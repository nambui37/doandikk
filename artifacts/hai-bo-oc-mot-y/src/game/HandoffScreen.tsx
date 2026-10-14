import { ArrowRight, Clock3, Eye, EyeOff, Sparkles } from 'lucide-react';
import type { GameConfig } from './SetupScreen';

type HandoffProps = { config: GameConfig; giverIndex: number; word: string; seconds: number; onReady: () => void; reveal: boolean; continueTurn: boolean };

export default function HandoffScreen({ config, giverIndex, word, seconds, onReady, reveal, continueTurn }: HandoffProps) {
  const giver = config.players[giverIndex];
  const guesser = config.players[1 - giverIndex];
  return (
    <main className="screen">
      <section className="handoff fade-in" data-testid={reveal ? 'status-private-reveal' : 'status-ready-handoff'}>
        <div className="handoff-icon">{reveal ? <Eye /> : <EyeOff />}</div>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>{reveal ? 'Chỉ người ra gợi ý xem' : 'Đã sẵn sàng chuyền máy'}</div>
        {reveal ? <>
          <h1 style={{ marginTop: 16 }}>Đưa máy cho<br />{giver}.</h1>
          <p>Hãy đảm bảo {guesser} không nhìn thấy màn hình. Ghi nhớ từ bí mật trước khi chuyền máy.</p>
          <div className="secret-word" data-testid="text-secret-prompt">{word}</div>
          <button className="primary-btn" onClick={onReady} data-testid="button-hide-prompt">Đã nhớ, chuyền máy <ArrowRight /></button>
        </> : <>
          <h1 style={{ marginTop: 16 }}>{continueTurn ? <>Mời {guesser}<br /><span style={{ color: '#f7d55c' }}>đoán tiếp.</span></> : <>Đến lượt<br /><span style={{ color: '#f7d55c' }}>{giver}</span> ra hiệu.</>}</h1>
          <p>{continueTurn ? `Chuyền máy lại cho ${guesser}. ${giver} tiếp tục gợi ý; đồng hồ vẫn đang chạy.` : `Chuyền máy lại cho ${guesser}. Khi cả hai đã sẵn sàng, đồng hồ 60 giây sẽ bắt đầu.`}</p>
          {continueTurn && <div className="role-pill" style={{ display: 'inline-flex', marginBottom: 18 }} data-testid="status-turn-handoff-time"><Clock3 /> Còn {seconds} giây · đồng hồ đang chạy</div>}
          <div className="role-pill" style={{ display: 'inline-flex', marginBottom: 22 }}><Sparkles /> {config.mode === 'talk' ? 'Nói gợi ý' : 'Vẽ gợi ý'} · {config.category}</div>
          <button className="primary-btn" onClick={onReady} data-testid={continueTurn ? 'button-ready-continue' : 'button-ready-start'}>{continueTurn ? 'Tiếp tục lượt chơi' : 'Bắt đầu tính giờ'} <ArrowRight /></button>
        </>}
      </section>
    </main>
  );
}
