import type {
  RoomAction,
  RoomCreateInput,
  RoomJoinInput,
  RoomSession,
  RoomView,
  DrawingStroke,
} from '../game/types';

const API_BASE = '/api';

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
): Promise<RoomView> {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomCode)}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Hành động không hợp lệ.');
  }
  return res.json();
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
