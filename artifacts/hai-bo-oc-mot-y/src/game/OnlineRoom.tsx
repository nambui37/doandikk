import { useCallback, useEffect, useRef } from 'react';
import { ArrowRight, Check, Clock3, Copy, LoaderCircle, Pause, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { useGetRoomState, useActOnRoom, useUpdateRoomDrawing, getGetRoomStateQueryKey } from '@workspace/api-client-react';
import type { DrawingStroke, RoomSession, RoomView } from '@workspace/api-client-react';
import type { GameConfig } from './SetupScreen';
import OnlineDrawing from './OnlineDrawing';
import ResultsScreen from './ResultsScreen';

type Props = { session: RoomSession; onExit: () => void };

function message(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'Kết nối bị gián đoạn. Đang thử kết nối lại…';
}

export default function OnlineRoom({ session, onExit }: Props) {
  const headers = { Authorization: `Bearer ${session.playerToken}` };
  const roomCode = session.roomCode;
  const roomQuery = useGetRoomState(roomCode, {
    query: {
      enabled: Boolean(roomCode && session.playerToken),
      queryKey: getGetRoomStateQueryKey(roomCode),
      refetchInterval: query =>
        query.state.data?.mode === 'draw' && query.state.data.status === 'playing' ? 350 : 1200,
      retry: 2,
    },
    request: { headers },
  });
  const act = useActOnRoom({ request: { headers } });
  const drawingMutation = useUpdateRoomDrawing({ request: { headers } });
  const view = roomQuery.data as RoomView | undefined;
  const drawingRevision = useRef(view?.drawingRevision ?? 0);
  useEffect(() => {
    if (view) drawingRevision.current = Math.max(drawingRevision.current, view.drawingRevision);
  }, [view?.drawingRevision]);

  const perform = useCallback((action: 'start' | 'correct' | 'pass' | 'pause' | 'resume' | 'restart') => {
    act.mutate({ roomCode, data: { action } }, { onSuccess: () => roomQuery.refetch() });
  }, [act.mutate, roomCode, roomQuery.refetch]);
  const updateDrawing = (strokes: DrawingStroke[]) => {
    const revision = Math.max(drawingRevision.current, view?.drawingRevision ?? 0) + 1;
    drawingRevision.current = revision;
    drawingMutation.mutate({ roomCode, data: { revision, strokes } }, { onSuccess: () => roomQuery.refetch() });
  };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(roomCode); } catch { /* clipboard may be unavailable in embedded browsers */ }
  };

  if (roomQuery.isLoading && !view) return <main className="screen"><section className="online-panel online-status-card" aria-label="Đang khôi phục phòng">
    <div className="eyebrow" style={{ justifyContent: 'center' }}>Đang kết nối lại</div><h1>Trở lại bàn chơi…</h1>
    <div className="skeleton-line" style={{ width: '70%', margin: '18px auto' }} /><div className="skeleton-line" style={{ width: '46%', margin: '10px auto' }} />
  </section></main>;

  if (roomQuery.isError && !view) return <main className="screen"><section className="online-panel online-status-card fade-in" data-testid="status-room-reconnecting">
    <div className="handoff-icon"><WifiOff /></div><div className="eyebrow" style={{ justifyContent: 'center' }}>Mất kết nối</div>
    <h1>Phòng vẫn được lưu.</h1><p>{message(roomQuery.error)} Mã phòng và quyền truy cập vẫn nằm trên thiết bị này.</p>
    <div className="pause-actions"><button type="button" className="secondary-btn" onClick={onExit} data-testid="button-leave-room">Về màn hình đầu</button><button type="button" className="primary-btn" onClick={() => roomQuery.refetch()} data-testid="button-retry-room">Thử kết nối lại <Wifi /></button></div>
  </section></main>;

  if (!view) return null;
  const names = [view.players.find(player => player.index === 0)?.name ?? 'Người chơi 1', view.players.find(player => player.index === 1)?.name ?? 'Đang chờ…'] as [string, string];
  const config: GameConfig = { players: names, category: view.category, mode: view.mode };
  const giverIndex = view.turnIndex % 2;
  const guesserIndex = 1 - giverIndex;
  const localIsGiver = session.playerIndex === giverIndex;
  const localPlayer = view.players.find(player => player.index === session.playerIndex);
  const isHost = session.playerIndex === 0;
  const actionError = act.error ?? drawingMutation.error;

  if (view.status === 'results') {
    return <div className="room-shell"><div className="room-topline"><span>Mã phòng · {roomCode}</span><span className="connection-state">Đã đồng bộ</span></div>
      <ResultsScreen config={config} scores={[view.scores[0] ?? 0, view.scores[1] ?? 0]} onSetup={onExit} onAgain={() => perform('restart')} />
      <p className="online-result-note" style={{ textAlign: 'center' }}>Kết quả đã được đồng bộ cho cả hai người chơi.</p>
    </div>;
  }

  if (view.status === 'waiting' || view.status === 'ready') {
    const hasGuest = view.players.some(player => player.index !== 0);
    return <main className="screen"><section className="online-panel room-shell fade-in" data-testid="screen-online-lobby">
      <div className="room-topline"><span>Phòng chơi trực tuyến</span><span className="connection-state" data-testid="status-room-connection">{roomQuery.isFetching ? 'Đang cập nhật' : 'Đã kết nối'}</span></div>
      <div className="eyebrow">Đưa bạn bè vào cuộc</div><h1 style={{ fontSize: 'clamp(33px,6vw,49px)', letterSpacing: '-.05em', margin: '13px 0 0' }}>Bàn chơi đã mở.</h1>
      <div className="room-code-panel"><div className="field-label">Mã phòng · gửi mã này cho bạn</div><div className="room-code" data-testid="text-room-code">{roomCode}</div><button type="button" className="copy-btn" onClick={copyCode} data-testid="button-copy-room-code"><Copy size={13} /> Sao chép mã</button><p>Cả hai dùng mã này để vào cùng một phòng.</p></div>
      <div className="room-players">
        <div className="room-player"><small>Người tạo phòng</small><strong data-testid="text-room-player-0">{view.players.find(player => player.index === 0)?.name ?? names[0]}</strong></div>
        {hasGuest ? <div className="room-player"><small>Đã tham gia</small><strong data-testid="text-room-player-1">{names[1]}</strong></div> : <div className="room-player waiting"><small>Người chơi 2</small><strong data-testid="status-room-waiting-player">Đang chờ bạn của bạn…</strong></div>}
      </div>
      <div className="room-message"><Wifi /> Chủ đề: {view.category} · {view.mode === 'talk' ? 'Nói gợi ý' : 'Vẽ gợi ý'} · 4 lượt, mỗi lượt 60 giây.</div>
      {actionError && <div className="online-error" role="alert" data-testid="status-room-action-error">{message(actionError)}</div>}
      {isHost ? <button type="button" className="primary-btn full-btn" disabled={!hasGuest || act.isPending} onClick={() => perform('start')} data-testid="button-start-online-game">
        {act.isPending ? <><LoaderCircle /> Đang bắt đầu…</> : <>Bắt đầu ván chơi <ArrowRight /></>}
      </button> : <div className="room-message" data-testid="status-room-waiting-host"><LoaderCircle /> Đã vào phòng. Chờ người tạo bắt đầu ván nhé.</div>}
      <button type="button" className="online-back" onClick={onExit} data-testid="button-exit-lobby">Thoát về màn hình đầu</button>
    </section></main>;
  }

  const progress = Math.max(0, Math.min(100, view.timeLeftSeconds / 60 * 100));
  const canControl = localIsGiver && view.status === 'playing';
  return <main className="online-playing">
    <div className="room-topline"><span data-testid="status-online-round">Lượt {view.turnIndex + 1} / 4 · {view.mode === 'talk' ? 'NÓI' : 'VẼ'} · {view.category}</span>
      <span className="connection-state" data-testid="status-room-connection">{roomQuery.isFetching ? 'Đang đồng bộ' : 'Đã kết nối'}</span></div>
    <header className="game-header">
      <div className="round-info">Phòng <strong>{roomCode}</strong> · Bạn là {localPlayer?.name ?? names[session.playerIndex]}</div>
      <div className="scoreboard">{names.map((player, index) => <div key={index} className={`score-chip ${index === guesserIndex ? 'active-turn' : ''}`} data-testid={`status-online-score-${index}`}><span>{player}</span><b>{view.scores[index] ?? 0}</b></div>)}</div>
    </header>
    <div className={`online-role-banner ${localIsGiver ? '' : 'guesser'}`} data-testid="status-online-role">
      <Wifi size={16} /> {localIsGiver ? `Bạn ra gợi ý cho ${names[guesserIndex]}.` : `${names[giverIndex]} đang ra gợi ý — bạn hãy đoán!`}
    </div>
    <div className="game-grid">
      <section className="play-main">
        <div className="turn-top">
          <div className="role-pill" data-testid="status-player-roles"><span><strong>{names[giverIndex]}</strong> ra gợi ý <span style={{ color: '#71798f' }}>→</span> <strong>{names[guesserIndex]}</strong> đoán</span></div>
          <div className="turn-actions">
            {view.status === 'playing' && <button className="icon-btn" aria-label="Tạm dừng" onClick={() => perform('pause')} data-testid="button-online-pause"><Pause /></button>}
            {view.status === 'paused' && <button className="icon-btn" aria-label="Tiếp tục" onClick={() => perform('resume')} data-testid="button-online-resume-icon"><Check /></button>}
            {isHost && <button className="icon-btn" aria-label="Chơi lại" onClick={() => perform('restart')} data-testid="button-online-restart"><RotateCcw /></button>}
          </div>
        </div>
        <div className="timer-wrap"><div><div className={`timer ${view.timeLeftSeconds <= 10 ? 'danger' : ''}`} data-testid="status-online-timer">00:{String(view.timeLeftSeconds).padStart(2, '0')}</div><div className="timer-label"><Clock3 style={{ width: 12, verticalAlign: '-2px', marginRight: 5 }} />Thời gian từ máy chủ</div></div><div className="meter" aria-label={`Còn ${view.timeLeftSeconds} giây`}><div className="meter-fill" style={{ width: `${progress}%` }} /></div></div>
        {localIsGiver && view.currentPrompt ? <div className="prompt-card" data-testid="card-private-online-prompt"><div className="prompt-label">Từ bí mật · chỉ bạn nhìn thấy</div><div className="prompt-word" data-testid="text-private-online-prompt">{view.currentPrompt}</div></div> :
          <div className="prompt-card" data-testid="card-hidden-online-prompt"><div className="prompt-label">Từ bí mật</div><div className="prompt-word">Chỉ người ra gợi ý nhìn thấy</div></div>}
        {view.mode === 'draw' && <OnlineDrawing strokes={view.drawingStrokes} revision={view.drawingRevision} canDraw={canControl} onChange={updateDrawing} />}
        <p className="play-instruction" data-testid="text-online-instruction">{localIsGiver ? (view.mode === 'talk' ? 'Hãy diễn tả bằng lời, không nói từ bí mật. Bạn xác nhận khi bạn mình đoán đúng.' : 'Vẽ gợi ý trên bảng. Bạn xác nhận khi bạn mình đoán đúng.') : 'Hãy đoán thành tiếng dựa trên gợi ý. Người ra gợi ý sẽ xác nhận đáp án đúng.'}</p>
        {canControl ? <div className="play-actions"><button type="button" className="primary-btn" disabled={act.isPending} onClick={() => perform('correct')} data-testid="button-online-correct"><Check /> Đoán đúng!</button><button type="button" className="pass-btn" disabled={act.isPending} onClick={() => perform('pass')} data-testid="button-online-pass">Bỏ qua từ này</button></div> :
          <div className="room-message" data-testid="status-waiting-for-clue"><LoaderCircle /> {view.status === 'paused' ? 'Ván chơi đang tạm dừng.' : 'Chờ người ra gợi ý xác nhận hoặc chuyển từ.'}</div>}
        {actionError && <div className="online-error" role="alert" data-testid="status-room-action-error">{message(actionError)}</div>}
      </section>
      <aside className="game-side">
        <section className="side-card"><h3>Đang chơi</h3><div className="role-row"><span>Ra gợi ý</span><b data-testid="text-online-clue-giver">{names[giverIndex]}</b></div><div className="role-row"><span>Đoán từ</span><b data-testid="text-online-guesser">{names[guesserIndex]}</b></div><div className="role-row"><span>Đã đúng lượt này</span><b data-testid="status-online-correct-count">{view.correctThisTurn}</b></div></section>
        <section className="side-card"><h3>Điểm thưởng tốc độ</h3><div className="points-note"><strong>100 điểm + 20 × giây còn lại</strong>Mỗi đáp án đúng cộng điểm cho người đoán. Cả hai màn hình cập nhật cùng lúc.</div></section>
      </aside>
    </div>
    {view.status === 'paused' && <div className="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="online-pause-title"><div className="pause-card"><div className="eyebrow" style={{ justifyContent: 'center' }}>Đồng hồ đã dừng</div><h2 id="online-pause-title">Nghỉ một nhịp.</h2><p>Ván chơi đang tạm dừng trên cả hai thiết bị.</p><button type="button" className="primary-btn" onClick={() => perform('resume')} disabled={act.isPending} data-testid="button-online-resume">Tiếp tục <Check /></button></div></div>}
  </main>;
}
