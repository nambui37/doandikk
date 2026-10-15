import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RoomSession } from './game/types';
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

function shuffled<T>(items: T[]): T[] {
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
      return saved ? (JSON.parse(saved) as RoomSession) : null;
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

  // Tự động mở màn hình Online nếu có ?room=... trong link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room') && !onlineSession) {
      setOnlineSetup(true);
    }
  }, [onlineSession]);

  const currentWord = useMemo(
    () => (deck.length ? deck[wordIndex % deck.length] : ''),
    [deck, wordIndex],
  );

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
    const interval = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [turnIsActive, paused]);

  useEffect(() => {
    if (turnIsActive && seconds === 0) setScreen('turnDone');
  }, [turnIsActive, seconds]);

  const scoreCorrect = useCallback(() => {
    const guesserIndex = 1 - (turn % 2);
    const earned = 100 + seconds * 20;
    setScores((previous) => {
      const next: [number, number] = [...previous];
      next[guesserIndex] += earned;
      return next;
    });
    setCorrectCount((previous) => {
      const next: [number, number] = [...previous];
      next[guesserIndex] += 1;
      return next;
    });
    setWordIndex((index) => index + 1);
  }, [seconds, turn]);

  const prepareNextCard = useCallback(() => {
    setWordIndex((index) => index + 1);
    setScreen('cardReveal');
  }, []);

  const advance = useCallback(() => {
    if (turn >= 3) {
      setScreen('results');
      return;
    }
    setTurn((value) => value + 1);
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

  if (onlineSession) {
    return <OnlineRoom session={onlineSession} onExit={exitOnlineRoom} />;
  }

  // Mặc định khi mới vào web: Luôn hiển thị giao diện Gartic Phone chính thức!
  return (
    <OnlineSetup
      onSession={enterOnlineRoom}
      onBack={() => {}}
    />
  );
}

export default App;

