import { Award, RotateCcw, Settings2 } from 'lucide-react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { RoomPlayer } from './types';
import type { GameConfig } from './SetupScreen';

type ResultsProps = {
  config?: GameConfig;
  players?: RoomPlayer[];
  scores: number[];
  winner?: RoomPlayer | null;
  targetScore?: number;
  isHost?: boolean;
  onAgain?: () => void;
  onPlayAgain?: () => void;
  onSetup?: () => void;
  onExit?: () => void;
};

export default function ResultsScreen({
  config,
  players,
  scores,
  winner: propWinner,
  targetScore,
  isHost = true,
  onAgain,
  onPlayAgain,
  onSetup,
  onExit,
}: ResultsProps) {
  const handlePlayAgain = onPlayAgain || onAgain || (() => {});
  const handleExit = onExit || onSetup || (() => {});
  // Chuẩn hóa danh sách người chơi
  const playerList = players
    ? players.map((p) => ({ name: p.name, score: scores[p.index] || 0 }))
    : (config?.players || []).map((name, index) => ({ name, score: scores[index] || 0 }));

  // Xếp hạng theo điểm từ cao xuống thấp
  const sorted = [...playerList].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const isTie = sorted.length > 1 && sorted[0].score === sorted[1].score && sorted[0].score > 0;

  useEffect(() => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.5 },
    });
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 0) return '🥇 Quán quân';
    if (rank === 1) return '🥈 Á quân';
    if (rank === 2) return '🥉 Hạng 3';
    return `#${rank + 1}`;
  };

  return (
    <main className="screen">
      <section className="results fade-in">
        <div className="winner-kicker">
          <Award style={{ width: 15, verticalAlign: '-4px', marginRight: 6 }} /> Bảng vàng danh dự
        </div>
        <h1 className="winner-title">
          {isTie ? (
            <>
              Hai bạn<br />
              <span>Ngang tài ngang sức!</span>
            </>
          ) : winner ? (
            <>
              Vẽ đẹp đoán tài,<br />
              <span>{winner.name} Vô địch! 🏆</span>
            </>
          ) : (
            'Trận đấu hoàn thành!'
          )}
        </h1>
        <p className="results-sub">Ván đấu đã khép lại với những màn vẽ tranh siêu hài hước!</p>

        <div className="multiplayer-results-grid">
          {sorted.map((item, rank) => (
            <div
              key={item.name}
              className={`result-score ${rank === 0 && !isTie ? 'winner' : ''}`}
            >
              <div className="rank-badge-text">{getRankBadge(rank)}</div>
              <strong>{item.name}</strong>
              <div className="final-points">{item.score} điểm</div>
            </div>
          ))}
        </div>

        <div className="result-buttons" style={{ marginTop: 22 }}>
          <button className="secondary-btn" onClick={handleExit}>
            <Settings2 /> {players ? 'Thoát phòng' : 'Đổi thiết lập'}
          </button>
          {isHost && (
            <button className="primary-btn" onClick={handlePlayAgain}>
              <RotateCcw /> Chơi lại ván mới
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
