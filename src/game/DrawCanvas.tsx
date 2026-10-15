import { Eraser, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DrawingPoint, DrawingStroke } from './types';

type DrawCanvasProps = { onClear?: () => void };

const COLORS = ['#1e2433', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
const SIZES = [
  { label: 'Mảnh', value: 3 },
  { label: 'Vừa', value: 6 },
  { label: 'Dày', value: 12 },
];

export default function DrawCanvas({ onClear }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const strokesRef = useRef<DrawingStroke[]>([]);
  const currentPointsRef = useRef<DrawingPoint[]>([]);

  const [color, setColor] = useState('#1e2433');
  const [size, setSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>): DrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const renderAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 0) continue;
      ctx.strokeStyle = stroke.color || '#1e2433';
      ctx.lineWidth = stroke.size || 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(
          stroke.points[0].x * canvas.width,
          stroke.points[0].y * canvas.height,
          (stroke.size || 6) / 2,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = stroke.color || '#1e2433';
        ctx.fill();
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      }
      ctx.stroke();
    }
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const pt = getCanvasPoint(event);
    if (!pt) return;

    const strokeColor = isEraser ? '#fcfbf8' : color;
    const strokeSize = isEraser ? size * 2.5 : size;

    currentPointsRef.current = [pt];

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, strokeSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(pt.x * canvas.width, pt.y * canvas.height);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const pt = getCanvasPoint(event);
    if (!pt) return;

    currentPointsRef.current.push(pt);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const strokeColor = isEraser ? '#fcfbf8' : color;
    const strokeSize = isEraser ? size * 2.5 : size;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      const strokeColor = isEraser ? '#fcfbf8' : color;
      const strokeSize = isEraser ? size * 2.5 : size;
      strokesRef.current.push({
        points: [...currentPointsRef.current],
        color: strokeColor,
        size: strokeSize,
      });
      currentPointsRef.current = [];
    }
  };

  const handleClear = () => {
    strokesRef.current = [];
    currentPointsRef.current = [];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onClear?.();
  };

  const handleUndo = () => {
    if (strokesRef.current.length > 0) {
      strokesRef.current.pop();
      renderAll();
    }
  };

  useEffect(() => {
    renderAll();
  }, [renderAll]);

  return (
    <div className="draw-container">
      <div className="draw-tools-bar">
        <div className="draw-palette">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-dot ${color === c && !isEraser ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              title="Chọn màu"
            />
          ))}
          <div className="tool-divider" />
          {SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`size-btn ${size === s.value ? 'active' : ''}`}
              onClick={() => setSize(s.value)}
              title={s.label}
            >
              <span
                style={{
                  width: s.value + 3,
                  height: s.value + 3,
                  backgroundColor: 'currentColor',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
            </button>
          ))}
          <div className="tool-divider" />
          <button
            type="button"
            className={`action-tool-btn ${isEraser ? 'active' : ''}`}
            onClick={() => setIsEraser(!isEraser)}
            title="Tẩy nét vẽ"
          >
            <Eraser size={16} />
          </button>
          <button
            type="button"
            className="action-tool-btn"
            onClick={handleUndo}
            title="Hoàn tác nét vừa vẽ"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        <button
          type="button"
          className="clear-btn"
          onClick={handleClear}
          title="Xóa trắng bảng vẽ"
        >
          <Trash2 size={15} /> Xóa sạch
        </button>
      </div>

      <div className="draw-area">
        <canvas
          ref={canvasRef}
          width={1000}
          height={380}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Bảng vẽ cảm ứng mượt mà"
        />
      </div>
    </div>
  );
}
