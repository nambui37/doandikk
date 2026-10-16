export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'paused' | 'results';
export type RoomTurnPhase = 'drawing' | 'guessing' | 'reveal';
export type GameMode = 'classic' | 'telephone';

export type RoomAction =
  | 'start'
  | 'guess'
  | 'finish_drawing'
  | 'pause'
  | 'resume'
  | 'restart'
  | 'leave'
  | 'telephone_submit'
  | 'telephone_draft'
  | 'set_game_mode'
  | 'set_telephone_config'
  | 'telephone_change_album';

export type DrawingPoint = { x: number; y: number };
export type DrawingShape =
  | 'free'
  | 'highlighter'
  | 'rect'
  | 'rect_fill'
  | 'circle'
  | 'circle_fill'
  | 'triangle'
  | 'triangle_fill'
  | 'star'
  | 'heart'
  | 'line'
  | 'fill';

export type DrawingStroke = {
  points: DrawingPoint[];
  color?: string;
  size?: number;
  shape?: DrawingShape;
};

export type RoomPlayer = {
  index: number;
  name: string;
  isHost: boolean;
  online: boolean;
  score: number;
  avatarIndex?: number;
};

export type GuessFeedback = {
  guesserName: string;
  drawerName?: string;
  text: string;
  isCorrect: boolean;
  timestamp: number;
};

export type TelephoneStepType = 'prompt' | 'drawing' | 'guess';

export interface TelephoneStep {
  stepIndex: number;
  type: TelephoneStepType;
  authorName: string;
  text?: string;
  strokes?: DrawingStroke[];
  timestamp: number;
}

export interface TelephoneBook {
  bookIndex: number;
  initialAuthorName: string;
  steps: TelephoneStep[];
  draftStrokes?: DrawingStroke[];
  draftText?: string;
}

export interface TelephoneConfig {
  promptSeconds: number;
  drawSeconds: number;
  guessSeconds: number;
}

export interface TelephoneState {
  round: number;
  totalRounds: number;
  phase: 'prompt' | 'drawing' | 'guess' | 'album';
  timeLeftSeconds: number;
  myBookIndex: number;
  hasSubmitted: boolean;
  submittedCount: number;
  totalPlayers: number;
  inputPrompt?: string;
  inputDrawingStrokes?: DrawingStroke[];
  allBooks?: TelephoneBook[];
  albumBookIndex?: number;
  albumStepIndex?: number;
}

export type RoomView = {
  roomCode: string;
  status: RoomStatus;
  gameMode: GameMode;
  telephoneConfig?: TelephoneConfig;
  telephoneState?: TelephoneState;
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
  gameMode?: GameMode;
  avatarIndex?: number;
  customWords?: string[];
};

export type RoomJoinInput = {
  playerName: string;
  avatarIndex?: number;
};

