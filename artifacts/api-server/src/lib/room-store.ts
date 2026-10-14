import { randomBytes } from "node:crypto";

type RoomStatus = "waiting" | "ready" | "playing" | "paused" | "results";
type RoomMode = "talk" | "draw";
type RoomAction =
  | "start"
  | "correct"
  | "pass"
  | "pause"
  | "resume"
  | "restart";

type DrawingPoint = { x: number; y: number };
type DrawingStroke = { points: DrawingPoint[] };
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
    this.name = "RoomStoreError";
  }
}

const TURN_LENGTH_MS = 60_000;
const ROOM_TTL_MS = 4 * 60 * 60 * 1000;
const ONLINE_WINDOW_MS = 15_000;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const wordBank: Record<string, string[]> = {
  "Đời thường": [
    "Bàn chải đánh răng",
    "Mất chìa khóa",
    "Máy giặt",
    "Đi chợ",
    "Ngủ nướng",
    "Bánh mì",
    "Thang máy",
    "Điện thoại hết pin",
    "Áo mưa",
    "Nồi cơm điện",
    "Hắt xì",
    "Kẹt xe",
    "Đồng hồ báo thức",
    "Dép lê",
    "Đèn giao thông",
    "Tủ lạnh",
  ],
  "Phim & hoạt hình": [
    "Người Nhện",
    "Nàng tiên cá",
    "Vua Sư Tử",
    "Harry Potter",
    "Doraemon",
    "Khủng long",
    "Siêu nhân",
    "Công chúa tóc mây",
    "Batman",
    "Minions",
    "Thám tử",
    "Phi hành gia",
    "Ma cà rồng",
    "Rồng lửa",
  ],
  "Ăn uống": [
    "Phở bò",
    "Trà sữa",
    "Bánh xèo",
    "Kem ốc quế",
    "Gỏi cuốn",
    "Sushi",
    "Nước dừa",
    "Bắp rang bơ",
    "Mì cay",
    "Bánh chưng",
    "Cà phê sữa đá",
    "Chân gà sả tắc",
    "Pizza",
    "Chè đậu xanh",
  ],
  "Hành động": [
    "Trượt vỏ chuối",
    "Nhảy dây",
    "Bơi ngửa",
    "Chụp ảnh tự sướng",
    "Đánh răng",
    "Thổi nến",
    "Đào khoai",
    "Chạy marathon",
    "Đạp xe",
    "Tập yoga",
    "Câu cá",
    "Gói quà",
    "Chơi đàn",
    "Ngáp ngủ",
  ],
};

const rooms = new Map<string, GameRoom>();

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomBytes(4).readUInt32BE(0) % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createRoomCode(): string {
  let code = "";
  const random = randomBytes(6);
  for (const value of random) {
    code += ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

function createPlayerToken(): string {
  return randomBytes(32).toString("base64url");
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

function findRoom(code: string): GameRoom {
  expireInactiveRooms(Date.now());
  const room = rooms.get(code);
  if (!room) throw new RoomStoreError(404, "Không tìm thấy phòng này.");
  return room;
}

function playerIndexForToken(room: GameRoom, token: string | undefined): number {
  if (!token) throw new RoomStoreError(401, "Phiên chơi không hợp lệ.");
  const index = room.players.findIndex((player) => player.token === token);
  if (index < 0) throw new RoomStoreError(401, "Phiên chơi không hợp lệ.");
  return index;
}

function remainingMilliseconds(room: GameRoom, now: number): number {
  if (room.status === "paused") {
    return Math.max(0, room.pausedRemainingMs ?? TURN_LENGTH_MS);
  }
  if (room.status !== "playing" || room.turnEndsAt === null) {
    return TURN_LENGTH_MS;
  }
  return Math.max(0, room.turnEndsAt - now);
}

function finishExpiredTurns(room: GameRoom, now: number): void {
  while (
    room.status === "playing" &&
    room.turnEndsAt !== null &&
    room.turnEndsAt <= now
  ) {
    room.wordIndex += 1;
    room.correctThisTurn = 0;
    clearDrawing(room);

    if (room.turnIndex >= 3) {
      room.status = "results";
      room.turnEndsAt = null;
      return;
    }

    room.turnIndex += 1;
    room.turnEndsAt += TURN_LENGTH_MS;
  }
}

function roomView(room: GameRoom, playerIndex: number, now: number): RoomView {
  const isClueGiver = room.turnIndex % 2 === playerIndex;
  const canSeePrompt =
    isClueGiver && (room.status === "playing" || room.status === "paused");

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
    status: "waiting",
    turnIndex: 0,
    turnEndsAt: null,
    pausedRemainingMs: null,
    scores: [0, 0],
    correctThisTurn: 0,
    wordIndex: 0,
    words: shuffled(wordBank[input.category] ?? wordBank["Đời thường"]),
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
  if (room.players.length >= 2 || room.status !== "waiting") {
    throw new RoomStoreError(409, "Phòng đã đủ người hoặc ván chơi đã bắt đầu.");
  }

  const now = Date.now();
  const token = createPlayerToken();
  room.players.push({ name: playerName, token, lastSeenAt: now });
  room.status = "ready";
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

  if (action === "start") {
    if (playerIndex !== 0) {
      throw new RoomStoreError(403, "Chỉ chủ phòng mới có thể bắt đầu ván chơi.");
    }
    if (room.status !== "ready" || room.players.length !== 2) {
      throw new RoomStoreError(400, "Cần đủ hai người trước khi bắt đầu.");
    }
    room.status = "playing";
    room.turnIndex = 0;
    room.turnEndsAt = now + TURN_LENGTH_MS;
    room.pausedRemainingMs = null;
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (action === "restart") {
    if (playerIndex !== 0) {
      throw new RoomStoreError(403, "Chỉ chủ phòng mới có thể bắt đầu ván mới.");
    }
    if (room.players.length !== 2) {
      throw new RoomStoreError(400, "Cần đủ hai người trong phòng để chơi lại.");
    }
    room.status = "ready";
    room.turnIndex = 0;
    room.turnEndsAt = null;
    room.pausedRemainingMs = null;
    room.scores = [0, 0];
    room.correctThisTurn = 0;
    room.wordIndex = 0;
    room.words = shuffled(wordBank[room.category] ?? wordBank["Đời thường"]);
    clearDrawing(room);
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (action === "pause") {
    if (room.status !== "playing") {
      throw new RoomStoreError(400, "Ván chơi hiện không thể tạm dừng.");
    }
    room.pausedRemainingMs = remainingMilliseconds(room, now);
    room.turnEndsAt = null;
    room.status = "paused";
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (action === "resume") {
    if (room.status !== "paused") {
      throw new RoomStoreError(400, "Ván chơi hiện không ở trạng thái tạm dừng.");
    }
    room.status = "playing";
    room.turnEndsAt = now + (room.pausedRemainingMs ?? TURN_LENGTH_MS);
    room.pausedRemainingMs = null;
    room.lastActivityAt = now;
    return roomView(room, playerIndex, now);
  }

  if (room.status !== "playing") {
    throw new RoomStoreError(400, "Lượt chơi hiện không hoạt động.");
  }
  if (room.turnIndex % 2 !== playerIndex) {
    throw new RoomStoreError(403, "Chỉ người ra gợi ý mới có thể xác nhận đáp án.");
  }

  if (action === "correct") {
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

  if (room.status !== "playing" || room.mode !== "draw") {
    throw new RoomStoreError(400, "Bảng vẽ chỉ hoạt động trong lượt vẽ.");
  }
  if (room.turnIndex % 2 !== playerIndex) {
    throw new RoomStoreError(403, "Chỉ người ra gợi ý mới có thể vẽ.");
  }
  if (input.revision > room.drawingRevision) {
    room.drawingRevision = input.revision;
    room.drawingStrokes = input.strokes.map((stroke) => ({
      points: stroke.points.map((point) => ({ ...point })),
    }));
  }

  return roomView(room, playerIndex, now);
}
