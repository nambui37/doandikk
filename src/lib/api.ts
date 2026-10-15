import type {
  RoomAction,
  RoomCreateInput,
  RoomJoinInput,
  RoomSession,
  RoomView,
  DrawingStroke,
} from '../game/types';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Tự động đánh thức máy chủ ngầm (Cold Start Warm-Up) ngay khi người dùng vào web
export function warmUpServer(): void {
  try {
    fetch(`${API_BASE}/health`, { method: 'GET', mode: 'cors' }).catch(() => {});
  } catch {
    // ignore
  }
}

// Kích hoạt đánh thức server ngay lập tức
warmUpServer();

// Duy trì keep-alive mỗi 10 phút để server không bị ngủ
if (typeof window !== 'undefined') {
  setInterval(warmUpServer, 10 * 60 * 1000);
}

export async function apiCreateRoom(data: RoomCreateInput): Promise<RoomSession> {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể tạo phòng lúc này.');
  }
  return res.json();
}

export async function apiJoinRoom(roomCode: string, data: RoomJoinInput): Promise<RoomSession> {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomCode)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể vào phòng này.');
  }
  return res.json();
}

export async function apiGetRoomState(roomCode: string, token: string): Promise<RoomView> {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomCode)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Mất kết nối với phòng.');
  }
  return res.json();
}

export async function apiActOnRoom(
  roomCode: string,
  token: string,
  action: RoomAction,
  payload?: any,
): Promise<RoomView> {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomCode)}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Hành động không hợp lệ.');
  }
  return res.json();
}

export async function apiSetGameMode(
  roomCode: string,
  token: string,
  gameMode: 'classic' | 'telephone',
): Promise<RoomView> {
  return apiActOnRoom(roomCode, token, 'set_game_mode', { gameMode });
}

export async function apiSetTelephoneConfig(
  roomCode: string,
  token: string,
  telephoneConfig: { promptSeconds?: number; drawSeconds?: number; guessSeconds?: number },
): Promise<RoomView> {
  return apiActOnRoom(roomCode, token, 'set_telephone_config', { telephoneConfig });
}

export async function apiTelephoneSubmit(
  roomCode: string,
  token: string,
  payload: { text?: string; strokes?: DrawingStroke[] },
): Promise<RoomView> {
  return apiActOnRoom(roomCode, token, 'telephone_submit', payload);
}

export async function apiTelephoneChangeAlbum(
  roomCode: string,
  token: string,
  payload: { albumBookIndex?: number; albumStepIndex?: number },
): Promise<RoomView> {
  return apiActOnRoom(roomCode, token, 'telephone_change_album', payload);
}

export async function apiGuessWord(
  roomCode: string,
  token: string,
  guessText: string,
): Promise<RoomView> {
  return apiActOnRoom(roomCode, token, 'guess', { guessText });
}

export async function apiFinishDrawingEarly(
  roomCode: string,
  token: string,
): Promise<RoomView> {
  return apiActOnRoom(roomCode, token, 'finish_drawing');
}

export async function apiUpdateRoomDrawing(
  roomCode: string,
  token: string,
  data: { revision: number; strokes: DrawingStroke[] },
): Promise<RoomView> {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomCode)}/drawing`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể cập nhật bảng vẽ.');
  }
  return res.json();
}

export async function apiLeaveRoom(roomCode: string, token: string): Promise<RoomView | null> {
  try {
    return await apiActOnRoom(roomCode, token, 'leave');
  } catch {
    return null;
  }
}

