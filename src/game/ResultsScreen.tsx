import { Award, RotateCcw, Settings2 } from 'lucide-react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { GameConfig } from './SetupScreen';

type ResultsProps = {
  config: GameConfig;
  scores: [number, number];
  onAgain: () => void;
  onSetup: () => void;
};

export default function ResultsScreen({ config, scores, onAgain, onSetup }: ResultsProps) {
  const winnerIndex = scores[0] === scores[1] ? -1 : scores[0] > scores[1] ? 0 : 1;
  const winner = winnerIndex < 0 ? '' : config.players[winnerIndex as 0 | 1];

  useEffect(() => {
    // Pháo hoa chiến thắng
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
    });
  }, []);

  return (
    <main className="screen">
      <section className="results fade-in">
        <div className="winner-kicker">
          <Award style={{ width: 15, verticalAlign: '-4px', marginRight: 6 }} /> Kết quả chung cuộc
        </div>
        <h1 className="winner-title">
          {winnerIndex < 0 ? (
            <>
              Hai người<br />
              <span>Ngang tài ngang sức!</span>
            </>
          ) : (
            <>
              Ý hợp tâm đầu,<br />
              <span>{winner} Thắng!</span>
            </>
          )}
        </h1>
        <p className="results-sub">Bốn lượt đấu gay cấn đã khép lại. Ván tiếp theo, ai sẽ đọc vị ai?</p>
        <div className="result-scores">
          {config.players.map((player, index) => (
            <div
              className={`result-score ${winnerIndex === index ? 'winner' : ''}`}
              key={player}
            >
              <small>{player}{winnerIndex === index ? ' · Người chiến thắng 🏆' : ''}</small>
              <strong>{scores[index]} đ</strong>
            </div>
          ))}
        </div>
        <div className="result-buttons">
          <button className="secondary-btn" onClick={onSetup}>
            <Settings2 /> Đổi thiết lập
          </button>
          <button className="primary-btn" onClick={onAgain}>
            <RotateCcw /> Chơi lại ván mới
          </button>
        </div>
      </section>
    </main>
  );
}
