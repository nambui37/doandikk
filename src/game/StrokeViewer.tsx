import { useEffect, useRef } from 'react';
import type { DrawingStroke } from './types';

interface Props {
  strokes: DrawingStroke[];
  className?: string;
  width?: number;
  height?: number;
}

export default function StrokeViewer({ strokes, className = '', width = 800, height = 500 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (!stroke.points || stroke.points.length === 0) continue;
      const strokeColor = stroke.color || '#000000';
      const strokeSize = stroke.size || 6;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(
          stroke.points[0].x * canvas.width,
          stroke.points[0].y * canvas.height,
          strokeSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = strokeColor;
        ctx.fill();
        continue;
      }

      // Hình tròn / Elip
      if (stroke.shape === 'circle') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const cx = ((p0.x + p1.x) / 2) * canvas.width;
        const cy = ((p0.y + p1.y) / 2) * canvas.height;
        const rx = (Math.abs(p1.x - p0.x) / 2) * canvas.width;
        const ry = (Math.abs(p1.y - p0.y) / 2) * canvas.height;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      if (stroke.shape === 'rect') {
        ctx.closePath();
      }
      ctx.stroke();
    }
  }, [strokes]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`stroke-viewer-canvas ${className}`}
      style={{
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        aspectRatio: '8 / 5',
        borderRadius: 16,
        background: '#ffffff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'block',
      }}
    />
  );
}
