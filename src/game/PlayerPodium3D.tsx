import { Canvas } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { Crown } from 'lucide-react';
import type { RoomPlayer } from './types';
import Avatar3D from './Avatar3D';

interface Props {
  player: RoomPlayer;
  isMe: boolean;
  avatarIndex: number;
}

export default function PlayerPodium3D({ player, isMe, avatarIndex }: Props) {
  return (
    <div className={`player-podium-card ${isMe ? 'is-me' : ''} ${player.isHost ? 'is-host' : ''}`}>
      {/* KHỐI 3D PODIUM VÀ AVATAR NHÚN NHẢY */}
      <div className="podium-canvas-wrapper">
        {/* Vương miện vàng 3D trên đầu chủ phòng */}
        {player.isHost && (
          <div className="host-floating-crown-badge">
            <Crown size={24} className="crown-shining-icon" />
          </div>
        )}

        {/* Khung 3D Avatar Chibi */}
        <div className="podium-avatar-3d-box">
          <Avatar3D
            avatarIndex={avatarIndex}
            flashlightEnabled={false}
          />
        </div>

        {/* Bục tròn 3D phát sáng bên dưới chân */}
        <div className="podium-pedestal-disk">
          <div className="pedestal-surface" />
          <div className="pedestal-glow-ring" />
        </div>
      </div>

      {/* THÔNG TIN NGƯỜI CHƠI BÊN DƯỚI BỤC */}
      <div className="podium-player-meta">
        <div className="podium-name-tag">
          <span className="player-display-name">{player.name}</span>
          {isMe && <span className="me-badge-mini">Bạn</span>}
        </div>

        <div className="podium-role-badge">
          {player.isHost ? (
            <span className="role-host-pill">
              <Crown size={12} /> Chủ phòng
            </span>
          ) : (
            <span className="role-ready-pill">
              <span className="ready-green-dot" /> Sẵn sàng
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
