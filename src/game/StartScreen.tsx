import { Brush, Globe2, Mic2 } from 'lucide-react';
import { useState } from 'react';
import SetupScreen, { type GameConfig } from './SetupScreen';

type StartScreenProps = { onStart: (config: GameConfig) => void; onOnline: () => void };

export default function StartScreen({ onStart, onOnline }: StartScreenProps) {
  const [localSetup, setLocalSetup] = useState(false);

  if (localSetup) {
    return <div className="start-local">
      <button type="button" className="online-back" onClick={() => setLocalSetup(false)} data-testid="button-back-to-modes">← Chọn cách chơi</button>
      <SetupScreen onStart={onStart} />
    </div>;
  }

  return <main className="screen">
    <div className="mode-picker">
      <section className="fade-in">
        <div className="eyebrow">Trò chơi cho hai người</div>
        <h1 className="hero-title">Hai bộ óc.<span>Một ý.</span></h1>
        <p className="hero-copy">Một người gợi ý. Một người đoán thật nhanh. Chọn cách chơi rồi cùng xem ai hiểu ý ai hơn.</p>
        <div className="tiny-stats"><div><b>02</b>Người chơi</div><div><b>04</b>Lượt đấu</div><div><b>60s</b>Mỗi lượt</div></div>
      </section>
      <section className="mode-panel fade-in delay-2">
        <div className="eyebrow">Bắt đầu cuộc vui</div>
        <h2>Hai người, một bàn chơi.</h2>
        <p>Cùng một máy hay mỗi người trên thiết bị riêng — luật chơi vẫn dễ hiểu.</p>
        <button className="play-mode-option" type="button" onClick={() => setLocalSetup(true)} data-testid="button-choose-local">
          <span className="mode-icon"><Mic2 /></span><span><strong>Chơi cùng một máy</strong><small>Luân phiên chuyền điện thoại, như trước giờ.</small></span>
        </button>
        <button className="play-mode-option" type="button" onClick={onOnline} data-testid="button-choose-online">
          <span className="mode-icon"><Globe2 /></span><span><strong>Kết nối qua mạng</strong><small>Tạo phòng hoặc nhập mã của bạn bè.</small></span>
        </button>
        <div className="room-message"><Brush /> Nói hoặc vẽ gợi ý; bảng vẽ cập nhật trực tiếp.</div>
      </section>
    </div>
  </main>;
}
