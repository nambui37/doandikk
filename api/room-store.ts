import { randomBytes } from 'node:crypto';
import { wordBank } from '../src/game/words';

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'paused' | 'results';
export type RoomMode = 'talk' | 'draw';
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
  mode: RoomMode;
  status: RoomStatus;
  turnIndex: number;
  turnEndsAt: number | null;
  pausedRemainingMs: number | null;
  scores: [number, number];
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
  }>;
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
const ROOM_TTL_MS = 8 * 60 * 60 * 1000; // 8 tiếng
const ONLINE_WINDOW_MS = 25_000;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Lưu trữ toàn cục đảm bảo không bị xoá khi Vercel hot-reload
const globalStore = globalThis as unknown as { __HBOMY_ROOMS__?: Map<string, GameRoom> };
if (!globalStore.__HBOMY_ROOMS__) {
  globalStore.__HBOMY_ROOMS__ = new Map<string, GameRoom>();
}
const rooms = globalStore.__HBOMY_ROOMS__;

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
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

    if (room.turnIndex >= 3) {
      room.status = 'results';
      room.turnEndsAt = null;
      return;
    }

    room.turnIndex += 1;
    room.turnEndsAt += TURN_LENGTH_MS;
  }
}

export function roomView(room: GameRoom, playerIndex: number, now: number): RoomView {
  const isClueGiver = room.turnIndex % 2 === playerIndex;
  const canSeePrompt =
    isClueGiver && (room.status === 'playing' || room.status === 'paused');

  return {
    roomCode: room.code,
    status: room.status,
    players: room.players.map((player, index) => ({
      index,
      name: player.name,
      isHost: index === 0,
      online: now - player.lastSeenAt <= ONLINE_WINDOW_MS,
    })),
    category: room.category,
    mode: room.mode,
    turnIndex: room.turnIndex,
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
  mode: RoomMode;
}) {
  const now = Date.now();
  expireInactiveRooms(now);

  let code = createRoomCode();
  while (rooms.has(code)) code = createRoomCode();

  const token = createPlayerToken();
  const room: GameRoom = {
    code,
    players: [{ name: input.playerName, token, lastSeenAt: now }],
    category: input.category,
    mode: input.mode,
    status: 'waiting',
    turnIndex: 0,
    turnEndsAt: null,
    pausedRemainingMs: null,
    scores: [0, 0],
    correctThisTurn: 0,
    wordIndex: 0,
    words: shuffled(wordBank[input.category] ?? wordBank['Đời thường']),
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

  // Kiểm tra xem người này có phải player cũ kết nối lại không
  const existingPlayer = room.players.find(p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase());
  if (existingPlayer) {
    existingPlayer.lastSeenAt = now;
    const pIdx = room.players.indexOf(existingPlayer);
    return {
      roomCode: room.code,
      playerToken: existingPlayer.token,
      playerIndex: pIdx,
      view: roomView(room, pIdx, now),
    };
  }

  if (room.players.length >= 2 || (room.status !== 'waiting' && room.status !== 'ready')) {
    throw new RoomStoreError(409, 'Phòng đã đủ 2 người hoặc ván chơi đang diễn ra.');
  }

  const token = createPlayerToken();
  room.players.push({ name: playerName, token, lastSeenAt: now });
  room.status = 'ready';
  room.lastActivityAt = now;

  return {
    roomCode: room.code,
    playerToken: token,
    playerIndex: 1,
    view: roomView(room, 1, now),
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
): RoomView {
  const room = findRoom(code);
  const playerIndex = playerIndexForToken(room, token);
  const now = Date.now();
  finishExpiredTurns(room, now);
  touchPlayer(room, playerIndex, now);

  if (action === 'start') {
    if (playerIndex !== 0) {
      throw new RoomStoreError(403, 'Chỉ chủ phòng mới có quyền bắt đầu ván.');
    }
    if (room.players.length !== 2) {
      throw new RoomStoreError(400, 'Cần đủ hai người trong phòng để bắt đầu.');
    }
    room.status = 'playing';
    room.turnIndex = 0;
    room.turnEndsAt = now + TURN_LENGTH_MS;
    room.pausedRemainingMs = null;
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
    room.scores = [0, 0];
    room.correctThisTurn = 0;
    room.wordIndex = 0;
    room.words = shuffled(wordBank[room.category] ?? wordBank['Đời thường']);
    clearDrawing(room);
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (action === 'pause') {
    if (room.status !== 'playing') {
      return roomView(room, playerIndex, now);
    }
    room.pausedRemainingMs = remainingMilliseconds(room, now);
    room.turnEndsAt = null;
    room.status = 'paused';
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (action === 'resume') {
    if (room.status !== 'paused') {
      return roomView(room, playerIndex, now);
    }
    room.status = 'playing';
    room.turnEndsAt = now + (room.pausedRemainingMs ?? TURN_LENGTH_MS);
    room.pausedRemainingMs = null;
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  // Đang không chơi
  if (room.status !== 'playing') {
    return roomView(room, playerIndex, now);
  }

  // Người ra gợi ý xác nhận đoán đúng hoặc bỏ qua
  if (room.turnIndex % 2 !== playerIndex) {
    throw new RoomStoreError(403, 'Chỉ người ra gợi ý mới có thể xác nhận đáp án.');
  }

  if (action === 'correct') {
    const guesserIndex = 1 - playerIndex;
    const secondsLeft = Math.floor(remainingMilliseconds(room, now) / 1000);
    room.scores[guesserIndex] += 100 + secondsLeft * 20;
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

  // FIX LỖI 403: Nếu không trong lượt vẽ hoặc không phải người vẽ, im lặng bỏ qua không quăng lỗi 403
  if (room.status !== 'playing' || room.mode !== 'draw' || room.turnIndex % 2 !== playerIndex) {
    return roomView(room, playerIndex, now);
  }

  if (input.revision >= room.drawingRevision) {
    room.drawingRevision = input.revision;
    // Không giới hạn số nét hay số điểm
    room.drawingStrokes = input.strokes.map((stroke) => ({
      points: stroke.points.map((point) => ({ ...point })),
      color: stroke.color,
      size: stroke.size,
    }));
  }

  return roomView(room, playerIndex, now);
}
