import { ArrowRight, ArrowLeft, Globe2, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { categories } from './words';
import type { RoomCreateInput, RoomJoinInput, RoomSession } from '@workspace/api-client-react';
import { useCreateRoom, useJoinRoom } from '@workspace/api-client-react';

type Props = { onSession: (session: RoomSession) => void; onBack: () => void };
type Mode = 'host' | 'join';

function errorText(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'Không thể kết nối lúc này. Hãy thử lại nhé.';
}

export default function OnlineSetup({ onSession, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('host');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [playMode, setPlayMode] = useState<'talk' | 'draw'>('talk');
  const [roomCode, setRoomCode] = useState('');
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();
  const pending = createRoom.isPending || joinRoom.isPending;
  const error = createRoom.error ?? joinRoom.error;
  const canSubmit = name.trim().length > 0 && (mode === 'host' || roomCode.trim().length === 6);

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || pending) return;
    const data: RoomCreateInput = { playerName: name.trim(), category: category as RoomCreateInput['category'], mode: playMode };
    createRoom.mutate({ data }, { onSuccess: onSession });
  };
  const join = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || pending) return;
    const data: RoomJoinInput = { playerName: name.trim() };
    joinRoom.mutate({ roomCode: roomCode.trim().toUpperCase(), data }, { onSuccess: onSession });
  };

  return <main className="screen">
    <div className="online-wrap">
      <aside className="online-aside fade-in">
        <div className="eyebrow"><Globe2 size={14} /> Chơi từ xa</div>
        <h1>Ở xa mấy,<br /><span>vẫn hiểu ý.</span></h1>
        <p>Một người nhận từ bí mật, một người đoán qua những gợi ý đang hiện ngay trên màn hình.</p>
        <button className="online-back" type="button" onClick={onBack} data-testid="button-online-back"><ArrowLeft size={15} /> Chọn cách chơi khác</button>
      </aside>
      <section className="online-panel fade-in delay-1">
        <div className="online-tabs" role="tablist" aria-label="Chọn tạo hoặc tham gia phòng">
          <button type="button" role="tab" aria-selected={mode === 'host'} className={`online-tab ${mode === 'host' ? 'active' : ''}`} onClick={() => setMode('host')} data-testid="tab-create-room">Tạo phòng</button>
          <button type="button" role="tab" aria-selected={mode === 'join'} className={`online-tab ${mode === 'join' ? 'active' : ''}`} onClick={() => setMode('join')} data-testid="tab-join-room">Nhập mã phòng</button>
        </div>
        <form onSubmit={mode === 'host' ? create : join}>
          <label className="online-field">Tên của bạn
            <input value={name} onChange={event => setName(event.target.value)} maxLength={18} autoComplete="nickname" placeholder="Ví dụ: Minh" data-testid="input-online-player-name" />
          </label>
          {mode === 'host' ? <>
            <label className="online-field">Chủ đề
              <select value={category} onChange={event => setCategory(event.target.value)} data-testid="select-online-category">
                {categories.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <div className="field-label">Cách ra gợi ý</div>
            <div className="mode-row">
              <button type="button" className={`mode-choice ${playMode === 'talk' ? 'active' : ''}`} onClick={() => setPlayMode('talk')} data-testid="button-online-mode-talk"><span className="mode-icon"><Mic2Icon /></span><span><strong>NÓI</strong><small>Gợi ý bằng lời</small></span></button>
              <button type="button" className={`mode-choice ${playMode === 'draw' ? 'active' : ''}`} onClick={() => setPlayMode('draw')} data-testid="button-online-mode-draw"><span className="mode-icon"><BrushIcon /></span><span><strong>VẼ</strong><small>Gợi ý bằng hình</small></span></button>
            </div>
          </> : <label className="online-field">Mã phòng
            <input className="room-code-input" value={roomCode} onChange={event => setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6))} maxLength={6} autoCapitalize="characters" placeholder="ABC123" data-testid="input-room-code" />
          </label>}
          {error && <div className="online-error" role="alert" data-testid="status-room-setup-error">{errorText(error)}</div>}
          <button type="submit" className="primary-btn full-btn" disabled={!canSubmit || pending} data-testid={mode === 'host' ? 'button-create-room' : 'button-join-room'}>
            {pending ? <><LoaderCircle className="spin" /> Đang kết nối…</> : <>{mode === 'host' ? 'Tạo phòng' : 'Vào phòng'} <ArrowRight /></>}
          </button>
        </form>
      </section>
    </div>
  </main>;
}

function Mic2Icon() {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></svg>;
}
function BrushIcon() {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 6 4 4M3 21c4 0 6-2 6-5l11-11-4-4L5 12c-3 3-2 9-2 9Z"/></svg>;
}
