import { Router, type IRouter, type Request, type RequestHandler, type Response } from "express";
import {
  ActOnRoomBody,
  ActOnRoomParams,
  ActOnRoomResponse,
  CreateRoomBody,
  CreateRoomResponse,
  GetRoomStateParams,
  GetRoomStateResponse,
  JoinRoomBody,
  JoinRoomParams,
  JoinRoomResponse,
  UpdateRoomDrawingBody,
  UpdateRoomDrawingParams,
  UpdateRoomDrawingResponse,
} from "@workspace/api-zod";
import {
  createRoom,
  getRoomViewForToken,
  joinRoom,
  performRoomAction,
  RoomStoreError,
  updateRoomDrawing,
} from "../lib/room-store";

const router: IRouter = Router();

function bearerToken(req: Request): string | undefined {
  const header = req.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

function roomCodeFrom(req: Request): string {
  const rawCode = req.params["roomCode"];
  return (Array.isArray(rawCode) ? rawCode[0] : rawCode ?? "")
    .trim()
    .toUpperCase();
}

function invalidRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

function roomEndpoint(
  handler: (req: Request, res: Response) => Promise<void> | void,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((error: unknown) => {
      if (error instanceof RoomStoreError) {
        res.status(error.status).json({ error: error.message });
        return;
      }

      req.log.error({ err: error }, "Unexpected online room error");
      next(error);
      });
  };
}

router.post(
  "/rooms",
  roomEndpoint((req, res) => {
    const parsed = CreateRoomBody.safeParse(req.body);
    if (!parsed.success) {
      invalidRequest(res, parsed.error.message);
      return;
    }

    const playerName = parsed.data.playerName.trim();
    if (!playerName) {
      invalidRequest(res, "Nhập tên trước khi tạo phòng.");
      return;
    }

    const session = createRoom({ ...parsed.data, playerName });
    res.status(201).json(CreateRoomResponse.parse(session));
  }),
);

router.post(
  "/rooms/:roomCode/join",
  roomEndpoint((req, res) => {
    const params = JoinRoomParams.safeParse({ roomCode: roomCodeFrom(req) });
    const body = JoinRoomBody.safeParse(req.body);
    if (!params.success) {
      invalidRequest(res, params.error.message);
      return;
    }
    if (!body.success) {
      invalidRequest(res, body.error.message);
      return;
    }

    const playerName = body.data.playerName.trim();
    if (!playerName) {
      invalidRequest(res, "Nhập tên trước khi vào phòng.");
      return;
    }

    const session = joinRoom(params.data.roomCode, playerName);
    res.json(JoinRoomResponse.parse(session));
  }),
);

router.get(
  "/rooms/:roomCode",
  roomEndpoint((req, res) => {
    const params = GetRoomStateParams.safeParse({ roomCode: roomCodeFrom(req) });
    if (!params.success) {
      invalidRequest(res, params.error.message);
      return;
    }

    const view = getRoomViewForToken(params.data.roomCode, bearerToken(req));
    res.json(GetRoomStateResponse.parse(view));
  }),
);

router.post(
  "/rooms/:roomCode/actions",
  roomEndpoint((req, res) => {
    const params = ActOnRoomParams.safeParse({ roomCode: roomCodeFrom(req) });
    const body = ActOnRoomBody.safeParse(req.body);
    if (!params.success) {
      invalidRequest(res, params.error.message);
      return;
    }
    if (!body.success) {
      invalidRequest(res, body.error.message);
      return;
    }

    const view = performRoomAction(
      params.data.roomCode,
      bearerToken(req),
      body.data.action,
    );
    res.json(ActOnRoomResponse.parse(view));
  }),
);

router.put(
  "/rooms/:roomCode/drawing",
  roomEndpoint((req, res) => {
    const params = UpdateRoomDrawingParams.safeParse({
      roomCode: roomCodeFrom(req),
    });
    const body = UpdateRoomDrawingBody.safeParse(req.body);
    if (!params.success) {
      invalidRequest(res, params.error.message);
      return;
    }
    if (!body.success) {
      invalidRequest(res, body.error.message);
      return;
    }

    const view = updateRoomDrawing(
      params.data.roomCode,
      bearerToken(req),
      body.data,
    );
    res.json(UpdateRoomDrawingResponse.parse(view));
  }),
);

export default router;
