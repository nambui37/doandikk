import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Crown,
  LoaderCircle,
  RotateCcw,
  Send,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  DrawingStroke,
  RoomAction,
  RoomSession,
  RoomView,
} from './types';
import OnlineDrawing from './OnlineDrawing';
import ResultsScreen from './ResultsScreen';
import {
  apiActOnRoom,
  apiFinishDrawingEarly,
  apiGetRoomState,
  apiGuessWord,
  apiUpdateRoomDrawing,
} from '../lib/api';
import { P2PManager, type P2PMessage } from '../lib/p2p';

type Props = {
  session: RoomSession;
  onExit: () => void;
};

export default function OnlineRoom({ session, onExit }: Props) {
  const [view, setView] = useState<RoomView>(session.view);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [p2pActive, setP2pActive] = useState(false);

  // Ô nhập đoán từ khóa
  const [guessInput, setGuessInput] = useState('');
  const [lastFeedback, setLastFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);

  const roomCode = session.roomCode;
  const playerToken = session.playerToken;
  const isHost = session.playerIndex === 0;

  const drawingRevision = useRef(session.view.drawingRevision || 0);
  const p2pManagerRef = useRef<P2PManager | null>(null);
  const lastFeedbackTimestamp = useRef<number>(0);

  // Khởi tạo WebRTC P2P
  useEffect(() => {
    const p2p = new P2PManager(roomCode, isHost);
    p2pManagerRef.current = p2p;

    p2p.init(
      (msg: P2PMessage) => {
        if (msg.type === 'DRAW_STROKE') {
          drawingRevision.current = Math.max(drawingRevision.current, msg.revision);
          setView((prev) => ({
            ...prev,
            drawingRevision: msg.revision,
            drawingStrokes: [...prev.drawingStrokes, msg.stroke],
          }));
        } else if (msg.type === 'CLEAR_DRAWING') {
          drawingRevision.current = msg.revision;
          setView((prev) => ({
            ...prev,
            drawingRevision: msg.revision,
            drawingStrokes: [],
          }));
        } else if (msg.type === 'STATE_SYNC') {
          setView(msg.view);
        } else if (msg.type === 'REQUEST_ACTION' && isHost) {
          handleAction(msg.action);
        }
      },
      () => setP2pActive(true),
      () => setP2pActive(false),
    );

    return () => {
      p2p.destroy();
      p2pManagerRef.current = null;
    };
  }, [roomCode, isHost]);

  // Polling đồng bộ từ Server (1.2s)
  useEffect(() => {
    let timerId: any = null;
    let isCancelled = false;

    const poll = async () => {
      try {
        const nextView = await apiGetRoomState(roomCode, playerToken);
        if (!isCancelled) {
          setView(nextView);
          drawingRevision.current = Math.max(drawingRevision.current, nextView.drawingRevision);

          // Nhận diện khi có ai đó đoán đúng
          if (
            nextView.lastGuessFeedback &&
            nextView.lastGuessFeedback.timestamp !== lastFeedbackTimestamp.current
          ) {
            lastFeedbackTimestamp.current = nextView.lastGuessFeedback.timestamp;
            setLastFeedback({
              text: `${nextView.lastGuessFeedback.guesserName}: "${nextView.lastGuessFeedback.text}"`,
              isCorrect: nextView.lastGuessFeedback.isCorrect,
            });

            if (nextView.lastGuessFeedback.isCorrect) {
              confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
              });
            }
          }

          if (isHost && p2pManagerRef.current?.isConnected) {
            p2pManagerRef.current.broadcast({
              type: 'STATE_SYNC',
              view: nextView,
            });
          }
        }
      } catch {
        // Lỗi mạng tạm thời, tiếp tục poll
      } finally {
        if (!isCancelled) {
          timerId = setTimeout(poll, 1200);
        }
      }
    };

    poll();

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [roomCode, playerToken, isHost]);

  // Hành động phòng
  const handleAction = async (action: RoomAction) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const nextView = await apiActOnRoom(roomCode, playerToken, action);
      setView(nextView);

      if (action === 'start') {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      if (isHost && p2pManagerRef.current?.isConnected) {
        p2pManagerRef.current.broadcast({
          type: 'STATE_SYNC',
          view: nextView,
        });
      }
    } catch (err: any) {
      setActionError(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Người vẽ kết thúc vẽ sớm -> chuyển sang cho đoán ngay
  const handleFinishDrawingEarly = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const nextView = await apiFinishDrawingEarly(roomCode, playerToken);
      setView(nextView);
    } catch (err: any) {
      setActionError(err?.message || 'Không thể kết thúc sớm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Người đoán gửi câu trả lời
  const handleSendGuess = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = guessInput.trim();
    if (!text || isSubmitting) return;

    setGuessInput('');
    setActionError(null);

    try {
      const nextView = await apiGuessWord(roomCode, playerToken, text);
      setView(nextView);
    } catch (err: any) {
      setActionError(err?.message || 'Lỗi gửi câu trả lời.');
    }
  };

  // Cập nhật nét vẽ realtime
  const handleDrawingChange = useCallback(
    (strokes: DrawingStroke[]) => {
      const newRev = drawingRevision.current + 1;
      drawingRevision.current = newRev;

      if (p2pManagerRef.current?.isConnected) {
        const lastStroke = strokes[strokes.length - 1];
        if (lastStroke) {
          p2pManagerRef.current.broadcast({
            type: 'DRAW_STROKE',
            stroke: lastStroke,
            revision: newRev,
          });
        }
      }

      apiUpdateRoomDrawing(roomCode, playerToken, {
        revision: newRev,
        strokes,
      }).catch(() => {});
    },
    [roomCode, playerToken],
  );

  const handleClearDrawing = useCallback(() => {
    const newRev = drawingRevision.current + 1;
    drawingRevision.current = newRev;

    if (p2pManagerRef.current?.isConnected) {
      p2pManagerRef.current.broadcast({
        type: 'CLEAR_DRAWING',
        revision: newRev,
      });
    }

    apiUpdateRoomDrawing(roomCode, playerToken, {
      revision: newRev,
      strokes: [],
    }).catch(() => {});
  }, [roomCode, playerToken]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const localPlayer = view.players[session.playerIndex];
  const drawerIndex = view.drawerIndex;
  const currentDrawer = view.players[drawerIndex];
  const localIsDrawer = drawerIndex === session.playerIndex;

  // MÀN HÌNH KẾT QUẢ KHI CÓ NGƯỜI ĐẠT ĐỦ ĐIỂM
  if (view.status === 'results') {
    const winnerPlayer = view.winnerIndex !== null && view.winnerIndex !== undefined
      ? view.players[view.winnerIndex]
      : null;

    return (
      <ResultsScreen
        scores={view.scores}
        players={view.players}
        winner={winnerPlayer}
        targetScore={view.targetScore}
        isHost={isHost}
        onPlayAgain={() => handleAction('restart')}
        onExit={onExit}
      />
    );
  }

  // MÀN HÌNH PHÒNG CHỜ (WAITING / READY)
  if (view.status === 'waiting' || view.status === 'ready') {
    return (
      <main className="screen online-lobby">
        <section className="lobby-card fade-in">
          <div className="eyebrow" style={{ justifyContent: 'center' }}>
            <Wifi size={14} /> Phòng chơi trực tuyến ({view.players.length}/8 người)
          </div>

          <h2>
            Mã phòng: <span className="room-code-tag">{roomCode}</span>
          </h2>

          <p style={{ marginTop: 4, color: '#aeb4c5', fontSize: 13, textAlign: 'center' }}>
            Chia sẻ mã phòng hoặc sao chép link gửi cho bạn bè để cùng vào vẽ & đoán:
          </p>

          <div className="copy-row" style={{ marginTop: 12 }}>
            <button type="button" className="copy-btn primary-copy" onClick={copyInviteLink}>
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              {copiedLink ? 'Đã sao chép link mời!' : 'Sao chép link mời bạn bè'}
            </button>
            <button type="button" className="copy-btn icon-only-btn" onClick={copyCode} title="Sao chép mã phòng">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <div className="players-list-box" style={{ marginTop: 16 }}>
            <div className="box-title">
              <Users size={15} /> Danh sách người chơi ({view.players.length}/8):
            </div>
            <div className="players-grid">
              {view.players.map((player) => (
                <div
                  key={player.index}
                  className={`player-card-chip ${player.index === session.playerIndex ? 'me-chip' : ''}`}
                >
                  <div className="player-avatar-mini">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="player-meta">
                    <span className="player-name">
                      {player.name} {player.index === session.playerIndex && '(Bạn)'}
                    </span>
                    <span className="player-role-badge">
                      {player.isHost ? (
                        <>
                          <Crown size={11} /> Chủ phòng
                        </>
                      ) : (
                        'Người chơi'
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {view.players.length < 8 && (
                <div className="player-card-chip waiting-chip">
                  <small>Đang đợi thêm bạn bè tham gia…</small>
                </div>
              )}
            </div>
          </div>

          <div className="room-message" style={{ marginTop: 14 }}>
            <Trophy size={15} style={{ color: '#f7d55c' }} />
            Mục tiêu: <strong>{view.targetScore} Điểm</strong> là chiến thắng · Chủ đề: <strong>{view.category}</strong>
          </div>

          {actionError && <div className="online-error" role="alert">{actionError}</div>}

          {isHost ? (
            <button
              type="button"
              className="primary-btn full-btn"
              disabled={view.players.length < 2 || isSubmitting}
              onClick={() => handleAction('start')}
              style={{ marginTop: 14 }}
            >
              {isSubmitting ? (
                <><LoaderCircle className="spin" /> Đang vào ván…</>
              ) : view.players.length < 2 ? (
                <>Đang đợi ít nhất 2 người để bắt đầu…</>
              ) : (
                <>Bắt đầu trận đấu ({view.players.length} người) <ArrowRight /></>
              )}
            </button>
          ) : (
            <div className="room-message" style={{ justifyContent: 'center', marginTop: 14 }}>
              <LoaderCircle className="spin" /> Đã sẵn sàng. Đang chờ chủ phòng bấm bắt đầu ván…
            </div>
          )}

          <button type="button" className="online-back" onClick={onExit} style={{ marginTop: 10 }}>
            Thoát phòng về màn hình đầu
          </button>
        </section>
      </main>
    );
  }

  // MÀN HÌNH ĐANG CHƠI (PLAYING / PAUSED)
  const isDrawingPhase = view.currentPhase === 'drawing';
  const isGuessingPhase = view.currentPhase === 'guessing';
  const isRevealPhase = view.currentPhase === 'reveal';

  const maxPhaseTime = isDrawingPhase ? 60 : 20;
  const progress = Math.max(0, Math.min(100, (view.phaseTimeLeftSeconds / maxPhaseTime) * 100));
  const canDraw = localIsDrawer && isDrawingPhase && view.status === 'playing';

  return (
    <main className="online-playing">
      {/* THANH THÔNG TIN ĐỈNH */}
      <div className="room-topline">
        <span>
          Lượt {view.turnIndex + 1} · {view.category} · Mục tiêu: {view.targetScore} điểm
        </span>
        <span className="connection-state">
          <span className={`live-dot ${p2pActive ? 'p2p' : ''}`} />
          {p2pActive ? 'P2P Realtime (60fps)' : 'Đã kết nối'}
        </span>
      </div>

      {/* BẢNG ĐIỂM NGƯỜI CHƠI */}
      <header className="game-header">
        <div className="round-info">
          Phòng <strong>{roomCode}</strong> · Bạn là <strong>{localPlayer?.name}</strong>
        </div>
        <div className="scoreboard scoreboard-multi">
          {view.players.map((player) => (
            <div
              key={player.index}
              className={`score-chip ${player.index === drawerIndex ? 'drawer-turn' : ''} ${player.score >= view.targetScore ? 'winner-near' : ''}`}
            >
              <span className="chip-player-name">
                {player.index === drawerIndex && '✏️ '}
                {player.name}
              </span>
              <b>{view.scores[player.index] ?? 0}/{view.targetScore} đ</b>
            </div>
          ))}
        </div>
      </header>

      {/* BANNER THÔNG BÁO PHA CHƠI */}
      <div
        className={`online-role-banner ${
          isGuessingPhase ? 'danger-phase' : isRevealPhase ? 'reveal-phase' : localIsDrawer ? '' : 'guesser'
        }`}
      >
        {isRevealPhase ? (
          <>🎉 HẾT LƯỢT! Đáp án chính xác là: <strong>{view.lastRevealedWord}</strong></>
        ) : isGuessingPhase ? (
          <>⚡ HẾT GIỜ VẼ! 20 GIÂY ĐOÁN CỰC NHANH — GÕ ĐÁP ÁN BÊN DƯỚI!</>
        ) : localIsDrawer ? (
          <>🎨 Bạn đang vẽ! Bạn có 60 giây để vẽ từ bí mật cho bạn bè đoán.</>
        ) : (
          <>👀 <strong>{currentDrawer?.name}</strong> đang vẽ! Bạn có thể gõ câu trả lời bất kỳ lúc nào.</>
        )}
      </div>

      <div className="game-grid">
        <section className="play-main">
          <div className="turn-top">
            <div className="role-pill">
              <span>
                {isDrawingPhase ? (
                  <>✏️ <strong>{currentDrawer?.name}</strong> đang vẽ nét gợi ý</>
                ) : isGuessingPhase ? (
                  <span style={{ color: '#ff6b6b', fontWeight: 700 }}>🔥 GIAI ĐOẠN ĐOÁN (20s)</span>
                ) : (
                  <>🎉 Công bố kết quả</>
                )}
              </span>
            </div>

            {/* NÚT VẼ XONG SỚM CHO NGƯỜI VẼ */}
            {localIsDrawer && isDrawingPhase && (
              <button
                type="button"
                className="icon-btn-text"
                disabled={isSubmitting}
                onClick={handleFinishDrawingEarly}
                title="Nếu đã vẽ xong, bấm để bạn bè vào đoán ngay lập tức"
              >
                <Sparkles size={15} /> Vẽ xong sớm (Cho đoán ngay)
              </button>
            )}

            {isHost && (
              <button
                className="icon-btn"
                aria-label="Chơi lại ván mới"
                title="Bắt đầu lại ván đấu"
                onClick={() => handleAction('restart')}
              >
                <RotateCcw size={17} />
              </button>
            )}
          </div>

          {/* ĐỒNG HỒ ĐẾM NGƯỢC THEO PHA */}
          <div className="timer-wrap">
            <div>
              <div className={`timer ${isGuessingPhase || view.phaseTimeLeftSeconds <= 10 ? 'danger' : ''}`}>
                00:{String(view.phaseTimeLeftSeconds).padStart(2, '0')}
              </div>
              <div className="timer-label">
                <Clock3 style={{ width: 12, verticalAlign: '-2px', marginRight: 5 }} />
                {isDrawingPhase ? 'Thời gian vẽ (60s)' : isGuessingPhase ? 'Thời gian đoán (20s)' : 'Chuyển lượt'}
              </div>
            </div>
            <div className="meter" aria-label={`Còn ${view.phaseTimeLeftSeconds} giây`}>
              <div
                className={`meter-fill ${isGuessingPhase ? 'danger-meter' : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* TỪ KHÓA BÍ MẬT */}
          {localIsDrawer && view.currentPrompt ? (
            <div className="prompt-card">
              <div className="prompt-label">Từ khóa bí mật bạn cần vẽ (Chỉ bạn thấy)</div>
              <div className="prompt-word">{view.currentPrompt}</div>
            </div>
          ) : isRevealPhase ? (
            <div className="prompt-card correct-reveal-card">
              <div className="prompt-label">Đáp án của vòng này</div>
              <div className="prompt-word" style={{ color: '#55d3bf' }}>{view.lastRevealedWord}</div>
            </div>
          ) : (
            <div className="prompt-card">
              <div className="prompt-label">Từ bí mật</div>
              <div className="prompt-word" style={{ fontSize: 'clamp(18px, 3.5vw, 24px)', color: '#aeb4c5' }}>
                {isGuessingPhase ? '⚡ Đang trong 20s đoán! Gõ đáp án bên dưới!' : `Đang quan sát nét vẽ của ${currentDrawer?.name}…`}
              </div>
            </div>
          )}

          {/* BẢNG VẼ ONLINE 3D */}
          <OnlineDrawing
            strokes={view.drawingStrokes}
            revision={view.drawingRevision}
            canDraw={canDraw}
            onChange={handleDrawingChange}
            onClearDrawing={handleClearDrawing}
          />

          {/* PHẢN HỒI KHI ĐOÁN */}
          {lastFeedback && (
            <div
              className={`guess-feedback-banner ${lastFeedback.isCorrect ? 'correct' : 'wrong'}`}
            >
              {lastFeedback.isCorrect ? (
                <>🎉 CHÍNH XÁC! {lastFeedback.text} đoán đúng! (+1 Điểm)</>
              ) : (
                <>{lastFeedback.text} — Chưa đúng, thử lại nhanh lên!</>
              )}
            </div>
          )}

          {/* Ô NHẬP ĐOÁN TỰ ĐỘNG DÀNH CHO NGƯỜI ĐOÁN */}
          {!localIsDrawer && (
            <form onSubmit={handleSendGuess} className="guess-input-container">
              <input
                type="text"
                className="guess-input"
                placeholder={isGuessingPhase ? '⚡ 20s ĐOÁN: Nhập từ bạn đoán vào đây rồi bấm Gửi (hoặc Enter)...' : 'Nhập dự đoán của bạn (Enter để gửi)...'}
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                autoFocus={isGuessingPhase}
                disabled={isRevealPhase}
              />
              <button
                type="submit"
                className="primary-btn guess-submit-btn"
                disabled={!guessInput.trim() || isRevealPhase}
              >
                <Send size={16} /> Gửi
              </button>
            </form>
          )}

          {actionError && <div className="online-error" role="alert">{actionError}</div>}
        </section>

        {/* CỘT BÊN PHẢI: BẢNG TIẾN ĐỘ & BẢNG XẾP HẠNG */}
        <aside className="game-side">
          <section className="side-card">
            <h3>Trạng thái trận đấu</h3>
            <div className="role-row">
              <span>Đang vẽ 🎨</span>
              <b style={{ color: '#f7d55c' }}>{currentDrawer?.name}</b>
            </div>
            <div className="role-row">
              <span>Giai đoạn</span>
              <b style={{ color: isGuessingPhase ? '#ff6b6b' : '#55d3bf' }}>
                {isDrawingPhase ? 'Vẽ hình (60s)' : isGuessingPhase ? 'Đoán từ (20s)' : 'Công bố'}
              </b>
            </div>
            <div className="role-row">
              <span>Mục tiêu thắng</span>
              <b style={{ color: '#f7d55c' }}>{view.targetScore} Điểm</b>
            </div>
          </section>

          <section className="side-card">
            <h3>Bảng xếp hạng điểm</h3>
            <div className="players-rank-list">
              {[...view.players]
                .sort((a, b) => (view.scores[b.index] || 0) - (view.scores[a.index] || 0))
                .map((player, rank) => (
                  <div key={player.index} className="rank-item-row">
                    <span className="rank-badge">
                      {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                    </span>
                    <span className="rank-name">
                      {player.name} {player.index === session.playerIndex && '(Bạn)'}
                    </span>
                    <b className="rank-score">
                      {view.scores[player.index] || 0} / {view.targetScore} đ
                    </b>
                  </div>
                ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
