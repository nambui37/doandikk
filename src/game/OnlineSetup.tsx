import { ArrowRight, ArrowLeft, Globe2, LoaderCircle, RotateCw, Play, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { categories } from './words';
import type { RoomCreateInput, RoomJoinInput, RoomSession } from './types';
import { apiCreateRoom, apiJoinRoom, warmUpServer } from '../lib/api';

type Props = {
  onSession: (session: RoomSession) => void;
  onBack: () => void;
};
type Mode = 'host' | 'join';

// Danh sách các Avatar hoạt hình Gartic Phone phong phú
const GARTIC_AVATARS = [
  { id: 'knight', icon: '🛡️', bg: '#2b3a67', name: 'Hiệp sĩ' },
  { id: 'dragon', icon: '🐉', bg: '#6b2d5c', name: 'Rồng tím' },
  { id: 'penguin', icon: '🐧', bg: '#1f4e5b', name: 'Cánh cụt' },
  { id: 'fox', icon: '🦊', bg: '#b45309', name: 'Cáo cam' },
  { id: 'robot', icon: '🤖', bg: '#374151', name: 'Robot' },
  { id: 'cat', icon: '🐱', bg: '#c026d3', name: 'Mèo cưng' },
  { id: 'ninja', icon: '🥷', bg: '#111827', name: 'Ninja' },
  { id: 'bear', icon: '🐻', bg: '#78350f', name: 'Gấu bự' },
  { id: 'astronaut', icon: '🚀', bg: '#1e3a8a', name: 'Phi hành gia' },
  { id: 'rabbit', icon: '🐰', bg: '#db2777', name: 'Thỏ ngọc' },
  { id: 'wizard', icon: '🧙‍♂️', bg: '#4c1d95', name: 'Pháp sư' },
  { id: 'lion', icon: '🦁', bg: '#d97706', name: 'Sư tử' },
];

const TUTORIAL_SLIDES = [
  {
    title: '1. NHẬN TỪ & VẼ (60s)',
    desc: 'Một người sẽ nhận từ bí mật và có 60 giây trổ tài vẽ hình gợi ý cho bạn bè.',
    icon: '🎨',
  },
  {
    title: '2. TRANH NHAU ĐOÁN (20s)',
    desc: 'Hết giờ vẽ, tất cả người đoán có 20 giây gõ đáp án. Máy tự động chấm điểm!',
    icon: '⚡',
  },
  {
    title: '3. THAY PHIÊN VÒNG TRÒN',
    desc: 'Lượt tiếp theo người khác sẽ vẽ để bạn trổ tài đoán ý đồng đội.',
    icon: '🔄',
  },
  {
    title: '4. ĐỦ ĐIỂM LÀ CHIẾN THẮNG!',
    desc: 'Đoán trúng được +1 điểm. Ai chạm mốc điểm mục tiêu trước sẽ giành cúp Vô địch 🏆!',
    icon: '👑',
  },
];

export default function OnlineSetup({ onSession, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('host');
  const [name, setName] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [category, setCategory] = useState(categories[0] || 'Đồ vật quen thuộc');
  const [targetScore, setTargetScore] = useState<number>(5);
  const [roomCode, setRoomCode] = useState('');
  const [pending, setPending] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  // Đánh thức server Render ngay từ lúc vào màn hình
  useEffect(() => {
    warmUpServer();
  }, []);

  // Tự động nhận diện ?room=ABCDEF từ link mời của bạn bè
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRoom = params.get('room');
    if (queryRoom && queryRoom.trim().length === 6) {
      setRoomCode(queryRoom.trim().toUpperCase());
      setMode('join');
    }
  }, []);

  const currentAvatar = GARTIC_AVATARS[avatarIndex] || GARTIC_AVATARS[0];

  const handleRandomAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % GARTIC_AVATARS.length);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (!name.trim()) {
      setError('⚠️ Vui lòng nhập tên biệt danh của bạn trước khi tạo phòng!');
      return;
    }
    setPending(true);
    setSlowNotice(false);
    setError(null);
    const timer = setTimeout(() => setSlowNotice(true), 1800);

    try {
      const data: RoomCreateInput = {
        playerName: `${currentAvatar.icon} ${name.trim()}`,
        category,
        targetScore,
      };
      const session = await apiCreateRoom(data);
      onSession(session);
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo phòng lúc này. Hãy thử lại.');
    } finally {
      clearTimeout(timer);
      setPending(false);
      setSlowNotice(false);
    }
  };

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (!name.trim()) {
      setError('⚠️ Vui lòng nhập tên biệt danh của bạn!');
      return;
    }
    if (roomCode.trim().length !== 6) {
      setError('⚠️ Vui lòng nhập đủ 6 ký tự mã phòng!');
      return;
    }
    setPending(true);
    setSlowNotice(false);
    setError(null);
    const timer = setTimeout(() => setSlowNotice(true), 1800);

    try {
      const data: RoomJoinInput = { playerName: `${currentAvatar.icon} ${name.trim()}` };
      const session = await apiJoinRoom(roomCode.trim().toUpperCase(), data);
      onSession(session);
    } catch (err: any) {
      setError(err?.message || 'Không thể vào phòng này. Hãy kiểm tra lại mã phòng.');
    } finally {
      clearTimeout(timer);
      setPending(false);
      setSlowNotice(false);
    }
  };

  const nextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % TUTORIAL_SLIDES.length);
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + TUTORIAL_SLIDES.length) % TUTORIAL_SLIDES.length);
  };

  const currentSlide = TUTORIAL_SLIDES[slideIndex];

  return (
    <main className="gartic-home-screen">
      {/* HEADER TOPBAR GARTIC PHONE */}
      <header className="gartic-home-topbar">
        <button type="button" className="gartic-lang-badge">
          <Globe2 size={15} /> <span>VI</span>
        </button>
        <button type="button" className="gartic-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Quay lại
        </button>
      </header>

      {/* LOGO GARTIC PHONE CHÍNH GIỮA */}
      <div className="gartic-main-brand">
        <div className="gartic-bubble-logo">
          <span className="logo-text">ĐOÁN ĐỈNH</span>
          <span className="sub-logo-tag">TAM SAO THẤT BẢN · VẼ TRANH ĐOÁN Ý</span>
        </div>
      </div>

      {/* KHUNG NỘI DUNG 2 CỘT CHUẨN ẢNH MẪU */}
      <div className="gartic-setup-container">
        {/* CỘT BÊN TRÁI: CHỌN AVATAR & TÊN */}
        <section className="gartic-profile-card">
          {/* TABS CHẾ ĐỘ */}
          <div className="gartic-nav-tabs">
            <button
              type="button"
              className={`gartic-nav-tab ${mode === 'host' ? 'active' : ''}`}
              onClick={() => {
                setMode('host');
                setError(null);
              }}
            >
              TẠO PHÒNG MỚI
            </button>
            <button
              type="button"
              className={`gartic-nav-tab ${mode === 'join' ? 'active' : ''}`}
              onClick={() => {
                setMode('join');
                setError(null);
              }}
            >
              NHẬP MÃ PHÒNG
            </button>
          </div>

          <form onSubmit={mode === 'host' ? handleCreate : handleJoin} className="gartic-profile-form">
            <div className="gartic-avatar-picker-row">
              {/* AVATAR TRÒN LỚN CÓ NÚT RANDOM */}
              <div className="gartic-big-avatar-wrapper" style={{ backgroundColor: currentAvatar.bg }}>
                <span className="avatar-icon-char">{currentAvatar.icon}</span>
                <button
                  type="button"
                  className="gartic-random-avatar-btn"
                  onClick={handleRandomAvatar}
                  title="Bấm để đổi avatar ngẫu nhiên"
                >
                  <RotateCw size={16} />
                </button>
              </div>

              {/* Ô NHẬP TÊN BIỆT DANH */}
              <div className="gartic-nickname-input-group">
                <label className="gartic-field-label">CHỌN MỘT NHÂN VẬT VÀ BIỆT DANH</label>
                <input
                  className="gartic-nickname-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={16}
                  autoFocus
                  placeholder="Nhập biệt danh của bạn..."
                />
              </div>
            </div>

            {/* TÙY CHỌN RIÊNG CHO CHỦ PHÒNG HOẶC MÃ PHÒNG */}
            {mode === 'host' ? (
              <div className="gartic-room-settings">
                <div className="gartic-setting-field">
                  <label className="gartic-field-label">CHỦ ĐỀ TỪ KHÓA:</label>
                  <select
                    className="gartic-select-box"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="gartic-setting-field">
                  <label className="gartic-field-label">MỤC TIÊU ĐIỂM THẮNG:</label>
                  <div className="gartic-score-target-row">
                    {[
                      { score: 3, label: '3 Điểm', desc: 'Ván nhanh' },
                      { score: 5, label: '5 Điểm', desc: 'Tiêu chuẩn' },
                      { score: 10, label: '10 Điểm', desc: 'Thách thức' },
                    ].map((item) => (
                      <button
                        key={item.score}
                        type="button"
                        className={`gartic-target-btn ${targetScore === item.score ? 'active' : ''}`}
                        onClick={() => setTargetScore(item.score)}
                      >
                        <strong>{item.label}</strong>
                        <small>{item.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="gartic-room-settings">
                <div className="gartic-setting-field">
                  <label className="gartic-field-label">MÃ PHÒNG (6 KÝ TỰ):</label>
                  <input
                    className="gartic-code-input"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6))}
                    maxLength={6}
                    autoCapitalize="characters"
                    placeholder="VD: 7K9MF2"
                  />
                </div>
              </div>
            )}

            {error && <div className="gartic-error-banner">{error}</div>}

            {/* NÚT BẮT ĐẦU CHUẨN GARTIC PHONE */}
            <button
              type="submit"
              className="gartic-start-play-btn"
              disabled={pending}
            >
              {pending ? (
                <>
                  <LoaderCircle className="spin" size={20} />
                  <span>{slowNotice ? 'Đang đánh thức máy chủ (vài giây)...' : 'Đang xử lý…'}</span>
                </>
              ) : (
                <>
                  <Play size={20} className="play-icon" />
                  <span>{mode === 'host' ? 'BẮT ĐẦU' : 'VÀO PHÒNG'}</span>
                </>
              )}
            </button>

            {pending && slowNotice && (
              <p className="gartic-wake-notice">
                💡 Máy chủ miễn phí đang thức dậy từ chế độ ngủ, sau lần đầu này mọi thao tác sẽ phản hồi tức thì!
              </p>
            )}
          </form>
        </section>

        {/* CỘT BÊN PHẢI: CÁCH CHƠI & CAROUSEL HÌNH ẢNH */}
        <section className="gartic-tutorial-card">
          <h3 className="gartic-tutorial-heading">CÁCH CHƠI</h3>

          <div className="gartic-tutorial-carousel">
            <div className="gartic-tutorial-graphic">
              <span className="big-tut-emoji">{currentSlide.icon}</span>
            </div>

            <h4 className="tutorial-step-title">{currentSlide.title}</h4>
            <p className="tutorial-step-desc">{currentSlide.desc}</p>

            <div className="gartic-carousel-controls">
              <button type="button" className="carousel-arrow" onClick={prevSlide}>
                <ChevronLeft size={22} />
              </button>

              <div className="carousel-dots">
                {TUTORIAL_SLIDES.map((_, i) => (
                  <span
                    key={i}
                    className={`dot ${slideIndex === i ? 'active' : ''}`}
                    onClick={() => setSlideIndex(i)}
                  />
                ))}
              </div>

              <button type="button" className="carousel-arrow" onClick={nextSlide}>
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
