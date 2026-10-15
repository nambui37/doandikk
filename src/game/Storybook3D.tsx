import React, { useState, useEffect } from 'react';
import {
  Heart,
  Laugh,
  Flame,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import type { TelephoneBook, TelephoneStep } from './types';
import StrokeViewer from './StrokeViewer';
import { soundManager } from '../lib/soundManager';
import { AVATAR_LIST } from './Avatars';

function getAvatarForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_LIST.length;
  return AVATAR_LIST[hash] || AVATAR_LIST[0];
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  leftPercent: number;
  scale: number;
  rotateDeg: number;
  durationMs: number;
}

interface Props {
  book: TelephoneBook;
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  canNext: boolean;
  canPrev: boolean;
}

export default function Storybook3D({
  book,
  currentStepIndex,
  onNext,
  onPrev,
  canNext,
  canPrev,
}: Props) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);

  const steps = book?.steps || [];
  const currentStep: TelephoneStep | undefined = steps[currentStepIndex];
  const prevStep: TelephoneStep | undefined = currentStepIndex > 0 ? steps[currentStepIndex - 1] : undefined;

  // Xử lý hiệu ứng lật trang 3D
  const handleNextPage = () => {
    if (!canNext) return;
    soundManager.playWhoosh();
    setFlipDirection('next');
    setTimeout(() => {
      onNext();
      setFlipDirection(null);
    }, 280);
  };

  const handlePrevPage = () => {
    if (!canPrev) return;
    soundManager.playWhoosh();
    setFlipDirection('prev');
    setTimeout(() => {
      onPrev();
      setFlipDirection(null);
    }, 280);
  };

  // Thả biểu cảm cảm xúc (Floating Reaction)
  const triggerReaction = (emoji: string) => {
    soundManager.playPop();

    // Sinh 3 - 5 hạt emoji bay lên cùng lúc cho hiệu ứng rực rỡ
    const count = 4;
    const newItems: FloatingEmoji[] = [];
    const baseId = Date.now() + Math.random();

    for (let i = 0; i < count; i++) {
      newItems.push({
        id: baseId + i,
        emoji,
        leftPercent: 15 + Math.random() * 70, // ngẫu nhiên từ 15% đến 85% chiều rộng
        scale: 0.8 + Math.random() * 0.7,
        rotateDeg: (Math.random() - 0.5) * 45,
        durationMs: 1600 + Math.random() * 800,
      });
    }

    setFloatingEmojis((prev) => [...prev, ...newItems]);

    // Tự dọn dẹp sau khi bay xong
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => !newItems.some((n) => n.id === item.id)));
    }, 2500);
  };

  const currentAuthorAvatar = currentStep ? getAvatarForName(currentStep.authorName) : null;
  const prevAuthorAvatar = prevStep ? getAvatarForName(prevStep.authorName) : null;

  return (
    <div className="storybook-3d-wrapper">
      {/* KHUNG TRỜI BAY BIỂU CẢM (FLOATING EMOJIS LAYER) */}
      <div className="floating-reactions-stream" pointer-events="none">
        {floatingEmojis.map((item) => (
          <span
            key={item.id}
            className="floating-reaction-item"
            style={{
              left: `${item.leftPercent}%`,
              transform: `scale(${item.scale}) rotate(${item.rotateDeg}deg)`,
              animationDuration: `${item.durationMs}ms`,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* CUỐN SÁCH 3D ĐANG MỞ */}
      <div className={`storybook-book-3d ${flipDirection ? `flipping-${flipDirection}` : ''}`}>
        {/* Gáy sách ở giữa */}
        <div className="storybook-spine-shadow" />
        <div className="storybook-spine-seam" />

        {/* TRANG TRÁI (LEFT PAGE) */}
        <div className="storybook-page left-page">
          <div className="page-paper-texture" />
          <div className="page-inner-content">
            {currentStepIndex === 0 ? (
              // Bìa giới thiệu câu chuyện
              <div className="book-cover-introduction">
                <div className="cover-ribbon">
                  <BookOpen size={20} /> CUỐN SỔ TÂM HUYẾT
                </div>
                <h3 className="cover-title">Câu Chuyện Của</h3>
                <div className="cover-author-pill">
                  <span className="author-name-tag">{book.initialAuthorName}</span>
                </div>
                <div className="cover-decorative-frame">
                  <p className="cover-tagline">“Khởi nguồn từ một ý tưởng bất ngờ, hãy xem qua từng người câu chuyện đã bay xa đến đâu!”</p>
                  <div className="cover-step-badge">
                    Tổng cộng: <strong>{steps.length}</strong> lần tam sao thất bản
                  </div>
                </div>
                <div className="cover-flip-hint">
                  <span>Bấm lật sang phải để bắt đầu</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            ) : prevStep ? (
              // Bước trước đó
              <div className="page-step-content">
                <div className="page-header-row">
                  <div className="author-badge-group">
                    <div
                      className="author-avatar-mini"
                      style={{ backgroundColor: prevAuthorAvatar?.bg || '#6366f1' }}
                    >
                      {prevAuthorAvatar ? prevAuthorAvatar.render(22) : '👤'}
                    </div>
                    <div>
                      <span className="author-name">{prevStep.authorName}</span>
                      <span className="step-role-text">
                        {prevStep.type === 'prompt' && 'Câu mở đầu'}
                        {prevStep.type === 'drawing' && 'Đã vẽ lại'}
                        {prevStep.type === 'guess' && 'Đã đoán'}
                      </span>
                    </div>
                  </div>
                  <span className="page-number-tag">Trang {currentStepIndex}</span>
                </div>

                <div className="page-main-display">
                  {prevStep.type === 'prompt' || prevStep.type === 'guess' ? (
                    <div className="page-quote-box">
                      <span className="open-quote">“</span>
                      <p className="quote-body-text">{prevStep.text}</p>
                      <span className="close-quote">”</span>
                    </div>
                  ) : (
                    <div className="page-drawing-box">
                      <StrokeViewer strokes={prevStep.strokes || []} width={460} height={320} />
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="page-curl-corner bottom-left" />
        </div>

        {/* TRANG PHẢI (RIGHT PAGE - BƯỚC HIỆN TẠI) */}
        <div className="storybook-page right-page">
          <div className="page-paper-texture" />
          <div className="page-inner-content">
            {currentStep && (
              <div className="page-step-content current">
                <div className="page-header-row">
                  <div className="author-badge-group">
                    <div
                      className="author-avatar-mini current-glow"
                      style={{ backgroundColor: currentAuthorAvatar?.bg || '#ec4899' }}
                    >
                      {currentAuthorAvatar ? currentAuthorAvatar.render(24) : '✨'}
                    </div>
                    <div>
                      <span className="author-name highlight">{currentStep.authorName}</span>
                      <span className="step-role-text">
                        {currentStep.type === 'prompt' && 'đã sáng tác câu mở đầu:'}
                        {currentStep.type === 'drawing' && 'đã vẽ tác phẩm:'}
                        {currentStep.type === 'guess' && 'đã đoán nội dung:'}
                      </span>
                    </div>
                  </div>
                  <span className="page-number-tag current">Trang {currentStepIndex + 1}</span>
                </div>

                <div className="page-main-display">
                  {currentStep.type === 'prompt' || currentStep.type === 'guess' ? (
                    <div className="page-quote-box right-glow">
                      <span className="open-quote">“</span>
                      <p className="quote-body-text focal">{currentStep.text}</p>
                      <span className="close-quote">”</span>
                    </div>
                  ) : (
                    <div className="page-drawing-box right-glow">
                      <StrokeViewer strokes={currentStep.strokes || []} width={480} height={330} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="page-curl-corner bottom-right" />
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG LẬT TRANG SÁCH 3D */}
      <div className="storybook-navigation-bar">
        <button
          type="button"
          className="storybook-flip-btn prev"
          onClick={handlePrevPage}
          disabled={!canPrev}
          title="Lật về trang trước"
        >
          <ChevronLeft size={22} />
          <span>Trang trước</span>
        </button>

        <div className="storybook-step-indicator">
          <span>Trang</span>
          <strong>{currentStepIndex + 1}</strong>
          <span>/</span>
          <span>{steps.length}</span>
        </div>

        <button
          type="button"
          className="storybook-flip-btn next primary"
          onClick={handleNextPage}
          disabled={!canNext}
          title="Lật sang trang kế tiếp"
        >
          <span>Lật trang tiếp</span>
          <ChevronRight size={22} />
        </button>
      </div>

      {/* THANH NÚT TƯƠNG TÁC THẢ CẢM XÚC BAY NGẬP MÀN HÌNH */}
      <div className="storybook-reaction-panel">
        <span className="reaction-label">
          <Sparkles size={16} /> Thả cảm xúc cùng phòng:
        </span>
        <div className="reaction-buttons-group">
          <button
            type="button"
            className="reaction-circle-btn heart-btn"
            onClick={() => triggerReaction('❤️')}
            title="Thả tim yêu thích"
          >
            <span className="reaction-emoji">❤️</span>
            <span className="reaction-tooltip">Thả Tim</span>
          </button>

          <button
            type="button"
            className="reaction-circle-btn laugh-btn"
            onClick={() => triggerReaction('😂')}
            title="Cười bò haha"
          >
            <span className="reaction-emoji">😂</span>
            <span className="reaction-tooltip">Haha</span>
          </button>

          <button
            type="button"
            className="reaction-circle-btn angry-btn"
            onClick={() => triggerReaction('😡')}
            title="Phẫn nộ"
          >
            <span className="reaction-emoji">😡</span>
            <span className="reaction-tooltip">Phẫn nộ</span>
          </button>

          <button
            type="button"
            className="reaction-circle-btn wow-btn"
            onClick={() => triggerReaction('😮')}
            title="Kinh ngạc WOW"
          >
            <span className="reaction-emoji">😮</span>
            <span className="reaction-tooltip">WOW</span>
          </button>

          <button
            type="button"
            className="reaction-circle-btn fire-btn"
            onClick={() => triggerReaction('🔥')}
            title="Cháy quá"
          >
            <span className="reaction-emoji">🔥</span>
            <span className="reaction-tooltip">Cháy quá</span>
          </button>
        </div>
      </div>
    </div>
  );
}
