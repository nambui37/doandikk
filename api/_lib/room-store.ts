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
  GameMode,
  TelephoneConfig,
  TelephoneState,
  TelephoneBook,
  TelephoneStep,
  TelephoneStepType,
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
  avatarIndex?: number;
}

interface GameRoom {
  code: string;
  players: StoredPlayer[];
  category: string;
  targetScore: number;
  gameMode: GameMode;
  telephoneConfig: TelephoneConfig;
  status: 'waiting' | 'ready' | 'playing' | 'paused' | 'results';
  currentPhase: RoomTurnPhase;
  phaseEndsAt: number | null;
  turnIndex: number;
  scores: number[];
  wordIndex: number;
  baseWords: string[];
  words: string[];
  currentPrompt: string | null;
  lastRevealedWord: string | null;
  lastGuessFeedback: GuessFeedback | null;
  winnerIndex: number | null;
  drawingRevision: number;
  drawingStrokes: DrawingStroke[];
  lastActivityAt: number;

  // Trạng thái cho chế độ Tam Sao Thất Bản (Telephone Chain)
  telephoneRound: number;
  telephoneTotalRounds: number;
  telephoneSubmissions: Record<string, boolean>;
  telephoneBooks: TelephoneBook[];
  albumBookIndex: number;
  albumStepIndex: number;
}


const DRAWING_DURATION_MS = 60 * 1000; // 60 giây vẽ
const GUESSING_DURATION_MS = 20 * 1000; // 20 giây đoán
const REVEAL_DURATION_MS = 1500;        // 1.5 giây hiện kết quả (chuyển lượt nhanh gọn)
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

  // Hỗ trợ người dùng gõ liền không khoảng cách trên điện thoại (VD: "balo" <-> "ba lo")
  if (
    strippedGuess.replace(/\s+/g, '') === strippedTarget.replace(/\s+/g, '') &&
    strippedGuess.replace(/\s+/g, '').length >= 3
  ) {
    return true;
  }

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

// Xáo trộn kho từ khóa: ưu tiên đưa các từ CHƯA chơi lên đầu để không bao giờ bị trùng lặp khi chơi lại
function reshuffleRoomWords(room: GameRoom): string[] {
  const base = room.baseWords && room.baseWords.length > 0
    ? room.baseWords
    : (wordBank[room.category] || Object.values(wordBank)[0] || []);
  if (!base || base.length === 0) return Object.values(wordBank)[0] || [];

  // Lấy các từ đã xuất hiện trong ván vừa kết thúc
  const playedSlice = (room.words || []).slice(0, Math.min(room.wordIndex + 1, (room.words || []).length));
  const unplayed = base.filter((w) => !playedSlice.includes(w));
  const played = base.filter((w) => playedSlice.includes(w));

  // Trộn riêng 2 nhóm và ghép lại: nhóm chưa chơi lên trước, nhóm đã chơi về sau
  const shuffledUnplayed = shuffled(unplayed);
  const shuffledPlayed = shuffled(played);

  return [...shuffledUnplayed, ...shuffledPlayed];
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

// Chuyển sang vòng tiếp theo (Classic 1v1)
function advanceToNextRound(room: GameRoom, now: number): void {
  let reachedTarget = false;
  let highestScore = -1;
  let winnerIdx: number | null = null;
  let isTie = false;

  for (let i = 0; i < room.players.length; i++) {
    const s = room.scores[i] || 0;
    if (s >= room.targetScore) {
      reachedTarget = true;
    }
    if (s > highestScore) {
      highestScore = s;
      winnerIdx = i;
      isTie = false;
    } else if (s === highestScore && highestScore > 0) {
      isTie = true;
    }
  }

  if (reachedTarget) {
    room.status = 'results';
    room.winnerIndex = isTie ? null : winnerIdx;
    room.phaseEndsAt = null;
    return;
  }

  room.turnIndex += 1;
  room.wordIndex += 1;
  // Nếu đã dùng hết danh sách từ hiện tại, tự động xáo trộn kho từ mới
  if (room.wordIndex >= room.words.length) {
    room.words = reshuffleRoomWords(room);
    room.wordIndex = 0;
  }
  room.currentPhase = 'drawing';
  room.phaseEndsAt = now + DRAWING_DURATION_MS;
  clearDrawing(room);
}

// Chuyển sang vòng tiếp theo trong Tam Sao Thất Bản (Telephone Chain)
function advanceTelephoneRound(room: GameRoom, now: number): void {
  const currentRound = room.telephoneRound;
  const totalRounds = room.telephoneTotalRounds || room.players.length;
  const stepType: TelephoneStepType = currentRound === 0 ? 'prompt' : (currentRound % 2 === 1 ? 'drawing' : 'guess');

  // Điền giá trị mặc định cho những người chưa kịp nộp bài khi hết giờ
  room.players.forEach((player, pIdx) => {
    const bookIndex = (pIdx - currentRound + totalRounds) % totalRounds;
    const book = room.telephoneBooks[bookIndex];
    if (book && !book.steps[currentRound]) {
      book.steps[currentRound] = {
        stepIndex: currentRound,
        type: stepType,
        authorName: player.name,
        text: stepType === 'prompt' ? 'Con mèo bay lượn trên mây' : 'Một điều kỳ thú',
        strokes: [],
        timestamp: now,
      };
    }
  });

  room.telephoneRound += 1;
  room.telephoneSubmissions = {};

  if (room.telephoneRound >= totalRounds) {
    // Tất cả các cuốn sổ đã hoàn thành! Chuyển sang Màn hình Công chiếu Album
    room.status = 'results';
    room.phaseEndsAt = null;
    room.albumBookIndex = 0;
    room.albumStepIndex = 0;
    return;
  }

  // Xác định thời lượng cho vòng tiếp theo
  const nextType = room.telephoneRound % 2 === 1 ? 'drawing' : 'guess';
  const durationSec = nextType === 'drawing' ? room.telephoneConfig.drawSeconds : room.telephoneConfig.guessSeconds;
  room.phaseEndsAt = now + durationSec * 1000;
}

// Tự động kiểm tra thời gian trôi qua để chuyển phase
function updateRoomClock(room: GameRoom, now: number): void {
  if (room.status !== 'playing' || room.phaseEndsAt === null) return;

  if (now >= room.phaseEndsAt) {
    if (room.gameMode === 'telephone') {
      advanceTelephoneRound(room, now);
      return;
    }

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

  const currentWord = room.words[room.wordIndex % room.words.length] ?? '';
  const canSeeWord = isDrawer || room.currentPhase === 'reveal' || room.status === 'results';

  let timeLeft = 0;
  if (room.status === 'playing' && room.phaseEndsAt !== null) {
    timeLeft = Math.max(0, Math.ceil((room.phaseEndsAt - now) / 1000));
  }

  // Xây dựng trạng thái Telephone riêng biệt cho người chơi này
  let telephoneState: TelephoneState | undefined = undefined;
  if (room.gameMode === 'telephone') {
    const isAlbum = room.status === 'results' || (room.telephoneTotalRounds > 0 && room.telephoneRound >= room.telephoneTotalRounds);
    const currentRound = room.telephoneRound;
    const totalRounds = room.telephoneTotalRounds || room.players.length;
    const currentStepType: TelephoneStepType = isAlbum
      ? ('album' as any)
      : currentRound === 0
      ? 'prompt'
      : currentRound % 2 === 1
      ? 'drawing'
      : 'guess';

    const myBookIndex = totalRounds > 0 ? (playerIndex - currentRound + totalRounds) % totalRounds : 0;
    const myCurrentBook = room.telephoneBooks[myBookIndex];
    const previousStep = myCurrentBook && currentRound > 0 ? myCurrentBook.steps[currentRound - 1] : undefined;

    const playerToken = room.players[playerIndex]?.token;
    const hasSubmitted = !!(playerToken && room.telephoneSubmissions[playerToken]);
    const submittedCount = Object.values(room.telephoneSubmissions).filter(Boolean).length;

    telephoneState = {
      round: currentRound,
      totalRounds,
      phase: isAlbum ? 'album' : currentStepType,
      timeLeftSeconds: timeLeft,
      myBookIndex,
      hasSubmitted,
      submittedCount,
      totalPlayers: room.players.length,
      inputPrompt: previousStep?.text,
      inputDrawingStrokes: previousStep?.strokes,
      allBooks: isAlbum ? room.telephoneBooks : undefined,
      albumBookIndex: room.albumBookIndex,
      albumStepIndex: room.albumStepIndex,
    };
  }

  return {
    roomCode: room.code,
    status: room.status,
    gameMode: room.gameMode,
    telephoneConfig: room.telephoneConfig,
    telephoneState,
    currentPhase: room.currentPhase,
    phaseTimeLeftSeconds: timeLeft,
    players: room.players.map((player, index) => ({
      index,
      name: player.name,
      isHost: index === 0,
      online: now - player.lastSeenAt <= ONLINE_WINDOW_MS,
      score: room.scores[index] || 0,
      avatarIndex: player.avatarIndex,
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
      shape: stroke.shape,
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

  const hasCustomWords = Array.isArray(input.customWords) && input.customWords.length > 0;
  const selectedCategory = input.category || (hasCustomWords ? 'Tùy chỉnh' : Object.keys(wordBank)[0]);
  const wordsList = hasCustomWords
    ? input.customWords!
    : (wordBank[selectedCategory] || Object.values(wordBank)[0] || []);
  const targetScore = input.targetScore && [3, 5, 10].includes(input.targetScore) ? input.targetScore : 5;

  const token = createPlayerToken();
  const room: GameRoom = {
    code,
    players: [{ name: input.playerName, token, lastSeenAt: now, avatarIndex: input.avatarIndex }],
    category: selectedCategory,
    targetScore,
    gameMode: input.gameMode || 'telephone',
    telephoneConfig: {
      promptSeconds: 60,
      drawSeconds: 75,
      guessSeconds: 60,
    },
    status: 'waiting',
    currentPhase: 'drawing',
    phaseEndsAt: null,
    turnIndex: 0,
    scores: [0],
    wordIndex: 0,
    baseWords: [...wordsList],
    words: shuffled(wordsList),
    currentPrompt: null,
    lastRevealedWord: null,
    lastGuessFeedback: null,
    winnerIndex: null,
    drawingRevision: 0,
    drawingStrokes: [],
    lastActivityAt: now,
    telephoneRound: 0,
    telephoneTotalRounds: 0,
    telephoneSubmissions: {},
    telephoneBooks: [],
    albumBookIndex: 0,
    albumStepIndex: 0,
  };
  rooms.set(code, room);

  return {
    roomCode: code,
    playerToken: token,
    playerIndex: 0,
    view: roomView(room, 0, now),
  };
}

export function joinRoom(code: string, playerName: string, avatarIndex?: number) {
  const room = findRoom(code);
  const now = Date.now();

  const cleanName = playerName.trim();
  const existingIndex = room.players.findIndex(
    (p) => p.name.trim().toLowerCase() === cleanName.toLowerCase(),
  );

  if (existingIndex >= 0) {
    const existingPlayer = room.players[existingIndex];
    existingPlayer.lastSeenAt = now;
    if (typeof avatarIndex === 'number') existingPlayer.avatarIndex = avatarIndex;
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
  room.players.push({ name: cleanName, token, lastSeenAt: now, avatarIndex });
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
  payload?: any,
): RoomView {
  const room = findRoom(code);
  const now = Date.now();
  const playerIndex = playerIndexForToken(room, token);
  touchPlayer(room, playerIndex, now);
  updateRoomClock(room, now);

  const drawerIndex = room.players.length > 0 ? room.turnIndex % room.players.length : 0;
  const isDrawer = drawerIndex === playerIndex;

  switch (action) {
    case 'set_game_mode': {
      if (playerIndex !== 0) throw new RoomStoreError(403, 'Chỉ chủ phòng mới có thể thay đổi chế độ chơi.');
      if (payload?.gameMode === 'classic' || payload?.gameMode === 'telephone') {
        room.gameMode = payload.gameMode;
      }
      break;
    }

    case 'set_telephone_config': {
      if (playerIndex !== 0) throw new RoomStoreError(403, 'Chỉ chủ phòng mới có thể chỉnh sửa thời gian.');
      if (payload?.telephoneConfig) {
        room.telephoneConfig = {
          ...room.telephoneConfig,
          ...payload.telephoneConfig,
        };
      }
      break;
    }

    case 'start': {
      if (playerIndex !== 0) throw new RoomStoreError(403, 'Chỉ chủ phòng mới có thể bắt đầu ván đấu.');
      if (room.players.length < 2) throw new RoomStoreError(400, 'Cần ít nhất 2 người để bắt đầu.');

      room.status = 'playing';

      if (room.gameMode === 'telephone') {
        room.telephoneRound = 0;
        room.telephoneTotalRounds = room.players.length;
        room.telephoneSubmissions = {};
        room.telephoneBooks = room.players.map((p, idx) => ({
          bookIndex: idx,
          initialAuthorName: p.name,
          steps: [],
        }));
        room.albumBookIndex = 0;
        room.albumStepIndex = 0;
        room.phaseEndsAt = now + room.telephoneConfig.promptSeconds * 1000;
        clearDrawing(room);
      } else {
        room.currentPhase = 'drawing';
        room.turnIndex = 0;
        room.words = reshuffleRoomWords(room);
        room.wordIndex = 0;
        room.scores = room.players.map(() => 0);
        room.winnerIndex = null;
        room.lastRevealedWord = null;
        room.lastGuessFeedback = null;
        room.phaseEndsAt = now + DRAWING_DURATION_MS;
        clearDrawing(room);
      }
      break;
    }

    case 'telephone_submit': {
      if (room.gameMode !== 'telephone') throw new RoomStoreError(400, 'Phòng không ở chế độ Tam Sao Thất Bản.');
      if (room.status !== 'playing') throw new RoomStoreError(400, 'Ván chơi chưa bắt đầu.');

      const player = room.players[playerIndex];
      const pToken = player.token;
      if (room.telephoneSubmissions[pToken]) {
        break; // Đã nộp rồi
      }

      const cRound = room.telephoneRound;
      const tRounds = room.telephoneTotalRounds || room.players.length;
      const myBookIdx = (playerIndex - cRound + tRounds) % tRounds;
      const targetBook = room.telephoneBooks[myBookIdx];

      const currentType: TelephoneStepType = cRound === 0 ? 'prompt' : (cRound % 2 === 1 ? 'drawing' : 'guess');
      if (targetBook) {
        targetBook.steps[cRound] = {
          stepIndex: cRound,
          type: currentType,
          authorName: player.name,
          text: (payload?.text || '').trim() || (currentType === 'prompt' ? 'Con mèo bay lượn' : 'Bức vẽ bí ẩn'),
          strokes: Array.isArray(payload?.strokes) ? payload.strokes : [],
          timestamp: now,
        };
      }

      room.telephoneSubmissions[pToken] = true;

      // Nếu tất cả người chơi đã nộp bài, chuyển ngay sang vòng tiếp theo mà không cần chờ hết giờ!
      const allSubmitted = room.players.every((p) => room.telephoneSubmissions[p.token]);
      if (allSubmitted) {
        advanceTelephoneRound(room, now);
      }
      break;
    }

    case 'telephone_change_album': {
      if (typeof payload?.albumBookIndex === 'number') {
        room.albumBookIndex = payload.albumBookIndex;
      }
      if (typeof payload?.albumStepIndex === 'number') {
        room.albumStepIndex = payload.albumStepIndex;
      }
      break;
    }

    case 'finish_drawing': {
      if (!isDrawer) throw new RoomStoreError(403, 'Chỉ người vẽ mới có thể bấm hoàn thành vẽ sớm.');
      if (room.status !== 'playing' || room.currentPhase !== 'drawing') {
        throw new RoomStoreError(400, 'Hiện không ở lượt vẽ.');
      }
      room.currentPhase = 'guessing';
      room.phaseEndsAt = now + GUESSING_DURATION_MS;
      break;
    }

    case 'guess': {
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
      const drawerName = room.players[drawerIndex]?.name || 'Người vẽ';

      room.lastGuessFeedback = {
        guesserName,
        drawerName,
        text: guessText,
        isCorrect,
        timestamp: now,
      };

      if (isCorrect) {
        // CHỈ người vẽ được +1 điểm vì vẽ đẹp, chuẩn để người khác đoán ra!
        if (drawerIndex >= 0 && drawerIndex < room.players.length) {
          room.scores[drawerIndex] = (room.scores[drawerIndex] || 0) + 1;
        }

        room.lastRevealedWord = currentWord;
        room.currentPhase = 'reveal';
        room.phaseEndsAt = now + REVEAL_DURATION_MS;

        // Kiểm tra xem ai đã đạt mục tiêu điểm số để kết thúc ván đấu
        let reachedTarget = false;
        let highestScore = -1;
        let winnerIdx: number | null = null;
        let isTie = false;

        for (let i = 0; i < room.players.length; i++) {
          const s = room.scores[i] || 0;
          if (s >= room.targetScore) {
            reachedTarget = true;
          }
          if (s > highestScore) {
            highestScore = s;
            winnerIdx = i;
            isTie = false;
          } else if (s === highestScore && highestScore > 0) {
            isTie = true;
          }
        }

        if (reachedTarget) {
          room.status = 'results';
          room.winnerIndex = isTie ? null : winnerIdx;
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
      // TRỘN LẠI TOÀN BỘ TỪ KHÓA: Đưa các từ mới chưa chơi lên đầu để không bao giờ bị lặp lại
      room.words = reshuffleRoomWords(room);
      room.wordIndex = 0;
      room.scores = room.players.map(() => 0);
      room.winnerIndex = null;
      room.lastRevealedWord = null;
      room.lastGuessFeedback = null;
      room.telephoneRound = 0;
      room.telephoneTotalRounds = 0;
      room.telephoneSubmissions = {};
      room.telephoneBooks = [];
      room.albumBookIndex = 0;
      room.albumStepIndex = 0;
      clearDrawing(room);
      break;
    }

    case 'leave': {
      const leavingPlayer = room.players[playerIndex];
      // Xóa người chơi khỏi danh sách
      room.players.splice(playerIndex, 1);
      room.scores.splice(playerIndex, 1);

      // Nếu không còn ai trong phòng, dọn dẹp xóa luôn phòng
      if (room.players.length === 0) {
        rooms.delete(code);
        return {
          roomCode: code,
          category: room.category,
          targetScore: room.targetScore,
          gameMode: room.gameMode,
          telephoneConfig: room.telephoneConfig,
          status: 'waiting',
          currentPhase: 'drawing',
          phaseTimeLeftSeconds: 0,
          turnIndex: 0,
          scores: [],
          players: [],
          drawerIndex: 0,
          currentPrompt: null,
          lastRevealedWord: null,
          lastGuessFeedback: null,
          winnerIndex: null,
          drawingRevision: 0,
          drawingStrokes: [],
        };
      }

      // Nếu đang trong trận đấu mà số người chơi còn lại < 2:
      // Tự động kết thúc ván đấu và chuyển về phòng chờ
      if (room.status === 'playing' && room.players.length < 2) {
        room.status = 'waiting';
        room.currentPhase = 'drawing';
        room.phaseEndsAt = null;
        room.turnIndex = 0;
        room.wordIndex = 0;
        room.winnerIndex = null;
        room.lastRevealedWord = null;
        room.telephoneRound = 0;
        room.telephoneTotalRounds = 0;
        room.telephoneSubmissions = {};
        clearDrawing(room);

        room.lastGuessFeedback = {
          guesserName: 'Hệ thống',
          text: `${leavingPlayer?.name || 'Một người chơi'} đã rời phòng. Trận đấu kết thúc do không đủ người tham gia!`,
          isCorrect: false,
          timestamp: now,
        };
      }

      return roomView(room, 0, now);
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

  if (input.revision >= room.drawingRevision) {
    room.drawingStrokes = input.strokes;
    room.drawingRevision = input.revision;
  }
  return roomView(room, playerIndex, now);
}
