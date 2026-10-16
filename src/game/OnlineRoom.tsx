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
import TelephonePlay from './TelephonePlay';
import TelephoneAlbum from './TelephoneAlbum';
import Hourglass3D from './Hourglass3D';
import PlayerPodium3D from './PlayerPodium3D';
import SoundSettingsModal from './SoundSettingsModal';
import InstallAppModal from './InstallAppModal';
import { soundManager } from '../lib/soundManager';
import { AVATAR_LIST } from './Avatars';
import {
  apiActOnRoom,
  apiFinishDrawingEarly,
  apiGetRoomState,
  apiGuessWord,
  apiSetGameMode,
  apiSetTelephoneConfig,
  apiTelephoneSubmit,
  apiTelephoneDraft,
  apiUpdateRoomDrawing,
  apiLeaveRoom,
} from '../lib/api';
import { P2PManager, type P2PMessage } from '../lib/p2p';

function getAvatarForPlayer(player: { name: string; avatarIndex?: number } | string) {
  if (typeof player === 'object' && typeof player.avatarIndex === 'number' && AVATAR_LIST[player.avatarIndex]) {
    return AVATAR_LIST[player.avatarIndex];
  }
  const name = typeof player === 'string' ? player : player.name;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_LIST.length;
  return AVATAR_LIST[hash] || AVATAR_LIST[0];
}

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
  const [lastFeedback, setLastFeedback] = useState<{
    text: string;
    guesserName?: string;
    drawerName?: string;
    isCorrect: boolean;
  } | null>(null);

  // Tự động ẩn thông báo đoán sau 4.5 giây để không che khuất màn hình
  useEffect(() => {
    if (!lastFeedback) return;
    const timer = setTimeout(() => {
      setLastFeedback(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [lastFeedback]);

  const roomCode = session.roomCode;
  const playerToken = session.playerToken;
  const isHost = session.playerIndex === 0;

  const drawingRevision = useRef(session.view.drawingRevision || 0);
  const prevTurnIndexRef = useRef(session.view.turnIndex);
  const p2pManagerRef = useRef<P2PManager | null>(null);
  const lastFeedbackTimestamp = useRef<number>(0);
  const drawingDebounceTimer = useRef<any>(null);
  const pendingStrokesRef = useRef<DrawingStroke[] | null>(null);

  // Khởi tạo WebRTC P2P (truyền nét vẽ SYNC_STROKES, DRAW_STROKE và CLEAR_DRAWING tức thì)
  useEffect(() => {
    const p2p = new P2PManager(roomCode, isHost);
    p2pManagerRef.current = p2p;

    p2p.init(
      (msg: P2PMessage) => {
        if (msg.type === 'SYNC_STROKES') {
          drawingRevision.current = Math.max(drawingRevision.current, msg.revision);
          pendingStrokesRef.current = null;
          setView((prev) => ({
            ...prev,
            drawingRevision: msg.revision,
            drawingStrokes: msg.strokes,
          }));
        } else if (msg.type === 'DRAW_STROKE') {
          drawingRevision.current = Math.max(drawingRevision.current, msg.revision);
          setView((prev) => ({
            ...prev,
            drawingRevision: msg.revision,
            drawingStrokes: [...prev.drawingStrokes, msg.stroke],
          }));
        } else if (msg.type === 'CLEAR_DRAWING') {
          drawingRevision.current = msg.revision;
          pendingStrokesRef.current = null;
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
          // Khi chuyển sang lượt vẽ mới (hoặc vòng đấu mới):
          const isTurnChanged = nextView.turnIndex !== prevTurnIndexRef.current;
          if (isTurnChanged) {
            prevTurnIndexRef.current = nextView.turnIndex;
            drawingRevision.current = nextView.drawingRevision || 0;
            pendingStrokesRef.current = null;
            setLastFeedback(null);
            if (drawingDebounceTimer.current) {
              clearTimeout(drawingDebounceTimer.current);
            }
            if (p2pManagerRef.current?.isConnected) {
              p2pManagerRef.current.broadcast({
                type: 'CLEAR_DRAWING',
                revision: nextView.drawingRevision || 0,
              });
            }
          } else {
            drawingRevision.current = Math.max(drawingRevision.current, nextView.drawingRevision);
          }

          // Bảo vệ nét vẽ của Drawer và Viewer: không bao giờ để polling server đè lùi revision làm mất nét
          setView((prev) => {
            const hasTurnChanged = nextView.turnIndex !== prev.turnIndex;
            if (hasTurnChanged) {
              // Chuyển lượt mới hoàn toàn: xóa sạch nét vẽ cũ của người chơi trước
              return {
                ...nextView,
                drawingRevision: nextView.drawingRevision || 0,
                drawingStrokes: [],
              };
            }

            const isLocalDrawer = nextView.players.length > 0 &&
              (nextView.turnIndex % nextView.players.length) === session.playerIndex;
            // Chỉ giữ nét vẽ cục bộ trong cùng 1 lượt khi Drawer đang vẽ dở mà server chưa kịp nhận (in-flight)
            const keepLocalDrawing = isLocalDrawer && prev.drawingStrokes.length > 0 && nextView.drawingStrokes.length === 0 && (drawingRevision.current > nextView.drawingRevision);
            const keepHigherRevision = prev.drawingRevision > nextView.drawingRevision && nextView.drawingStrokes.length > 0;

            return {
              ...nextView,
              drawingRevision: (keepLocalDrawing || keepHigherRevision) ? prev.drawingRevision : nextView.drawingRevision,
              drawingStrokes: (keepLocalDrawing || keepHigherRevision) ? prev.drawingStrokes : nextView.drawingStrokes,
            };
          });

          // Nhận diện khi có ai đó đoán đúng
          if (
            nextView.lastGuessFeedback &&
            nextView.lastGuessFeedback.timestamp !== lastFeedbackTimestamp.current
          ) {
            lastFeedbackTimestamp.current = nextView.lastGuessFeedback.timestamp;
            const fb = nextView.lastGuessFeedback;
            setLastFeedback({
              guesserName: fb.guesserName,
              drawerName: fb.drawerName,
              text: fb.text,
              isCorrect: fb.isCorrect,
            });

            if (fb.isCorrect) {
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
          const isReveal = view.currentPhase === 'reveal';
          timerId = setTimeout(poll, isReveal ? 400 : 900);
        }
      }
    };

    poll();

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [roomCode, playerToken, session.playerIndex]);

  // Hành động phòng
  const handleAction = async (action: RoomAction) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const nextView = await apiActOnRoom(roomCode, playerToken, action);
      if (nextView.turnIndex !== prevTurnIndexRef.current) {
        prevTurnIndexRef.current = nextView.turnIndex;
        drawingRevision.current = nextView.drawingRevision || 0;
        pendingStrokesRef.current = null;
        if (drawingDebounceTimer.current) {
          clearTimeout(drawingDebounceTimer.current);
        }
      }
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
    // Flush ngay lập tức các nét vẽ còn pending
    if (drawingDebounceTimer.current) {
      clearTimeout(drawingDebounceTimer.current);
      if (pendingStrokesRef.current) {
        apiUpdateRoomDrawing(roomCode, playerToken, {
          revision: drawingRevision.current,
          strokes: pendingStrokesRef.current,
        }).catch(() => {});
      }
    }
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
        const fb = nextView.lastGuessFeedback;
        setLastFeedback({
          guesserName: fb.guesserName,
          drawerName: fb.drawerName,
          text: fb.text,
          isCorrect: fb.isCorrect,
        });
        if (fb.isCorrect) {
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

  // Cập nhật nét vẽ realtime (P2P phát toàn bộ strokes tức thì + HTTP debounce 60ms)
  const handleDrawingChange = useCallback(
    (strokes: DrawingStroke[]) => {
      const newRev = drawingRevision.current + 1;
      drawingRevision.current = newRev;
      pendingStrokesRef.current = strokes;

      // Cập nhật state view ngay lập tức để mượt mà
      setView((prev) => ({
        ...prev,
        drawingRevision: newRev,
        drawingStrokes: strokes,
      }));

      // 1. Broadcast P2P tức thì với toàn bộ nét vẽ SYNC_STROKES
      if (p2pManagerRef.current?.isConnected) {
        p2pManagerRef.current.broadcast({
          type: 'SYNC_STROKES',
          strokes,
          revision: newRev,
        });
      }

      // 2. Debounce gửi HTTP lên server (60ms) để không nghẽn mạng khi vẽ nhanh liên tục
      if (drawingDebounceTimer.current) clearTimeout(drawingDebounceTimer.current);
      drawingDebounceTimer.current = setTimeout(() => {
        if (pendingStrokesRef.current) {
          apiUpdateRoomDrawing(roomCode, playerToken, {
            revision: drawingRevision.current,
            strokes: pendingStrokesRef.current,
          }).catch(() => {});
        }
      }, 60);
    },
    [roomCode, playerToken],
  );

  const handleClearDrawing = useCallback(() => {
    if (drawingDebounceTimer.current) {
      clearTimeout(drawingDebounceTimer.current);
    }
    pendingStrokesRef.current = null;
    const newRev = drawingRevision.current + 1;
    drawingRevision.current = newRev;

    setView((prev) => ({
      ...prev,
      drawingRevision: newRev,
      drawingStrokes: [],
    }));

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
    soundManager.playSuccess();
    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.65 },
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Xác định chuẩn xác người chơi hiện tại và vai trò vẽ
  const myName = session.view.players[session.playerIndex]?.name;
  const myPlayer = view.players.find((p) => p.name === myName) || view.players[session.playerIndex];
  const myIndex = myPlayer ? myPlayer.index : session.playerIndex;
  const drawerIndex = view.drawerIndex;
  const currentDrawer = view.players[drawerIndex];
  const localIsDrawer = drawerIndex === myIndex;

  // Nộp bài cho chế độ Tam Sao Thất Bản
  const handleTelephoneSubmit = async (payload: { text?: string; strokes?: DrawingStroke[] }) => {
    try {
      const nextView = await apiTelephoneSubmit(roomCode, playerToken, payload);
      setView(nextView);
    } catch (err: any) {
      console.error('Lỗi nộp bài Telephone:', err);
    }
  };

  // Gửi bản nháp nét vẽ ngầm cho server để chống mất bài vẽ khi hết giờ hoặc ngắt kết nối
  const handleTelephoneDraft = async (payload: { text?: string; strokes?: DrawingStroke[] }) => {
    try {
      await apiTelephoneDraft(roomCode, playerToken, payload);
    } catch {
      // ignore
    }
  };

  // Rời phòng có báo Server để cập nhật số người và kết thúc trận đấu nếu thiếu người
  const handleExitRoom = async () => {
    try {
      await apiLeaveRoom(roomCode, playerToken);
    } catch {
      // ignore
    }
    onExit();
  };

  // MÀN HÌNH KẾT QUẢ KHI CÓ NGƯỜI ĐẠT ĐỦ ĐIỂM HOẶC CÔNG CHIẾU ALBUM
  if (view.status === 'results') {
    if (view.gameMode === 'telephone' && view.telephoneState?.allBooks) {
      return (
        <>
          <SoundSettingsModal />
          <TelephoneAlbum
            books={view.telephoneState.allBooks}
            isHost={isHost}
            onRestart={() => handleAction('restart')}
            onExit={handleExitRoom}
          />
        </>
      );
    }

    const winnerPlayer = view.winnerIndex !== null && view.winnerIndex !== undefined
      ? view.players[view.winnerIndex]
      : null;

    return (
      <>
        <SoundSettingsModal />
        <ResultsScreen
          scores={view.scores}
          players={view.players}
          winner={winnerPlayer}
          targetScore={view.targetScore}
          isHost={isHost}
          onPlayAgain={() => handleAction('restart')}
          onExit={handleExitRoom}
        />
      </>
    );
  }

  // MÀN HÌNH PHÒNG CHỜ (WAITING / READY)
  if (view.status === 'waiting' || view.status === 'ready') {
    return (
      <main className="screen gartic-lobby-screen">
        <SoundSettingsModal />
        <section className="gartic-lobby-card fade-in">
          {/* HEADER PHÒNG CHỜ */}
          <div className="gartic-lobby-header">
            <div className="gartic-tag">
              <Wifi size={14} /> Phòng chơi trực tuyến
            </div>
            <div className="lobby-header-right-actions">
              <InstallAppModal />
              <button
                type="button"
                className="gartic-leave-btn-header"
                onClick={() => setShowExitConfirm(true)}
                title="Rời phòng"
              >
                <LogOut size={16} /> Rời phòng
              </button>
            </div>
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

          {/* DANH SÁCH BỤC 3D NGƯỜI CHƠI (3D PODIUM LOBBY) */}
          <div className="gartic-players-section">
            <div className="gartic-section-label">
              <Users size={16} /> Người chơi trong phòng ({view.players.length}/8):
            </div>
            <div className="gartic-podium-lobby-grid">
              {view.players.map((player) => (
                <PlayerPodium3D
                  key={player.index}
                  player={player}
                  isMe={player.index === myIndex}
                  avatarIndex={player.avatarIndex ?? player.index}
                />
              ))}
              {view.players.length < 8 && (
                <div className="player-podium-card empty-waiting" onClick={copyInviteLink} title="Bấm để sao chép link mời bạn bè">
                  <div className="podium-empty-box">
                    <span className="empty-plus-icon">+</span>
                    <span className="empty-invite-text">Mời bạn</span>
                  </div>
                  <div className="podium-pedestal-disk empty">
                    <div className="pedestal-surface" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LỰA CHỌN CHẾ ĐỘ CHƠI */}
          <div className="gartic-mode-selector-section">
            <div className="gartic-section-label">
              <Sparkles size={16} /> Chọn chế độ chơi:
            </div>
            <div className="gartic-mode-tabs">
              <button
                type="button"
                className={`gartic-mode-tab ${view.gameMode === 'telephone' ? 'active' : ''}`}
                onClick={() => isHost && apiSetGameMode(roomCode, playerToken, 'telephone').then(setView).catch(() => {})}
                disabled={!isHost}
              >
                <div className="mode-tab-title">
                  <span>🌀 Tam Sao Thất Bản</span>
                  <span className="mode-badge-hot">KHUYÊN DÙNG</span>
                </div>
                <div className="mode-tab-desc">
                  Mỗi người 1 cuốn sổ song song: Viết câu ➔ Vẽ tranh ➔ Đoán câu ➔ Công chiếu Album!
                </div>
              </button>

              <button
                type="button"
                className={`gartic-mode-tab ${view.gameMode === 'classic' ? 'active' : ''}`}
                onClick={() => isHost && apiSetGameMode(roomCode, playerToken, 'classic').then(setView).catch(() => {})}
                disabled={!isHost}
              >
                <div className="mode-tab-title">
                  <span>⚔️ Đoán Hình 1v1</span>
                </div>
                <div className="mode-tab-desc">
                  Thay phiên nhau vẽ và đoán từ bí mật, ai đủ điểm mục tiêu trước sẽ thắng!
                </div>
              </button>
            </div>
          </div>

          {/* THÔNG TIN THỜI GIAN HOẶC MỤC TIÊU ĐIỂM */}
          {view.gameMode === 'telephone' ? (
            <div className="gartic-rules-card telephone">
              <div className="gartic-section-label" style={{ marginBottom: 8, color: '#e0e7ff' }}>
                <Clock3 size={16} /> Tùy chỉnh thời gian mỗi lượt:
              </div>
              <div className="telephone-time-presets">
                <button
                  type="button"
                  className={`preset-pill ${view.telephoneConfig?.drawSeconds === 60 ? 'active' : ''}`}
                  onClick={() => isHost && apiSetTelephoneConfig(roomCode, playerToken, { promptSeconds: 45, drawSeconds: 60, guessSeconds: 45 }).then(setView).catch(() => {})}
                  disabled={!isHost}
                >
                  ⚡ Nhanh (45s viết / 60s vẽ / 45s đoán)
                </button>
                <button
                  type="button"
                  className={`preset-pill ${(!view.telephoneConfig || view.telephoneConfig?.drawSeconds === 75) ? 'active' : ''}`}
                  onClick={() => isHost && apiSetTelephoneConfig(roomCode, playerToken, { promptSeconds: 60, drawSeconds: 75, guessSeconds: 60 }).then(setView).catch(() => {})}
                  disabled={!isHost}
                >
                  🌟 Chuẩn (60s viết / 75s vẽ / 60s đoán)
                </button>
                <button
                  type="button"
                  className={`preset-pill ${view.telephoneConfig?.drawSeconds === 90 ? 'active' : ''}`}
                  onClick={() => isHost && apiSetTelephoneConfig(roomCode, playerToken, { promptSeconds: 75, drawSeconds: 90, guessSeconds: 75 }).then(setView).catch(() => {})}
                  disabled={!isHost}
                >
                  ☕ Thoải mái (75s viết / 90s vẽ / 75s đoán)
                </button>
              </div>
            </div>
          ) : (
            <div className="gartic-rules-card">
              <Trophy size={18} className="trophy-icon" />
              <div>
                <strong>Mục tiêu: {view.targetScore} Điểm để Thắng cuộc!</strong>
                <small>60s vẽ tranh · 20s đoán tự động · Thay phiên nhau vẽ</small>
              </div>
            </div>
          )}

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
                  <button type="button" className="danger-btn" onClick={handleExitRoom}>
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

  // MÀN HÌNH CHẾ ĐỘ TAM SAO THẤT BẢN
  if (view.gameMode === 'telephone' && view.telephoneState) {
    if (view.telephoneState.phase === 'album' && view.telephoneState.allBooks) {
      return (
        <>
          <SoundSettingsModal />
          <TelephoneAlbum
            books={view.telephoneState.allBooks}
            isHost={isHost}
            onRestart={() => handleAction('restart')}
            onExit={handleExitRoom}
          />
        </>
      );
    }
    return (
      <>
        <SoundSettingsModal />
        <TelephonePlay
          state={view.telephoneState}
          roomCode={roomCode}
          onSubmit={handleTelephoneSubmit}
          onDraft={handleTelephoneDraft}
        />
      </>
    );
  }

  // MÀN HÌNH ĐANG CHƠI 1v1 CỔ ĐIỂN (PLAYING / PAUSED)
  const isDrawingPhase = view.currentPhase === 'drawing';
  const isGuessingPhase = view.currentPhase === 'guessing';
  const isRevealPhase = view.currentPhase === 'reveal';

  const maxPhaseTime = isDrawingPhase ? 60 : 20;
  const progress = Math.max(0, Math.min(100, (view.phaseTimeLeftSeconds / maxPhaseTime) * 100));
  const canDraw = localIsDrawer && isDrawingPhase && view.status === 'playing';

  return (
    <main className="gartic-playing-screen">
      <SoundSettingsModal />
      {/* THANH TOP BAR PHONG CÁCH GARTIC PHONE */}
      <header className="gartic-play-topbar">
        <div className="topbar-left">
          <span className="room-pill">Phòng: <strong>{roomCode}</strong></span>
          <span className="round-pill">Lượt {view.turnIndex + 1}</span>
          <span className="target-pill">Mục tiêu: {view.targetScore}đ</span>
        </div>

        {/* ĐỒNG HỒ CÁT 3D STUDIO & ĐẾM NGƯỢC */}
        <div className={`gartic-timer-box ${isGuessingPhase || view.phaseTimeLeftSeconds <= 10 ? 'danger-pulse' : ''}`}>
          <Hourglass3D timeLeft={view.phaseTimeLeftSeconds} totalTime={maxPhaseTime} />
          <div className="timer-text-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="timer-text">00:{String(view.phaseTimeLeftSeconds).padStart(2, '0')}</span>
            <small className="timer-desc">
              {isDrawingPhase ? '60s Vẽ' : isGuessingPhase ? '20s Đoán' : 'Công bố'}
            </small>
          </div>
        </div>

        {/* NÚT RỜI PHÒNG LUÔN CÓ MẶT */}
        <div className="topbar-right">
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
          key={`online-drawing-${view.turnIndex}-${view.drawerIndex}`}
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
            <>
              🎉 CHÍNH XÁC! <strong>{lastFeedback.guesserName || 'Bạn'}</strong> đoán đúng từ "{lastFeedback.text}"
              {lastFeedback.drawerName && <> &rarr; <strong>{lastFeedback.drawerName}</strong> vẽ chuẩn đẹp (+1 Điểm)!</>}
            </>
          ) : (
            <>{lastFeedback.guesserName ? `${lastFeedback.guesserName}: "${lastFeedback.text}"` : `"${lastFeedback.text}"`} — Chưa đúng, thử lại nhanh lên!</>
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
              <button type="button" className="danger-btn" onClick={handleExitRoom}>
                Rời phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
