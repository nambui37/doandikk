import type { IncomingMessage, ServerResponse } from 'http';
import {
  createRoom,
  getRoomViewForToken,
  joinRoom,
  performRoomAction,
  updateRoomDrawing,
  RoomStoreError,
} from './room-store';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse body if string or buffer
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  // Extract auth token
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const tokenMatch = typeof authHeader === 'string' ? authHeader.match(/^Bearer\s+(.+)$/i) : null;
  const token = tokenMatch ? tokenMatch[1] : undefined;

  // Normalize path & query
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathParts = url.pathname.replace(/^\/api\/rooms\/?/, '').split('/').filter(Boolean);

  try {
    // 1. POST /api/rooms - Tạo phòng mới
    if (req.method === 'POST' && pathParts.length === 0) {
      const { playerName, category, mode } = body || {};
      if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
        res.status(400).json({ error: 'Vui lòng nhập tên người chơi.' });
        return;
      }
      const session = createRoom({
        playerName: playerName.trim(),
        category: category || 'Đời thường',
        mode: mode === 'draw' ? 'draw' : 'talk',
      });
      res.status(201).json(session);
      return;
    }

    const roomCode = (pathParts[0] || (req.query && req.query.roomCode) || '').toUpperCase();
    const actionOrSub = pathParts[1];

    if (!roomCode) {
      res.status(400).json({ error: 'Mã phòng không hợp lệ.' });
      return;
    }

    // 2. POST /api/rooms/:roomCode/join - Tham gia phòng
    if (req.method === 'POST' && actionOrSub === 'join') {
      const { playerName } = body || {};
      if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
        res.status(400).json({ error: 'Vui lòng nhập tên trước khi vào phòng.' });
        return;
      }
      const session = joinRoom(roomCode, playerName.trim());
      res.status(200).json(session);
      return;
    }

    // 3. GET /api/rooms/:roomCode - Lấy trạng thái phòng
    if (req.method === 'GET' && !actionOrSub) {
      const view = getRoomViewForToken(roomCode, token);
      res.status(200).json(view);
      return;
    }

    // 4. POST /api/rooms/:roomCode/actions - Thực hiện hành động
    if (req.method === 'POST' && actionOrSub === 'actions') {
      const { action } = body || {};
      if (!action) {
        res.status(400).json({ error: 'Thiếu hành động (action).' });
        return;
      }
      const view = performRoomAction(roomCode, token, action);
      res.status(200).json(view);
      return;
    }

    // 5. PUT /api/rooms/:roomCode/drawing - Đồng bộ bảng vẽ
    if (req.method === 'PUT' && actionOrSub === 'drawing') {
      const { revision, strokes } = body || {};
      const view = updateRoomDrawing(roomCode, token, {
        revision: typeof revision === 'number' ? revision : 0,
        strokes: Array.isArray(strokes) ? strokes : [],
      });
      res.status(200).json(view);
      return;
    }

    res.status(404).json({ error: 'Không tìm thấy endpoint yêu cầu.' });
  } catch (error: any) {
    if (error instanceof RoomStoreError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error('Room API Error:', error);
    res.status(500).json({ error: error?.message || 'Lỗi máy chủ nội bộ.' });
  }
}
