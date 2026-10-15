import {
  Circle,
  Eraser,
  Minus,
  PenTool,
  Redo2,
  Square,
  Trash2,
  Undo2,
  CheckCircle2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DrawingPoint, DrawingStroke } from './types';

type Props = {
  strokes: DrawingStroke[];
  revision: number;
  canDraw: boolean;
  drawerName?: string;
  onDone?: () => void;
  onChange?: (strokes: DrawingStroke[]) => void;
  onClearDrawing?: () => void;
};

// Bảng màu 18 màu sắc chuẩn Gartic Phone
const GARTIC_COLORS = [
  '#000000', '#555555', // Đen, Xám đậm
  '#ffffff', '#aaaaaa', // Trắng, Xám nhạt
  '#0055ff', '#00ccff', // Xanh dương, Xanh biển
  '#008800', '#16db65', // Xanh lá đậm, Xanh lá tươi
  '#ff0033', '#ff7700', // Đỏ tươi, Cam
  '#ffdd00', '#ffee55', // Vàng cam, Vàng chanh
  '#a52a2a', '#7a3e1d', // Nâu đỏ, Nâu đất
  '#ff0077', '#ff99cc', // Hồng đậm, Hồng phấn
  '#7b2cbf', '#ffd1a9', // Tím, Da người
];

const GARTIC_SIZES = [
  { size: 3, label: '3px' },
  { size: 6, label: '6px' },
  { size: 12, label: '12px' },
  { size: 20, label: '20px' },
  { size: 32, label: '32px' },
];

type ToolType = 'pen' | 'eraser' | 'rect' | 'circle' | 'line';

export default function OnlineDrawing({
  strokes,
  revision,
  canDraw,
  drawerName,
  onDone,
  onChange,
  onClearDrawing,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const startPointRef = useRef<DrawingPoint | null>(null);
  const currentPointsRef = useRef<DrawingPoint[]>([]);
  const localStrokesRef = useRef<DrawingStroke[]>(strokes);
  const undoStackRef = useRef<DrawingStroke[][]>([]);
  const observedRevision = useRef(-1);

  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedSize, setSelectedSize] = useState(6);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');

  // Vẽ nét lên canvas
  const drawSingleStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: DrawingStroke, width: number, height: number) => {
      if (!stroke.points || stroke.points.length === 0) return;
      const strokeColor = stroke.color || '#000000';
      const strokeSize = stroke.size || 6;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(
          stroke.points[0].x * width,
          stroke.points[0].y * height,
          strokeSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = strokeColor;
        ctx.fill();
        return;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.stroke();
    },
    [],
  );

  // Vẽ lại toàn bộ tranh
  const renderAll = useCallback(
    (data: DrawingStroke[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const stroke of data) {
        drawSingleStroke(ctx, stroke, canvas.width, canvas.height);
      }
    },
    [drawSingleStroke],
  );

  // Đồng bộ khi revision thay đổi từ server / đối thủ
  useEffect(() => {
    if (observedRevision.current === revision) return;
    observedRevision.current = revision;

    if (!drawingRef.current) {
      localStrokesRef.current = strokes;
      renderAll(strokes);
    }
  }, [revision, strokes, renderAll]);

  // Điều chỉnh kích thước canvas sắc nét
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      renderAll(localStrokesRef.current);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [renderAll]);

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
    const pt = getCanvasPoint(event);
    if (!pt) return;

    drawingRef.current = true;
    startPointRef.current = pt;
    currentPointsRef.current = [pt];

    // Lưu snapshot cho Undo
    undoStackRef.current.push([...localStrokesRef.current]);
    if (undoStackRef.current.length > 20) undoStackRef.current.shift();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const strokeColor = activeTool === 'eraser' ? '#ffffff' : selectedColor;
    const strokeSize = activeTool === 'eraser' ? selectedSize * 2 : selectedSize;

    drawSingleStroke(
      ctx,
      { points: [pt], color: strokeColor, size: strokeSize },
      canvas.width,
      canvas.height,
    );
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !drawingRef.current) return;
    const pt = getCanvasPoint(event);
    if (!pt) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const strokeColor = activeTool === 'eraser' ? '#ffffff' : selectedColor;
    const strokeSize = activeTool === 'eraser' ? selectedSize * 2 : selectedSize;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      currentPointsRef.current.push(pt);
      const points = currentPointsRef.current;
      const len = points.length;
      if (len >= 2) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[len - 2].x * canvas.width, points[len - 2].y * canvas.height);
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        ctx.stroke();
      }
    } else if (startPointRef.current) {
      // Xem trước hình dạng: Hình chữ nhật / Tròn / Thẳng
      renderAll(localStrokesRef.current);
      const start = startPointRef.current;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.beginPath();

      if (activeTool === 'line') {
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      } else if (activeTool === 'rect') {
        const x = Math.min(start.x, pt.x) * canvas.width;
        const y = Math.min(start.y, pt.y) * canvas.height;
        const w = Math.abs(pt.x - start.x) * canvas.width;
        const h = Math.abs(pt.y - start.y) * canvas.height;
        ctx.strokeRect(x, y, w, h);
      } else if (activeTool === 'circle') {
        const cx = (start.x + pt.x) / 2 * canvas.width;
        const cy = (start.y + pt.y) / 2 * canvas.height;
        const rx = Math.abs(pt.x - start.x) / 2 * canvas.width;
        const ry = Math.abs(pt.y - start.y) / 2 * canvas.height;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !drawingRef.current) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // bỏ qua nếu đã release
    }
    drawingRef.current = false;

    const strokeColor = activeTool === 'eraser' ? '#ffffff' : selectedColor;
    const strokeSize = activeTool === 'eraser' ? selectedSize * 2 : selectedSize;
    let finalStroke: DrawingStroke | null = null;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      if (currentPointsRef.current.length > 0) {
        finalStroke = {
          points: [...currentPointsRef.current],
          color: strokeColor,
          size: strokeSize,
        };
      }
    } else if (startPointRef.current) {
      const pt = getCanvasPoint(event);
      if (pt) {
        const start = startPointRef.current;
        const points: DrawingPoint[] = [];

        if (activeTool === 'line') {
          points.push(start, pt);
        } else if (activeTool === 'rect') {
          points.push(
            start,
            { x: pt.x, y: start.y },
            pt,
            { x: start.x, y: pt.y },
            start,
          );
        } else if (activeTool === 'circle') {
          const cx = (start.x + pt.x) / 2;
          const cy = (start.y + pt.y) / 2;
          const rx = Math.abs(pt.x - start.x) / 2;
          const ry = Math.abs(pt.y - start.y) / 2;
          for (let angle = 0; angle <= 360; angle += 15) {
            const rad = (angle * Math.PI) / 180;
            points.push({
              x: cx + rx * Math.cos(rad),
              y: cy + ry * Math.sin(rad),
            });
          }
        }

        if (points.length > 0) {
          finalStroke = { points, color: strokeColor, size: strokeSize };
        }
      }
    }

    if (finalStroke) {
      const nextStrokes = [...localStrokesRef.current, finalStroke];
      localStrokesRef.current = nextStrokes;
      renderAll(nextStrokes);
      onChange?.(nextStrokes);
    }

    startPointRef.current = null;
    currentPointsRef.current = [];
  };

  const handleUndo = () => {
    if (!canDraw || undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current.pop();
    if (previous !== undefined) {
      localStrokesRef.current = previous;
      renderAll(previous);
      onChange?.(previous);
    }
  };

  const handleClearAll = () => {
    if (!canDraw) return;
    undoStackRef.current.push([...localStrokesRef.current]);
    localStrokesRef.current = [];
    renderAll([]);
    onClearDrawing?.();
  };

  return (
    <div className="gartic-draw-wrapper">
      <div className="gartic-console-frame">
        {/* CỘT BẢNG MÀU BÊN TRÁI (LEFT PALETTE) */}
        {canDraw && (
          <aside className="gartic-left-panel">
            <div className="gartic-palette-grid">
              {GARTIC_COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className={`gartic-color-btn ${selectedColor === c && activeTool !== 'eraser' ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    setSelectedColor(c);
                    if (activeTool === 'eraser') setActiveTool('pen');
                  }}
                  title={`Chọn màu ${c}`}
                />
              ))}
            </div>
            {/* Ô xem trước màu đang chọn */}
            <div className="gartic-current-color-preview" style={{ backgroundColor: activeTool === 'eraser' ? '#ffffff' : selectedColor }} />
          </aside>
        )}

        {/* KHUNG VẼ TRANG GIẤY Ở GIỮA (CANVAS) */}
        <div className="gartic-canvas-stage">
          {!canDraw && drawerName && (
            <div className="gartic-spectator-badge">
              <span className="live-dot pulse" /> Đang xem {drawerName} vẽ trực tiếp…
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`gartic-canvas-surface ${canDraw ? 'pen-active' : 'read-only'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>

        {/* CỘT CÔNG CỤ BÊN PHẢI (RIGHT TOOLS) */}
        {canDraw && (
          <aside className="gartic-right-panel">
            <div className="gartic-tools-grid">
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
                onClick={() => setActiveTool('pen')}
                title="Bút vẽ tự do"
              >
                <PenTool size={18} />
              </button>
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
                onClick={() => setActiveTool('eraser')}
                title="Cục tẩy"
              >
                <Eraser size={18} />
              </button>
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'rect' ? 'active' : ''}`}
                onClick={() => setActiveTool('rect')}
                title="Hình chữ nhật"
              >
                <Square size={18} />
              </button>
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'circle' ? 'active' : ''}`}
                onClick={() => setActiveTool('circle')}
                title="Hình tròn"
              >
                <Circle size={18} />
              </button>
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'line' ? 'active' : ''}`}
                onClick={() => setActiveTool('line')}
                title="Đường thẳng"
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                className="gartic-tool-btn danger"
                onClick={handleClearAll}
                title="Xóa trắng bảng vẽ"
              >
                <Trash2 size={18} />
              </button>
              <button
                type="button"
                className="gartic-tool-btn"
                onClick={handleUndo}
                title="Hoàn tác (Undo)"
              >
                <Undo2 size={18} />
              </button>
              <button
                type="button"
                className="gartic-tool-btn"
                onClick={handleUndo}
                title="Làm lại (Redo)"
              >
                <Redo2 size={18} />
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* THANH ĐIỀU KHIỂN BÊN DƯỚI (BOTTOM BAR) */}
      {canDraw && (
        <div className="gartic-bottom-bar">
          <div className="gartic-size-picker">
            {GARTIC_SIZES.map((item) => (
              <button
                key={item.size}
                type="button"
                className={`gartic-size-dot-btn ${selectedSize === item.size ? 'active' : ''}`}
                onClick={() => setSelectedSize(item.size)}
                title={`Kích thước ${item.label}`}
              >
                <span
                  className="gartic-size-indicator"
                  style={{
                    width: Math.min(item.size * 1.3, 20),
                    height: Math.min(item.size * 1.3, 20),
                  }}
                />
              </button>
            ))}
          </div>

          {onDone && (
            <button
              type="button"
              className="gartic-done-btn"
              onClick={onDone}
              title="Bấm khi bạn đã vẽ xong để bạn bè vào đoán ngay lập tức!"
            >
              <CheckCircle2 size={22} className="check-icon" />
              <span>DONE!</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
