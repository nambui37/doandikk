import { Eraser, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DrawingPoint, DrawingStroke } from './types';

type Props = {
  strokes: DrawingStroke[];
  revision: number;
  canDraw: boolean;
  onChange?: (strokes: DrawingStroke[]) => void;
  onLivePoint?: (point: DrawingPoint, isNewStroke: boolean, color?: string, size?: number) => void;
  onClearDrawing?: () => void;
};

const COLORS = ['#1e2433', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
const SIZES = [
  { label: 'Mảnh', value: 3 },
  { label: 'Vừa', value: 6 },
  { label: 'Dày', value: 12 },
];

export default function OnlineDrawing({
  strokes,
  revision,
  canDraw,
  onChange,
  onLivePoint,
  onClearDrawing,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentPointsRef = useRef<DrawingPoint[]>([]);
  const localStrokesRef = useRef<DrawingStroke[]>(strokes);
  const observedRevision = useRef(-1);

  const [color, setColor] = useState('#1e2433');
  const [size, setSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  // Vẽ lại toàn bộ strokes lên canvas
  const renderAll = useCallback((data: DrawingStroke[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of data) {
      if (!stroke.points || stroke.points.length === 0) continue;
      const strokeColor = stroke.color || '#1e2433';
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

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      }
      ctx.stroke();
    }
  }, []);

  // Cập nhật khi nhận revision mới từ server hoặc bạn chơi
  useEffect(() => {
    if (observedRevision.current === revision) return;
    observedRevision.current = revision;

    // Nếu không đang trong lúc vẽ thì sync ngay
    if (!drawingRef.current) {
      localStrokesRef.current = strokes;
      renderAll(strokes);
    }
  }, [revision, strokes, renderAll]);

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>): DrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;

    const pt = getCanvasPoint(event);
    if (!pt) return;

    const strokeColor = isEraser ? '#fcfbf8' : color;
    const strokeSize = isEraser ? size * 2.5 : size;

    currentPointsRef.current = [pt];

    // Vẽ điểm đầu tiên trực tiếp
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

    onLivePoint?.(pt, true, strokeColor, strokeSize);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !drawingRef.current) return;
    const pt = getCanvasPoint(event);
    if (!pt) return;

    // Bỏ giới hạn số điểm: Vẽ dài hay ngắn tùy thích!
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

    onLivePoint?.(pt, false, strokeColor, strokeSize);
  };

  const handlePointerUp = () => {
    if (!canDraw || !drawingRef.current) return;
    drawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      const strokeColor = isEraser ? '#fcfbf8' : color;
      const strokeSize = isEraser ? size * 2.5 : size;
      const newStroke: DrawingStroke = {
        points: [...currentPointsRef.current],
        color: strokeColor,
        size: strokeSize,
      };

      // Thêm nét mới vào danh sách không giới hạn
      const updated = [...localStrokesRef.current, newStroke];
      localStrokesRef.current = updated;
      currentPointsRef.current = [];
      onChange?.(updated);
    }
  };

  const handleClear = () => {
    if (!canDraw) return;
    localStrokesRef.current = [];
    currentPointsRef.current = [];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onClearDrawing?.();
    onChange?.([]);
  };

  const handleUndo = () => {
    if (!canDraw || localStrokesRef.current.length === 0) return;
    localStrokesRef.current.pop();
    renderAll(localStrokesRef.current);
    onChange?.(localStrokesRef.current);
  };

  return (
    <div className="draw-container">
      <div className="draw-tools-bar">
        <div className="draw-status-label">
          {canDraw ? (
            <span className="live-indicator">
              <span className="live-dot pulse" /> Bảng vẽ của bạn (Đang truyền trực tiếp)
            </span>
          ) : (
            <span className="live-indicator remote">
              <span className="live-dot pulse" /> Bạn bè đang vẽ trực tiếp…
            </span>
          )}
        </div>

        {canDraw && (
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
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              title="Xóa trắng bảng vẽ"
            >
              <Trash2 size={15} /> Xóa bảng
            </button>
          </div>
        )}
      </div>

      <div className={`draw-area ${canDraw ? '' : 'remote-drawing'}`}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={380}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label={canDraw ? 'Bảng vẽ của bạn' : 'Bảng vẽ của bạn bè'}
        />
      </div>
    </div>
  );
}
