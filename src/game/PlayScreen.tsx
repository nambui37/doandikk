import { Check, Clock3, Pause, RotateCcw, UserRound } from 'lucide-react';
import type { GameConfig } from './SetupScreen';
import DrawCanvas from './DrawCanvas';

type PlayProps = {
  config: GameConfig;
  turn: number;
  seconds: number;
  word: string;
  scores: [number, number];
  correctCount: [number, number];
  paused: boolean;
  onCorrect: () => void;
  onPass: () => void;
  onPause: () => void;
  onRestart: () => void;
  onResume: () => void;
};

export default function PlayScreen({
  config,
  turn,
  seconds,
  word,
  scores,
  correctCount,
  paused,
  onCorrect,
  onPass,
  onPause,
  onRestart,
  onResume,
}: PlayProps) {
  const giverIndex = turn % 2;
  const guesserIndex = 1 - giverIndex;
  const giver = config.players[giverIndex];
  const guesser = config.players[guesserIndex];
  const progress = Math.max(0, (seconds / 60) * 100);

  return (
    <main className="play-screen">
      <header className="game-header">
        <div className="round-info">
          Lượt <strong>{turn + 1}</strong> / 4 <span style={{ color: '#596176', margin: '0 7px' }}>•</span> VẼ TRANH · {config.category}
        </div>
        <div className="scoreboard">
          {config.players.map((player, index) => (
            <div
              key={player}
              className={`score-chip ${index === guesserIndex ? 'active-turn' : ''}`}
            >
              <span>{player}</span>
              <b>{scores[index]}</b>
            </div>
          ))}
        </div>
      </header>
      <div className="game-grid">
        <section className="play-main">
          <div className="turn-top">
            <div className="role-pill">
              <UserRound />{' '}
              <span>
                <strong>{giver}</strong> vẽ gợi ý{' '}
                <span style={{ color: '#71798f' }}>→</span> <strong>{guesser}</strong> đoán
              </span>
            </div>
            <div className="turn-actions">
              <button
                className="icon-btn"
                aria-label="Tạm dừng"
                onClick={onPause}
              >
                <Pause />
              </button>
              <button
                className="icon-btn"
                aria-label="Chơi lại"
                onClick={onRestart}
              >
                <RotateCcw />
              </button>
            </div>
          </div>
          <div className="timer-wrap">
            <div>
              <div className={`timer ${seconds <= 10 ? 'danger' : ''}`}>
                00:{String(seconds).padStart(2, '0')}
              </div>
              <div className="timer-label">
                <Clock3 style={{ width: 12, verticalAlign: '-2px', marginRight: 5 }} />
                Thời gian còn lại
              </div>
            </div>
            <div className="meter" aria-label={`Còn ${seconds} giây`}>
              <div className="meter-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="prompt-card">
            <div className="prompt-label">Từ bí mật · chỉ người vẽ nhìn thấy</div>
            <div className="prompt-word">{word}</div>
          </div>

          <DrawCanvas onClear={() => undefined} />

          <p className="play-instruction">
            {giver} vẽ hình gợi ý trên bảng. {guesser} đoán thành tiếng — người vẽ bấm xác nhận khi đúng!
          </p>

          <div className="play-actions">
            <button
              className="primary-btn"
              onClick={onCorrect}
            >
              <Check /> Đoán đúng! (+{100 + seconds * 20}đ)
            </button>
            <button
              className="pass-btn"
              onClick={onPass}
            >
              Bỏ qua từ này
            </button>
          </div>
        </section>
        <aside className="game-side">
          <section className="side-card">
            <h3>Đang chơi</h3>
            <div className="role-row">
              <span>Đang vẽ</span>
              <b>{giver}</b>
            </div>
            <div className="role-row">
              <span>Đoán từ</span>
              <b>{guesser}</b>
            </div>
            <div className="role-row">
              <span>Đã đúng lượt này</span>
              <b>{correctCount[guesserIndex]}</b>
            </div>
          </section>
          <section className="side-card">
            <h3>Điểm thưởng tốc độ</h3>
            <div className="points-note">
              <strong>100 điểm + 20 × giây còn lại</strong>
              Mỗi đáp án đúng được cộng cho người đoán. Bỏ qua không bị trừ điểm.
            </div>
          </section>
        </aside>
      </div>
      {paused && (
        <div className="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <div className="pause-card">
            <div className="eyebrow" style={{ justifyContent: 'center' }}>Đồng hồ đã dừng</div>
            <h2 id="pause-title">Nghỉ một nhịp.</h2>
            <p>Điểm số và lượt chơi vẫn được giữ nguyên.</p>
            <div className="pause-actions">
              <button
                className="secondary-btn"
                onClick={onRestart}
              >
                Chơi ván mới
              </button>
              <button
                className="primary-btn"
                onClick={onResume}
              >
                Tiếp tục <Check />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
