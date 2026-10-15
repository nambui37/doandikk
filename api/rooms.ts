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

  // Parse body an toàn
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  if (!body || typeof body !== 'object') {
    body = {};
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const tokenMatch = typeof authHeader === 'string' ? authHeader.match(/^Bearer\s+(.+)$/i) : null;
  const token = tokenMatch ? tokenMatch[1] : undefined;

  // Xử lý path an toàn trên cả Vercel lẫn Local
  const rawUrl = req.url || '/';
  const cleanPath = rawUrl.split('?')[0];
  const pathParts = cleanPath
    .replace(/^\/api\/rooms\/?/, '')
    .replace(/^\/rooms\/?/, '')
    .split('/')
    .filter(Boolean);

  try {
    // 1. Khi truy cập vào /api/rooms gốc
    if (pathParts.length === 0) {
      if (req.method === 'POST') {
        const playerName = (body.playerName || '').trim();
        if (!playerName) {
          res.status(400).json({ error: 'Vui lòng nhập tên người chơi.' });
          return;
        }
        const session = createRoom({
          playerName,
          category: body.category || 'Đời thường',
        });
        res.status(201).json(session);
        return;
      }

      // GET /api/rooms trả về 200 OK
      res.status(200).json({ status: 'ok', message: 'API Hai Bộ Óc Một Ý đang hoạt động tốt.' });
      return;
    }

    const roomCode = (pathParts[0] || (req.query && req.query.roomCode) || '').toUpperCase();
    const subAction = pathParts[1];

    if (!roomCode) {
      res.status(400).json({ error: 'Mã phòng không hợp lệ.' });
      return;
    }

    // 2. POST /api/rooms/:roomCode/join - Vào phòng
    if (req.method === 'POST' && subAction === 'join') {
      const playerName = (body.playerName || '').trim();
      if (!playerName) {
        res.status(400).json({ error: 'Vui lòng nhập tên trước khi vào phòng.' });
        return;
      }
      const session = joinRoom(roomCode, playerName);
      res.status(200).json(session);
      return;
    }

    // 3. GET /api/rooms/:roomCode - Lấy trạng thái phòng
    if (req.method === 'GET' && !subAction) {
      const view = getRoomViewForToken(roomCode, token);
      res.status(200).json(view);
      return;
    }

    // 4. POST /api/rooms/:roomCode/actions - Hành động ván chơi
    if (req.method === 'POST' && subAction === 'actions') {
      const action = body.action;
      if (!action) {
        res.status(400).json({ error: 'Thiếu trường hành động (action).' });
        return;
      }
      const view = performRoomAction(roomCode, token, action, body.targetGuesserIndex);
      res.status(200).json(view);
      return;
    }

    // 5. PUT /api/rooms/:roomCode/drawing - Bảng vẽ
    if (req.method === 'PUT' && subAction === 'drawing') {
      const revision = typeof body.revision === 'number' ? body.revision : 0;
      const strokes = Array.isArray(body.strokes) ? body.strokes : [];
      const view = updateRoomDrawing(roomCode, token, { revision, strokes });
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
    res.status(500).json({ error: error?.message || 'Lỗi xử lý API nội bộ.' });
  }
}
