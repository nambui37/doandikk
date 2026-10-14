import { Award, RotateCcw, Settings2 } from 'lucide-react';
import type { GameConfig } from './SetupScreen';

type ResultsProps = { config: GameConfig; scores: [number, number]; onAgain: () => void; onSetup: () => void };

export default function ResultsScreen({ config, scores, onAgain, onSetup }: ResultsProps) {
  const winnerIndex = scores[0] === scores[1] ? -1 : scores[0] > scores[1] ? 0 : 1;
  const winner = winnerIndex < 0 ? '' : config.players[winnerIndex as 0 | 1];
  return (
    <main className="screen">
      <section className="results fade-in" data-testid="screen-results">
        <div className="winner-kicker"><Award style={{ width: 15, verticalAlign: '-4px', marginRight: 6 }} /> Kết quả cuộc chơi</div>
        <h1 className="winner-title">{winnerIndex < 0 ? <>Hai người<br /><span>ngang tài!</span></> : <>Ý hợp tâm đầu,<br /><span>{winner} thắng!</span></>}</h1>
        <p className="results-sub">Bốn lượt đã khép lại. Ván tiếp theo, ai sẽ đọc vị ai?</p>
        <div className="result-scores">
          {config.players.map((player, index) => <div className={`result-score ${winnerIndex === index ? 'winner' : ''}`} key={player} data-testid={`status-final-score-${index}`}><small>{player}{winnerIndex === index ? ' · Người thắng' : ''}</small><strong>{scores[index]}</strong></div>)}
        </div>
        <div className="result-buttons">
          <button className="secondary-btn" onClick={onSetup} data-testid="button-back-to-setup"><Settings2 /> Đổi thiết lập</button>
          <button className="primary-btn" onClick={onAgain} data-testid="button-rematch"><RotateCcw /> Chơi ván mới</button>
        </div>
      </section>
    </main>
  );
}
