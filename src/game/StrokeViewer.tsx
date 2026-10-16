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

    if (!strokes || strokes.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎨 Chưa có nét vẽ nào ở lượt này', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Hàm chuyển đổi tọa độ chuẩn hóa (0..1) hoặc pixel thực
    const toPx = (pt: { x: number; y: number }) => {
      const isNorm = pt.x <= 1.05 && pt.y <= 1.05;
      return {
        x: isNorm ? pt.x * canvas.width : pt.x,
        y: isNorm ? pt.y * canvas.height : pt.y,
      };
    };

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
        const pt = toPx(stroke.points[0]);
        floodFill(ctx, pt.x, pt.y, strokeColor, canvas.width, canvas.height);
        ctx.restore();
        continue;
      }

      // 2. Chấm điểm đơn
      if (stroke.points.length === 1) {
        const pt = toPx(stroke.points[0]);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, strokeSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // 3. Hình chữ nhật đặc
      if (stroke.shape === 'rect_fill') {
        const p0 = toPx(stroke.points[0]);
        const p1 = toPx(stroke.points[1] || stroke.points[stroke.points.length - 1]);
        const x = Math.min(p0.x, p1.x);
        const y = Math.min(p0.y, p1.y);
        const w = Math.abs(p1.x - p0.x);
        const h = Math.abs(p1.y - p0.y);
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
        const p0 = toPx(stroke.points[0]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = toPx(stroke.points[i]);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // 5. Hình tròn đặc
      if (stroke.shape === 'circle_fill') {
        const p0 = toPx(stroke.points[0]);
        const p1 = toPx(stroke.points[1] || stroke.points[stroke.points.length - 1]);
        const cx = (p0.x + p1.x) / 2;
        const cy = (p0.y + p1.y) / 2;
        const rx = Math.abs(p1.x - p0.x) / 2;
        const ry = Math.abs(p1.y - p0.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // 6. Hình tròn viền
      if (stroke.shape === 'circle') {
        const p0 = toPx(stroke.points[0]);
        const p1 = toPx(stroke.points[1] || stroke.points[stroke.points.length - 1]);
        const cx = (p0.x + p1.x) / 2;
        const cy = (p0.y + p1.y) / 2;
        const rx = Math.abs(p1.x - p0.x) / 2;
        const ry = Math.abs(p1.y - p0.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // 7. Tam giác
      if (stroke.shape === 'triangle' || stroke.shape === 'triangle_fill') {
        const p0 = toPx(stroke.points[0]);
        const p1 = toPx(stroke.points[1] || stroke.points[stroke.points.length - 1]);
        drawTriangle(ctx, p0.x, p0.y, p1.x, p1.y, stroke.shape === 'triangle_fill');
        ctx.restore();
        continue;
      }

      // 8. Ngôi sao
      if (stroke.shape === 'star') {
        const p0 = toPx(stroke.points[0]);
        const p1 = toPx(stroke.points[1] || stroke.points[stroke.points.length - 1]);
        const cx = (p0.x + p1.x) / 2;
        const cy = (p0.y + p1.y) / 2;
        const rx = Math.abs(p1.x - p0.x) / 2;
        const ry = Math.abs(p1.y - p0.y) / 2;
        const rOuter = Math.max(rx, ry);
        drawStar(ctx, cx, cy, rOuter, rOuter * 0.45, 5, true);
        ctx.restore();
        continue;
      }

      // 9. Trái tim
      if (stroke.shape === 'heart') {
        const p0 = toPx(stroke.points[0]);
        const p1 = toPx(stroke.points[1] || stroke.points[stroke.points.length - 1]);
        const cx = (p0.x + p1.x) / 2;
        const cy = (p0.y + p1.y) / 2;
        const w = Math.abs(p1.x - p0.x);
        const h = Math.abs(p1.y - p0.y);
        drawHeart(ctx, cx, cy, w, h, true);
        ctx.restore();
        continue;
      }

      // 10. Đoạn thẳng
      if (stroke.shape === 'line' || stroke.points.length === 2) {
        const p0 = toPx(stroke.points[0]);
        const p1 = toPx(stroke.points[1]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
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

      // 12. Nét vẽ tự do (Smooth quadratic curves)
      const p0 = toPx(stroke.points[0]);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      let i = 1;
      for (; i < stroke.points.length - 1; i++) {
        const pi = toPx(stroke.points[i]);
        const piNext = toPx(stroke.points[i + 1]);
        const xc = (pi.x + piNext.x) / 2;
        const yc = (pi.y + piNext.y) / 2;
        ctx.quadraticCurveTo(pi.x, pi.y, xc, yc);
      }
      if (stroke.points.length > 1) {
        const pLast = toPx(stroke.points[stroke.points.length - 1]);
        ctx.lineTo(pLast.x, pLast.y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [strokes, width, height]);

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
