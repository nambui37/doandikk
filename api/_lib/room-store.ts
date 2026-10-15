import { randomBytes } from 'node:crypto';
import { wordBank } from './word-bank';

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'paused' | 'results';
export type RoomAction = 'start' | 'correct' | 'pass' | 'pause' | 'resume' | 'restart';

export type DrawingPoint = { x: number; y: number };
export type DrawingStroke = {
  points: DrawingPoint[];
  color?: string;
  size?: number;
};

type RoomPlayerRecord = {
  name: string;
  token: string;
  lastSeenAt: number;
};

type GameRoom = {
  code: string;
  players: RoomPlayerRecord[];
  category: string;
  status: RoomStatus;
  turnIndex: number;
  totalTurns: number;
  turnEndsAt: number | null;
  pausedRemainingMs: number | null;
  scores: number[]; // Điểm số của từng người chơi [player0, player1, player2, ...]
  correctThisTurn: number;
  wordIndex: number;
  words: string[];
  drawingRevision: number;
  drawingStrokes: DrawingStroke[];
  lastActivityAt: number;
};

export type RoomView = {
  roomCode: string;
  status: RoomStatus;
  players: Array<{
    index: number;
    name: string;
    isHost: boolean;
    online: boolean;
    score: number;
  }>;
  category: string;
  turnIndex: number;
  totalTurns: number;
  drawerIndex: number; // Người đang vẽ ở lượt này
  timeLeftSeconds: number;
  scores: number[];
  correctThisTurn: number;
  currentPrompt: string | null;
  drawingRevision: number;
  drawingStrokes: DrawingStroke[];
};

export class RoomStoreError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'RoomStoreError';
  }
}

const TURN_LENGTH_MS = 60_000;
const ROOM_TTL_MS = 8 * 60 * 60 * 1000;
const ONLINE_WINDOW_MS = 30_000;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_PLAYERS_PER_ROOM = 8;

const globalStore = globalThis as unknown as { __HBOMY_ROOMS__?: Map<string, GameRoom> };
if (!globalStore.__HBOMY_ROOMS__) {
  globalStore.__HBOMY_ROOMS__ = new Map<string, GameRoom>();
}
const rooms = globalStore.__HBOMY_ROOMS__;

function shuffled<T>(items: T[] | undefined): T[] {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : Object.values(wordBank)[0] || [];
  const result = [...safeItems];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomBytes(4).readUInt32BE(0) % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createRoomCode(): string {
  let code = '';
  const random = randomBytes(6);
  for (const value of random) {
    code += ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

function createPlayerToken(): string {
  return randomBytes(32).toString('base64url');
}

function clearDrawing(room: GameRoom): void {
  room.drawingStrokes = [];
  room.drawingRevision += 1;
}

function expireInactiveRooms(now: number): void {
  for (const [code, room] of rooms) {
    if (now - room.lastActivityAt > ROOM_TTL_MS) rooms.delete(code);
  }
}

export function findRoom(code: string): GameRoom {
  expireInactiveRooms(Date.now());
  const cleanCode = code.trim().toUpperCase();
  const room = rooms.get(cleanCode);
  if (!room) throw new RoomStoreError(404, 'Không tìm thấy phòng này.');
  return room;
}

function playerIndexForToken(room: GameRoom, token: string | undefined): number {
  if (!token) throw new RoomStoreError(401, 'Phiên chơi không hợp lệ.');
  const index = room.players.findIndex((player) => player.token === token);
  if (index < 0) throw new RoomStoreError(401, 'Phiên chơi không hợp lệ.');
  return index;
}

function remainingMilliseconds(room: GameRoom, now: number): number {
  if (room.status === 'paused') {
    return Math.max(0, room.pausedRemainingMs ?? TURN_LENGTH_MS);
  }
  if (room.status !== 'playing' || room.turnEndsAt === null) {
    return TURN_LENGTH_MS;
  }
  return Math.max(0, room.turnEndsAt - now);
}

function finishExpiredTurns(room: GameRoom, now: number): void {
  while (
    room.status === 'playing' &&
    room.turnEndsAt !== null &&
    room.turnEndsAt <= now
  ) {
    room.wordIndex += 1;
    room.correctThisTurn = 0;
    clearDrawing(room);

    // Kiểm tra đã hết số lượt của ván chưa
    if (room.turnIndex >= room.totalTurns - 1) {
      room.status = 'results';
      room.turnEndsAt = null;
      return;
    }

    room.turnIndex += 1;
    room.turnEndsAt += TURN_LENGTH_MS;
  }
}

export function roomView(room: GameRoom, playerIndex: number, now: number): RoomView {
  const currentDrawerIndex = room.players.length > 0 ? room.turnIndex % room.players.length : 0;
  const isDrawer = currentDrawerIndex === playerIndex;
  const canSeePrompt = isDrawer && (room.status === 'playing' || room.status === 'paused');

  return {
    roomCode: room.code,
    status: room.status,
    players: room.players.map((player, index) => ({
      index,
      name: player.name,
      isHost: index === 0,
      online: now - player.lastSeenAt <= ONLINE_WINDOW_MS,
      score: room.scores[index] || 0,
    })),
    category: room.category,
    turnIndex: room.turnIndex,
    totalTurns: room.totalTurns,
    drawerIndex: currentDrawerIndex,
    timeLeftSeconds: Math.min(
      60,
      Math.ceil(remainingMilliseconds(room, now) / 1000),
    ),
    scores: [...room.scores],
    correctThisTurn: room.correctThisTurn,
    currentPrompt: canSeePrompt
      ? (room.words[room.wordIndex % room.words.length] ?? null)
      : null,
    drawingRevision: room.drawingRevision,
    drawingStrokes: room.drawingStrokes.map((stroke) => ({
      points: stroke.points.map((point) => ({ ...point })),
      color: stroke.color,
      size: stroke.size,
    })),
  };
}

function touchPlayer(room: GameRoom, playerIndex: number, now: number): void {
  const player = room.players[playerIndex];
  if (player) player.lastSeenAt = now;
  room.lastActivityAt = now;
}

export function createRoom(input: {
  playerName: string;
  category: string;
}) {
  const now = Date.now();
  expireInactiveRooms(now);

  let code = createRoomCode();
  while (rooms.has(code)) code = createRoomCode();

  const token = createPlayerToken();
  const room: GameRoom = {
    code,
    players: [{ name: input.playerName, token, lastSeenAt: now }],
    category: (input.category && wordBank[input.category]) ? input.category : Object.keys(wordBank)[0],
    status: 'waiting',
    turnIndex: 0,
    totalTurns: 4, // Mặc định, sẽ cập nhật khi bấm bắt đầu theo số lượng người
    turnEndsAt: null,
    pausedRemainingMs: null,
    scores: [0],
    correctThisTurn: 0,
    wordIndex: 0,
    words: shuffled((input.category && wordBank[input.category]) ? wordBank[input.category] : Object.values(wordBank)[0]),
    drawingRevision: 0,
    drawingStrokes: [],
    lastActivityAt: now,
  };
  rooms.set(code, room);

  return {
    roomCode: code,
    playerToken: token,
    playerIndex: 0,
    view: roomView(room, 0, now),
  };
}

export function joinRoom(code: string, playerName: string) {
  const room = findRoom(code);
  const now = Date.now();

  // Kiểm tra nếu là người cũ kết nối lại theo tên
  const existingIndex = room.players.findIndex(
    (p) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase(),
  );

  if (existingIndex >= 0) {
    const existingPlayer = room.players[existingIndex];
    existingPlayer.lastSeenAt = now;
    return {
      roomCode: room.code,
      playerToken: existingPlayer.token,
      playerIndex: existingIndex,
      view: roomView(room, existingIndex, now),
    };
  }

  // Nếu phòng đang chơi dở hoặc đã đủ số lượng tối đa
  if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
    throw new RoomStoreError(409, `Phòng đã đầy (tối đa ${MAX_PLAYERS_PER_ROOM} người).`);
  }

  if (room.status !== 'waiting' && room.status !== 'ready') {
    throw new RoomStoreError(409, 'Ván chơi đang diễn ra. Hãy đợi ván sau nhé.');
  }

  const token = createPlayerToken();
  const newIndex = room.players.length;
  room.players.push({ name: playerName, token, lastSeenAt: now });
  room.scores.push(0);
  room.status = 'ready';
  room.lastActivityAt = now;

  return {
    roomCode: room.code,
    playerToken: token,
    playerIndex: newIndex,
    view: roomView(room, newIndex, now),
  };
}

export function getRoomViewForToken(code: string, token: string | undefined) {
  const room = findRoom(code);
  const playerIndex = playerIndexForToken(room, token);
  const now = Date.now();
  finishExpiredTurns(room, now);
  touchPlayer(room, playerIndex, now);
  return roomView(room, playerIndex, now);
}

export function performRoomAction(
  code: string,
  token: string | undefined,
  action: RoomAction,
  targetGuesserIndex?: number,
): RoomView {
  const room = findRoom(code);
  const playerIndex = playerIndexForToken(room, token);
  const now = Date.now();
  finishExpiredTurns(room, now);
  touchPlayer(room, playerIndex, now);

  if (action === 'start') {
    if (playerIndex !== 0) {
      throw new RoomStoreError(403, 'Chỉ chủ phòng mới có thể bắt đầu ván đấu.');
    }
    if (room.players.length < 2) {
      throw new RoomStoreError(400, 'Cần ít nhất 2 người trong phòng để bắt đầu.');
    }
    room.status = 'playing';
    room.turnIndex = 0;
    // Mỗi người chơi được vẽ 2 lượt
    room.totalTurns = room.players.length * 2;
    room.turnEndsAt = now + TURN_LENGTH_MS;
    room.pausedRemainingMs = null;
    room.scores = room.players.map(() => 0);
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (action === 'restart') {
    if (playerIndex !== 0) {
      throw new RoomStoreError(403, 'Chỉ chủ phòng mới có thể bắt đầu lại.');
    }
    room.status = 'ready';
    room.turnIndex = 0;
    room.turnEndsAt = null;
    room.pausedRemainingMs = null;
    room.scores = room.players.map(() => 0);
    room.correctThisTurn = 0;
    room.wordIndex = 0;
    room.words = shuffled(wordBank[room.category] ?? wordBank['Đời thường']);
    clearDrawing(room);
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (action === 'pause') {
    if (room.status !== 'playing') return roomView(room, playerIndex, now);
    room.pausedRemainingMs = remainingMilliseconds(room, now);
    room.turnEndsAt = null;
    room.status = 'paused';
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (action === 'resume') {
    if (room.status !== 'paused') return roomView(room, playerIndex, now);
    room.status = 'playing';
    room.turnEndsAt = now + (room.pausedRemainingMs ?? TURN_LENGTH_MS);
    room.pausedRemainingMs = null;
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (room.status !== 'playing') {
    return roomView(room, playerIndex, now);
  }

  const currentDrawerIndex = room.turnIndex % room.players.length;

  // Chỉ người đang vẽ mới có thể xác nhận đoán đúng hoặc bỏ qua
  if (currentDrawerIndex !== playerIndex) {
    throw new RoomStoreError(403, 'Chỉ người đang vẽ mới có thể xác nhận đáp án.');
  }

  if (action === 'correct') {
    const secondsLeft = Math.floor(remainingMilliseconds(room, now) / 1000);
    const guesserPoints = 100 + secondsLeft * 20;

    // Xác định người đoán đúng:
    // Nếu có chỉ định targetGuesserIndex hợp lệ thì cộng điểm cho người đó,
    // nếu phòng 2 người thì tự động cộng cho người còn lại.
    let awardedGuesser = targetGuesserIndex;
    if (awardedGuesser === undefined || awardedGuesser === currentDrawerIndex || !room.players[awardedGuesser]) {
      // Mặc định chọn guesser đầu tiên khác người vẽ
      awardedGuesser = room.players.findIndex((_, idx) => idx !== currentDrawerIndex);
    }

    if (awardedGuesser >= 0 && room.scores[awardedGuesser] !== undefined) {
      room.scores[awardedGuesser] += guesserPoints;
    }

    // Người vẽ gợi ý xuất sắc cũng được thưởng 50 điểm
    if (room.scores[currentDrawerIndex] !== undefined) {
      room.scores[currentDrawerIndex] += 50;
    }

    room.correctThisTurn += 1;
  }

  room.wordIndex += 1;
  clearDrawing(room);
  room.lastActivityAt = now;
  return roomView(room, playerIndex, now);
}

export function updateRoomDrawing(
  code: string,
  token: string | undefined,
  input: { revision: number; strokes: DrawingStroke[] },
): RoomView {
  const room = findRoom(code);
  const playerIndex = playerIndexForToken(room, token);
  const now = Date.now();
  finishExpiredTurns(room, now);
  touchPlayer(room, playerIndex, now);

  const currentDrawerIndex = room.players.length > 0 ? room.turnIndex % room.players.length : 0;

  // Nếu không phải người đang vẽ, im lặng bỏ qua (chống lỗi 403 khi hết giờ)
  if (room.status !== 'playing' || currentDrawerIndex !== playerIndex) {
    return roomView(room, playerIndex, now);
  }

  if (input.revision >= room.drawingRevision) {
    room.drawingRevision = input.revision;
    room.drawingStrokes = input.strokes.map((stroke) => ({
      points: stroke.points.map((point) => ({ ...point })),
      color: stroke.color,
      size: stroke.size,
    }));
  }

  return roomView(room, playerIndex, now);
}
