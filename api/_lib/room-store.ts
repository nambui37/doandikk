import { randomBytes } from 'crypto';
import { wordBank } from './word-bank';
import type {
  RoomAction,
  RoomCreateInput,
  RoomSession,
  RoomView,
  DrawingStroke,
  RoomTurnPhase,
  GuessFeedback,
} from '../../src/game/types';

export class RoomStoreError extends Error {
  public status: number;
  constructor(public statusCode: number, message: string) {
    super(message);
    this.status = statusCode;
    this.name = 'RoomStoreError';
  }
}

interface StoredPlayer {
  name: string;
  token: string;
  lastSeenAt: number;
}

interface GameRoom {
  code: string;
  players: StoredPlayer[];
  category: string;
  targetScore: number;
  status: 'waiting' | 'ready' | 'playing' | 'paused' | 'results';
  currentPhase: RoomTurnPhase;
  phaseEndsAt: number | null;
  turnIndex: number;
  scores: number[];
  wordIndex: number;
  words: string[];
  currentPrompt: string | null;
  lastRevealedWord: string | null;
  lastGuessFeedback: GuessFeedback | null;
  winnerIndex: number | null;
  drawingRevision: number;
  drawingStrokes: DrawingStroke[];
  lastActivityAt: number;
}

const DRAWING_DURATION_MS = 60 * 1000; // 60 giây vẽ
const GUESSING_DURATION_MS = 20 * 1000; // 20 giây đoán
const REVEAL_DURATION_MS = 3 * 1000;   // 3 giây hiện kết quả
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const ONLINE_WINDOW_MS = 15 * 1000;
const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const globalStore = globalThis as unknown as {
  __HBOMY_ROOMS__?: Map<string, GameRoom>;
};

if (!globalStore.__HBOMY_ROOMS__) {
  globalStore.__HBOMY_ROOMS__ = new Map();
}
const rooms = globalStore.__HBOMY_ROOMS__;

// Hàm bỏ dấu tiếng Việt để so khớp không phân biệt dấu
function removeVietnameseTones(str: string): string {
  let s = str.trim().toLowerCase();
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  // Xóa các ký tự đặc biệt
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

// Bản đồ đồng nghĩa phổ biến trong tiếng Việt
const SYNONYMS_MAP: Record<string, string> = {
  'non': 'mu',
  'bat': 'to',
  'ly': 'coc',
  'my': 'mi',
  'xe hoi': 'o to',
};

function normalizeSynonyms(str: string): string {
  let s = str;
  for (const [key, val] of Object.entries(SYNONYMS_MAP)) {
    s = s.replace(new RegExp(`\\b${key}\\b`, 'g'), val);
  }
  return s;
}

// Kiểm tra đoán trúng thông minh (Hỗ trợ đảo từ "pin sạc" <-> "sạc pin", từ đồng nghĩa "nón" <-> "mũ")
function checkCorrectGuess(guess: string, target: string): boolean {
  if (!guess || !target) return false;
  let cleanGuess = removeVietnameseTones(guess);
  let cleanTarget = removeVietnameseTones(target);

  if (cleanGuess === cleanTarget) return true;

  // Chuẩn hóa từ đồng nghĩa (nón -> mũ, ly -> cốc, bát -> tô, mỳ -> mì...)
  cleanGuess = normalizeSynonyms(cleanGuess);
  cleanTarget = normalizeSynonyms(cleanTarget);

  if (cleanGuess === cleanTarget) return true;

  // Bỏ các mạo từ / tiền tố phổ biến trong tiếng Việt
  const prefixRegex = /^(cai|con|qua|trai|chiec|doi|ngon|to|bat|binh|chum|mieng|bong|cu|tia|hat|cay)\s+/i;
  const strippedGuess = cleanGuess.replace(prefixRegex, '').trim();
  const strippedTarget = cleanTarget.replace(prefixRegex, '').trim();

  if (strippedGuess === strippedTarget && strippedGuess.length >= 2) return true;

  // So khớp đảo từ (VD: "pin sạc" <-> "sạc pin")
  const guessTokens = strippedGuess.split(/\s+/).filter(Boolean).sort().join(' ');
  const targetTokens = strippedTarget.split(/\s+/).filter(Boolean).sort().join(' ');
  if (guessTokens === targetTokens && guessTokens.length >= 2) return true;

  // Nếu từ khóa có các từ con, người chơi gõ chứa đủ các từ con bất kể thứ tự
  const targetWords = strippedTarget.split(/\s+/).filter(Boolean);
  const guessWords = strippedGuess.split(/\s+/).filter(Boolean);
  if (targetWords.length > 1 && guessWords.length === targetWords.length) {
    const allMatch = targetWords.every(w => guessWords.includes(w));
    if (allMatch) return true;
  }

  return false;
}

function shuffled(items: string[] | undefined): string[] {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : (Object.values(wordBank)[0] || []);
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

// Chuyển sang vòng tiếp theo
function advanceToNextRound(room: GameRoom, now: number): void {
  // Kiểm tra xem đã có người thắng chưa
  for (let i = 0; i < room.players.length; i++) {
    if (room.scores[i] >= room.targetScore) {
      room.status = 'results';
      room.winnerIndex = i;
      room.phaseEndsAt = null;
      return;
    }
  }

  room.turnIndex += 1;
  room.wordIndex += 1;
  room.currentPhase = 'drawing';
  room.phaseEndsAt = now + DRAWING_DURATION_MS;
  clearDrawing(room);
}

// Tự động kiểm tra thời gian trôi qua để chuyển phase
function updateRoomClock(room: GameRoom, now: number): void {
  if (room.status !== 'playing' || room.phaseEndsAt === null) return;

  if (now >= room.phaseEndsAt) {
    if (room.currentPhase === 'drawing') {
      // Hết 60s vẽ -> chuyển sang 20s đoán
      room.currentPhase = 'guessing';
      room.phaseEndsAt = now + GUESSING_DURATION_MS;
    } else if (room.currentPhase === 'guessing') {
      // Hết 20s đoán mà không ai đúng -> hiện đáp án 3s
      const currentWord = room.words[room.wordIndex % room.words.length];
      room.lastRevealedWord = currentWord;
      room.currentPhase = 'reveal';
      room.phaseEndsAt = now + REVEAL_DURATION_MS;
    } else if (room.currentPhase === 'reveal') {
      // Hết 3s hiện đáp án -> sang round tiếp theo
      advanceToNextRound(room, now);
    }
  }
}

export function roomView(room: GameRoom, playerIndex: number, now: number): RoomView {
  updateRoomClock(room, now);

  const drawerIndex = room.players.length > 0 ? room.turnIndex % room.players.length : 0;
  const isDrawer = drawerIndex === playerIndex;

  // Người vẽ được thấy từ bí mật trong suốt ván chơi
  // Người đoán chỉ thấy từ bí mật khi ở phase 'reveal' hoặc khi kết thúc game
  const currentWord = room.words[room.wordIndex % room.words.length] ?? '';
  const canSeeWord = isDrawer || room.currentPhase === 'reveal' || room.status === 'results';

  let timeLeft = 0;
  if (room.status === 'playing' && room.phaseEndsAt !== null) {
    timeLeft = Math.max(0, Math.ceil((room.phaseEndsAt - now) / 1000));
  }

  return {
    roomCode: room.code,
    status: room.status,
    currentPhase: room.currentPhase,
    phaseTimeLeftSeconds: timeLeft,
    players: room.players.map((player, index) => ({
      index,
      name: player.name,
      isHost: index === 0,
      online: now - player.lastSeenAt <= ONLINE_WINDOW_MS,
      score: room.scores[index] || 0,
    })),
    category: room.category,
    targetScore: room.targetScore,
    turnIndex: room.turnIndex,
    drawerIndex,
    scores: [...room.scores],
    currentPrompt: canSeeWord ? currentWord : null,
    lastRevealedWord: room.lastRevealedWord,
    lastGuessFeedback: room.lastGuessFeedback,
    winnerIndex: room.winnerIndex,
    drawingRevision: room.drawingRevision,
    drawingStrokes: room.drawingStrokes.map((stroke) => ({
      points: stroke.points.map((p) => ({ ...p })),
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

export function createRoom(input: RoomCreateInput): RoomSession {
  const now = Date.now();
  expireInactiveRooms(now);

  let code = createRoomCode();
  while (rooms.has(code)) code = createRoomCode();

  const selectedCategory = (input.category && wordBank[input.category]) ? input.category : Object.keys(wordBank)[0];
  const targetScore = input.targetScore && [3, 5, 10].includes(input.targetScore) ? input.targetScore : 5;

  const token = createPlayerToken();
  const room: GameRoom = {
    code,
    players: [{ name: input.playerName, token, lastSeenAt: now }],
    category: selectedCategory,
    targetScore,
    status: 'waiting',
    currentPhase: 'drawing',
    phaseEndsAt: null,
    turnIndex: 0,
    scores: [0],
    wordIndex: 0,
    words: shuffled(wordBank[selectedCategory]),
    currentPrompt: null,
    lastRevealedWord: null,
    lastGuessFeedback: null,
    winnerIndex: null,
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

  const cleanName = playerName.trim();
  const existingIndex = room.players.findIndex(
    (p) => p.name.trim().toLowerCase() === cleanName.toLowerCase(),
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

  if (room.players.length >= 8) {
    throw new RoomStoreError(400, 'Phòng đã đầy (tối đa 8 người).');
  }

  const token = createPlayerToken();
  const newIndex = room.players.length;
  room.players.push({ name: cleanName, token, lastSeenAt: now });
  room.scores.push(0);

  if (room.status === 'waiting' && room.players.length >= 2) {
    room.status = 'ready';
  }

  touchPlayer(room, newIndex, now);
  return {
    roomCode: room.code,
    playerToken: token,
    playerIndex: newIndex,
    view: roomView(room, newIndex, now),
  };
}

export function getRoomViewForToken(code: string, token: string | undefined): RoomView {
  const room = findRoom(code);
  const now = Date.now();
  const playerIndex = playerIndexForToken(room, token);
  touchPlayer(room, playerIndex, now);
  return roomView(room, playerIndex, now);
}

export function performRoomAction(
  code: string,
  token: string | undefined,
  action: RoomAction,
  payload?: { guessText?: string; targetScore?: number },
): RoomView {
  const room = findRoom(code);
  const now = Date.now();
  const playerIndex = playerIndexForToken(room, token);
  touchPlayer(room, playerIndex, now);
  updateRoomClock(room, now);

  const drawerIndex = room.players.length > 0 ? room.turnIndex % room.players.length : 0;
  const isDrawer = drawerIndex === playerIndex;

  switch (action) {
    case 'start': {
      if (playerIndex !== 0) throw new RoomStoreError(403, 'Chỉ chủ phòng mới có thể bắt đầu ván đấu.');
      if (room.players.length < 2) throw new RoomStoreError(400, 'Cần ít nhất 2 người để bắt đầu.');

      room.status = 'playing';
      room.currentPhase = 'drawing';
      room.turnIndex = 0;
      room.wordIndex = 0;
      room.scores = room.players.map(() => 0);
      room.winnerIndex = null;
      room.lastRevealedWord = null;
      room.lastGuessFeedback = null;
      room.phaseEndsAt = now + DRAWING_DURATION_MS;
      clearDrawing(room);
      break;
    }

    case 'finish_drawing': {
      // Người vẽ bấm hoàn thành vẽ sớm -> chuyển ngay sang phase đoán
      if (!isDrawer) throw new RoomStoreError(403, 'Chỉ người vẽ mới có thể bấm hoàn thành vẽ sớm.');
      if (room.status !== 'playing' || room.currentPhase !== 'drawing') {
        throw new RoomStoreError(400, 'Hiện không ở lượt vẽ.');
      }
      room.currentPhase = 'guessing';
      room.phaseEndsAt = now + GUESSING_DURATION_MS;
      break;
    }

    case 'guess': {
      // Người đoán nhập câu trả lời
      if (room.status !== 'playing') throw new RoomStoreError(400, 'Trận đấu chưa bắt đầu.');
      if (isDrawer) throw new RoomStoreError(400, 'Người vẽ không được tự đoán từ của mình!');
      if (room.currentPhase !== 'guessing' && room.currentPhase !== 'drawing') {
        throw new RoomStoreError(400, 'Hiện không trong thời gian đoán.');
      }

      const guessText = (payload?.guessText || '').trim();
      if (!guessText) throw new RoomStoreError(400, 'Vui lòng nhập câu trả lời.');

      const currentWord = room.words[room.wordIndex % room.words.length];
      const isCorrect = checkCorrectGuess(guessText, currentWord);
      const guesserName = room.players[playerIndex].name;

      room.lastGuessFeedback = {
        guesserName,
        text: guessText,
        isCorrect,
        timestamp: now,
      };

      if (isCorrect) {
        // Chỉ cộng 1 điểm duy nhất cho người đoán đúng
        room.scores[playerIndex] = (room.scores[playerIndex] || 0) + 1;

        room.lastRevealedWord = currentWord;
        room.currentPhase = 'reveal';
        room.phaseEndsAt = now + REVEAL_DURATION_MS;

        // Người đoán đạt đủ điểm mục tiêu trước sẽ chiến thắng
        if (room.scores[playerIndex] >= room.targetScore) {
          room.status = 'results';
          room.winnerIndex = playerIndex;
          room.phaseEndsAt = null;
        }
      }
      break;
    }

    case 'restart': {
      if (playerIndex !== 0) throw new RoomStoreError(403, 'Chỉ chủ phòng mới có thể bắt đầu lại.');
      room.status = 'ready';
      room.currentPhase = 'drawing';
      room.phaseEndsAt = null;
      room.turnIndex = 0;
      room.wordIndex = 0;
      room.scores = room.players.map(() => 0);
      room.winnerIndex = null;
      room.lastRevealedWord = null;
      room.lastGuessFeedback = null;
      clearDrawing(room);
      break;
    }

    default:
      throw new RoomStoreError(400, 'Hành động không hợp lệ.');
  }

  return roomView(room, playerIndex, now);
}

export function updateRoomDrawing(
  code: string,
  token: string | undefined,
  input: { revision: number; strokes: DrawingStroke[] },
): RoomView {
  const room = findRoom(code);
  const now = Date.now();
  const playerIndex = playerIndexForToken(room, token);
  touchPlayer(room, playerIndex, now);
  updateRoomClock(room, now);

  const drawerIndex = room.players.length > 0 ? room.turnIndex % room.players.length : 0;
  if (drawerIndex !== playerIndex) {
    throw new RoomStoreError(403, 'Chỉ người đang có lượt vẽ mới được vẽ.');
  }
  if (room.status !== 'playing' || room.currentPhase !== 'drawing') {
    throw new RoomStoreError(400, 'Thời gian vẽ đã kết thúc.');
  }

  room.drawingStrokes = input.strokes;
  room.drawingRevision = input.revision;
  return roomView(room, playerIndex, now);
}
