import { useState, useEffect, useRef } from 'react';
import {
  Clock3,
  Dices,
  Send,
  Sparkles,
  LoaderCircle,
  CheckCircle2,
  Brush,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DrawingStroke, TelephoneState } from './types';
import OnlineDrawing from './OnlineDrawing';
import StrokeViewer from './StrokeViewer';
import Hourglass3D from './Hourglass3D';
import { getRandomPrompt } from './telephonePrompts';

interface Props {
  state: TelephoneState;
  roomCode: string;
  onSubmit: (payload: { text?: string; strokes?: DrawingStroke[] }) => Promise<void>;
  onDraft?: (payload: { text?: string; strokes?: DrawingStroke[] }) => void;
}

export default function TelephonePlay({ state, roomCode, onSubmit, onDraft }: Props) {
  const [promptText, setPromptText] = useState('');
  const [guessText, setGuessText] = useState('');
  const [currentStrokes, setCurrentStrokes] = useState<DrawingStroke[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSubmitted, setLocalSubmitted] = useState(false);

  // Ref lưu nét vẽ và text mới nhất tức thì (tránh stale closure và batching delay của React)
  const latestStrokesRef = useRef<DrawingStroke[]>([]);
  const promptTextRef = useRef('');
  const guessTextRef = useRef('');
  const draftDebounceRef = useRef<any>(null);

  promptTextRef.current = promptText;
  guessTextRef.current = guessText;

  // Reset local state when round changes
  useEffect(() => {
    setLocalSubmitted(state.hasSubmitted);
    setPromptText('');
    setGuessText('');
    setCurrentStrokes([]);
    latestStrokesRef.current = [];
    if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
  }, [state.round, state.hasSubmitted]);

  const hasSubmitted = localSubmitted || state.hasSubmitted;

  // Cập nhật strokes khi người dùng vẽ và tự động gửi draft nháp lên server
  const handleStrokesChange = (newStrokes: DrawingStroke[]) => {
    latestStrokesRef.current = newStrokes;
    setCurrentStrokes(newStrokes);

    if (onDraft) {
      if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
      draftDebounceRef.current = setTimeout(() => {
        onDraft({ strokes: newStrokes });
      }, 1000);
    }
  };

  // Xử lý nộp câu ban đầu (Phase: prompt)
  const handlePromptSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = (promptTextRef.current || promptText).trim();
    if (!clean || isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);
    setLocalSubmitted(true);
    try {
      await onSubmit({ text: clean });
      confetti({ particleCount: 30, spread: 60 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý nộp tranh vẽ (Phase: drawing)
  const handleDrawingSubmit = async (explicitStrokes?: DrawingStroke[]) => {
    if (isSubmitting || hasSubmitted) return;
    const strokesToSubmit =
      Array.isArray(explicitStrokes) && explicitStrokes.length > 0
        ? explicitStrokes
        : (latestStrokesRef.current.length > 0 ? latestStrokesRef.current : currentStrokes);

    setIsSubmitting(true);
    setLocalSubmitted(true);
    try {
      await onSubmit({ strokes: strokesToSubmit });
      confetti({ particleCount: 35, spread: 60 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý nộp câu đoán (Phase: guess)
  const handleGuessSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = (guessTextRef.current || guessText).trim();
    if (!clean || isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);
    setLocalSubmitted(true);
    try {
      await onSubmit({ text: clean });
      confetti({ particleCount: 30, spread: 60 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // TỰ ĐỘNG NỘP BÀI KHI ĐỒNG HỒ ĐẾM NGƯỢC VỀ 0 HOẶC <= 1 GIÂY
  // Đảm bảo tuyệt đối không bao giờ bị mất bài vẽ hoặc kết quả bị trắng tinh do quên bấm nút
  useEffect(() => {
    if (state.timeLeftSeconds <= 1 && !hasSubmitted && !isSubmitting) {
      if (state.phase === 'drawing') {
        const strokes = latestStrokesRef.current.length > 0 ? latestStrokesRef.current : currentStrokes;
        handleDrawingSubmit(strokes);
      } else if (state.phase === 'prompt') {
        const text = (promptTextRef.current || promptText).trim() || getRandomPrompt();
        setIsSubmitting(true);
        setLocalSubmitted(true);
        onSubmit({ text }).finally(() => setIsSubmitting(false));
      } else if (state.phase === 'guess') {
        const text = (guessTextRef.current || guessText).trim() || 'Một tác phẩm bí ẩn';
        setIsSubmitting(true);
        setLocalSubmitted(true);
        onSubmit({ text }).finally(() => setIsSubmitting(false));
      }
    }
  }, [state.timeLeftSeconds, hasSubmitted, isSubmitting, state.phase]);

  const handleRandomPrompt = () => {
    setPromptText(getRandomPrompt());
  };

  const roundNum = state.round + 1;
  const totalRounds = state.totalRounds;

  return (
    <div className="telephone-play-screen fade-in">
      {/* THANH TOP BAR */}
      <header className="gartic-play-topbar">
        <div className="topbar-left">
          <span className="room-pill">
            Phòng: <strong>{roomCode}</strong>
          </span>
          <span className="round-pill">
            Lượt {roundNum} / {totalRounds}
          </span>
          <span className="mode-pill-tag">
            <Sparkles size={13} /> Tam Sao Thất Bản
          </span>
        </div>

        {/* ĐỒNG HỒ CÁT 3D STUDIO & ĐẾM NGƯỢC */}
        <div className="topbar-timer-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Hourglass3D timeLeft={state.timeLeftSeconds} totalTime={75} />
          <div className={`gartic-timer-pill ${state.timeLeftSeconds <= 10 ? 'urgent' : ''}`}>
            <span className="timer-number">{state.timeLeftSeconds}s</span>
          </div>
        </div>

        <div className="topbar-right">
          <span className="submitted-count-pill">
            {state.submittedCount}/{state.totalPlayers} đã nộp
          </span>
        </div>
      </header>

      {/* NẾU ĐÃ NỘP BÀI: HIỆN MÀN HÌNH CHỜ NGHỈ NGƠI */}
      {hasSubmitted ? (
        <div className="telephone-waiting-card fade-in">
          <div className="waiting-spinner-glow">
            <CheckCircle2 size={56} className="text-emerald-400" />
          </div>
          <h3>Đã nộp bài thành công!</h3>
          <p className="waiting-desc">
            Bạn đã hoàn thành lượt này. Đang chờ các bạn bè trong phòng nộp bài...
          </p>
          <div className="waiting-stats-pill">
            <LoaderCircle size={18} className="spin" />
            <span>
              <strong>{state.submittedCount}</strong> / {state.totalPlayers} người chơi đã sẵn sàng
            </span>
          </div>
        </div>
      ) : (
        /* NỘI DUNG TỪNG PHASE KHI CHƯA NỘP */
        <div className="telephone-action-wrapper">
          {/* 1. PHASE VIẾT CÂU MỞ ĐẦU */}
          {state.phase === 'prompt' && (
            <div className="telephone-card prompt-card fade-in">
              <div className="telephone-task-badge">
                <Sparkles size={16} /> BƯỚC 1: VIẾT CÂU KHỞI NGUỒN
              </div>
              <h2 className="telephone-prompt-title">Viết một câu thật hài hước & ngộ nghĩnh!</h2>
              <p className="telephone-prompt-sub">
                Người chơi kế tiếp sẽ chỉ nhìn thấy câu này và phải vẽ lại nó bằng tranh.
              </p>

              <form onSubmit={handlePromptSubmit} className="telephone-form">
                <div className="telephone-input-wrapper">
                  <input
                    type="text"
                    maxLength={100}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Ví dụ: Con mèo lái máy bay đi mua phở..."
                    className="telephone-text-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="telephone-dice-btn"
                    onClick={handleRandomPrompt}
                    title="Lấy câu gợi ý ngẫu nhiên"
                  >
                    <Dices size={20} />
                    <span>Gợi ý</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="telephone-submit-btn"
                  disabled={!promptText.trim() || isSubmitting}
                >
                  <Send size={18} />
                  <span>XONG & NỘP BÀI</span>
                </button>
              </form>
            </div>
          )}

          {/* 2. PHASE VẼ TRANH THEO CÂU MIÊU TẢ */}
          {state.phase === 'drawing' && (
            <div className="telephone-drawing-card fade-in">
              <div className="telephone-task-banner drawing">
                <Brush size={18} />
                <span>Nhiệm vụ của bạn: Hãy vẽ lại câu này:</span>
              </div>

              <div className="telephone-target-prompt-pill">
                “{state.inputPrompt || 'Vẽ một điều kỳ diệu...'}”
              </div>

              <div className="telephone-canvas-container">
                <OnlineDrawing
                  key={`telephone-canvas-round-${state.round}`}
                  strokes={currentStrokes}
                  revision={state.round}
                  canDraw={true}
                  onChange={handleStrokesChange}
                  onDone={(strokes) => handleDrawingSubmit(strokes)}
                  onClearDrawing={() => {
                    latestStrokesRef.current = [];
                    setCurrentStrokes([]);
                  }}
                />
              </div>

              {/* NÚT NỘP TRANH NỔI BẬT DÀNH CHO NGƯỜI CHƠI */}
              <div className="telephone-drawing-bottom-bar">
                <button
                  type="button"
                  className="telephone-submit-btn drawing-btn"
                  onClick={() => handleDrawingSubmit()}
                  disabled={isSubmitting || hasSubmitted}
                  title="Bấm để nộp tác phẩm của bạn cho người chơi tiếp theo"
                >
                  <Send size={18} />
                  <span>XONG & NỘP BÀI VẼ</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. PHASE ĐOÁN TRANH */}
          {state.phase === 'guess' && (
            <div className="telephone-guess-card fade-in">
              <div className="telephone-task-banner guess">
                <Eye size={18} />
                <span>Nhiệm vụ của bạn: Đoán xem bức tranh này vẽ gì?</span>
              </div>

              <div className="telephone-preview-canvas-box">
                <StrokeViewer
                  key={`guess-prev-${state.round}`}
                  strokes={state.inputDrawingStrokes || []}
                  width={750}
                  height={460}
                />
              </div>

              <form onSubmit={handleGuessSubmit} className="telephone-guess-form">
                <input
                  type="text"
                  maxLength={100}
                  value={guessText}
                  onChange={(e) => setGuessText(e.target.value)}
                  placeholder="Nhập câu miêu tả bức tranh này theo suy nghĩ của bạn..."
                  className="telephone-text-input guess-input"
                  autoFocus
                />
                <button
                  type="submit"
                  className="telephone-submit-btn"
                  disabled={!guessText.trim() || isSubmitting}
                >
                  <Send size={18} />
                  <span>GỬI CÂU ĐOÁN</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
