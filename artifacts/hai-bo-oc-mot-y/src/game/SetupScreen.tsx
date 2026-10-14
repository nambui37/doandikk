import { ArrowRight, Brush, Mic2 } from 'lucide-react';
import { useState } from 'react';
import { categories } from './words';

export type GameConfig = { players: [string, string]; category: string; mode: 'talk' | 'draw' };
type SetupProps = { onStart: (config: GameConfig) => void };

export default function SetupScreen({ onStart }: SetupProps) {
  const [names, setNames] = useState<[string, string]>(['Minh', 'Linh']);
  const [category, setCategory] = useState(categories[0]);
  const [mode, setMode] = useState<'talk' | 'draw'>('talk');
  const canStart = names.every(name => name.trim().length > 0);

  return (
    <main className="screen">
      <div className="setup-layout">
        <section className="fade-in">
          <div className="eyebrow">Trò chơi cho hai người</div>
          <h1 className="hero-title">Hai bộ óc.<span>Một ý.</span></h1>
          <p className="hero-copy">Một người gợi ý. Một người đoán thật nhanh. Bốn lượt, một bàn chơi — xem ai hiểu ý ai hơn.</p>
          <div className="tiny-stats">
            <div><b>02</b>Người chơi</div>
            <div><b>04</b>Lượt đấu</div>
            <div><b>60s</b>Mỗi lượt</div>
          </div>
        </section>
        <form className="setup-panel fade-in delay-2" onSubmit={event => { event.preventDefault(); if (canStart) onStart({ players: [names[0].trim(), names[1].trim()], category, mode }); }}>
          <div className="panel-heading"><h2>Sẵn sàng chưa?</h2><span className="step-tag">01 / 01</span></div>
          <label className="field-label" htmlFor="player-one">Hai người chơi</label>
          <div className="name-grid">
            <input id="player-one" className="name-field" value={names[0]} maxLength={18} onChange={event => setNames([event.target.value, names[1]])} placeholder="Tên người chơi 1" data-testid="input-player-one" />
            <input aria-label="Tên người chơi 2" className="name-field" value={names[1]} maxLength={18} onChange={event => setNames([names[0], event.target.value])} placeholder="Tên người chơi 2" data-testid="input-player-two" />
          </div>
          <label className="field-label">Chọn chủ đề</label>
          <div className="option-row" role="group" aria-label="Chủ đề">
            {categories.map(item => <button type="button" key={item} onClick={() => setCategory(item)} className={`choice ${category === item ? 'active' : ''}`} data-testid={`button-category-${categories.indexOf(item)}`}>{item}</button>)}
          </div>
          <label className="field-label">Gợi ý bằng cách nào?</label>
          <div className="mode-row">
            <button type="button" onClick={() => setMode('talk')} className={`mode-choice ${mode === 'talk' ? 'active' : ''}`} data-testid="button-mode-talk">
              <span className="mode-icon"><Mic2 /></span><span><strong>TALK</strong><small>Nói gợi ý, đoán bằng lời</small></span>
            </button>
            <button type="button" onClick={() => setMode('draw')} className={`mode-choice ${mode === 'draw' ? 'active' : ''}`} data-testid="button-mode-draw">
              <span className="mode-icon"><Brush /></span><span><strong>DRAW</strong><small>Vẽ gợi ý, đoán bằng lời</small></span>
            </button>
          </div>
          <button type="submit" className="primary-btn full-btn" disabled={!canStart} data-testid="button-start-game">Bắt đầu cuộc vui <ArrowRight /></button>
        </form>
      </div>
    </main>
  );
}
