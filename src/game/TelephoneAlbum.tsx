import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Trophy,
  Share2,
  Check,
  LogOut,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { TelephoneBook, TelephoneStep } from './types';
import StrokeViewer from './StrokeViewer';
import { AVATAR_LIST } from './Avatars';

function getAvatarForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_LIST.length;
  return AVATAR_LIST[hash] || AVATAR_LIST[0];
}

interface Props {
  books: TelephoneBook[];
  isHost: boolean;
  onRestart: () => void;
  onExit: () => void;
}

export default function TelephoneAlbum({ books, isHost, onRestart, onExit }: Props) {
  const [activeBookIndex, setActiveBookIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentBook = books[activeBookIndex] || books[0];
  const steps = currentBook?.steps || [];
  const totalSteps = steps.length;

  // Nổ pháo hoa chào mừng khi vào màn hình Album
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  // Tự động chuyển slide khi bật chế độ Auto-Play
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < totalSteps - 1) {
          return prev + 1;
        } else {
          // Hết cuốn này, chuyển sang cuốn tiếp theo nếu còn
          setIsPlaying(false);
          return prev;
        }
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isPlaying, totalSteps]);

  const handleSelectBook = (index: number) => {
    setActiveBookIndex(index);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else if (activeBookIndex < books.length - 1) {
      setActiveBookIndex((prev) => prev + 1);
      setCurrentStepIndex(0);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else if (activeBookIndex > 0) {
      setActiveBookIndex((prev) => prev - 1);
      setCurrentStepIndex((books[activeBookIndex - 1]?.steps?.length || 1) - 1);
    }
  };

  const visibleSteps = showAllSteps ? steps : steps.slice(0, currentStepIndex + 1);

  return (
    <div className="telephone-album-container fade-in">
      {/* HEADER CÔNG CHIẾU */}
      <div className="album-topbar">
        <div className="album-title-group">
          <div className="album-badge">
            <Sparkles size={16} /> MÀN HÌNH CÔNG CHIẾU
          </div>
          <h2 className="album-headline">🎬 TAM SAO THẤT BẢN</h2>
          <p className="album-sub">
            Cùng xem câu chuyện khởi nguồn đã biến đổi ngoạn mục như thế nào!
          </p>
        </div>

        <div className="album-header-actions">
          {isHost && (
            <button type="button" className="album-restart-btn" onClick={onRestart}>
              <RotateCcw size={16} /> Chơi ván mới
            </button>
          )}
          <button type="button" className="album-exit-btn" onClick={onExit}>
            <LogOut size={16} /> Rời phòng
          </button>
        </div>
      </div>

      {/* TABS CHỌN CUỐN SỔ CỦA TỪNG NGƯỜI */}
      <div className="album-books-tabs">
        <span className="album-tabs-label">
          <BookOpen size={15} /> Danh sách cuốn sổ:
        </span>
        <div className="album-tabs-scroll">
          {books.map((book, idx) => {
            const isSelected = idx === activeBookIndex;
            return (
              <button
                key={book.bookIndex}
                type="button"
                className={`album-book-tab ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectBook(idx)}
              >
                <span className="album-tab-avatar">📖</span>
                <span className="album-tab-author">Cuốn của {book.initialAuthorName}</span>
                <span className="album-tab-count">({book.steps?.length || 0})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN TRÌNH CHIẾU */}
      <div className="album-controls-bar">
        <div className="album-progress-info">
          Bước <strong>{Math.min(currentStepIndex + 1, totalSteps)}</strong> / {totalSteps}
        </div>

        <div className="album-playback-buttons">
          <button
            type="button"
            className="album-nav-btn"
            onClick={handlePrevStep}
            disabled={activeBookIndex === 0 && currentStepIndex === 0}
            title="Lùi lại"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            className="album-nav-btn play-btn"
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Tạm dừng' : 'Tự động chiếu'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? 'Tạm dừng' : 'Tự động phát'}</span>
          </button>

          <button
            type="button"
            className="album-nav-btn primary-next"
            onClick={handleNextStep}
            disabled={activeBookIndex === books.length - 1 && currentStepIndex === totalSteps - 1}
          >
            <span>Bước tiếp</span>
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          type="button"
          className="album-toggle-all-btn"
          onClick={() => setShowAllSteps((v) => !v)}
        >
          {showAllSteps ? 'Xem từng bước' : 'Xem toàn bộ cuốn sổ'}
        </button>
      </div>

      {/* NỘI DUNG CUỐN SỔ (DANH SÁCH BƯỚC THAY ĐỔI) */}
      <div className="album-timeline">
        {visibleSteps.map((step, idx) => {
          const isLatest = idx === currentStepIndex && !showAllSteps;
          const authorAvatar = getAvatarForName(step.authorName);
          return (
            <div
              key={step.stepIndex}
              className={`album-step-card ${step.type} ${isLatest ? 'pop-in' : ''}`}
            >
              <div className="album-step-header">
                <div className="album-author-info">
                  <div className="album-avatar-bubble" style={{ backgroundColor: authorAvatar.bg }}>
                    {authorAvatar.render(28)}
                  </div>
                  <div>
                    <span className="album-author-name">{step.authorName}</span>
                    <span className="album-step-role">
                      {step.type === 'prompt' && 'đã bắt đầu câu chuyện:'}
                      {step.type === 'drawing' && 'đã vẽ lại câu trên:'}
                      {step.type === 'guess' && 'đã nhìn tranh và đoán:'}
                    </span>
                  </div>
                </div>
                <div className="album-step-number">#{idx + 1}</div>
              </div>

              <div className="album-step-body">
                {step.type === 'prompt' || step.type === 'guess' ? (
                  <div className="album-text-quote">
                    <span className="quote-mark">“</span>
                    <span className="quote-text">{step.text}</span>
                    <span className="quote-mark">”</span>
                  </div>
                ) : (
                  <div className="album-drawing-container">
                    <StrokeViewer strokes={step.strokes || []} width={700} height={440} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CUỐI CUỐN SỔ: CHUYỂN CUỐN HOẶC VÁN MỚI */}
      {currentStepIndex >= totalSteps - 1 && (
        <div className="album-book-footer fade-in">
          {activeBookIndex < books.length - 1 ? (
            <button
              type="button"
              className="album-next-book-btn"
              onClick={() => handleSelectBook(activeBookIndex + 1)}
            >
              <span>Xem tiếp cuốn của {books[activeBookIndex + 1]?.initialAuthorName}</span>
              <ChevronRight size={20} />
            </button>
          ) : (
            <div className="album-all-done-banner">
              <Trophy size={28} className="trophy-glow" />
              <h3>Đã công chiếu hết tất cả các cuốn sổ!</h3>
              <p>Một ván đấu đầy ắp tiếng cười và những bức tranh sáng tạo!</p>
              {isHost ? (
                <button type="button" className="album-play-again-big-btn" onClick={onRestart}>
                  <RotateCcw size={20} /> BẮT ĐẦU VÁN MỚI
                </button>
              ) : (
                <p className="waiting-host-text">Đang chờ chủ phòng bắt đầu ván mới...</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
