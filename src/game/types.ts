export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'paused' | 'results';
export type RoomMode = 'talk' | 'draw';
export type RoomAction = 'start' | 'correct' | 'pass' | 'pause' | 'resume' | 'restart';

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
};

export type RoomView = {
  roomCode: string;
  status: RoomStatus;
  players: RoomPlayer[];
  category: string;
  mode: RoomMode;
  turnIndex: number;
  timeLeftSeconds: number;
  scores: [number, number];
  correctThisTurn: number;
  currentPrompt: string | null;
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
  mode: RoomMode;
};

export type RoomJoinInput = {
  playerName: string;
};
