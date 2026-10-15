import { useState, useEffect } from 'react';
import {
  Globe2,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  LoaderCircle,
  KeyRound,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { AVATAR_LIST } from './Avatars';
import type { GameMode, RoomCreateInput, RoomJoinInput, RoomSession } from './types';
import { apiCreateRoom, apiJoinRoom, warmUpServer } from '../lib/api';

type Props = {
  onSession: (session: RoomSession) => void;
  onBack: () => void;
};

type SetupStep = 'profile' | 'mode_select';

const TUTORIAL_SLIDES = [
  {
    title: '1. GỌI SẼ TỐT HƠN',
    desc: 'Mời bạn bè của bạn tham gia một cuộc gọi thoại (ví dụ: Discord, Zoom, Zalo).',
    emoji1: '👾',
    emoji2: '🐧',
  },
  {
    title: '2. VIẾT MỘT CÂU BẤT KỲ',
    desc: 'Mỗi người khởi đầu bằng một câu hài hước để bắt đầu cuốn sổ bí mật.',
    emoji1: '✍️',
    emoji2: '📝',
  },
  {
    title: '3. NHÌN CÂU & VẼ TRANH',
    desc: 'Hãy thử vẽ lại câu miêu tả của bạn bè bằng tài năng hội họa của bạn.',
    emoji1: '🎨',
    emoji2: '🖼️',
  },
  {
    title: '4. ĐÓ LÀ CÁI GÌ?',
    desc: 'Hãy thử mô tả một trong các hình vẽ ngộ nghĩnh và cùng xem Album cuối ván!',
    emoji1: '🤔',
    emoji2: '🎬',
  },
];

export default function OnlineSetup({ onSession }: Props) {
  const [step, setStep] = useState<SetupStep>('profile');
  const [name, setName] = useState('namm');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState<GameMode>('telephone');
  const [targetScore, setTargetScore] = useState<number>(5);
  const [roomCode, setRoomCode] = useState('');
  const [pending, setPending] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  // Đánh thức server Render ngầm
  useEffect(() => {
    warmUpServer();
  }, []);

  // Tự động nhận diện ?room=ABCDEF từ link mời
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRoom = params.get('room');
    if (queryRoom && queryRoom.trim().length === 6) {
      setRoomCode(queryRoom.trim().toUpperCase());
    }
  }, []);

  const currentAvatar = AVATAR_LIST[avatarIndex] || AVATAR_LIST[0];

  const handleRandomAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % AVATAR_LIST.length);
  };

  // BƯỚC 1: BẤM "BẮT ĐẦU" TỪ MÀN HÌNH CHÍNH
  const handleProfileStart = () => {
    if (!name.trim()) {
      setError('⚠️ Vui lòng nhập tên biệt danh của bạn!');
      return;
    }
    setError(null);

    // Nếu có sẵn mã phòng từ link mời, vào thẳng phòng đó
    if (roomCode.trim().length === 6) {
      handleJoinDirect(roomCode.trim().toUpperCase());
      return;
    }

    // Chuyển sang Bước 2: CHỌN PHƯƠNG THỨC THAM GIA
    setStep('mode_select');
  };

  // BƯỚC 2: TẠO PHÒNG MỚI
  const handleCreateRoom = async () => {
    if (pending) return;
    setPending(true);
    setSlowNotice(false);
    setError(null);
    const timer = setTimeout(() => setSlowNotice(true), 1800);

    try {
      const data: RoomCreateInput = {
        playerName: `${currentAvatar.name.split(' ')[0]} ${name.trim()}`,
        category: 'Đồ vật quen thuộc',
        targetScore,
        gameMode: selectedMode,
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

  // BƯỚC 2: THAM GIA PHÒNG
  const handleJoinDirect = async (codeToJoin: string) => {
    const cleanCode = codeToJoin.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setError('⚠️ Vui lòng nhập đủ 6 ký tự mã phòng!');
      return;
    }
    setPending(true);
    setSlowNotice(false);
    setError(null);
    const timer = setTimeout(() => setSlowNotice(true), 1800);

    try {
      const data: RoomJoinInput = {
        playerName: `${currentAvatar.name.split(' ')[0]} ${name.trim()}`,
      };
      const session = await apiJoinRoom(cleanCode, data);
      onSession(session);
    } catch (err: any) {
      setError(err?.message || 'Không thể vào phòng này. Hãy kiểm tra lại mã.');
    } finally {
      clearTimeout(timer);
      setPending(false);
      setSlowNotice(false);
    }
  };

  return (
    <div className="gartic-home-viewport">
      {/* ============================================================
          BƯỚC 1: GIAO DIỆN CHÍNH GARTIC PHONE CHUẨN 100% ẢNH MẪU
      ============================================================ */}
      {step === 'profile' ? (
        <div className="gartic-home-canvas fade-in">
          {/* TOPBAR TRÊN CÙNG: NÚT NGÔN NGỮ */}
          <div className="gartic-top-row">
            <div className="gartic-lang-pill">
              <Globe2 size={16} />
              <span>VI</span>
            </div>
          </div>

          {/* HERO BANNER & LOGO: THƯƠNG HIỆU NAM PHONE */}
          <div className="gartic-hero-section">
            <div className="gartic-tober-sticker">
              <span className="tober-text">Nam TOBER</span>
              <span className="tober-badge-sub">it's on!</span>
            </div>

            <div className="gartic-logo-master">
              <div className="gartic-logo-frame">
                <div className="gartic-brand-word">Nam</div>
                <div className="gartic-phone-word">
                  <span>PH</span>
                  <span className="phone-reel-circle">🎬</span>
                  <span>NE</span>
                </div>
              </div>
              <div className="gartic-tagline-text">TAM SAO THẤT BẢN</div>
            </div>
          </div>

          {/* MAIN DUAL PANELS CONTAINER */}
          <div className="gartic-dual-panels">
            {/* PANEL TRÁI: HỒ SƠ & BẮT ĐẦU */}
            <div className="gartic-main-card left-panel">
              <div className="panel-tab-bar">
                <div className="gartic-panel-tab active">
                  ẨN DANH
                </div>
              </div>

              {/* PHẦN THÂN: AVATAR TRÒN & Ô NHẬP TÊN BÊN CẠNH */}
              <div className="panel-body-horizontal">
                {/* VÒNG TRÒN AVATAR LỚN CÓ NÚT RANDOM 🔄 */}
                <div className="gartic-big-avatar-box">
                  <div
                    className="avatar-circle-core"
                    style={{ backgroundColor: currentAvatar.bg }}
                    onClick={handleRandomAvatar}
                    title="Bấm để đổi avatar ngẫu nhiên"
                  >
                    {currentAvatar.render(130)}
                  </div>
                  <button
                    type="button"
                    className="avatar-refresh-circle-btn"
                    onClick={handleRandomAvatar}
                    title="Đổi avatar ngẫu nhiên"
                  >
                    <RotateCw size={19} />
                  </button>
                </div>

                {/* Ô NHẬP BIỆT DANH */}
                <div className="nickname-input-column">
                  <label className="nickname-field-title">
                    CHỌN MỘT NHÂN VẬT VÀ BIỆT DANH
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    placeholder="namm"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleProfileStart();
                    }}
                    className="gartic-purple-pill-input"
                    autoFocus
                  />
                  {error && <div className="gartic-field-error">{error}</div>}
                </div>
              </div>

              {/* NÚT BẮT ĐẦU 3D MÀU TÍM NHẠT / TRẮNG DÀY DẶN */}
              <div className="start-btn-center-box">
                <button
                  type="button"
                  className="gartic-chunky-start-button"
                  onClick={handleProfileStart}
                  disabled={pending}
                >
                  <span className="green-play-arrow">▶</span>
                  <span className="start-button-text">BẮT ĐẦU</span>
                </button>
              </div>
            </div>

            {/* PANEL PHẢI: CÁCH CHƠI (TUTORIAL) */}
            <div className="gartic-main-card right-panel">
              <div className="tutorial-green-header">CÁCH CHƠI</div>

              <div className="tutorial-graphic-box">
                <div className="tutorial-duo-avatars">
                  <span className="tut-emoji">{TUTORIAL_SLIDES[slideIndex].emoji1}</span>
                  <span className="tut-emoji secondary">{TUTORIAL_SLIDES[slideIndex].emoji2}</span>
                </div>
              </div>

              <div className="tutorial-copy-box">
                <h4 className="tutorial-headline-title">{TUTORIAL_SLIDES[slideIndex].title}</h4>
                <p className="tutorial-headline-desc">{TUTORIAL_SLIDES[slideIndex].desc}</p>
              </div>

              {/* ĐIỀU HƯỚNG CAROUSEL: < ( ) . . . > */}
              <div className="tutorial-carousel-nav">
                <button
                  type="button"
                  className="carousel-chevron-btn"
                  onClick={() =>
                    setSlideIndex((prev) => (prev - 1 + TUTORIAL_SLIDES.length) % TUTORIAL_SLIDES.length)
                  }
                >
                  ◀
                </button>
                <div className="carousel-dot-indicators">
                  {TUTORIAL_SLIDES.map((_, idx) => (
                    <span
                      key={idx}
                      className={`carousel-dot ${idx === slideIndex ? 'active' : ''}`}
                      onClick={() => setSlideIndex(idx)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="carousel-chevron-btn"
                  onClick={() =>
                    setSlideIndex((prev) => (prev + 1) % TUTORIAL_SLIDES.length)
                  }
                >
                  ▶
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER BAR: TẢI ỨNG DỤNG */}
          <div className="gartic-bottom-badge-row">
            <div className="app-download-pill">
              <span className="app-badge-icon">🎮</span>
              <span className="app-badge-text">TẢI ỨNG DỤNG!</span>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================
            BƯỚC 2: CHỌN PHƯƠNG THỨC THAM GIA
        ============================================================ */
        <div className="gartic-mode-select-viewport fade-in">
          <div className="gartic-mode-card-container">
            {/* THANH TOP BAR */}
            <div className="mode-nav-header">
              <button
                type="button"
                className="mode-back-button"
                onClick={() => setStep('profile')}
              >
                <ArrowLeft size={18} /> Đổi nhân vật / tên
              </button>

              <div className="current-user-pill">
                <div className="user-avatar-mini" style={{ backgroundColor: currentAvatar.bg }}>
                  {currentAvatar.render(26)}
                </div>
                <span className="user-name-display">{name}</span>
              </div>
            </div>

            <h2 className="mode-page-title">CHỌN PHƯƠNG THỨC THAM GIA</h2>
            <p className="mode-page-subtitle">
              Bạn muốn tạo phòng mới làm chủ phòng hay tham gia vào phòng cùng bạn bè?
            </p>

            {error && <div className="mode-error-alert">{error}</div>}

            {slowNotice && (
              <div className="mode-warmup-notice fade-in">
                <LoaderCircle size={18} className="spin text-amber-400" />
                <span>Đang kết nối máy chủ Render, vui lòng đợi vài giây nhé...</span>
              </div>
            )}

            <div className="mode-options-grid">
              {/* LỰA CHỌN 1: TẠO PHÒNG MỚI */}
              <div className="mode-option-card host-card">
                <div className="mode-badge-tag">LÀM CHỦ PHÒNG</div>
                <h3 className="mode-card-title">Tạo phòng mới</h3>
                <p className="mode-card-description">
                  Tạo mã phòng riêng và mời bạn bè vào tham gia tranh tài.
                </p>

                <div className="mode-selector-block">
                  <span className="selector-title">Chọn chế độ chơi:</span>
                  <div className="mode-buttons-stack">
                    <button
                      type="button"
                      className={`mode-toggle-button ${selectedMode === 'telephone' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('telephone')}
                    >
                      <div className="toggle-btn-header">
                        <span>🌀 Tam Sao Thất Bản</span>
                        <span className="hot-pill">KHUYÊN DÙNG</span>
                      </div>
                      <small>Mỗi người 1 cuốn sổ song song, công chiếu Album cười nghiêng ngả cuối ván!</small>
                    </button>

                    <button
                      type="button"
                      className={`mode-toggle-button ${selectedMode === 'classic' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('classic')}
                    >
                      <div className="toggle-btn-header">
                        <span>⚔️ Đoán Hình 1v1</span>
                      </div>
                      <small>1 người vẽ, 1 người đoán giành cúp vô địch theo lượt</small>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="mode-primary-submit-btn"
                  onClick={handleCreateRoom}
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <LoaderCircle size={20} className="spin" /> Đang chuẩn bị phòng...
                    </>
                  ) : (
                    <>
                      <span>TẠO PHÒNG & MỜI BẠN BÈ</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>

              {/* LỰA CHỌN 2: THAM GIA PHÒNG */}
              <div className="mode-option-card join-card">
                <div className="mode-badge-tag join-badge">THAM GIA PHÒNG</div>
                <h3 className="mode-card-title">Vào phòng cùng bạn bè</h3>
                <p className="mode-card-description">
                  Nhập mã phòng 6 ký tự được bạn bè chia sẻ để cùng chơi.
                </p>

                <div className="join-code-block">
                  <label className="selector-title">Mã phòng (6 ký tự):</label>
                  <div className="code-input-wrapper">
                    <KeyRound size={22} className="key-icon" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="VD: 84ZHXK"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="room-code-input"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="mode-secondary-submit-btn"
                  onClick={() => handleJoinDirect(roomCode)}
                  disabled={pending || roomCode.trim().length !== 6}
                >
                  {pending ? (
                    <>
                      <LoaderCircle size={20} className="spin" /> Đang vào phòng...
                    </>
                  ) : (
                    <>
                      <span>VÀO PHÒNG NGAY</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
