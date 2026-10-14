import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RoomSession } from '@workspace/api-client-react';
import GameScene from '@/game/GameScene';
import StartScreen from '@/game/StartScreen';
import OnlineSetup from '@/game/OnlineSetup';
import OnlineRoom from '@/game/OnlineRoom';
import type { GameConfig } from '@/game/SetupScreen';
import HandoffScreen from '@/game/HandoffScreen';
import PlayScreen from '@/game/PlayScreen';
import ResultsScreen from '@/game/ResultsScreen';
import { wordBank } from '@/game/words';

type Screen = 'setup' | 'reveal' | 'handoff' | 'playing' | 'cardReveal' | 'cardHandoff' | 'turnDone' | 'results';

function shuffled<T,>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [onlineSetup, setOnlineSetup] = useState(false);
  const [onlineSession, setOnlineSession] = useState<RoomSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('hai-bo-oc-mot-y-room');
      return saved ? JSON.parse(saved) as RoomSession : null;
    } catch {
      return null;
    }
  });
  const [turn, setTurn] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [correctCount, setCorrectCount] = useState<[number, number]>([0, 0]);
  const [deck, setDeck] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const turnIsActive = screen === 'playing' || screen === 'cardReveal' || screen === 'cardHandoff';

  const currentWord = useMemo(() => deck.length ? deck[wordIndex % deck.length] : '', [deck, wordIndex]);
  const begin = useCallback((nextConfig: GameConfig) => {
    setConfig(nextConfig);
    setDeck(shuffled(wordBank[nextConfig.category] ?? wordBank['Đời thường']));
    setScores([0, 0]);
    setCorrectCount([0, 0]);
    setTurn(0);
    setWordIndex(0);
    setSeconds(60);
    setPaused(false);
    setScreen('reveal');
  }, []);

  useEffect(() => {
    if (!turnIsActive || paused) return;
    const interval = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [turnIsActive, paused]);

  useEffect(() => {
    if (turnIsActive && seconds === 0) setScreen('turnDone');
  }, [turnIsActive, seconds]);

  const scoreCorrect = useCallback(() => {
    const guesserIndex = 1 - (turn % 2);
    const earned = 100 + seconds * 20;
    setScores(previous => {
      const next: [number, number] = [...previous];
      next[guesserIndex] += earned;
      return next;
    });
    setCorrectCount(previous => {
      const next: [number, number] = [...previous];
      next[guesserIndex] += 1;
      return next;
    });
    setWordIndex(index => index + 1);
  }, [seconds, turn]);

  const prepareNextCard = useCallback(() => {
    setWordIndex(index => index + 1);
    setScreen('cardReveal');
  }, []);

  const advance = useCallback(() => {
    if (turn >= 3) {
      setScreen('results');
      return;
    }
    setTurn(value => value + 1);
    setSeconds(60);
    setScreen('reveal');
  }, [turn]);

  const resetToSetup = useCallback(() => {
    setPaused(false);
    setScreen('setup');
    setConfig(null);
  }, []);
  const enterOnlineRoom = useCallback((session: RoomSession) => {
    sessionStorage.setItem('hai-bo-oc-mot-y-room', JSON.stringify(session));
    setOnlineSession(session);
    setOnlineSetup(false);
  }, []);
  const exitOnlineRoom = useCallback(() => {
    sessionStorage.removeItem('hai-bo-oc-mot-y-room');
    setOnlineSession(null);
    setOnlineSetup(false);
    resetToSetup();
  }, [resetToSetup]);

  return (
    <div className="game-shell">
      <GameScene />
      <div className="app-ui">
        <header className="topbar">
          <div className="brand"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 7h10M7 12h6M7 17h10" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/><circle cx="17.5" cy="12" r="1.5" fill="currentColor"/></svg></span> Hai Bộ Óc Một Ý</div>
          <div className="top-note">Hai người · Cùng một ý · Một cuộc vui</div>
        </header>
        {onlineSession ? <OnlineRoom session={onlineSession} onExit={exitOnlineRoom} /> :
          onlineSetup ? <OnlineSetup onSession={enterOnlineRoom} onBack={() => setOnlineSetup(false)} /> :
          !config || screen === 'setup' ? <StartScreen onStart={begin} onOnline={() => setOnlineSetup(true)} /> :
          (screen === 'reveal' || screen === 'cardReveal') ? <HandoffScreen config={config} giverIndex={turn % 2} word={currentWord} seconds={seconds} reveal continueTurn={screen === 'cardReveal'} onReady={() => setScreen(screen === 'reveal' ? 'handoff' : 'cardHandoff')} /> :
          (screen === 'handoff' || screen === 'cardHandoff') ? <HandoffScreen config={config} giverIndex={turn % 2} word={currentWord} seconds={seconds} reveal={false} continueTurn={screen === 'cardHandoff'} onReady={() => { if (screen === 'handoff') setSeconds(60); setScreen('playing'); }} /> :
          screen === 'playing' && <PlayScreen config={config} turn={turn} seconds={seconds} word={currentWord} scores={scores} correctCount={correctCount} paused={paused} onCorrect={() => { scoreCorrect(); setScreen('cardReveal'); }} onPass={prepareNextCard} onPause={() => setPaused(true)} onResume={() => setPaused(false)} onRestart={() => begin(config)} />}
        {!onlineSession && screen === 'turnDone' && config && <main className="screen"><section className="handoff fade-in" data-testid="status-turn-complete">
          <div className="handoff-icon"><span style={{ fontSize: 31, fontWeight: 900 }}>60</span></div>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Kết thúc lượt {turn + 1} / 4</div>
          <h1 style={{ marginTop: 16 }}>Hết giờ rồi!</h1>
          <p>Điểm vẫn được giữ nguyên. Chuyền máy để người tiếp theo ra gợi ý.</p>
          <div className="result-scores">
            {config.players.map((player, index) => <div className="result-score" key={player}><small>{player}</small><strong>{scores[index]}</strong></div>)}
          </div>
          <button className="primary-btn" onClick={advance} data-testid="button-next-turn">{turn === 3 ? 'Xem kết quả' : 'Sang lượt tiếp theo'} <span aria-hidden="true">→</span></button>
        </section></main>}
        {!onlineSession && screen === 'results' && config && <ResultsScreen config={config} scores={scores} onSetup={resetToSetup} onAgain={() => begin(config)} />}
        {!onlineSetup && !onlineSession && screen === 'setup' && <div className="scene-label">Thử xem hai bạn hiểu ý nhau đến đâu</div>}
      </div>
    </div>
  );
}

export default App;
