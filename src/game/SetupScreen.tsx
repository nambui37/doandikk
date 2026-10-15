import { ArrowRight, Brush } from 'lucide-react';
import { useState } from 'react';
import { categories } from './words';

export type GameConfig = { players: [string, string]; category: string };
type SetupProps = { onStart: (config: GameConfig) => void };

export default function SetupScreen({ onStart }: SetupProps) {
  const [names, setNames] = useState<[string, string]>(['Hải', 'Linh']);
  const [category, setCategory] = useState(categories[0] || 'Đời thường');
  const canStart = names.every((name) => name.trim().length > 0);

  return (
    <main className="screen">
      <div className="setup-layout">
        <section className="fade-in">
          <div className="eyebrow">Chơi chung một máy</div>
          <h1 className="hero-title">
            Hai bộ óc.<span>Một ý.</span>
          </h1>
          <p className="hero-copy">
            Một người vẽ hình gợi ý trên màn hình. Người kia đoán thật nhanh trong 60 giây.
          </p>
          <div className="tiny-stats">
            <div>
              <b>02</b>Người chơi
            </div>
            <div>
              <b>04</b>Lượt đấu
            </div>
            <div>
              <b>60s</b>Mỗi lượt
            </div>
          </div>
        </section>

        <form
          className="setup-panel fade-in delay-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (canStart)
              onStart({
                players: [names[0].trim(), names[1].trim()],
                category,
              });
          }}
        >
          <div className="panel-heading">
            <h2>Sẵn sàng chưa?</h2>
            <span className="step-tag"><Brush size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> Vẽ tranh</span>
          </div>

          <label className="field-label" htmlFor="player-one">
            Tên hai người chơi
          </label>
          <div className="name-grid">
            <input
              id="player-one"
              className="name-field"
              value={names[0]}
              maxLength={18}
              onChange={(event) => setNames([event.target.value, names[1]])}
              placeholder="Tên người chơi 1"
            />
            <input
              aria-label="Tên người chơi 2"
              className="name-field"
              value={names[1]}
              maxLength={18}
              onChange={(event) => setNames([names[0], event.target.value])}
              placeholder="Tên người chơi 2"
            />
          </div>

          <label className="field-label">Chọn chủ đề</label>
          <div className="option-row" role="group" aria-label="Chủ đề">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                className={`choice ${category === item ? 'active' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="primary-btn full-btn"
            disabled={!canStart}
            style={{ marginTop: 12 }}
          >
            Bắt đầu cuộc vui <ArrowRight />
          </button>
        </form>
      </div>
    </main>
  );
}
