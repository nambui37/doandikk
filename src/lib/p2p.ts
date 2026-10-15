import Peer, { type DataConnection } from 'peerjs';
import type { DrawingStroke, RoomAction, RoomView } from '../game/types';

export type P2PMessage =
  | { type: 'STATE_SYNC'; view: RoomView }
  | { type: 'DRAW_STROKE'; stroke: DrawingStroke; revision: number }
  | { type: 'SYNC_STROKES'; strokes: DrawingStroke[]; revision: number }
  | { type: 'DRAW_POINT'; point: { x: number; y: number }; isNewStroke: boolean; color?: string; size?: number }
  | { type: 'CLEAR_DRAWING'; revision: number }
  | { type: 'REQUEST_ACTION'; action: RoomAction };

export class P2PManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private onMessageCallback: ((msg: P2PMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  public isConnected = false;

  constructor(
    private roomCode: string,
    private isHost: boolean,
  ) {}

  public init(
    onMessage: (msg: P2PMessage) => void,
    onConnect?: () => void,
    onDisconnect?: () => void,
  ) {
    this.onMessageCallback = onMessage;
    this.onConnectCallback = onConnect || null;
    this.onDisconnectCallback = onDisconnect || null;

    const peerId = this.isHost
      ? `hbomy-${this.roomCode.toLowerCase()}`
      : `hbomy-guest-${this.roomCode.toLowerCase()}-${Math.floor(Math.random() * 10000)}`;

    try {
      this.peer = new Peer(peerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', () => {
        if (!this.isHost) {
          // Guest kết nối tới Host
          const hostPeerId = `hbomy-${this.roomCode.toLowerCase()}`;
          this.connectToPeer(hostPeerId);
        }
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        // Lỗi kết nối P2P (vd ID đã tồn tại do host refresh) -> Im lặng fallback sang API
        console.warn('P2P connection notice:', err.type);
      });
    } catch (e) {
      console.warn('P2P initialization fallback:', e);
    }
  }

  private connectToPeer(targetId: string) {
    if (!this.peer) return;
    const conn = this.peer.connect(targetId, { reliable: true });
    this.setupConnection(conn);
  }

  private setupConnection(conn: DataConnection) {
    this.connection = conn;

    conn.on('open', () => {
      this.isConnected = true;
      this.onConnectCallback?.();
    });

    conn.on('data', (data) => {
      try {
        const msg = data as P2PMessage;
        this.onMessageCallback?.(msg);
      } catch (err) {
        console.error('Invalid P2P message', err);
      }
    });

    conn.on('close', () => {
      this.isConnected = false;
      this.onDisconnectCallback?.();
    });

    conn.on('error', () => {
      this.isConnected = false;
    });
  }

  public send(msg: P2PMessage) {
    if (this.connection && this.connection.open) {
      try {
        this.connection.send(msg);
      } catch {
        // fallback
      }
    }
  }

  public broadcast(msg: P2PMessage) {
    this.send(msg);
  }

  public destroy() {
    this.isConnected = false;
    try {
      this.connection?.close();
      this.peer?.destroy();
    } catch {
      // ignore
    }
    this.connection = null;
    this.peer = null;
  }
}
