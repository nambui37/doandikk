import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  LoaderCircle,
  Pause,
  RotateCcw,
  Share2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  DrawingPoint,
  DrawingStroke,
  RoomAction,
  RoomSession,
  RoomView,
} from './types';
import type { GameConfig } from './SetupScreen';
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
          // Host xử lý hành động được yêu cầu
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

  // Polling đồng bộ định kỳ từ Server (nhẹ nhàng, 1.2s - 1.8s)
  useEffect(() => {
    let timerId: any = null;
    let isCancelled = false;

    const poll = async () => {
      try {
        const nextView = await apiGetRoomState(roomCode, playerToken);
        if (!isCancelled) {
          setView(nextView);
          drawingRevision.current = Math.max(drawingRevision.current, nextView.drawingRevision);

          // Nếu là host và P2P mở, broadcast state sang bạn bè
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
          // Tần suất đồng bộ ổn định
          timerId = setTimeout(poll, 1400);
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
    async (action: RoomAction) => {
      setIsSubmitting(true);
      setActionError(null);
      try {
        if (action === 'correct') {
          // Hiệu ứng pháo hoa chúc mừng
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
        const updatedView = await apiActOnRoom(roomCode, playerToken, action);
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

      // 1. Gửi qua P2P tức thì nếu có
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

      // 2. Gửi lên Server để lưu trạng thái
      try {
        await apiUpdateRoomDrawing(roomCode, playerToken, { revision: rev, strokes });
      } catch {
        // im lặng bỏ qua nếu do trôi lượt
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

  const names = [
    view.players.find((p) => p.index === 0)?.name || 'Người chơi 1',
    view.players.find((p) => p.index === 1)?.name || 'Đang chờ…',
  ] as [string, string];

  const config: GameConfig = {
    players: names,
    category: view.category,
    mode: view.mode,
  };

  const giverIndex = view.turnIndex % 2;
  const guesserIndex = 1 - giverIndex;
  const localIsGiver = session.playerIndex === giverIndex;
  const localPlayer = view.players.find((p) => p.index === session.playerIndex);
  const hasGuest = view.players.some((p) => p.index === 1);

  // MÀN HÌNH TỔNG KẾT
  if (view.status === 'results') {
    return (
      <div className="room-shell">
        <div className="room-topline">
          <span>Mã phòng · {roomCode}</span>
          <span className="connection-state">
            <span className="live-dot" /> Đã kết thúc
          </span>
        </div>
        <ResultsScreen
          config={config}
          scores={[view.scores[0] ?? 0, view.scores[1] ?? 0]}
          onSetup={onExit}
          onAgain={() => handleAction('restart')}
        />
        <p className="online-result-note" style={{ textAlign: 'center', marginTop: 16 }}>
          Kết quả trận đấu đã được đồng bộ hoàn toàn giữa hai bạn.
        </p>
      </div>
    );
  }

  // MÀN HÌNH CHỜ (LOBBY)
  if (view.status === 'waiting' || view.status === 'ready') {
    return (
      <main className="screen">
        <section className="online-panel room-shell fade-in">
          <div className="room-topline">
            <span>Phòng chơi trực tuyến</span>
            <span className="connection-state">
              <span className={`live-dot ${p2pActive ? 'p2p' : ''}`} />
              {p2pActive ? 'Kết nối trực tiếp P2P (Siêu tốc)' : 'Đã kết nối máy chủ'}
            </span>
          </div>

          <div className="eyebrow">Đưa bạn bè vào cuộc</div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 48px)', letterSpacing: '-.05em', margin: '12px 0 0' }}>
            Bàn chơi đã mở.
          </h1>

          <div className="room-code-panel">
            <div className="field-label">Mã phòng · gửi mã hoặc link cho bạn bè</div>
            <div className="room-code">{roomCode}</div>
            <div className="share-buttons-row">
              <button type="button" className="copy-btn" onClick={copyCode}>
                {copied ? <><Check size={14} color="#55d3bf" /> Đã chép mã!</> : <><Copy size={14} /> Chép mã phòng</>}
              </button>
              <button type="button" className="copy-btn link-btn" onClick={copyInviteLink}>
                {copiedLink ? <><Check size={14} color="#55d3bf" /> Đã chép link!</> : <><Share2 size={14} /> Chép link mời</>}
              </button>
            </div>
            <p>Bạn bè chỉ cần nhấn link là vào phòng ngay lập tức!</p>
          </div>

          <div className="room-players">
            <div className="room-player">
              <small>Người tạo phòng</small>
              <strong>{names[0]}</strong>
            </div>
            {hasGuest ? (
              <div className="room-player">
                <small>Đã tham gia</small>
                <strong>{names[1]}</strong>
              </div>
            ) : (
              <div className="room-player waiting">
                <small>Người chơi 2</small>
                <strong>Đang chờ bạn bè vào…</strong>
              </div>
            )}
          </div>

          <div className="room-message">
            <Wifi /> Chủ đề: <strong>{view.category}</strong> · Cách chơi:{' '}
            <strong>{view.mode === 'talk' ? 'Nói gợi ý' : 'Vẽ gợi ý'}</strong> · 4 lượt đấu.
          </div>

          {actionError && <div className="online-error" role="alert">{actionError}</div>}

          {isHost ? (
            <button
              type="button"
              className="primary-btn full-btn"
              disabled={!hasGuest || isSubmitting}
              onClick={() => handleAction('start')}
            >
              {isSubmitting ? (
                <><LoaderCircle className="spin" /> Đang vào ván…</>
              ) : (
                <>Bắt đầu ván chơi <ArrowRight /></>
              )}
            </button>
          ) : (
            <div className="room-message" style={{ justifyContent: 'center' }}>
              <LoaderCircle className="spin" /> Đã sẵn sàng. Chờ chủ phòng bấm bắt đầu…
            </div>
          )}

          <button type="button" className="online-back" onClick={onExit} style={{ marginTop: 12 }}>
            Thoát phòng về màn hình đầu
          </button>
        </section>
      </main>
    );
  }

  // MÀN HÌNH ĐANG CHƠI (PLAYING / PAUSED)
  const progress = Math.max(0, Math.min(100, (view.timeLeftSeconds / 60) * 100));
  const canControl = localIsGiver && view.status === 'playing';

  return (
    <main className="online-playing">
      <div className="room-topline">
        <span>
          Lượt {view.turnIndex + 1} / 4 · {view.mode === 'talk' ? 'NÓI GỢI Ý' : 'VẼ GỢI Ý'} · {view.category}
        </span>
        <span className="connection-state">
          <span className={`live-dot ${p2pActive ? 'p2p' : ''}`} />
          {p2pActive ? 'P2P Realtime (60fps)' : 'Đã kết nối'}
        </span>
      </div>

      <header className="game-header">
        <div className="round-info">
          Phòng <strong>{roomCode}</strong> · Bạn là <strong>{localPlayer?.name || names[session.playerIndex]}</strong>
        </div>
        <div className="scoreboard">
          {names.map((player, index) => (
            <div
              key={index}
              className={`score-chip ${index === guesserIndex ? 'active-turn' : ''}`}
            >
              <span>{player}</span>
              <b>{view.scores[index] ?? 0} đ</b>
            </div>
          ))}
        </div>
      </header>

      <div className={`online-role-banner ${localIsGiver ? '' : 'guesser'}`}>
        <Wifi size={16} />{' '}
        {localIsGiver
          ? `Bạn đang ra gợi ý cho ${names[guesserIndex]}.`
          : `${names[giverIndex]} đang gợi ý — bạn hãy đoán thật nhanh!`}
      </div>

      <div className="game-grid">
        <section className="play-main">
          <div className="turn-top">
            <div className="role-pill">
              <span>
                <strong>{names[giverIndex]}</strong> ra hiệu{' '}
                <span style={{ color: '#71798f' }}>→</span> <strong>{names[guesserIndex]}</strong> đoán
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
                Thời gian còn lại
              </div>
            </div>
            <div className="meter" aria-label={`Còn ${view.timeLeftSeconds} giây`}>
              <div className="meter-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {localIsGiver && view.currentPrompt ? (
            <div className="prompt-card">
              <div className="prompt-label">Từ bí mật · Chỉ bạn nhìn thấy</div>
              <div className="prompt-word">{view.currentPrompt}</div>
            </div>
          ) : (
            <div className="prompt-card">
              <div className="prompt-label">Từ bí mật</div>
              <div className="prompt-word" style={{ fontSize: 'clamp(20px, 4vw, 28px)', color: '#aeb4c5' }}>
                Đang chờ gợi ý từ {names[giverIndex]}…
              </div>
            </div>
          )}

          {view.mode === 'draw' && (
            <OnlineDrawing
              strokes={view.drawingStrokes}
              revision={view.drawingRevision}
              canDraw={canControl}
              onChange={handleDrawingChange}
              onClearDrawing={handleClearDrawing}
            />
          )}

          <p className="play-instruction">
            {localIsGiver
              ? view.mode === 'talk'
                ? 'Hãy dùng lời nói để diễn tả (không nói từ khóa). Xác nhận ngay khi bạn đoán đúng!'
                : 'Vẽ gợi ý lên bảng. Nét vẽ truyền trực tiếp sang màn hình của bạn bè!'
              : 'Hãy chú ý gợi ý trên bảng và đoán to thành tiếng. Người ra gợi ý sẽ bấm xác nhận khi bạn đoán trúng!'}
          </p>

          {canControl ? (
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
          ) : (
            <div className="room-message" style={{ justifyContent: 'center' }}>
              <LoaderCircle className="spin" />{' '}
              {view.status === 'paused'
                ? 'Ván chơi đang tạm dừng.'
                : 'Hãy đoán thật nhanh! Người gợi ý sẽ xác nhận khi bạn nói đúng.'}
            </div>
          )}

          {actionError && <div className="online-error" role="alert">{actionError}</div>}
        </section>

        <aside className="game-side">
          <section className="side-card">
            <h3>Lượt hiện tại</h3>
            <div className="role-row">
              <span>Ra gợi ý</span>
              <b>{names[giverIndex]}</b>
            </div>
            <div className="role-row">
              <span>Đoán từ</span>
              <b>{names[guesserIndex]}</b>
            </div>
            <div className="role-row">
              <span>Đã đúng lượt này</span>
              <b style={{ color: '#f7d55c', fontSize: 18 }}>{view.correctThisTurn} từ</b>
            </div>
          </section>

          <section className="side-card">
            <h3>Điểm thưởng tốc độ</h3>
            <div className="points-note">
              <strong>100 điểm + 20 × giây còn lại</strong>
              Mỗi đáp án đúng sẽ cộng điểm trực tiếp cho người đoán!
            </div>
          </section>
        </aside>
      </div>

      {view.status === 'paused' && (
        <div className="pause-overlay" role="dialog" aria-modal="true">
          <div className="pause-card">
            <div className="eyebrow" style={{ justifyContent: 'center' }}>Đồng hồ đã dừng</div>
            <h2>Nghỉ giải lao.</h2>
            <p>Ván chơi đang tạm dừng trên cả hai thiết bị.</p>
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
