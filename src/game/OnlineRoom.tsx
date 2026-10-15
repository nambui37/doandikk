import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Crown,
  LoaderCircle,
  Pause,
  RotateCcw,
  Share2,
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
  apiGetRoomState,
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

  const roomCode = session.roomCode;
  const playerToken = session.playerToken;
  const isHost = session.playerIndex === 0;

  const drawingRevision = useRef(session.view.drawingRevision || 0);
  const p2pManagerRef = useRef<P2PManager | null>(null);

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

  // Polling đồng bộ từ Server (1.3s)
  useEffect(() => {
    let timerId: any = null;
    let isCancelled = false;

    const poll = async () => {
      try {
        const nextView = await apiGetRoomState(roomCode, playerToken);
        if (!isCancelled) {
          setView(nextView);
          drawingRevision.current = Math.max(drawingRevision.current, nextView.drawingRevision);

          if (isHost && p2pManagerRef.current?.isConnected) {
            p2pManagerRef.current.send({ type: 'STATE_SYNC', view: nextView });
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Sync notice:', err?.message);
        }
      } finally {
        if (!isCancelled) {
          timerId = setTimeout(poll, 1300);
        }
      }
    };

    poll();

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [roomCode, playerToken, isHost]);

  const handleAction = useCallback(
    async (action: RoomAction, targetGuesserIndex?: number) => {
      setIsSubmitting(true);
      setActionError(null);
      try {
        if (action === 'correct') {
          confetti({
            particleCount: 55,
            spread: 65,
            origin: { y: 0.6 },
          });
        }
        const updatedView = await apiActOnRoom(roomCode, playerToken, action, targetGuesserIndex);
        setView(updatedView);
        drawingRevision.current = Math.max(drawingRevision.current, updatedView.drawingRevision);

        if (p2pManagerRef.current?.isConnected) {
          p2pManagerRef.current.send({ type: 'STATE_SYNC', view: updatedView });
        }
      } catch (err: any) {
        setActionError(err.message || 'Thao tác không thành công.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [roomCode, playerToken],
  );

  const handleDrawingChange = useCallback(
    async (strokes: DrawingStroke[]) => {
      const rev = drawingRevision.current + 1;
      drawingRevision.current = rev;

      setView((prev) => ({
        ...prev,
        drawingRevision: rev,
        drawingStrokes: strokes,
      }));

      // Broadcast qua P2P
      if (p2pManagerRef.current?.isConnected) {
        const latest = strokes[strokes.length - 1];
        if (latest) {
          p2pManagerRef.current.send({
            type: 'DRAW_STROKE',
            stroke: latest,
            revision: rev,
          });
        } else {
          p2pManagerRef.current.send({
            type: 'CLEAR_DRAWING',
            revision: rev,
          });
        }
      }

      // Lưu lên Server
      try {
        await apiUpdateRoomDrawing(roomCode, playerToken, { revision: rev, strokes });
      } catch {
        // ignore
      }
    },
    [roomCode, playerToken],
  );

  const handleClearDrawing = useCallback(() => {
    const rev = drawingRevision.current + 1;
    drawingRevision.current = rev;
    if (p2pManagerRef.current?.isConnected) {
      p2pManagerRef.current.send({ type: 'CLEAR_DRAWING', revision: rev });
    }
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const copyInviteLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomCode);
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const drawerIndex = view.drawerIndex ?? (view.turnIndex % Math.max(1, view.players.length));
  const currentDrawer = view.players[drawerIndex];
  const localIsDrawer = session.playerIndex === drawerIndex;
  const localPlayer = view.players.find((p) => p.index === session.playerIndex);
  const otherGuessers = view.players.filter((p) => p.index !== drawerIndex);

  // MÀN HÌNH TỔNG KẾT
  if (view.status === 'results') {
    return (
      <div className="room-shell">
        <div className="room-topline">
          <span>Mã phòng · {roomCode}</span>
          <span className="connection-state">
            <span className="live-dot" /> Trận đấu kết thúc
          </span>
        </div>
        <ResultsScreen
          players={view.players}
          scores={view.scores}
          onSetup={onExit}
          onAgain={() => handleAction('restart')}
        />
        <p className="online-result-note" style={{ textAlign: 'center', marginTop: 16 }}>
          Cảm ơn tất cả mọi người đã tham gia vẽ tranh và đoán từ!
        </p>
      </div>
    );
  }

  // MÀN HÌNH CHỜ (LOBBY NHIỀU NGƯỜI CHƠI)
  if (view.status === 'waiting' || view.status === 'ready') {
    return (
      <main className="screen">
        <section className="online-panel room-shell fade-in">
          <div className="room-topline">
            <span>Phòng vẽ trực tuyến ({view.players.length}/8 người)</span>
            <span className="connection-state">
              <span className={`live-dot ${p2pActive ? 'p2p' : ''}`} />
              {p2pActive ? 'P2P Trực tiếp (Siêu mượt)' : 'Đã kết nối máy chủ'}
            </span>
          </div>

          <div className="eyebrow">Mời bạn bè cùng vào cuộc</div>
          <h1 style={{ fontSize: 'clamp(30px, 5.5vw, 44px)', letterSpacing: '-.05em', margin: '12px 0 0' }}>
            Phòng chơi đã sẵn sàng.
          </h1>

          <div className="room-code-panel">
            <div className="field-label">Mã phòng · gửi mã hoặc link cho nhóm bạn</div>
            <div className="room-code">{roomCode}</div>
            <div className="share-buttons-row">
              <button type="button" className="copy-btn" onClick={copyCode}>
                {copied ? <><Check size={14} color="#55d3bf" /> Đã chép mã!</> : <><Copy size={14} /> Chép mã phòng</>}
              </button>
              <button type="button" className="copy-btn link-btn" onClick={copyInviteLink}>
                {copiedLink ? <><Check size={14} color="#55d3bf" /> Đã chép link!</> : <><Share2 size={14} /> Chép link mời bạn</>}
              </button>
            </div>
            <p>Hỗ trợ từ 2 đến 8 người chơi cùng lúc! Nhấn link để vào phòng ngay.</p>
          </div>

          {/* DANH SÁCH TẤT CẢ NGƯỜI CHƠI TRONG PHÒNG */}
          <div className="multiplayer-lobby-list">
            <div className="field-label" style={{ marginBottom: 10 }}>
              <Users size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }} />
              Danh sách người chơi ({view.players.length} người)
            </div>
            <div className="players-grid">
              {view.players.map((p) => (
                <div key={p.index} className={`player-card-chip ${p.isHost ? 'host' : ''}`}>
                  <div className="player-chip-top">
                    {p.isHost && (
                      <span className="host-badge" title="Chủ phòng">
                        <Crown size={12} /> Chủ phòng
                      </span>
                    )}
                    <span className="online-dot-mini" title="Đang online" />
                  </div>
                  <strong className="player-chip-name">{p.name}</strong>
                  <small>{p.index === session.playerIndex ? '(Bạn)' : 'Đã sẵn sàng'}</small>
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
            <Wifi /> Chủ đề: <strong>{view.category}</strong> · Chế độ <strong>VẼ TRANH ĐOÁN Ý</strong> · Thay phiên nhau vẽ.
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
                <>Bắt đầu ván chơi ({view.players.length} người) <ArrowRight /></>
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
  const progress = Math.max(0, Math.min(100, (view.timeLeftSeconds / 60) * 100));
  const canControl = localIsDrawer && view.status === 'playing';

  return (
    <main className="online-playing">
      <div className="room-topline">
        <span>
          Lượt {view.turnIndex + 1} / {view.totalTurns} · VẼ TRANH · {view.category}
        </span>
        <span className="connection-state">
          <span className={`live-dot ${p2pActive ? 'p2p' : ''}`} />
          {p2pActive ? 'P2P Realtime (60fps)' : 'Đã kết nối'}
        </span>
      </div>

      {/* SCOREBOARD CHO TẤT CẢ NGƯỜI CHƠI */}
      <header className="game-header">
        <div className="round-info">
          Phòng <strong>{roomCode}</strong> · Bạn là <strong>{localPlayer?.name || `Người chơi ${session.playerIndex + 1}`}</strong>
        </div>
        <div className="scoreboard scoreboard-multi">
          {view.players.map((player) => (
            <div
              key={player.index}
              className={`score-chip ${player.index === drawerIndex ? 'drawer-turn' : ''}`}
            >
              <span className="chip-player-name">
                {player.index === drawerIndex && '✏️ '}
                {player.name}
              </span>
              <b>{view.scores[player.index] ?? 0} đ</b>
            </div>
          ))}
        </div>
      </header>

      {/* BANNER BÁO VAI TRÒ */}
      <div className={`online-role-banner ${localIsDrawer ? '' : 'guesser'}`}>
        <Wifi size={16} />{' '}
        {localIsDrawer
          ? `Bạn đang vẽ từ bí mật! Tất cả bạn bè đang chăm chú nhìn và đoán.`
          : `${currentDrawer?.name || 'Bạn'} đang vẽ — Hãy đoán thật to đáp án!`}
      </div>

      <div className="game-grid">
        <section className="play-main">
          <div className="turn-top">
            <div className="role-pill">
              <span>
                <strong>{currentDrawer?.name}</strong> vẽ tranh{' '}
                <span style={{ color: '#71798f' }}>→</span> Các bạn còn lại cùng đoán!
              </span>
            </div>
            <div className="turn-actions">
              {view.status === 'playing' && (
                <button
                  className="icon-btn"
                  aria-label="Tạm dừng"
                  onClick={() => handleAction('pause')}
                >
                  <Pause size={17} />
                </button>
              )}
              {view.status === 'paused' && (
                <button
                  className="icon-btn"
                  aria-label="Tiếp tục"
                  onClick={() => handleAction('resume')}
                >
                  <Check size={17} />
                </button>
              )}
              {isHost && (
                <button
                  className="icon-btn"
                  aria-label="Chơi lại ván mới"
                  onClick={() => handleAction('restart')}
                >
                  <RotateCcw size={17} />
                </button>
              )}
            </div>
          </div>

          <div className="timer-wrap">
            <div>
              <div className={`timer ${view.timeLeftSeconds <= 10 ? 'danger' : ''}`}>
                00:{String(view.timeLeftSeconds).padStart(2, '0')}
              </div>
              <div className="timer-label">
                <Clock3 style={{ width: 12, verticalAlign: '-2px', marginRight: 5 }} />
                Thời gian lượt vẽ
              </div>
            </div>
            <div className="meter" aria-label={`Còn ${view.timeLeftSeconds} giây`}>
              <div className="meter-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {localIsDrawer && view.currentPrompt ? (
            <div className="prompt-card">
              <div className="prompt-label">Từ khóa bí mật cần vẽ · Chỉ bạn nhìn thấy</div>
              <div className="prompt-word">{view.currentPrompt}</div>
            </div>
          ) : (
            <div className="prompt-card">
              <div className="prompt-label">Từ bí mật</div>
              <div className="prompt-word" style={{ fontSize: 'clamp(20px, 4vw, 26px)', color: '#aeb4c5' }}>
                Đang chờ nét vẽ gợi ý từ {currentDrawer?.name}…
              </div>
            </div>
          )}

          {/* BẢNG VẼ ONLINE SIÊU MƯỢT */}
          <OnlineDrawing
            strokes={view.drawingStrokes}
            revision={view.drawingRevision}
            canDraw={canControl}
            onChange={handleDrawingChange}
            onClearDrawing={handleClearDrawing}
          />

          <p className="play-instruction">
            {localIsDrawer
              ? 'Vẽ nhanh hình gợi ý lên bảng. Nét vẽ lập tức hiện trên màn hình của tất cả bạn bè!'
              : 'Hãy nhìn hình vẽ và đoán to thành tiếng. Người vẽ sẽ bấm nút xác nhận cho bạn khi bạn đoán đúng!'}
          </p>

          {/* HÀNH ĐỘNG CỦA NGƯỜI VẼ */}
          {canControl ? (
            <div className="drawer-actions-container">
              {otherGuessers.length > 1 ? (
                <div className="guesser-award-box">
                  <span className="award-title">Bấm vào người vừa đoán đúng:</span>
                  <div className="award-buttons-row">
                    {otherGuessers.map((guesser) => (
                      <button
                        key={guesser.index}
                        type="button"
                        className="award-guesser-btn"
                        disabled={isSubmitting}
                        onClick={() => handleAction('correct', guesser.index)}
                      >
                        <Check size={14} /> {guesser.name} (+{100 + view.timeLeftSeconds * 20}đ)
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="play-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={isSubmitting}
                    onClick={() => handleAction('correct')}
                  >
                    <Check /> Đoán đúng rồi! (+{100 + view.timeLeftSeconds * 20}đ)
                  </button>
                  <button
                    type="button"
                    className="pass-btn"
                    disabled={isSubmitting}
                    onClick={() => handleAction('pass')}
                  >
                    Bỏ qua từ này
                  </button>
                </div>
              )}

              {otherGuessers.length > 1 && (
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <button
                    type="button"
                    className="pass-btn"
                    style={{ padding: '8px 16px', fontSize: 12 }}
                    disabled={isSubmitting}
                    onClick={() => handleAction('pass')}
                  >
                    Bỏ qua từ này
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="room-message" style={{ justifyContent: 'center' }}>
              <LoaderCircle className="spin" />{' '}
              {view.status === 'paused'
                ? 'Ván chơi đang tạm dừng.'
                : 'Hãy đoán thật nhanh! Người vẽ sẽ bấm xác nhận khi bạn đoán trúng.'}
            </div>
          )}

          {actionError && <div className="online-error" role="alert">{actionError}</div>}
        </section>

        <aside className="game-side">
          <section className="side-card">
            <h3>Lượt hiện tại</h3>
            <div className="role-row">
              <span>Đang vẽ ✏️</span>
              <b style={{ color: '#f7d55c' }}>{currentDrawer?.name}</b>
            </div>
            <div className="role-row">
              <span>Đã đoán đúng</span>
              <b style={{ color: '#55d3bf', fontSize: 18 }}>{view.correctThisTurn} từ</b>
            </div>
          </section>

          <section className="side-card">
            <h3>Bảng điểm cuộc chơi</h3>
            <div className="player-rankings-mini">
              {[...view.players]
                .sort((a, b) => (view.scores[b.index] || 0) - (view.scores[a.index] || 0))
                .map((p, rank) => (
                  <div key={p.index} className="ranking-row">
                    <span className="rank-num">#{rank + 1}</span>
                    <span className="rank-name">{p.name}</span>
                    <strong className="rank-score">{view.scores[p.index] || 0} đ</strong>
                  </div>
                ))}
            </div>
          </section>
        </aside>
      </div>

      {view.status === 'paused' && (
        <div className="pause-overlay" role="dialog" aria-modal="true">
          <div className="pause-card">
            <div className="eyebrow" style={{ justifyContent: 'center' }}>Đồng hồ đã dừng</div>
            <h2>Nghỉ một nhịp.</h2>
            <p>Ván chơi đang tạm dừng trên thiết bị của mọi người.</p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => handleAction('resume')}
              disabled={isSubmitting}
            >
              Tiếp tục chơi <Check />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
