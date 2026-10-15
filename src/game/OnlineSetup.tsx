import { useState, useEffect, useRef } from 'react';
import {
  Globe2,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  LoaderCircle,
  KeyRound,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Music,
  Settings,
  Gamepad2,
  Crown,
  Rocket,
  Smile,
  Users,
  Flashlight,
  Bot,
} from 'lucide-react';
import { AVATAR_LIST } from './Avatars';
import Avatar3D from './Avatar3D';
import FlashlightEyeOverlay from './FlashlightEyeOverlay';
import InstallAppModal from './InstallAppModal';
import AdminDashboardModal from './AdminDashboardModal';
import { soundManager } from '../lib/soundManager';
import { customWordManager } from '../lib/customWords';
import type { GameMode, RoomCreateInput, RoomJoinInput, RoomSession } from './types';
import { apiCreateRoom, apiJoinRoom, warmUpServer } from '../lib/api';

type Props = {
  onSession: (session: RoomSession) => void;
  onBack: () => void;
  onStartBotBattle?: (playerName: string, avatarIndex: number) => void;
};

type SetupStep = 'profile' | 'mode_select';
type RightTab = 'tutorial' | 'settings';

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

export default function OnlineSetup({ onSession, onStartBotBattle }: Props) {
  const [step, setStep] = useState<SetupStep>('profile');
  const [name, setName] = useState(() => localStorage.getItem('phone_player_name') || '');
  const [avatarIndex, setAvatarIndex] = useState(() => {
    const saved = localStorage.getItem('phone_user_avatar_idx');
    return saved !== null ? Number(saved) || 0 : 0;
  });
  const [selectedMode, setSelectedMode] = useState<GameMode>('telephone');
  const [targetScore, setTargetScore] = useState<number>(5);
  const [roomCode, setRoomCode] = useState('');
  const [pending, setPending] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  // Tab bên phải: 'tutorial' (Cách chơi) hoặc 'settings' (Cài đặt âm thanh)
  const [rightTab, setRightTab] = useState<RightTab>('tutorial');

  // Cài đặt âm thanh & hiệu ứng
  const [sfxEnabled, setSfxEnabled] = useState(() => soundManager.getSfx());
  const [bgmEnabled, setBgmEnabled] = useState(() => soundManager.getBgm());
  const [sfxVolume, setSfxVolume] = useState(() => soundManager.getSfxVolume());
  const [bgmVolume, setBgmVolume] = useState(() => soundManager.getBgmVolume());
  const [flashlightEnabled, setFlashlightEnabled] = useState(() => {
    const saved = localStorage.getItem('phone_flashlight_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Vị trí avatar & hướng nhìn của mắt con trỏ chuột toàn màn hình
  const avatarBoxRef = useRef<HTMLDivElement>(null);
  const [screenPointer, setScreenPointer] = useState<{ x: number; y: number } | null>(null);

  // Đánh thức server Render ngầm
  useEffect(() => {
    warmUpServer();
  }, []);

  // Luôn theo dõi vị trí chuột toàn màn hình để mắt và đầu avatar luôn nhìn theo chuột (kể cả khi tắt đèn pin)
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -((e.clientY / window.innerHeight) * 2 - 1);
      setScreenPointer({ x: normX, y: normY });
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleGlobalPointerMove);
  }, []);

  // QUẢN TRỊ VIÊN ADMIN DASHBOARD BÍ MẬT
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const crownClicksRef = useRef<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return customWordManager.getCategoryNames()[0] || 'Đồ vật quen thuộc';
  });

  // Kích hoạt bí mật: Nhấn 5 lần vào vương miện hoàng gia trên logo
  const handleCrownClick = () => {
    const now = Date.now();
    crownClicksRef.current = [...crownClicksRef.current.filter((t) => now - t < 3500), now];
    if (crownClicksRef.current.length >= 5) {
      crownClicksRef.current = [];
      soundManager.playSuccess();
      setIsAdminOpen(true);
    } else {
      soundManager.playPop();
    }
  };

  // Kích hoạt bí mật: Tổ hợp phím Ctrl + Shift + A (hoặc Cmd + Shift + A trên Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        soundManager.playSuccess();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentAvatar = AVATAR_LIST[avatarIndex] || AVATAR_LIST[0];

  const handleRandomAvatar = () => {
    setIsSpinning(true);
    setAvatarIndex((prev) => (prev + 1) % AVATAR_LIST.length);
    setTimeout(() => setIsSpinning(false), 600);
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

  // VÀO CHẾ ĐỘ ĐẤU VỚI MÁY (BOT AI)
  const handleStartBotBattle = () => {
    soundManager.playPop();
    const cleanName = name.trim() || 'Chiến thần';
    localStorage.setItem('phone_player_name', cleanName);
    localStorage.setItem('phone_user_avatar_idx', String(avatarIndex));
    onStartBotBattle?.(cleanName, avatarIndex);
  };

  // BƯỚC 2: TẠO PHÒNG MỚI
  const handleCreateRoom = async () => {
    if (pending) return;
    const cleanName = name.trim();
    if (!cleanName) {
      setError('⚠️ Vui lòng nhập tên người chơi.');
      return;
    }
    setPending(true);
    setSlowNotice(false);
    setError(null);
    localStorage.setItem('phone_player_name', cleanName);
    localStorage.setItem('phone_user_avatar_idx', String(avatarIndex));
    const timer = setTimeout(() => setSlowNotice(true), 1800);

    try {
      const data: RoomCreateInput = {
        playerName: cleanName,
        avatarIndex,
        category: selectedCategory,
        customWords: customWordManager.getWords(selectedCategory),
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
    const cleanName = name.trim();
    if (!cleanName) {
      setError('⚠️ Vui lòng nhập tên người chơi.');
      return;
    }
    setPending(true);
    setSlowNotice(false);
    setError(null);
    localStorage.setItem('phone_player_name', cleanName);
    localStorage.setItem('phone_user_avatar_idx', String(avatarIndex));
    const timer = setTimeout(() => setSlowNotice(true), 1800);

    try {
      const data: RoomJoinInput = {
        playerName: cleanName,
        avatarIndex,
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
      {/* HIỆU ỨNG ÁNH SÁNG ĐÈN PIN TỪ MẮT CHIẾU RA TOÀN BỘ MÀN HÌNH (CÓ THỂ BẬT/TẮT TRONG CÀI ĐẶT) */}
      {step === 'profile' && flashlightEnabled && (
        <FlashlightEyeOverlay
          avatarAnchorRef={avatarBoxRef}
          onPointerUpdate={(norm) => setScreenPointer(norm)}
        />
      )}

      {/* ============================================================
          BƯỚC 1: GIAO DIỆN CHÍNH GARTIC PHONE CỰC CUTE THEO ẢNH MẪU
      ============================================================ */}
      {step === 'profile' ? (
        <div className="gartic-home-canvas fade-in">
          {/* TOPBAR TRÊN CÙNG: NÚT NGÔN NGỮ & NÚT THÊM VỀ MÀN HÌNH CHÍNH */}
          <div className="gartic-top-row">
            <InstallAppModal />
            <div className="gartic-lang-pill">
              <Globe2 size={16} />
              <span>VI</span>
            </div>
          </div>

          {/* HERO BANNER & LOGO: THƯƠNG HIỆU NAM PHONE VƯƠNG MIỆN VÀNG 3D */}
          <div className="gartic-hero-section">
            <div className="gartic-logo-master">
              {/* Vương miện vàng 3D tỏa sáng trên chữ Nam (Bấm 5 lần mở Admin) */}
              <div
                className="gartic-crown-wrap"
                onClick={handleCrownClick}
                style={{ cursor: 'pointer' }}
                title="Vương miện Nam Phone (Bấm 5 lần mở Bảng Điều Khiển Admin)"
              >
                <Crown size={30} className="golden-crown-svg" />
              </div>

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
                  ⚡ CHIẾN THẦN
                </div>
              </div>

              {/* PHẦN THÂN: AVATAR TRÒN & Ô NHẬP TÊN BÊN CẠNH */}
              <div className="panel-body-horizontal">
                {/* VÒNG TRÒN AVATAR LỚN CÓ NÚT RANDOM 🔄 */}
                <div className="gartic-big-avatar-box">
                  <div
                    ref={avatarBoxRef}
                    className="avatar-circle-core"
                    style={{ backgroundColor: currentAvatar.bg, overflow: 'hidden' }}
                    onClick={handleRandomAvatar}
                    title="Bấm để đổi avatar 3D ngẫu nhiên"
                  >
                    <Avatar3D
                      avatarIndex={avatarIndex}
                      isSpinning={isSpinning}
                      targetPointer={screenPointer}
                      flashlightEnabled={flashlightEnabled}
                    />
                  </div>
                  <button
                    type="button"
                    className="avatar-refresh-circle-btn"
                    onClick={handleRandomAvatar}
                    title="Đổi avatar 3D ngẫu nhiên"
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
                    placeholder="Nhập biệt danh của bạn..."
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

              {/* NÚT BẮT ĐẦU PHÁT SÁNG NEON MINT */}
              <div className="start-btn-center-box">
                <button
                  type="button"
                  className="gartic-chunky-start-button neon-mint-btn"
                  onClick={handleProfileStart}
                  disabled={pending}
                >
                  <span className="green-play-arrow">▶</span>
                  <span className="start-button-text">BẮT ĐẦU</span>
                </button>
              </div>

              {/* NÚT ĐẤU VỚI MÁY (BOT AI) - CHƠI 1 MÌNH */}
              <div className="bot-battle-quick-entry">
                <button
                  type="button"
                  className="gartic-bot-battle-button"
                  onClick={handleStartBotBattle}
                  title="Chơi ngay 1 mình cùng Robot AI thông minh"
                >
                  <div className="bot-btn-icon-wrapper">
                    <Bot size={22} className="bot-icon-svg text-cyan-300" />
                  </div>
                  <div className="bot-btn-labels">
                    <span className="bot-btn-main-title">🤖 ĐẤU VỚI MÁY (BOT AI)</span>
                    <small className="bot-btn-subtitle">Solo 1 mình • Đoán hình cùng AI Nam-Bot</small>
                  </div>
                  <span className="bot-btn-play-tag">CHƠI NGAY ▶</span>
                </button>
              </div>

              {/* 3 BADGES TÍNH NĂNG NHỎ CUTE BÊN DƯỚI BẮT ĐẦU */}
              <div className="gartic-feature-badges-row">
                <div className="feature-badge-item">
                  <Rocket size={14} className="badge-icon-item" />
                  <span>Chơi cùng bạn bè</span>
                </div>
                <div className="feature-badge-item">
                  <Smile size={14} className="badge-icon-item" />
                  <span>Vui nhộn bất ngờ</span>
                </div>
                <div className="feature-badge-item">
                  <Users size={14} className="badge-icon-item" />
                  <span>Nhiều chế độ hấp dẫn</span>
                </div>
              </div>
            </div>

            {/* PANEL PHẢI: CÁCH CHƠI & CÀI ĐẶT ÂM THANH */}
            <div className="gartic-main-card right-panel">
              {/* TAB BAR CHUYỂN ĐỔI: [ 🎮 CÁCH CHƠI ] | [ ⚙️ CÀI ĐẶT ] */}
              <div className="right-panel-tab-bar">
                <button
                  type="button"
                  className={`right-panel-tab-btn ${rightTab === 'tutorial' ? 'active' : ''}`}
                  onClick={() => {
                    soundManager.playPop();
                    setRightTab('tutorial');
                  }}
                >
                  <Gamepad2 size={16} />
                  <span>CÁCH CHƠI</span>
                </button>

                <button
                  type="button"
                  className={`right-panel-tab-btn ${rightTab === 'settings' ? 'active' : ''}`}
                  onClick={() => {
                    soundManager.playPop();
                    setRightTab('settings');
                  }}
                >
                  <Settings size={16} />
                  <span>CÀI ĐẶT</span>
                </button>
              </div>

              {rightTab === 'tutorial' ? (
                <>
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
                      onClick={() => {
                        soundManager.playPop();
                        setSlideIndex((prev) => (prev - 1 + TUTORIAL_SLIDES.length) % TUTORIAL_SLIDES.length);
                      }}
                    >
                      ◀
                    </button>
                    <div className="carousel-dot-indicators">
                      {TUTORIAL_SLIDES.map((_, idx) => (
                        <span
                          key={idx}
                          className={`carousel-dot ${idx === slideIndex ? 'active' : ''}`}
                          onClick={() => {
                            soundManager.playPop();
                            setSlideIndex(idx);
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="carousel-chevron-btn"
                      onClick={() => {
                        soundManager.playPop();
                        setSlideIndex((prev) => (prev + 1) % TUTORIAL_SLIDES.length);
                      }}
                    >
                      ▶
                    </button>
                  </div>
                </>
              ) : (
                /* GIAO DIỆN CÀI ĐẶT ÂM THANH & TRẢI NGHIỆM */
                <div className="settings-panel-content fade-in">
                  {/* 1. ÂM THANH HIỆU ỨNG (SFX) */}
                  <div className="setting-card-item">
                    <div className="setting-info-left">
                      <div className="setting-title-line">
                        {sfxEnabled ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} className="text-zinc-400" />}
                        <span className="setting-main-label">Hiệu ứng âm thanh (SFX)</span>
                      </div>
                      <span className="setting-sub-desc">Tiếng bấm nút, đổi avatar, vào ván</span>
                    </div>
                    <button
                      type="button"
                      className={`cute-toggle-btn ${sfxEnabled ? 'active' : ''}`}
                      onClick={() => {
                        const next = !sfxEnabled;
                        setSfxEnabled(next);
                        soundManager.setSfx(next);
                      }}
                    >
                      <span className="toggle-circle" />
                    </button>
                  </div>

                  {/* SLIDER ÂM LƯỢNG SFX */}
                  {sfxEnabled && (
                    <div className="setting-slider-container">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={sfxVolume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setSfxVolume(v);
                          soundManager.setSfxVolume(v);
                        }}
                        className="cute-range-input"
                      />
                      <span className="slider-value-display">{Math.round(sfxVolume * 100)}%</span>
                      <button
                        type="button"
                        className="test-sound-pill-btn"
                        onClick={() => soundManager.playPop()}
                        title="Nghe thử âm thanh"
                      >
                        🎵 Thử
                      </button>
                    </div>
                  )}

                  {/* 2. NHẠC NỀN THƯ GIÃN (BGM) */}
                  <div className="setting-card-item">
                    <div className="setting-info-left">
                      <div className="setting-title-line">
                        <Music size={18} className={bgmEnabled ? 'text-amber-400' : 'text-zinc-400'} />
                        <span className="setting-main-label">Nhạc nền YouTube (BGM)</span>
                      </div>
                      <span className="setting-sub-desc">Bài hát YouTube ZX2mjf9dFH8 vui nhộn, hào hứng</span>
                    </div>
                    <button
                      type="button"
                      className={`cute-toggle-btn ${bgmEnabled ? 'active' : ''}`}
                      onClick={() => {
                        const next = !bgmEnabled;
                        setBgmEnabled(next);
                        soundManager.setBgm(next);
                      }}
                    >
                      <span className="toggle-circle" />
                    </button>
                  </div>

                  {/* SLIDER ÂM LƯỢNG BGM */}
                  {bgmEnabled && (
                    <div className="setting-slider-container">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={bgmVolume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setBgmVolume(v);
                          soundManager.setBgmVolume(v);
                        }}
                        className="cute-range-input"
                      />
                      <span className="slider-value-display">{Math.round(bgmVolume * 100)}%</span>
                    </div>
                  )}

                  {/* 3. HIỆU ỨNG ĐÈN PIN MẮT THEO CHUỘT */}
                  <div className="setting-card-item">
                    <div className="setting-info-left">
                      <div className="setting-title-line">
                        <Flashlight size={18} className={flashlightEnabled ? 'text-yellow-300' : 'text-zinc-400'} />
                        <span className="setting-main-label">Đèn pin mắt rọi theo chuột</span>
                      </div>
                      <span className="setting-sub-desc">Chùm sáng ma thuật từ mắt avatar</span>
                    </div>
                    <button
                      type="button"
                      className={`cute-toggle-btn ${flashlightEnabled ? 'active' : ''}`}
                      onClick={() => {
                        const next = !flashlightEnabled;
                        setFlashlightEnabled(next);
                        localStorage.setItem('phone_flashlight_enabled', String(next));
                        soundManager.playPop();
                      }}
                    >
                      <span className="toggle-circle" />
                    </button>
                  </div>

                  {/* 4. NGÔN NGỮ */}
                  <div className="setting-card-item">
                    <div className="setting-info-left">
                      <div className="setting-title-line">
                        <Globe2 size={18} className="text-cyan-400" />
                        <span className="setting-main-label">Ngôn ngữ game</span>
                      </div>
                      <span className="setting-sub-desc">Tiếng Việt (Việt Nam)</span>
                    </div>
                    <span className="language-pill-tag">🇻🇳 VI</span>
                  </div>
                </div>
              )}
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

                {/* CHỦ ĐỀ TỪ KHÓA CHO PHÒNG */}
                <div className="mode-category-select-block">
                  <span className="selector-title">Chủ đề từ khóa ({customWordManager.getCategoryNames().length} chủ đề):</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="mode-category-dropdown"
                  >
                    {customWordManager.getCategoryNames().map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} ({customWordManager.getWords(cat).length} từ)
                      </option>
                    ))}
                  </select>
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

              {/* LỰA CHỌN 3: ĐẤU MÁY VỚI BOT AI */}
              <div className="mode-option-card bot-card">
                <div className="mode-badge-tag bot-badge">CHƠI 1 MÌNH</div>
                <h3 className="mode-card-title">Đấu với Robot AI</h3>
                <p className="mode-card-description">
                  Chơi ngay lập tức không cần chờ bạn bè, rèn luyện tài năng vẽ và suy luận cùng AI.
                </p>

                <div className="bot-card-perks-list">
                  <div className="perk-bullet">⚡ 4 hiệp luân phiên đối kháng điểm số</div>
                  <div className="perk-bullet">🎨 Bot tự vẽ nét hoạt họa mượt mà</div>
                  <div className="perk-bullet">🧠 AI nhận diện nét vẽ thông minh</div>
                </div>

                <button
                  type="button"
                  className="mode-bot-submit-btn"
                  onClick={handleStartBotBattle}
                >
                  <Bot size={20} />
                  <span>VÀO ĐẤU MÁY NGAY</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN ADMIN DASHBOARD */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
