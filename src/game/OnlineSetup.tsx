import { ArrowRight, ArrowLeft, Globe2, LoaderCircle } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { categories } from './words';
import type { RoomCreateInput, RoomJoinInput, RoomSession } from './types';
import { apiCreateRoom, apiJoinRoom } from '../lib/api';

type Props = {
  onSession: (session: RoomSession) => void;
  onBack: () => void;
};
type Mode = 'host' | 'join';

export default function OnlineSetup({ onSession, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('host');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Đời thường');
  const [playMode, setPlayMode] = useState<'talk' | 'draw'>('draw');
  const [roomCode, setRoomCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tự động nhận diện ?room=ABCDEF từ link bạn bè gửi
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRoom = params.get('room');
    if (queryRoom && queryRoom.trim().length === 6) {
      setRoomCode(queryRoom.trim().toUpperCase());
      setMode('join');
    }
  }, []);

  const canSubmit =
    name.trim().length > 0 && (mode === 'host' || roomCode.trim().length === 6);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || pending) return;
    setPending(true);
    setError(null);
    try {
      const data: RoomCreateInput = {
        playerName: name.trim(),
        category,
        mode: playMode,
      };
      const session = await apiCreateRoom(data);
      onSession(session);
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo phòng lúc này. Hãy thử lại.');
    } finally {
      setPending(false);
    }
  };

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || pending) return;
    setPending(true);
    setError(null);
    try {
      const data: RoomJoinInput = { playerName: name.trim() };
      const session = await apiJoinRoom(roomCode.trim().toUpperCase(), data);
      onSession(session);
    } catch (err: any) {
      setError(err?.message || 'Không thể vào phòng này. Kiểm tra lại mã phòng nhé.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="screen">
      <div className="online-wrap">
        <aside className="online-aside fade-in">
          <div className="eyebrow">
            <Globe2 size={14} /> Chơi cùng bạn bè qua mạng
          </div>
          <h1>
            Ở xa mấy,<br />
            <span>vẫn hiểu ý.</span>
          </h1>
          <p>
            Một người nhận từ khóa bí mật, người kia trổ tài phán đoán qua gợi ý nói hoặc nét vẽ trực tiếp!
          </p>
          <button
            className="online-back"
            type="button"
            onClick={onBack}
          >
            <ArrowLeft size={15} /> Quay lại trang chủ
          </button>
        </aside>

        <section className="online-panel fade-in delay-1">
          <div className="online-tabs" role="tablist">
            <button
              type="button"
              className={`online-tab ${mode === 'host' ? 'active' : ''}`}
              onClick={() => {
                setMode('host');
                setError(null);
              }}
            >
              Tạo phòng mới
            </button>
            <button
              type="button"
              className={`online-tab ${mode === 'join' ? 'active' : ''}`}
              onClick={() => {
                setMode('join');
                setError(null);
              }}
            >
              Nhập mã vào phòng
            </button>
          </div>

          <form onSubmit={mode === 'host' ? handleCreate : handleJoin}>
            <label className="online-field">
              Tên biệt danh của bạn
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={18}
                autoFocus
                autoComplete="nickname"
                placeholder="Ví dụ: Hoàng Hải"
              />
            </label>

            {mode === 'host' ? (
              <>
                <label className="online-field">
                  Chủ đề từ vựng
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="field-label">Cách thức ra gợi ý</div>
                <div className="mode-row">
                  <button
                    type="button"
                    className={`mode-choice ${playMode === 'draw' ? 'active' : ''}`}
                    onClick={() => setPlayMode('draw')}
                  >
                    <span className="mode-icon">
                      <BrushIcon />
                    </span>
                    <span>
                      <strong>VẼ</strong>
                      <small>Vẽ gợi ý trực tiếp</small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`mode-choice ${playMode === 'talk' ? 'active' : ''}`}
                    onClick={() => setPlayMode('talk')}
                  >
                    <span className="mode-icon">
                      <Mic2Icon />
                    </span>
                    <span>
                      <strong>NÓI</strong>
                      <small>Diễn tả bằng lời nói</small>
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <label className="online-field">
                Mã phòng (gồm 6 ký tự)
                <input
                  className="room-code-input"
                  value={roomCode}
                  onChange={(event) =>
                    setRoomCode(
                      event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6),
                    )
                  }
                  maxLength={6}
                  autoCapitalize="characters"
                  placeholder="VD: 7K9MF2"
                />
              </label>
            )}

            {error && <div className="online-error" role="alert">{error}</div>}

            <button
              type="submit"
              className="primary-btn full-btn"
              disabled={!canSubmit || pending}
              style={{ marginTop: 14 }}
            >
              {pending ? (
                <>
                  <LoaderCircle className="spin" /> Đang kết nối…
                </>
              ) : (
                <>
                  {mode === 'host' ? 'Tạo phòng ngay' : 'Tham gia phòng'}{' '}
                  <ArrowRight />
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Mic2Icon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 6 4 4M3 21c4 0 6-2 6-5l11-11-4-4L5 12c-3 3-2 9-2 9Z" />
    </svg>
  );
}
