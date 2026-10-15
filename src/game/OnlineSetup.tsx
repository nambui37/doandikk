import {
  ArrowRight,
  ArrowLeft,
  LoaderCircle,
  RotateCw,
  Play,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  Users,
  KeyRound,
} from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { categories } from './words';
import type { GameMode, RoomCreateInput, RoomJoinInput, RoomSession } from './types';
import { apiCreateRoom, apiJoinRoom, warmUpServer } from '../lib/api';
import { AVATAR_LIST, type AvatarItem } from './Avatars';

type Props = {
  onSession: (session: RoomSession) => void;
  onBack: () => void;
};

type SetupStep = 'profile' | 'mode_select';

const TUTORIAL_SLIDES = [
  {
    title: '1. VIẾT MỘT CÂU HÀI HƯỚC',
    desc: 'Mỗi người bắt đầu bằng một câu ngộ nghĩnh (Ví dụ: "Con mèo lái máy bay đi mua phở").',
    icon: '✍️',
  },
  {
    title: '2. NHÌN CÂU & VẼ LẠI (75s)',
    desc: 'Cuốn sổ được chuyền sang người tiếp theo, người này chỉ nhìn câu và vẽ lại bằng nét vẽ của mình.',
    icon: '🎨',
  },
  {
    title: '3. NHÌN TRANH & ĐOÁN CÂU',
    desc: 'Người kế tiếp chỉ nhìn tranh và đoán xem tranh đang vẽ gì. Câu đoán sẽ thành đề bài cho người sau!',
    icon: '🤔',
  },
  {
    title: '4. CÔNG CHIẾU ALBUM CUỐI VÁN',
    desc: 'Cả nhóm cùng thưởng thức cuốn sổ bị biến đổi hài hước và cười nghiêng ngả!',
    icon: '🎬',
  },
];

export default function OnlineSetup({ onSession, onBack }: Props) {
  const [step, setStep] = useState<SetupStep>('profile');
  const [name, setName] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState<GameMode>('telephone');
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
    }
  }, []);

  const currentAvatar = AVATAR_LIST[avatarIndex] || AVATAR_LIST[0];

  const handleRandomAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % AVATAR_LIST.length);
  };

  const handlePrevAvatar = () => {
    setAvatarIndex((prev) => (prev - 1 + AVATAR_LIST.length) % AVATAR_LIST.length);
  };

  const handleNextAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % AVATAR_LIST.length);
  };

  // BƯỚC 1: XÁC NHẬN TÊN VÀ AVATAR
  const handleProfileStart = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('⚠️ Vui lòng nhập tên biệt danh của bạn trước!');
      return;
    }
    setError(null);

    // Nếu có mã phòng mời trong URL, vào thẳng phòng đó luôn
    if (roomCode.trim().length === 6) {
      handleJoinDirect(roomCode.trim().toUpperCase());
      return;
    }

    // Chuyển sang Bước 2: Chọn Chế độ chơi / Tạo hoặc Vào phòng
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

  // BƯỚC 2: VÀO PHÒNG BẰNG MÃ
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
    <main className="screen gartic-setup-screen">
      {/* ============================================================
          BƯỚC 1: GIAO DIỆN CHỌN AVATAR & BIỆT DANH (CHUẨN GARTIC PHONE)
      ============================================================ */}
      {step === 'profile' && (
        <div className="gartic-setup-container fade-in">
          {/* HEADER CHÍNH */}
          <div className="gartic-main-header">
            <div className="gartic-logo-badge">
              <span className="logo-gartic">Đoán Đỉnh</span>
              <span className="logo-phone">3D</span>
            </div>
            <div className="gartic-logo-subtitle">TAM SAO THẤT BẢN</div>
          </div>

          <div className="gartic-cards-grid">
            {/* CỘT TRÁI: HỒ SƠ & BẮT ĐẦU */}
            <div className="gartic-profile-card">
              <div className="gartic-tabs-header">
                <button type="button" className="profile-tab active">
                  ẨN DANH
                </button>
                <button type="button" className="profile-tab" onClick={onBack}>
                  ← QUAY LẠI
                </button>
              </div>

              {/* KHUNG AVATAR LỚN */}
              <div className="avatar-selection-wrapper">
                <button
                  type="button"
                  className="avatar-arrow-btn left"
                  onClick={handlePrevAvatar}
                  title="Nhân vật trước"
                >
                  <ChevronLeft size={24} />
                </button>

                <div
                  className="gartic-avatar-big"
                  style={{ backgroundColor: currentAvatar.bg }}
                  onClick={handleRandomAvatar}
                  title="Click để đổi nhân vật ngẫu nhiên"
                >
                  {currentAvatar.render(110)}
                  <button
                    type="button"
                    className="avatar-dice-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRandomAvatar();
                    }}
                    title="Đổi nhân vật ngẫu nhiên"
                  >
                    <RotateCw size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  className="avatar-arrow-btn right"
                  onClick={handleNextAvatar}
                  title="Nhân vật tiếp theo"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="avatar-character-name">{currentAvatar.name}</div>

              {/* FORM NHẬP TÊN */}
              <form onSubmit={handleProfileStart} className="gartic-profile-form">
                <div className="input-label-tag">CHỌN MỘT NHÂN VẬT VÀ BIỆT DANH</div>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="Nhập biệt danh của bạn..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  className="gartic-name-input"
                  autoFocus
                />

                {error && <div className="gartic-error-msg">{error}</div>}

                {/* NÚT BẮT ĐẦU 3D TO BẢN */}
                <button
                  type="submit"
                  className="gartic-start-big-btn"
                  disabled={pending}
                >
                  <Play size={22} fill="currentColor" />
                  <span>BẮT ĐẦU</span>
                </button>
              </form>
            </div>

            {/* CỘT PHẢI: HƯỚNG DẪN CÁCH CHƠI (CAROUSEL) */}
            <div className="gartic-tutorial-card">
              <div className="tutorial-header-label">CÁCH CHƠI</div>

              <div className="tutorial-slide-content">
                <div className="tutorial-illustration-circle">
                  <span className="big-tut-emoji">{TUTORIAL_SLIDES[slideIndex].icon}</span>
                </div>

                <div className="tutorial-step-title">{TUTORIAL_SLIDES[slideIndex].title}</div>
                <div className="tutorial-step-desc">{TUTORIAL_SLIDES[slideIndex].desc}</div>

                <div className="gartic-carousel-controls">
                  <button
                    type="button"
                    className="carousel-arrow"
                    onClick={() =>
                      setSlideIndex((prev) => (prev - 1 + TUTORIAL_SLIDES.length) % TUTORIAL_SLIDES.length)
                    }
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="carousel-dots">
                    {TUTORIAL_SLIDES.map((_, idx) => (
                      <span
                        key={idx}
                        className={`dot ${idx === slideIndex ? 'active' : ''}`}
                        onClick={() => setSlideIndex(idx)}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="carousel-arrow"
                    onClick={() =>
                      setSlideIndex((prev) => (prev + 1) % TUTORIAL_SLIDES.length)
                    }
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          BƯỚC 2: MÀN HÌNH CHỌN CHẾ ĐỘ & TẠO / VÀO PHÒNG
      ============================================================ */}
      {step === 'mode_select' && (
        <div className="gartic-mode-container fade-in">
          {/* HEADER CHUYỂN BƯỚC */}
          <div className="mode-step-topbar">
            <button
              type="button"
              className="mode-back-btn"
              onClick={() => setStep('profile')}
            >
              <ArrowLeft size={18} /> Đổi nhân vật / tên
            </button>

            <div className="user-profile-badge">
              <div className="user-mini-avatar" style={{ backgroundColor: currentAvatar.bg }}>
                {currentAvatar.render(28)}
              </div>
              <span className="user-badge-name">{name}</span>
            </div>
          </div>

          <h2 className="mode-select-headline">CHỌN PHƯƠNG THỨC THAM GIA</h2>
          <p className="mode-select-sub">Bạn muốn tạo phòng mới làm chủ phòng hay tham gia vào phòng cùng bạn bè?</p>

          {error && <div className="gartic-error-msg" style={{ marginBottom: 16 }}>{error}</div>}

          {slowNotice && (
            <div className="server-wakeup-toast fade-in" style={{ marginBottom: 16 }}>
              <LoaderCircle size={18} className="spin text-amber-400" />
              <span>Đang kết nối máy chủ Render, vui lòng đợi vài giây nhé...</span>
            </div>
          )}

          <div className="mode-cards-grid">
            {/* THẺ 1: TẠO PHÒNG MỚI */}
            <div className="mode-choice-card highlight">
              <div className="choice-badge">LÀM CHỦ PHÒNG</div>
              <h3 className="choice-title">Tạo phòng mới</h3>
              <p className="choice-desc">Tạo mã phòng và mời bạn bè tham gia tranh tài.</p>

              <div className="choice-options-group">
                <span className="options-label">Chọn chế độ:</span>
                <div className="choice-tabs">
                  <button
                    type="button"
                    className={`choice-tab-btn ${selectedMode === 'telephone' ? 'active' : ''}`}
                    onClick={() => setSelectedMode('telephone')}
                  >
                    <div className="tab-btn-title">
                      <span>🌀 Tam Sao Thất Bản</span>
                      <span className="tab-hot-tag">HOT</span>
                    </div>
                    <small>Mỗi người 1 cuốn sổ song song, công chiếu Album cuối ván!</small>
                  </button>

                  <button
                    type="button"
                    className={`choice-tab-btn ${selectedMode === 'classic' ? 'active' : ''}`}
                    onClick={() => setSelectedMode('classic')}
                  >
                    <div className="tab-btn-title">
                      <span>⚔️ Đoán Hình 1v1</span>
                    </div>
                    <small>1 người vẽ, 1 người đoán tính điểm vô địch</small>
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="choice-action-btn primary"
                onClick={handleCreateRoom}
                disabled={pending}
              >
                {pending ? (
                  <>
                    <LoaderCircle size={20} className="spin" /> Đang tạo phòng...
                  </>
                ) : (
                  <>
                    <span>TẠO PHÒNG & MỜI BẠN BÈ</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

            {/* THẺ 2: THAM GIA PHÒNG ĐÃ CÓ */}
            <div className="mode-choice-card">
              <div className="choice-badge secondary">THAM GIA PHÒNG</div>
              <h3 className="choice-title">Vào phòng cùng bạn bè</h3>
              <p className="choice-desc">Nhập mã phòng gồm 6 ký tự được bạn bè chia sẻ.</p>

              <div className="choice-input-group">
                <label className="options-label">Mã phòng (6 ký tự):</label>
                <div className="join-code-input-wrapper">
                  <KeyRound size={20} className="code-icon" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="VD: 84ZHXK"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="join-code-input"
                  />
                </div>
              </div>

              <button
                type="button"
                className="choice-action-btn secondary"
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
      )}
    </main>
  );
}
