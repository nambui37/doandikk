import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Crown,
  LoaderCircle,
  LogOut,
  RotateCcw,
  Send,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Wifi,
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
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Ô nhập đoán từ khóa
  const [guessInput, setGuessInput] = useState('');
  const [lastFeedback, setLastFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);

  const roomCode = session.roomCode;
  const playerToken = session.playerToken;
  const isHost = session.playerIndex === 0;

  const drawingRevision = useRef(session.view.drawingRevision || 0);
  const p2pManagerRef = useRef<P2PManager | null>(null);
  const lastFeedbackTimestamp = useRef<number>(0);

  // Khởi tạo WebRTC P2P (CHỈ truyền nét vẽ DRAW_STROKE và CLEAR_DRAWING, tuyệt đối không đồng bộ view)
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

  // Polling đồng bộ độc lập từ Server cho từng client với token riêng
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
        }
      } catch {
        // Tiếp tục poll khi mạng lag
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
  }, [roomCode, playerToken]);

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
    } catch (err: any) {
      setActionError(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Người vẽ kết thúc vẽ sớm (Bấm DONE!)
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

  // Người đoán gửi câu trả lời (Phản hồi tức thì 0ms - Optimistic UI)
  const handleSendGuess = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = guessInput.trim();
    if (!text || isSubmitting) return;

    // Hiển thị phản hồi ngay lập tức không cần chờ mạng
    setGuessInput('');
    setActionError(null);
    setLastFeedback({ text: `Bạn: "${text}"`, isCorrect: false });

    try {
      const nextView = await apiGuessWord(roomCode, playerToken, text);
      setView(nextView);
      if (nextView.lastGuessFeedback) {
        setLastFeedback({
          text: `${nextView.lastGuessFeedback.guesserName}: "${nextView.lastGuessFeedback.text}"`,
          isCorrect: nextView.lastGuessFeedback.isCorrect,
        });
        if (nextView.lastGuessFeedback.isCorrect) {
          confetti({
            particleCount: 60,
            spread: 75,
            origin: { y: 0.6 },
          });
        }
      }
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

  // Xác định chuẩn xác người chơi hiện tại và vai trò vẽ
  const myName = session.view.players[session.playerIndex]?.name;
  const myPlayer = view.players.find((p) => p.name === myName) || view.players[session.playerIndex];
  const myIndex = myPlayer ? myPlayer.index : session.playerIndex;
  const drawerIndex = view.drawerIndex;
  const currentDrawer = view.players[drawerIndex];
  const localIsDrawer = drawerIndex === myIndex;

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
      <main className="screen gartic-lobby-screen">
        <section className="gartic-lobby-card fade-in">
          {/* HEADER PHÒNG CHỜ */}
          <div className="gartic-lobby-header">
            <div className="gartic-tag">
              <Wifi size={14} /> Phòng chơi trực tuyến
            </div>
            <button
              type="button"
              className="gartic-leave-btn-header"
              onClick={() => setShowExitConfirm(true)}
              title="Rời phòng"
            >
              <LogOut size={16} /> Rời phòng
            </button>
          </div>

          <h2 className="gartic-lobby-title">
            MÃ PHÒNG: <span className="gartic-code-glow">{roomCode}</span>
          </h2>

          <p className="gartic-lobby-desc">
            Mời bạn bè cùng vào tranh tài vẽ tranh và đoán từ siêu vui!
          </p>

          {/* HÀNG NÚT COPY MÃ & LINK */}
          <div className="gartic-invite-actions">
            <button type="button" className="gartic-big-copy-btn" onClick={copyInviteLink}>
              {copiedLink ? <Check size={18} /> : <Share2 size={18} />}
              <span>{copiedLink ? 'Đã sao chép link mời!' : 'Sao chép Link mời bạn bè'}</span>
            </button>
            <button type="button" className="gartic-icon-copy-btn" onClick={copyCode} title="Sao chép mã phòng">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          {/* DANH SÁCH THẺ NGƯỜI CHƠI PHONG CÁCH GARTIC PHONE */}
          <div className="gartic-players-section">
            <div className="gartic-section-label">
              <Users size={16} /> Người chơi trong phòng ({view.players.length}/8):
            </div>
            <div className="gartic-players-pod-grid">
              {view.players.map((player) => (
                <div
                  key={player.index}
                  className={`gartic-player-pod ${player.index === myIndex ? 'is-me' : ''}`}
                >
                  <div className="gartic-avatar-circle">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="gartic-pod-info">
                    <span className="gartic-pod-name">
                      {player.name} {player.index === myIndex && '(Bạn)'}
                    </span>
                    <span className="gartic-pod-role">
                      {player.isHost ? (
                        <>
                          <Crown size={12} className="crown-icon" /> Chủ phòng
                        </>
                      ) : (
                        'Đã sẵn sàng'
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {view.players.length < 8 && (
                <div className="gartic-player-pod waiting">
                  <div className="gartic-avatar-circle dashed">?</div>
                  <div className="gartic-pod-info">
                    <span className="gartic-pod-name" style={{ color: '#888' }}>Chờ bạn bè...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* THÔNG TIN LUẬT CHƠI & MỤC TIÊU ĐIỂM */}
          <div className="gartic-rules-card">
            <Trophy size={18} className="trophy-icon" />
            <div>
              <strong>Mục tiêu: {view.targetScore} Điểm để Thắng cuộc!</strong>
              <small>60s vẽ tranh · 20s đoán tự động · Thay phiên nhau vẽ</small>
            </div>
          </div>

          {actionError && <div className="online-error" role="alert">{actionError}</div>}

          {/* NÚT BẮT ĐẦU HOẶC CHỜ */}
          {isHost ? (
            <button
              type="button"
              className="gartic-primary-play-btn"
              disabled={view.players.length < 2 || isSubmitting}
              onClick={() => handleAction('start')}
            >
              {isSubmitting ? (
                <><LoaderCircle className="spin" /> Đang chuẩn bị ván…</>
              ) : view.players.length < 2 ? (
                <>Đang đợi bạn bè tham gia (Tối thiểu 2 người)…</>
              ) : (
                <>BẮT ĐẦU TRẬN ĐẤU ({view.players.length} người) <ArrowRight /></>
              )}
            </button>
          ) : (
            <div className="gartic-waiting-host-box">
              <LoaderCircle className="spin" /> Đã sẵn sàng! Đang đợi chủ phòng bấm Bắt đầu…
            </div>
          )}

          {/* POPUP XÁC NHẬN RỜI PHÒNG */}
          {showExitConfirm && (
            <div className="gartic-modal-overlay">
              <div className="gartic-modal-content">
                <h3>Bạn muốn rời phòng?</h3>
                <p>Bạn sẽ thoát ra ngoài màn hình chính.</p>
                <div className="gartic-modal-actions">
                  <button type="button" className="secondary-btn" onClick={() => setShowExitConfirm(false)}>
                    Ở lại
                  </button>
                  <button type="button" className="danger-btn" onClick={onExit}>
                    Rời đi
                  </button>
                </div>
              </div>
            </div>
          )}
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
    <main className="gartic-playing-screen">
      {/* THANH TOP BAR PHONG CÁCH GARTIC PHONE */}
      <header className="gartic-play-topbar">
        <div className="topbar-left">
          <span className="room-pill">Phòng: <strong>{roomCode}</strong></span>
          <span className="round-pill">Lượt {view.turnIndex + 1}</span>
          <span className="target-pill">Mục tiêu: {view.targetScore}đ</span>
        </div>

        {/* ĐỒNG HỒ ĐẾM NGƯỢC NỔI BẬT */}
        <div className={`gartic-timer-box ${isGuessingPhase || view.phaseTimeLeftSeconds <= 10 ? 'danger-pulse' : ''}`}>
          <Clock3 size={18} />
          <span className="timer-text">00:{String(view.phaseTimeLeftSeconds).padStart(2, '0')}</span>
          <small className="timer-desc">
            {isDrawingPhase ? '60s Vẽ' : isGuessingPhase ? '20s Đoán' : 'Công bố'}
          </small>
        </div>

        {/* NÚT RỜI PHÒNG LUÔN CÓ MẶT */}
        <div className="topbar-right">
          {isHost && (
            <button
              type="button"
              className="gartic-icon-topbar-btn"
              title="Chơi lại ván mới"
              onClick={() => handleAction('restart')}
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button
            type="button"
            className="gartic-leave-topbar-btn"
            onClick={() => setShowExitConfirm(true)}
            title="Rời phòng trở về trang chủ"
          >
            <LogOut size={16} />
            <span className="leave-text">Rời phòng</span>
          </button>
        </div>
      </header>

      {/* THANH BẢNG ĐIỂM NGANG TẤT CẢ NGƯỜI CHƠI */}
      <div className="gartic-scoreboard-strip">
        {view.players.map((player) => (
          <div
            key={player.index}
            className={`gartic-score-tab ${player.index === drawerIndex ? 'is-drawing-now' : ''} ${player.index === myIndex ? 'is-me' : ''}`}
          >
            <span className="tab-name">
              {player.index === drawerIndex && '🎨 '}
              {player.name} {player.index === myIndex && '(Bạn)'}
            </span>
            <span className="tab-score">{view.scores[player.index] || 0}/{view.targetScore}đ</span>
          </div>
        ))}
      </div>

      {/* BANNER THÔNG BÁO VAI TRÒ / TỪ KHÓA BÍ MẬT */}
      <div className="gartic-prompt-header-box">
        {localIsDrawer && view.currentPrompt ? (
          <div className="gartic-secret-word-card">
            <span className="label">TỪ BÍ MẬT CẦN VẼ (CHỈ BẠN NHÌN THẤY):</span>
            <strong className="secret-word">{view.currentPrompt}</strong>
          </div>
        ) : isRevealPhase ? (
          <div className="gartic-secret-word-card reveal">
            <span className="label">ĐÁP ÁN CHÍNH XÁC:</span>
            <strong className="secret-word">{view.lastRevealedWord}</strong>
          </div>
        ) : (
          <div className="gartic-guesser-prompt-card">
            <span className="label">BẠN ĐANG ĐOÁN TRANH:</span>
            <strong className="guesser-instruction">
              {isGuessingPhase ? '⚡ 20s ĐOÁN: Hãy nhập câu trả lời vào ô bên dưới!' : `Đang quan sát ${currentDrawer?.name} vẽ…`}
            </strong>
          </div>
        )}
      </div>

      {/* BẢNG VẼ CHUẨN GARTIC PHONE CÓ NÚT DONE! */}
      <section className="gartic-drawing-viewport">
        <OnlineDrawing
          strokes={view.drawingStrokes}
          revision={view.drawingRevision}
          canDraw={canDraw}
          drawerName={currentDrawer?.name}
          onDone={handleFinishDrawingEarly}
          onChange={handleDrawingChange}
          onClearDrawing={handleClearDrawing}
        />
      </section>

      {/* PHẢN HỒI KHI ĐOÁN */}
      {lastFeedback && (
        <div className={`gartic-feedback-toast ${lastFeedback.isCorrect ? 'correct' : 'wrong'}`}>
          {lastFeedback.isCorrect ? (
            <>🎉 CHÍNH XÁC! {lastFeedback.text} đoán đúng! (+1 Điểm)</>
          ) : (
            <>{lastFeedback.text} — Chưa đúng, thử lại nhanh lên!</>
          )}
        </div>
      )}

      {/* Ô NHẬP ĐOÁN TỰ ĐỘNG DÀNH CHO NGƯỜI ĐOÁN (MOBILE & DESKTOP) */}
      {!localIsDrawer && (
        <form onSubmit={handleSendGuess} className="gartic-guess-form-bar">
          <input
            type="text"
            className="gartic-guess-input"
            placeholder={isGuessingPhase ? '⚡ 20s ĐOÁN KHẨN CẤP: Gõ đáp án vào đây rồi Enter...' : 'Gõ từ bạn đoán vào đây (Enter để gửi)...'}
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            autoFocus={isGuessingPhase}
            disabled={isRevealPhase}
          />
          <button
            type="submit"
            className="gartic-guess-send-btn"
            disabled={!guessInput.trim() || isRevealPhase}
          >
            <Send size={18} />
            <span>Gửi</span>
          </button>
        </form>
      )}

      {actionError && <div className="online-error" role="alert">{actionError}</div>}

      {/* POPUP XÁC NHẬN RỜI PHÒNG KHI ĐANG CHƠI */}
      {showExitConfirm && (
        <div className="gartic-modal-overlay">
          <div className="gartic-modal-content">
            <h3>Rời trận đấu?</h3>
            <p>Bạn có chắc chắn muốn thoát về trang chủ không?</p>
            <div className="gartic-modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setShowExitConfirm(false)}>
                Tiếp tục chơi
              </button>
              <button type="button" className="danger-btn" onClick={onExit}>
                Rời phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
