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
  const [roomCode, setRoomCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tự động nhận diện ?room=ABCDEF từ link mời của bạn bè
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
      setError(err?.message || 'Không thể vào phòng này. Hãy kiểm tra lại mã phòng.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="screen">
      <div className="online-wrap">
        <aside className="online-aside fade-in">
          <div className="eyebrow">
            <Globe2 size={14} /> Chơi nhóm qua mạng (2 - 8 người)
          </div>
          <h1>
            Vẽ cùng bạn bè,<br />
            <span>đoán cực vui!</span>
          </h1>
          <p>
            Mỗi lượt một người sẽ nhận từ bí mật để vẽ. Tất cả những người còn lại cùng tranh nhau đoán từ thật nhanh!
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
              style={{ marginTop: 16 }}
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
