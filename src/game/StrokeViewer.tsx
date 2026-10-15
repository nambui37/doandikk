import { useEffect, useRef } from 'react';
import type { DrawingStroke } from './types';
import { floodFill } from './floodFill';
import { drawStar, drawHeart, drawTriangle } from './shapeDrawers';

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

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Thùng sơn đổ màu (Flood Fill)
      if (stroke.shape === 'fill') {
        const pt = stroke.points[0];
        floodFill(ctx, pt.x * canvas.width, pt.y * canvas.height, strokeColor, canvas.width, canvas.height);
        ctx.restore();
        continue;
      }

      // 2. Chấm điểm đơn
      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(
          stroke.points[0].x * canvas.width,
          stroke.points[0].y * canvas.height,
          strokeSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
        continue;
      }

      // 3. Hình chữ nhật đặc
      if (stroke.shape === 'rect_fill') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const x = Math.min(p0.x, p1.x) * canvas.width;
        const y = Math.min(p0.y, p1.y) * canvas.height;
        const w = Math.abs(p1.x - p0.x) * canvas.width;
        const h = Math.abs(p1.y - p0.y) * canvas.height;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
        continue;
      }

      // 4. Hình chữ nhật viền
      if (
        stroke.shape === 'rect' ||
        (stroke.points.length === 5 &&
          Math.abs(stroke.points[0].x - stroke.points[4].x) < 0.001 &&
          Math.abs(stroke.points[0].y - stroke.points[4].y) < 0.001)
      ) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // 5. Hình tròn đặc
      if (stroke.shape === 'circle_fill') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const cx = ((p0.x + p1.x) / 2) * canvas.width;
        const cy = ((p0.y + p1.y) / 2) * canvas.height;
        const rx = (Math.abs(p1.x - p0.x) / 2) * canvas.width;
        const ry = (Math.abs(p1.y - p0.y) / 2) * canvas.height;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // 6. Hình tròn viền
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
        ctx.restore();
        continue;
      }

      // 7. Tam giác
      if (stroke.shape === 'triangle' || stroke.shape === 'triangle_fill') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        drawTriangle(
          ctx,
          p0.x * canvas.width,
          p0.y * canvas.height,
          p1.x * canvas.width,
          p1.y * canvas.height,
          stroke.shape === 'triangle_fill',
        );
        ctx.restore();
        continue;
      }

      // 8. Ngôi sao
      if (stroke.shape === 'star') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const cx = ((p0.x + p1.x) / 2) * canvas.width;
        const cy = ((p0.y + p1.y) / 2) * canvas.height;
        const rx = (Math.abs(p1.x - p0.x) / 2) * canvas.width;
        const ry = (Math.abs(p1.y - p0.y) / 2) * canvas.height;
        const rOuter = Math.max(rx, ry);
        drawStar(ctx, cx, cy, rOuter, rOuter * 0.45, 5, true);
        ctx.restore();
        continue;
      }

      // 9. Trái tim
      if (stroke.shape === 'heart') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const cx = ((p0.x + p1.x) / 2) * canvas.width;
        const cy = ((p0.y + p1.y) / 2) * canvas.height;
        const w = Math.abs(p1.x - p0.x) * canvas.width;
        const h = Math.abs(p1.y - p0.y) * canvas.height;
        drawHeart(ctx, cx, cy, w, h, true);
        ctx.restore();
        continue;
      }

      // 10. Đoạn thẳng
      if (stroke.shape === 'line' || stroke.points.length === 2) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
        ctx.lineTo(stroke.points[1].x * canvas.width, stroke.points[1].y * canvas.height);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // 11. Bút dạ quang (Highlighter)
      if (stroke.shape === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = strokeSize * 2.5;
        ctx.lineCap = 'square';
      }

      // 12. Nét vẽ tự do
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      ctx.stroke();
      ctx.restore();
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
