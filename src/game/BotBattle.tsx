import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Crown,
  Eraser,
  HelpCircle,
  Lightbulb,
  Maximize2,
  Paintbrush,
  Palette,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Swords,
  Trash2,
  Trophy,
  Volume2,
} from 'lucide-react';
import { soundManager } from '../lib/soundManager';
import Avatar3D from './Avatar3D';
import { AVATAR_LIST } from './Avatars';
import {
  BOT_DRAWING_TEMPLATES,
  BOT_GUESS_COMMENTS,
  normalizeAnswer,
  type BotDrawingTemplate,
} from './botTemplates';
import { customWordManager } from '../lib/customWords';
import type { DrawingPoint, DrawingStroke } from './types';

interface Props {
  playerName: string;
  playerAvatarIndex: number;
  onExit: () => void;
}

type BattleMode = 'versus' | 'player_draws' | 'bot_draws';
type BattlePhase = 'ready' | 'playing' | 'round_result' | 'match_result';

const COLORS = [
  '#0f172a', // Đen
  '#ef4444', // Đỏ
  '#f97316', // Cam
  '#eab308', // Vàng
  '#22c55e', // Xanh lá
  '#06b6d4', // Xanh ngọc
  '#3b82f6', // Xanh dương
  '#8b5cf6', // Tím
  '#ec4899', // Hồng
  '#ffffff', // Trắng
];

const BRUSH_SIZES = [
  { label: 'Mảnh', size: 4 },
  { label: 'Vừa', size: 8 },
  { label: 'Dày', size: 14 },
  { label: 'To', size: 24 },
];

export default function BotBattle({ playerName, playerAvatarIndex, onExit }: Props) {
  const [battleMode, setBattleMode] = useState<BattleMode>('versus');
  const [phase, setPhase] = useState<BattlePhase>('ready');
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = battleMode === 'versus' ? 4 : 3;

  // Lượt hiện tại: 'player' (Bạn vẽ) hoặc 'bot' (Bot vẽ)
  const currentDrawer = useMemo<'player' | 'bot'>(() => {
    if (battleMode === 'player_draws') return 'player';
    if (battleMode === 'bot_draws') return 'bot';
    // Versus: Hiệp lẻ (1, 3) = Bot vẽ, Bạn đoán; Hiệp chẵn (2, 4) = Bạn vẽ, Bot đoán
    return currentRound % 2 === 1 ? 'bot' : 'player';
  }, [battleMode, currentRound]);

  // Điểm số
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);

  // Thời gian
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);

  // Từ khóa bí mật & Gợi ý
  const [secretWord, setSecretWord] = useState('');
  const [secretCategory, setSecretCategory] = useState('');
  const [revealedLetters, setRevealedLetters] = useState<Set<number>>(new Set());

  // Trạng thái Bot
  const [botSpeech, setBotSpeech] = useState('Sẵn sàng tranh tài cùng bạn!');
  const [botConfidence, setBotConfidence] = useState(0); // 0 - 100% khi người vẽ
  const [botIsThinking, setBotIsThinking] = useState(false);

  // Bảng chat
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: string; text: string; isCorrect?: boolean; isBot?: boolean }>
  >([]);

  // Lịch sử nét vẽ của người chơi
  const [playerStrokes, setPlayerStrokes] = useState<DrawingStroke[]>([]);
  const currentStrokePoints = useRef<DrawingPoint[]>([]);
  const isDrawing = useRef(false);

  // Công cụ vẽ
  const [currentColor, setCurrentColor] = useState('#0f172a');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);

  // Bot animated drawing
  const botCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerCanvasRef = useRef<HTMLCanvasElement>(null);
  const botAnimationRef = useRef<number | null>(null);
  const botStrokeIndexRef = useRef(0);
  const botPointIndexRef = useRef(0);
  const botDrawnStrokesRef = useRef<DrawingStroke[]>([]);

  // Kho từ khóa tổng hợp cho người chơi (đồng bộ từ customWordManager)
  const allWordList = useMemo(() => {
    const list: Array<{ word: string; category: string }> = [];
    const all = customWordManager.getAllCategories();
    Object.entries(all).forEach(([cat, words]) => {
      words.forEach((w) => list.push({ word: w, category: cat }));
    });
    return list;
  }, []);

  // Khởi động lượt mới
  const startRound = useCallback((roundNum: number) => {
    setCurrentRound(roundNum);
    setTimeLeft(60);
    setRevealedLetters(new Set());
    setChatMessages([]);
    setChatInput('');
    setPlayerStrokes([]);
    setBotConfidence(0);
    setBotIsThinking(false);
    botDrawnStrokesRef.current = [];
    botStrokeIndexRef.current = 0;
    botPointIndexRef.current = 0;

    const drawer =
      battleMode === 'player_draws'
        ? 'player'
        : battleMode === 'bot_draws'
        ? 'bot'
        : roundNum % 2 === 1
        ? 'bot'
        : 'player';

    if (drawer === 'bot') {
      // Chọn mẫu vẽ hoạt họa từ kho Bot
      const randomIndex = Math.floor(Math.random() * BOT_DRAWING_TEMPLATES.length);
      const template = BOT_DRAWING_TEMPLATES[randomIndex];
      setSecretWord(template.word);
      setSecretCategory(template.category);
      setBotSpeech(`Tôi đang trổ tài vẽ bức tranh này, đoán xem là gì nhé! 🎨`);
    } else {
      // Chọn ngẫu nhiên từ khóa cho người chơi
      const randomIndex = Math.floor(Math.random() * allWordList.length);
      const chosen = allWordList[randomIndex];
      setSecretWord(chosen.word);
      setSecretCategory(chosen.category);
      setBotSpeech(`Hãy vẽ thật đẹp nhé, tôi sẽ cố gắng đoán ra ngay! 👀`);
    }

    setPhase('playing');
  }, [battleMode, allWordList]);

  // Bắt đầu trận đấu mới
  const handleStartMatch = () => {
    soundManager.playPop();
    setPlayerScore(0);
    setBotScore(0);
    startRound(1);
  };

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (phase !== 'playing' || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Hết giờ
          handleTimeOut();
          return 0;
        }
        if (prev === 11) {
          soundManager.playAlarm();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isPaused]);

  // Xử lý khi hết giờ
  const handleTimeOut = () => {
    soundManager.playAlarm();
    setBotSpeech(`Hết giờ mất rồi! Đáp án chính xác là: "${secretWord}" ⏰`);
    setPhase('round_result');
  };

  // BOT VẼ HOẠT HỌA THEO THỜI GIAN THỰC (KHI CURRENT DRAWER LÀ BOT)
  useEffect(() => {
    if (phase !== 'playing' || currentDrawer !== 'bot') {
      if (botAnimationRef.current) cancelAnimationFrame(botAnimationRef.current);
      return;
    }

    const template = BOT_DRAWING_TEMPLATES.find((t) => t.word === secretWord) || BOT_DRAWING_TEMPLATES[0];
    const canvas = botCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    botDrawnStrokesRef.current = [];
    botStrokeIndexRef.current = 0;
    botPointIndexRef.current = 0;

    let lastDrawTime = performance.now();
    const drawSpeedMs = 28; // Tốc độ vẽ từng điểm mượt mà

    const animateBotDrawing = (now: number) => {
      if (botStrokeIndexRef.current >= template.strokes.length) {
        return; // Đã vẽ xong toàn bộ các nét
      }

      if (now - lastDrawTime >= drawSpeedMs) {
        lastDrawTime = now;
        const currentStroke = template.strokes[botStrokeIndexRef.current];

        if (botPointIndexRef.current === 0) {
          botDrawnStrokesRef.current.push({
            color: currentStroke.color,
            size: currentStroke.size,
            points: [],
          });
        }

        const targetPoint = currentStroke.points[botPointIndexRef.current];
        if (targetPoint) {
          botDrawnStrokesRef.current[botDrawnStrokesRef.current.length - 1].points.push(targetPoint);
        }

        // Vẽ lại canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        botDrawnStrokesRef.current.forEach((stroke) => {
          if (!stroke.points.length) return;
          ctx.strokeStyle = stroke.color || '#000';
          ctx.lineWidth = stroke.size || 6;
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        });

        // Di chuyển cọ vẽ
        botPointIndexRef.current += 1;
        if (botPointIndexRef.current >= currentStroke.points.length) {
          botStrokeIndexRef.current += 1;
          botPointIndexRef.current = 0;
        }
      }

      botAnimationRef.current = requestAnimationFrame(animateBotDrawing);
    };

    botAnimationRef.current = requestAnimationFrame(animateBotDrawing);

    return () => {
      if (botAnimationRef.current) cancelAnimationFrame(botAnimationRef.current);
    };
  }, [phase, currentDrawer, secretWord]);

  // HÉ LỘ DẦN CHỮ CÁI GỢI Ý THEO THỜI GIAN HOẶC NÚT BẤM (KHI BẠN ĐOÁN)
  const lettersArray = useMemo(() => secretWord.split(''), [secretWord]);

  const handleRevealLetter = () => {
    soundManager.playPop();
    const unrevealedIndices: number[] = [];
    lettersArray.forEach((ch, idx) => {
      if (ch !== ' ' && !revealedLetters.has(idx)) {
        unrevealedIndices.push(idx);
      }
    });

    if (unrevealedIndices.length > 0) {
      const pick = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      setRevealedLetters((prev) => new Set(prev).add(pick));
    }
  };

  // Tự động hé lộ chữ cái khi thời gian còn 45s, 30s, 15s
  useEffect(() => {
    if (phase !== 'playing' || currentDrawer !== 'bot') return;
    if (timeLeft === 45 || timeLeft === 30 || timeLeft === 15) {
      handleRevealLetter();
    }
  }, [timeLeft, phase, currentDrawer]);

  // XỬ LÝ NGƯỜI CHƠI GỬI ĐÁP ÁN ĐOÁN
  const handlePlayerSubmitGuess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const guess = chatInput.trim();
    if (!guess) return;

    soundManager.playPop();
    const isCorrect = normalizeAnswer(guess) === normalizeAnswer(secretWord);

    setChatMessages((prev) => [
      ...prev,
      {
        sender: playerName,
        text: guess,
        isCorrect,
      },
    ]);
    setChatInput('');

    if (isCorrect) {
      soundManager.playSuccess();
      const pointsEarned = 100 + timeLeft * 10;
      setPlayerScore((prev) => prev + pointsEarned);
      setBotSpeech(`CHÍNH XÁC RỒI! Bạn đoán trúng từ "${secretWord}" và nhận được +${pointsEarned} điểm! 🎉`);
      setPhase('round_result');
    } else {
      // Bot phản hồi gợi ý hoặc trêu đùa
      const hints = [
        'Chưa chính xác đâu nha hehe! Thử lại xem nào! 😜',
        'Gần đúng rồi đấy, quan sát kỹ nét vẽ nhé! 🧐',
        'Hình như không phải từ này rồi, cố lên bạn ơi!',
      ];
      setBotSpeech(hints[Math.floor(Math.random() * hints.length)]);
    }
  };

  // XỬ LÝ KHI NGƯỜI CHƠI VẼ (BẢNG VẼ CANVAS)
  const redrawPlayerCanvas = useCallback(() => {
    const canvas = playerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    playerStrokes.forEach((stroke) => {
      if (!stroke.points.length) return;
      ctx.strokeStyle = stroke.color || '#000';
      ctx.lineWidth = stroke.size || 8;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [playerStrokes]);

  useEffect(() => {
    if (currentDrawer === 'player') {
      redrawPlayerCanvas();
    }
  }, [currentDrawer, redrawPlayerCanvas]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = playerCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawing.current = true;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    currentStrokePoints.current = [{ x, y }];

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
      ctx.lineWidth = isEraser ? brushSize * 2 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = playerCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    currentStrokePoints.current.push({ x, y });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentStrokePoints.current.length > 0) {
      const newStroke: DrawingStroke = {
        color: isEraser ? '#ffffff' : currentColor,
        size: isEraser ? brushSize * 2 : brushSize,
        points: [...currentStrokePoints.current],
      };
      setPlayerStrokes((prev) => [...prev, newStroke]);
      currentStrokePoints.current = [];

      // Mỗi khi người chơi vẽ thêm 1 nét, tăng độ nhận diện của Bot AI
      setBotConfidence((prev) => {
        const next = Math.min(100, prev + Math.floor(Math.random() * 14) + 12);
        // Bot nhận xét trong chat
        if (next > 30 && next < 70 && Math.random() > 0.5) {
          const comment = BOT_GUESS_COMMENTS[Math.floor(Math.random() * BOT_GUESS_COMMENTS.length)];
          setBotSpeech(comment);
        } else if (next >= 85) {
          setBotSpeech(`Aaaa! Tôi sắp nhìn ra rồi, có phải là ${secretWord} không nhỉ?! 🤩`);
        }
        return next;
      });
    }
  };

  // NÚT BẤM CHO BOT ĐOÁN HOẶC BOT TỰ ĐOÁN ĐÚNG KHI ĐỦ NÉT
  const handleTriggerBotGuess = () => {
    if (botConfidence < 30) {
      setBotSpeech('Bạn hãy vẽ thêm vài nét nữa để tôi nhận diện chuẩn hơn nhé! 🎨');
      return;
    }

    soundManager.playPop();
    setBotIsThinking(true);
    setBotSpeech('Đang phân tích hình vẽ bằng mạng nơ-ron AI... 🤖⚡');

    setTimeout(() => {
      setBotIsThinking(false);
      soundManager.playSuccess();
      const earned = 100 + timeLeft * 10;
      setPlayerScore((prev) => prev + earned);
      setBotScore((prev) => prev + Math.round(earned * 0.85)); // Bot cũng nhận điểm thưởng vì đã đoán đúng
      setBotSpeech(`CHÍNH XÁC 100%! Bức vẽ này đích thị là "${secretWord}" rồi! Bạn vẽ đỉnh thật đấy! 👏🎉`);
      setPhase('round_result');
    }, 1200);
  };

  // Chuyển sang hiệp tiếp theo hoặc kết thúc trận
  const handleNextRound = () => {
    soundManager.playPop();
    if (currentRound >= totalRounds) {
      setPhase('match_result');
    } else {
      startRound(currentRound + 1);
    }
  };

  const currentAvatar = AVATAR_LIST[playerAvatarIndex] || AVATAR_LIST[0];

  return (
    <div className="bot-battle-viewport fade-in">
      {/* ============================================================
          TOPBAR ĐIỀU KHIỂN & BẢNG ĐIỂM SỐ ĐỐI KHÁNG
      ============================================================ */}
      <header className="bot-battle-header">
        <div className="header-left-col">
          <button
            type="button"
            className="battle-back-btn"
            onClick={onExit}
            title="Thoát về trang chủ"
          >
            <ArrowLeft size={18} />
            <span>Thoát</span>
          </button>

          <div className="battle-round-badge">
            <Swords size={16} className="text-yellow-400" />
            <span>
              Hiệp <strong>{currentRound}</strong> / {totalRounds}
            </span>
            <span className="mode-pill-tag">
              {currentDrawer === 'bot' ? '🤖 Bot vẽ • Bạn đoán' : '🎨 Bạn vẽ • Bot đoán'}
            </span>
          </div>
        </div>

        {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
        <div className={`battle-timer-chip ${timeLeft <= 10 ? 'danger-pulse' : ''}`}>
          <Clock size={18} />
          <span>00:{String(timeLeft).padStart(2, '0')}</span>
        </div>

        {/* BẢNG ĐIỂM ĐỐI KHÁNG TRỰC TIẾP */}
        <div className="battle-scoreboard-box">
          <div className="score-user-item me">
            <div className="avatar-chip-mini" style={{ backgroundColor: currentAvatar.bg }}>
              {currentAvatar.render(22)}
            </div>
            <div className="score-meta">
              <span className="name-lbl">{playerName} (Bạn)</span>
              <strong className="pts-val">{playerScore} đ</strong>
            </div>
          </div>

          <div className="vs-divider-pill">VS</div>

          <div className="score-user-item bot">
            <div className="avatar-chip-mini bg-indigo-500">
              <Bot size={22} className="text-white" />
            </div>
            <div className="score-meta">
              <span className="name-lbl">AI Nam-Bot 3000</span>
              <strong className="pts-val">{botScore} đ</strong>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          KHUNG BÀN ĐẤU CHÍNH (GAME ARENA)
      ============================================================ */}
      <main className="bot-battle-arena">
        {/* MÀN CHỜ BẮT ĐẦU */}
        {phase === 'ready' && (
          <div className="battle-ready-modal fade-in">
            <div className="ready-card-content">
              <div className="ready-icon-glow">
                <Bot size={56} className="text-cyan-400" />
              </div>
              <h2 className="ready-title">ĐẤU VỚI ROBOT AI</h2>
              <p className="ready-subtitle">
                Thử thách tài năng hội họa và suy luận của bạn cùng <strong>AI Nam-Bot 3000</strong> siêu thông minh!
              </p>

              {/* LỰA CHỌN THỂ THỨC ĐẤU */}
              <div className="mode-select-row">
                <button
                  type="button"
                  className={`mode-select-pill ${battleMode === 'versus' ? 'active' : ''}`}
                  onClick={() => setBattleMode('versus')}
                >
                  <Swords size={18} />
                  <span>Đối kháng 4 hiệp</span>
                  <small>Luân phiên vẽ và đoán</small>
                </button>

                <button
                  type="button"
                  className={`mode-select-pill ${battleMode === 'player_draws' ? 'active' : ''}`}
                  onClick={() => setBattleMode('player_draws')}
                >
                  <Paintbrush size={18} />
                  <span>Bạn vẽ • Bot đoán</span>
                  <small>Thử thách nhận diện AI</small>
                </button>

                <button
                  type="button"
                  className={`mode-select-pill ${battleMode === 'bot_draws' ? 'active' : ''}`}
                  onClick={() => setBattleMode('bot_draws')}
                >
                  <Lightbulb size={18} />
                  <span>Bot vẽ • Bạn đoán</span>
                  <small>Đoán nét vẽ hoạt họa</small>
                </button>
              </div>

              <button
                type="button"
                className="ready-start-btn"
                onClick={handleStartMatch}
              >
                <Play size={20} />
                <span>BẮT ĐẦU ĐẤU MÁY NGAY</span>
              </button>
            </div>
          </div>
        )}

        {/* MÀN ĐANG ĐẤU (PLAYING) */}
        {phase === 'playing' && (
          <div className="battle-play-grid">
            {/* CỘT TRÁI: KHU VỰC VẼ & XEM BỨC TRANH */}
            <section className="battle-canvas-section">
              {/* THANH GỢI Ý CHỦ ĐỀ HOẶC TỪ KHÓA BÍ MẬT */}
              <div className="battle-prompt-banner">
                {currentDrawer === 'player' ? (
                  <div className="prompt-content-box">
                    <span className="prompt-tag">TỪ BÍ MẬT BẠN CẦN VẼ:</span>
                    <strong className="prompt-secret-word">{secretWord}</strong>
                    <span className="prompt-cat-tag">({secretCategory})</span>
                  </div>
                ) : (
                  <div className="prompt-content-box guesser-mode">
                    <span className="prompt-tag">BOT ĐANG VẼ CHỦ ĐỀ:</span>
                    <strong className="prompt-cat-highlight">{secretCategory}</strong>
                    {/* GỢI Ý SỐ KÝ TỰ / CHỮ CÁI KIỂU HANGMAN */}
                    <div className="hangman-letters-row">
                      {lettersArray.map((ch, idx) => {
                        if (ch === ' ') {
                          return <span key={idx} className="hangman-space" />;
                        }
                        const isRevealed = revealedLetters.has(idx);
                        return (
                          <span
                            key={idx}
                            className={`hangman-box ${isRevealed ? 'revealed' : ''}`}
                          >
                            {isRevealed ? ch : '_'}
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        className="hint-letter-btn"
                        onClick={handleRevealLetter}
                        title="Bấm để mở thêm 1 chữ cái gợi ý"
                      >
                        <Lightbulb size={15} /> Gợi ý chữ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* BẢNG VẼ CANVAS */}
              <div className="battle-canvas-wrapper">
                {currentDrawer === 'bot' ? (
                  /* CANVAS BOT TỰ ĐỘNG VẼ */
                  <div className="bot-animated-canvas-box">
                    <canvas
                      ref={botCanvasRef}
                      width={600}
                      height={450}
                      className="bot-drawing-canvas"
                    />
                    <div className="bot-drawing-pen-indicator">
                      <span>🤖 Bot đang phác họa từng nét...</span>
                    </div>
                  </div>
                ) : (
                  /* CANVAS BẠN VẼ */
                  <div className="player-interactive-canvas-box">
                    <canvas
                      ref={playerCanvasRef}
                      width={600}
                      height={450}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="player-drawing-canvas"
                    />

                    {/* THANH CÔNG CỤ VẼ MƯỢT MÀ */}
                    <div className="battle-draw-toolbar">
                      {/* BẢNG MÀU */}
                      <div className="toolbar-colors">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`tool-color-dot ${currentColor === c && !isEraser ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => {
                              setCurrentColor(c);
                              setIsEraser(false);
                            }}
                          />
                        ))}
                      </div>

                      <div className="toolbar-divider" />

                      {/* CỠ NÉT */}
                      <div className="toolbar-sizes">
                        {BRUSH_SIZES.map((b) => (
                          <button
                            key={b.size}
                            type="button"
                            className={`tool-size-btn ${brushSize === b.size && !isEraser ? 'active' : ''}`}
                            onClick={() => {
                              setBrushSize(b.size);
                              setIsEraser(false);
                            }}
                            title={b.label}
                          >
                            <span
                              style={{
                                width: b.size + 2,
                                height: b.size + 2,
                                borderRadius: '50%',
                                backgroundColor: 'currentColor',
                              }}
                            />
                          </button>
                        ))}
                      </div>

                      <div className="toolbar-divider" />

                      {/* TẨY & XÓA BẢNG */}
                      <button
                        type="button"
                        className={`tool-action-btn ${isEraser ? 'active' : ''}`}
                        onClick={() => setIsEraser(!isEraser)}
                        title="Tẩy nét vẽ"
                      >
                        <Eraser size={18} />
                      </button>

                      <button
                        type="button"
                        className="tool-action-btn"
                        onClick={() => {
                          setPlayerStrokes([]);
                          redrawPlayerCanvas();
                          setBotConfidence(0);
                        }}
                        title="Xóa trắng bảng vẽ"
                      >
                        <Trash2 size={18} />
                      </button>

                      {/* NÚT CHO BOT ĐOÁN NGAY */}
                      <button
                        type="button"
                        className="btn-trigger-bot-guess"
                        onClick={handleTriggerBotGuess}
                        disabled={botIsThinking}
                      >
                        <Brain size={18} />
                        <span>{botIsThinking ? 'Bot đang nghĩ...' : 'Hỏi Bot đoán ngay!'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* CỘT PHẢI: KHUNG BOT AI & Ô NHẬP ĐOÁN TỪ KHÓA */}
            <aside className="battle-sidebar-panel">
              {/* KHỐI BOT AI INTERACTIVE VỚI BÓNG THOẠI */}
              <div className="bot-character-card">
                <div className="bot-avatar-frame">
                  <div className="bot-glow-ring" />
                  <Bot size={44} className="bot-robot-icon text-cyan-300" />
                </div>
                <div className="bot-dialog-bubble">
                  <span className="bot-name-tag">🤖 AI Nam-Bot 3000:</span>
                  <p className="bot-speech-text">"{botSpeech}"</p>
                </div>
              </div>

              {/* THANH ĐỘ NHẬN DIỆN CỦA BOT KHI BẠN VẼ */}
              {currentDrawer === 'player' && (
                <div className="bot-confidence-meter-card">
                  <div className="meter-label-row">
                    <span>Độ nhận diện của AI:</span>
                    <strong>{botConfidence}%</strong>
                  </div>
                  <div className="meter-bar-track">
                    <div
                      className="meter-bar-fill"
                      style={{
                        width: `${botConfidence}%`,
                        backgroundColor:
                          botConfidence > 75 ? '#22c55e' : botConfidence > 40 ? '#f59e0b' : '#3b82f6',
                      }}
                    />
                  </div>
                  <small className="meter-hint-text">
                    {botConfidence < 40
                      ? 'Vẽ thêm vài chi tiết để Bot hiểu...'
                      : botConfidence < 80
                      ? 'Bot đang dần nhận ra rồi đấy!'
                      : 'Đã sẵn sàng đoán trúng! Bấm "Hỏi Bot đoán ngay"'}
                  </small>
                </div>
              )}

              {/* KHUNG CHAT ĐOÁN TỪ KHI BOT ĐANG VẼ */}
              {currentDrawer === 'bot' && (
                <div className="guess-chat-card">
                  <div className="chat-messages-container">
                    {chatMessages.length === 0 ? (
                      <div className="empty-chat-tip">
                        <Lightbulb size={24} className="text-amber-400 mb-1" />
                        <span>Hãy quan sát bức tranh và gõ đáp án vào ô bên dưới!</span>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`chat-bubble-row ${msg.isCorrect ? 'correct' : 'wrong'}`}
                        >
                          <span className="chat-sender">{msg.sender}:</span>
                          <span className="chat-body">{msg.text}</span>
                          {msg.isCorrect && <CheckCircle2 size={16} className="text-emerald-400" />}
                        </div>
                      ))
                    )}
                  </div>

                  {/* FORM NHẬP ĐÁP ÁN ĐOÁN */}
                  <form onSubmit={handlePlayerSubmitGuess} className="guess-input-form">
                    <input
                      type="text"
                      placeholder="Nhập từ bạn đoán (VD: Con mèo, Quả táo)..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="guess-text-input"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="guess-submit-btn"
                      disabled={!chatInput.trim()}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* MÀN KẾT THÚC HIỆP (ROUND RESULT) */}
        {phase === 'round_result' && (
          <div className="round-result-modal fade-in">
            <div className="result-card-inner">
              <div className="result-crown-badge">
                <Trophy size={48} className="text-amber-400" />
              </div>
              <h2 className="result-round-title">KẾT THÚC HIỆP {currentRound}!</h2>
              <div className="result-word-reveal">
                <span>Đáp án chính xác:</span>
                <strong className="revealed-golden-word">{secretWord}</strong>
              </div>

              <div className="result-scores-comparison">
                <div className="score-summary-box">
                  <span className="lbl">{playerName}</span>
                  <span className="pts">{playerScore} đ</span>
                </div>
                <div className="vs-sign">VS</div>
                <div className="score-summary-box bot">
                  <span className="lbl">AI Nam-Bot 3000</span>
                  <span className="pts">{botScore} đ</span>
                </div>
              </div>

              <button
                type="button"
                className="next-round-action-btn"
                onClick={handleNextRound}
              >
                <span>{currentRound >= totalRounds ? 'XEM KẾT QUẢ CHUNG CUỘC' : 'SANG HIỆP TIẾP THEO'}</span>
                <Play size={18} />
              </button>
            </div>
          </div>
        )}

        {/* MÀN KẾT THÚC TRẬN ĐẤU (MATCH RESULT) */}
        {phase === 'match_result' && (
          <div className="match-result-modal fade-in">
            <div className="match-result-card">
              <div className="trophy-sparkle-hero">
                <Trophy size={64} className="trophy-golden-svg" />
                <Sparkles size={32} className="sparkle-gold-1" />
                <Sparkles size={24} className="sparkle-gold-2" />
              </div>

              <h1 className="match-winner-title">
                {playerScore >= botScore
                  ? `🎉 CHÚC MỪNG ${playerName.toUpperCase()}! BẠN ĐÃ CHIẾN THẮNG!`
                  : '🤖 AI NAM-BOT 3000 ĐÃ DÀNH CHIẾN THẮNG!'}
              </h1>
              <p className="match-winner-sub">
                {playerScore >= botScore
                  ? 'Bạn là một chiến thần hội họa và suy luận xuất sắc nhất!'
                  : 'Trận đấu rất gay cấn! Hãy thử sức lại để phục thù nhé!'}
              </p>

              <div className="match-final-podium-stats">
                <div className="final-podium-item me">
                  <Crown size={28} className="text-yellow-400 mb-1" />
                  <strong className="final-name">{playerName}</strong>
                  <span className="final-pts">{playerScore} ĐIỂM</span>
                </div>

                <div className="final-podium-item bot">
                  <Bot size={28} className="text-cyan-400 mb-1" />
                  <strong className="final-name">AI Nam-Bot</strong>
                  <span className="final-pts">{botScore} ĐIỂM</span>
                </div>
              </div>

              <div className="match-result-btn-row">
                <button
                  type="button"
                  className="rematch-btn"
                  onClick={handleStartMatch}
                >
                  <RotateCcw size={18} />
                  <span>ĐẤU LẠI VÁN MỚI</span>
                </button>

                <button
                  type="button"
                  className="exit-home-btn"
                  onClick={onExit}
                >
                  <ArrowLeft size={18} />
                  <span>VỀ TRANG CHỦ</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
