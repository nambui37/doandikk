import { Brush, Globe2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import SetupScreen, { type GameConfig } from './SetupScreen';

type StartScreenProps = {
  onStart: (config: GameConfig) => void;
  onOnline: () => void;
};

export default function StartScreen({ onStart, onOnline }: StartScreenProps) {
  const [localSetup, setLocalSetup] = useState(false);

  if (localSetup) {
    return (
      <div className="start-local">
        <button
          type="button"
          className="online-back"
          onClick={() => setLocalSetup(false)}
        >
          ← Chọn cách chơi
        </button>
        <SetupScreen onStart={onStart} />
      </div>
    );
  }

  return (
    <main className="screen">
      <div className="mode-picker">
        <section className="fade-in">
          <div className="eyebrow">Trò chơi vẽ hình đoán ý</div>
          <h1 className="hero-title">
            Vẽ cùng bạn bè.<span>Đoán một ý!</span>
          </h1>
          <p className="hero-copy">
            Một người trổ tài vẽ tranh, mọi người cùng thi nhau đoán từ khóa. Ai đoán trúng nhiều nhất sẽ trở thành Quán quân!
          </p>
          <div className="tiny-stats">
            <div>
              <b>2-8</b>Người chơi
            </div>
            <div>
              <b>04+</b>Lượt đấu
            </div>
            <div>
              <b>60s</b>Mỗi lượt
            </div>
          </div>
        </section>
        <section className="mode-panel fade-in delay-2">
          <div className="eyebrow">Bắt đầu cuộc vui</div>
          <h2>Chọn cách bạn muốn chơi</h2>
          <p>Cùng một máy hay mỗi người trên điện thoại riêng qua link phòng.</p>
          <button
            className="play-mode-option"
            type="button"
            onClick={onOnline}
          >
            <span className="mode-icon">
              <Globe2 />
            </span>
            <span>
              <strong>Phòng chơi qua mạng (2 - 8 người)</strong>
              <small>Tạo phòng hoặc nhập mã, chia sẻ link cho bạn bè cùng chơi.</small>
            </span>
          </button>
          <button
            className="play-mode-option"
            type="button"
            onClick={() => setLocalSetup(true)}
          >
            <span className="mode-icon">
              <Brush />
            </span>
            <span>
              <strong>Chơi trên cùng một máy (2 người)</strong>
              <small>Luân phiên chuyền máy, vẽ và đoán trực tiếp.</small>
            </span>
          </button>
          <div className="room-message">
            <Sparkles /> Bảng vẽ cảm ứng mượt mà, hỗ trợ nhiều màu sắc và cỡ nét.
          </div>
        </section>
      </div>
    </main>
  );
}
