export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'paused' | 'results';
export type RoomTurnPhase = 'drawing' | 'guessing' | 'reveal';
export type RoomAction = 'start' | 'guess' | 'finish_drawing' | 'pause' | 'resume' | 'restart';

export type DrawingPoint = { x: number; y: number };
export type DrawingStroke = {
  points: DrawingPoint[];
  color?: string;
  size?: number;
};

export type RoomPlayer = {
  index: number;
  name: string;
  isHost: boolean;
  online: boolean;
  score: number;
};

export type GuessFeedback = {
  guesserName: string;
  text: string;
  isCorrect: boolean;
  timestamp: number;
};

export type RoomView = {
  roomCode: string;
  status: RoomStatus;
  currentPhase: RoomTurnPhase;
  phaseTimeLeftSeconds: number;
  players: RoomPlayer[];
  category: string;
  targetScore: number;
  turnIndex: number;
  drawerIndex: number;
  scores: number[];
  currentPrompt: string | null;
  lastRevealedWord: string | null;
  lastGuessFeedback: GuessFeedback | null;
  winnerIndex: number | null;
  drawingRevision: number;
  drawingStrokes: DrawingStroke[];
};

export type RoomSession = {
  roomCode: string;
  playerToken: string;
  playerIndex: number;
  view: RoomView;
};

export type RoomCreateInput = {
  playerName: string;
  category: string;
  targetScore?: number;
};

export type RoomJoinInput = {
  playerName: string;
};
