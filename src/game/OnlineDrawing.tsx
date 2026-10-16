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
  PaintBucket,
  Highlighter,
  Triangle,
  Star,
  Heart,
  Maximize,
  Minimize,
  Smartphone,
  RotateCw,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DrawingPoint, DrawingStroke } from './types';
import { floodFill } from './floodFill';
import { drawStar, drawHeart, drawTriangle } from './shapeDrawers';
import { soundManager } from '../lib/soundManager';

type Props = {
  strokes: DrawingStroke[];
  revision: number;
  canDraw: boolean;
  drawerName?: string;
  onDone?: (strokes?: DrawingStroke[]) => void;
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

export type ToolType =
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'bucket'
  | 'rect'
  | 'rect_fill'
  | 'circle'
  | 'circle_fill'
  | 'triangle'
  | 'triangle_fill'
  | 'star'
  | 'heart'
  | 'line';

export default function OnlineDrawing({
  strokes,
  revision,
  canDraw,
  drawerName,
  onDone,
  onChange,
  onClearDrawing,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const startPointRef = useRef<DrawingPoint | null>(null);
  const currentPointsRef = useRef<DrawingPoint[]>([]);
  const localStrokesRef = useRef<DrawingStroke[]>(strokes);
  const undoStackRef = useRef<DrawingStroke[][]>([]);
  const redoStackRef = useRef<DrawingStroke[][]>([]);
  const observedRevision = useRef(-1);

  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedSize, setSelectedSize] = useState(6);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);

  // Đồng bộ trạng thái Fullscreen khi người dùng thoát bằng phím Esc hoặc gesture
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    soundManager.playClick();
    try {
      if (!document.fullscreenElement) {
        const el = wrapperRef.current || document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen not supported or blocked:', err);
    }
  };

  const toggleLandscape = async () => {
    soundManager.playClick();
    const nextState = !isLandscapeMode;
    setIsLandscapeMode(nextState);

    try {
      if (nextState) {
        // Cố gắng khóa hướng xoay màn hình sang landscape nếu trình duyệt di động hỗ trợ
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        }
        // Tự động kích hoạt toàn màn hình nếu chưa bật
        if (!document.fullscreenElement) {
          const el = wrapperRef.current || document.documentElement;
          if (el.requestFullscreen) await el.requestFullscreen().catch(() => {});
          else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen().catch(() => {});
        }
      } else {
        if (screen.orientation && (screen.orientation as any).unlock) {
          (screen.orientation as any).unlock();
        }
      }
    } catch {
      // bỏ qua lỗi trên trình duyệt không hỗ trợ lock orientation
    }
  };

  // Vẽ nét lên canvas
  const drawSingleStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: DrawingStroke, width: number, height: number) => {
      if (!stroke.points || stroke.points.length === 0) return;
      const strokeColor = stroke.color || '#000000';
      const strokeSize = stroke.size || 6;

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Thùng sơn đổ màu (Flood Fill trong phạm vi khép kín)
      if (stroke.shape === 'fill') {
        const pt = stroke.points[0];
        floodFill(ctx, pt.x * width, pt.y * height, strokeColor, width, height);
        ctx.restore();
        return;
      }

      // 2. Chấm điểm đơn
      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(
          stroke.points[0].x * width,
          stroke.points[0].y * height,
          strokeSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
        return;
      }

      // 3. Hình chữ nhật đặc (Filled Rect)
      if (stroke.shape === 'rect_fill') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const x = Math.min(p0.x, p1.x) * width;
        const y = Math.min(p0.y, p1.y) * height;
        const w = Math.abs(p1.x - p0.x) * width;
        const h = Math.abs(p1.y - p0.y) * height;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
        return;
      }

      // 4. Hình chữ nhật viền (Hollow Rect)
      const isRect =
        stroke.shape === 'rect' ||
        (stroke.points.length === 5 &&
          Math.abs(stroke.points[0].x - stroke.points[4].x) < 0.001 &&
          Math.abs(stroke.points[0].y - stroke.points[4].y) < 0.001);

      if (isRect) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        return;
      }

      // 5. Hình tròn đặc (Filled Circle)
      if (stroke.shape === 'circle_fill') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const cx = ((p0.x + p1.x) / 2) * width;
        const cy = ((p0.y + p1.y) / 2) * height;
        const rx = (Math.abs(p1.x - p0.x) / 2) * width;
        const ry = (Math.abs(p1.y - p0.y) / 2) * height;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      // 6. Hình tròn viền (Hollow Circle)
      if (stroke.shape === 'circle') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const cx = ((p0.x + p1.x) / 2) * width;
        const cy = ((p0.y + p1.y) / 2) * height;
        const rx = (Math.abs(p1.x - p0.x) / 2) * width;
        const ry = (Math.abs(p1.y - p0.y) / 2) * height;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // 7. Tam giác
      if (stroke.shape === 'triangle' || stroke.shape === 'triangle_fill') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        drawTriangle(
          ctx,
          p0.x * width,
          p0.y * height,
          p1.x * width,
          p1.y * height,
          stroke.shape === 'triangle_fill',
        );
        ctx.restore();
        return;
      }

      // 8. Ngôi sao
      if (stroke.shape === 'star') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const cx = ((p0.x + p1.x) / 2) * width;
        const cy = ((p0.y + p1.y) / 2) * height;
        const rx = (Math.abs(p1.x - p0.x) / 2) * width;
        const ry = (Math.abs(p1.y - p0.y) / 2) * height;
        const rOuter = Math.max(rx, ry);
        drawStar(ctx, cx, cy, rOuter, rOuter * 0.45, 5, true);
        ctx.restore();
        return;
      }

      // 9. Trái tim
      if (stroke.shape === 'heart') {
        const p0 = stroke.points[0];
        const p1 = stroke.points[1] || stroke.points[stroke.points.length - 1];
        const cx = ((p0.x + p1.x) / 2) * width;
        const cy = ((p0.y + p1.y) / 2) * height;
        const w = Math.abs(p1.x - p0.x) * width;
        const h = Math.abs(p1.y - p0.y) * height;
        drawHeart(ctx, cx, cy, w, h, true);
        ctx.restore();
        return;
      }

      // 10. Đoạn thẳng
      if (stroke.shape === 'line' || stroke.points.length === 2) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
        ctx.lineTo(stroke.points[1].x * width, stroke.points[1].y * height);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // 11. Bút dạ quang (Highlighter)
      if (stroke.shape === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = strokeSize * 2.5;
        ctx.lineCap = 'square';
      }

      // 12. Nét vẽ tự do (Smooth freehand curve)
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
      let i = 1;
      for (; i < stroke.points.length - 1; i++) {
        const xc = ((stroke.points[i].x + stroke.points[i + 1].x) / 2) * width;
        const yc = ((stroke.points[i].y + stroke.points[i + 1].y) / 2) * height;
        ctx.quadraticCurveTo(stroke.points[i].x * width, stroke.points[i].y * height, xc, yc);
      }
      ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
      ctx.stroke();
      ctx.restore();
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

  const prevCanDrawRef = useRef(canDraw);

  // Khi chuyển vai trò (Ví dụ: từ Người đoán chuyển thành Người vẽ lượt mới)
  useEffect(() => {
    if (!prevCanDrawRef.current && canDraw) {
      // Vừa chuyển từ người đoán sang người vẽ: Dọn sạch mọi nét vẽ cũ của người chơi trước
      localStrokesRef.current = strokes.length > 0 ? [...strokes] : [];
      undoStackRef.current = [];
      redoStackRef.current = [];
      observedRevision.current = revision;
      renderAll(localStrokesRef.current);
    }
    prevCanDrawRef.current = canDraw;
  }, [canDraw, strokes, revision, renderAll]);

  // Đồng bộ khi revision thay đổi từ server / đối thủ
  useEffect(() => {
    // 1. Nếu là người vẽ (drawer):
    if (canDraw) {
      // Khi server gửi danh sách nét vẽ rỗng (ví dụ: chuyển vòng mới hoặc bấm Xóa bảng vẽ)
      // Chỉ reset nếu revision thực sự mới hơn VÀ local strokes đã rỗng (hoặc chưa vẽ gì)
      if (strokes.length === 0 && revision > observedRevision.current && localStrokesRef.current.length === 0) {
        observedRevision.current = revision;
        renderAll([]);
        return;
      }

      // Nếu local chưa có nét nào nhưng server có sẵn nét (vừa vào lại phòng khi đang là lượt vẽ)
      if (localStrokesRef.current.length === 0 && strokes.length > 0 && revision > observedRevision.current) {
        localStrokesRef.current = strokes;
        observedRevision.current = revision;
        renderAll(strokes);
      }
      return;
    }

    // 2. Nếu là người xem / người đoán:
    if (revision <= observedRevision.current) return;
    observedRevision.current = revision;

    if (strokes.length === 0) {
      localStrokesRef.current = [];
      undoStackRef.current = [];
      redoStackRef.current = [];
      renderAll([]);
      return;
    }

    localStrokesRef.current = strokes;
    renderAll(strokes);
  }, [revision, strokes, renderAll, canDraw]);

  // Điều chỉnh kích thước canvas sắc nét và tự động thích ứng với xoay màn hình (ResizeObserver)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const applySize = (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const newW = Math.round(w * dpr);
      const newH = Math.round(h * dpr);
      if (canvas.width !== newW || canvas.height !== newH) {
        canvas.width = newW;
        canvas.height = newH;
        renderAll(localStrokesRef.current);
      }
    };

    const rect = canvas.getBoundingClientRect();
    applySize(rect.width, rect.height);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          applySize(width, height);
        }
      });
      ro.observe(canvas);
    }

    const onWinResize = () => {
      const r = canvas.getBoundingClientRect();
      applySize(r.width, r.height);
    };
    window.addEventListener('resize', onWinResize);
    window.addEventListener('orientationchange', onWinResize);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', onWinResize);
      window.removeEventListener('orientationchange', onWinResize);
    };
  }, [renderAll]);

  // Ngăn chặn gián đoạn cử chỉ cuộn trang / swipe của Safari iOS khi chạm hoặc vẽ trên canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventTouchDefault = (e: TouchEvent) => {
      if (canDraw && e.cancelable) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventTouchDefault, { passive: false });
    canvas.addEventListener('touchmove', preventTouchDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventTouchDefault);
      canvas.removeEventListener('touchmove', preventTouchDefault);
    };
  }, [canDraw]);

  const getCanvasPoint = (event: { clientX: number; clientY: number }): DrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    if (event.cancelable) event.preventDefault();
    const pt = getCanvasPoint(event);
    if (!pt) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    // 🪣 THÙNG SƠN ĐỔ MÀU (FLOOD FILL)
    if (activeTool === 'bucket') {
      undoStackRef.current.push([...localStrokesRef.current]);
      if (undoStackRef.current.length > 30) undoStackRef.current.shift();
      redoStackRef.current = [];

      floodFill(ctx, pt.x * canvas.width, pt.y * canvas.height, selectedColor, canvas.width, canvas.height);

      const fillStroke: DrawingStroke = {
        points: [pt],
        color: selectedColor,
        size: 1,
        shape: 'fill',
      };
      const nextStrokes = [...localStrokesRef.current, fillStroke];
      localStrokesRef.current = nextStrokes;
      onChange?.(nextStrokes);
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // bỏ qua nếu browser không hỗ trợ
    }
    drawingRef.current = true;
    startPointRef.current = pt;
    currentPointsRef.current = [pt];

    // Lưu snapshot cho Undo
    undoStackRef.current.push([...localStrokesRef.current]);
    if (undoStackRef.current.length > 30) undoStackRef.current.shift();
    redoStackRef.current = [];

    const strokeColor = activeTool === 'eraser' ? '#ffffff' : selectedColor;
    const strokeSize = activeTool === 'eraser' ? selectedSize * 2 : selectedSize;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      drawSingleStroke(
        ctx,
        { points: [pt], color: strokeColor, size: strokeSize },
        canvas.width,
        canvas.height,
      );
    } else if (activeTool === 'highlighter') {
      drawSingleStroke(
        ctx,
        { points: [pt], color: strokeColor, size: strokeSize, shape: 'highlighter' },
        canvas.width,
        canvas.height,
      );
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !drawingRef.current) return;
    if (event.cancelable) event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    // Lấy toàn bộ coalesced events để không bao giờ bị mất nét khi quẹt nhanh trên màn hình cảm ứng
    const nativeEvt = event.nativeEvent as any;
    const rawEvents: Array<{ clientX: number; clientY: number }> =
      typeof nativeEvt?.getCoalescedEvents === 'function' && nativeEvt.getCoalescedEvents().length > 0
        ? nativeEvt.getCoalescedEvents()
        : [event];

    const strokeColor = activeTool === 'eraser' ? '#ffffff' : selectedColor;
    const strokeSize = activeTool === 'eraser' ? selectedSize * 2 : selectedSize;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const rect = canvas.getBoundingClientRect();
      for (const e of rawEvents) {
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const pt = { x, y };

        const len = currentPointsRef.current.length;
        if (len > 0) {
          const prev = currentPointsRef.current[len - 1];
          // Nối nét mượt và liên tục tuyệt đối, không góc cạnh hay gián đoạn
          ctx.beginPath();
          ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
          ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
          ctx.stroke();
        }
        currentPointsRef.current.push(pt);
      }
      ctx.restore();
    } else if (activeTool === 'highlighter') {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = strokeSize * 2.5;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';

      const rect = canvas.getBoundingClientRect();
      for (const e of rawEvents) {
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const pt = { x, y };

        const len = currentPointsRef.current.length;
        if (len > 0) {
          const prev = currentPointsRef.current[len - 1];
          ctx.beginPath();
          ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
          ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
          ctx.stroke();
        }
        currentPointsRef.current.push(pt);
      }
      ctx.restore();
    } else if (startPointRef.current) {
      const pt = getCanvasPoint(event);
      if (!pt) return;

      // Xem trước trực tiếp hình dạng (Live Preview)
      renderAll(localStrokesRef.current);
      const start = startPointRef.current;

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const x0 = start.x * canvas.width;
      const y0 = start.y * canvas.height;
      const x1 = pt.x * canvas.width;
      const y1 = pt.y * canvas.height;

      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      } else if (activeTool === 'rect') {
        const x = Math.min(x0, x1);
        const y = Math.min(y0, y1);
        const w = Math.abs(x1 - x0);
        const h = Math.abs(y1 - y0);
        ctx.strokeRect(x, y, w, h);
      } else if (activeTool === 'rect_fill') {
        const x = Math.min(x0, x1);
        const y = Math.min(y0, y1);
        const w = Math.abs(x1 - x0);
        const h = Math.abs(y1 - y0);
        ctx.fillRect(x, y, w, h);
      } else if (activeTool === 'circle') {
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const rx = Math.abs(x1 - x0) / 2;
        const ry = Math.abs(y1 - y0) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTool === 'circle_fill') {
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const rx = Math.abs(x1 - x0) / 2;
        const ry = Math.abs(y1 - y0) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeTool === 'triangle') {
        drawTriangle(ctx, x0, y0, x1, y1, false);
      } else if (activeTool === 'triangle_fill') {
        drawTriangle(ctx, x0, y0, x1, y1, true);
      } else if (activeTool === 'star') {
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const rx = Math.abs(x1 - x0) / 2;
        const ry = Math.abs(y1 - y0) / 2;
        const rOuter = Math.max(rx, ry);
        drawStar(ctx, cx, cy, rOuter, rOuter * 0.45, 5, true);
      } else if (activeTool === 'heart') {
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const w = Math.abs(x1 - x0);
        const h = Math.abs(y1 - y0);
        drawHeart(ctx, cx, cy, w, h, true);
      }
      ctx.restore();
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !drawingRef.current) return;
    try {
      if (event.currentTarget && typeof event.currentTarget.hasPointerCapture === 'function') {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }
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
          shape: 'free',
        };
      }
    } else if (activeTool === 'highlighter') {
      if (currentPointsRef.current.length > 0) {
        finalStroke = {
          points: [...currentPointsRef.current],
          color: strokeColor,
          size: strokeSize,
          shape: 'highlighter',
        };
      }
    } else if (startPointRef.current) {
      const pt = getCanvasPoint(event) || startPointRef.current;
      const start = startPointRef.current;

      if (activeTool === 'line') {
        finalStroke = { points: [start, pt], color: strokeColor, size: strokeSize, shape: 'line' };
      } else if (activeTool === 'rect') {
        finalStroke = {
          points: [
            start,
            { x: pt.x, y: start.y },
            pt,
            { x: start.x, y: pt.y },
            start,
          ],
          color: strokeColor,
          size: strokeSize,
          shape: 'rect',
        };
      } else if (activeTool === 'rect_fill') {
        finalStroke = { points: [start, pt], color: strokeColor, size: strokeSize, shape: 'rect_fill' };
      } else if (activeTool === 'circle') {
        finalStroke = { points: [start, pt], color: strokeColor, size: strokeSize, shape: 'circle' };
      } else if (activeTool === 'circle_fill') {
        finalStroke = { points: [start, pt], color: strokeColor, size: strokeSize, shape: 'circle_fill' };
      } else if (activeTool === 'triangle') {
        finalStroke = { points: [start, pt], color: strokeColor, size: strokeSize, shape: 'triangle' };
      } else if (activeTool === 'triangle_fill') {
        finalStroke = { points: [start, pt], color: strokeColor, size: strokeSize, shape: 'triangle_fill' };
      } else if (activeTool === 'star') {
        finalStroke = { points: [start, pt], color: strokeColor, size: strokeSize, shape: 'star' };
      } else if (activeTool === 'heart') {
        finalStroke = { points: [start, pt], color: strokeColor, size: strokeSize, shape: 'heart' };
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
      redoStackRef.current.push([...localStrokesRef.current]);
      localStrokesRef.current = previous;
      renderAll(previous);
      onChange?.(previous);
    }
  };

  const handleRedo = () => {
    if (!canDraw || redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop();
    if (next !== undefined) {
      undoStackRef.current.push([...localStrokesRef.current]);
      localStrokesRef.current = next;
      renderAll(next);
      onChange?.(next);
    }
  };

  const handleClearAll = () => {
    if (!canDraw) return;
    undoStackRef.current.push([...localStrokesRef.current]);
    redoStackRef.current = [];
    localStrokesRef.current = [];
    renderAll([]);
    onClearDrawing?.();
  };

  return (
    <div
      ref={wrapperRef}
      className={`gartic-draw-wrapper ${isLandscapeMode ? 'mobile-force-landscape' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}
    >
      {/* THANH TIỆN ÍCH MOBILE: TOÀN MÀN HÌNH, TỰ ĐỘNG XOAY NGANG & BADGE TRỰC TIẾP KHÔNG CHE KHUNG VẼ */}
      <div className="gartic-mobile-quick-actions">
        {!canDraw && drawerName ? (
          <div className="gartic-live-indicator-pill">
            <span className="live-dot pulse" /> Trực tiếp: {drawerName} đang vẽ
          </div>
        ) : <div />}

        <div className="gartic-quick-buttons-group">
          <button
            type="button"
            className={`mobile-quick-btn ${isFullscreen ? 'active' : ''}`}
            onClick={toggleFullscreen}
            title="Chuyển đổi toàn màn hình (Fullscreen)"
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>

          <button
            type="button"
            className={`mobile-quick-btn ${isLandscapeMode ? 'active landscape' : ''}`}
            onClick={toggleLandscape}
            title="Tự động xoay ngang và mở rộng tối đa màn hình điện thoại"
          >
            <Smartphone size={15} className={isLandscapeMode ? 'rotate-90-icon' : ''} />
            <span>{isLandscapeMode ? 'Đứng lại' : 'Xoay ngang vẽ'}</span>
          </button>
        </div>
      </div>

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

        {/* KHUNG VẼ TRANG GIẤY Ở GIỮA (CANVAS 100% THOÁNG KHÔNG BỊ CHỮ CHE) */}
        <div className="gartic-canvas-stage">
          <canvas
            ref={canvasRef}
            className={`gartic-canvas-surface ${canDraw ? 'pen-active' : 'read-only'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={(e) => {
              if (drawingRef.current) handlePointerUp(e);
            }}
          />
        </div>

        {/* CỘT CÔNG CỤ BÊN PHẢI (RIGHT TOOLS - 16 CÔNG CỤ ĐA DẠNG) */}
        {canDraw && (
          <aside className="gartic-right-panel">
            <div className="gartic-tools-grid">
              {/* Hàng 1: Bút vẽ thường | Bút dạ quang */}
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
                className={`gartic-tool-btn ${activeTool === 'highlighter' ? 'active' : ''}`}
                onClick={() => setActiveTool('highlighter')}
                title="Bút dạ quang (Highlighter)"
              >
                <Highlighter size={18} />
              </button>

              {/* Hàng 2: Thùng sơn đổ màu | Cục tẩy */}
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'bucket' ? 'active' : ''}`}
                onClick={() => setActiveTool('bucket')}
                title="Thùng sơn đổ màu (Flood Fill)"
              >
                <PaintBucket size={18} />
              </button>
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
                onClick={() => setActiveTool('eraser')}
                title="Cục tẩy trắng"
              >
                <Eraser size={18} />
              </button>

              {/* Hàng 3: Hình chữ nhật viền | Hình chữ nhật đặc */}
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'rect' ? 'active' : ''}`}
                onClick={() => setActiveTool('rect')}
                title="Hình chữ nhật (Viền)"
              >
                <Square size={18} />
              </button>
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'rect_fill' ? 'active' : ''}`}
                onClick={() => setActiveTool('rect_fill')}
                title="Hình chữ nhật (Tô kín đặc)"
              >
                <Square size={18} fill="currentColor" />
              </button>

              {/* Hàng 4: Hình tròn viền | Hình tròn đặc */}
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'circle' ? 'active' : ''}`}
                onClick={() => setActiveTool('circle')}
                title="Hình tròn (Viền)"
              >
                <Circle size={18} />
              </button>
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'circle_fill' ? 'active' : ''}`}
                onClick={() => setActiveTool('circle_fill')}
                title="Hình tròn (Tô kín đặc)"
              >
                <Circle size={18} fill="currentColor" />
              </button>

              {/* Hàng 5: Tam giác viền | Tam giác đặc */}
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'triangle' ? 'active' : ''}`}
                onClick={() => setActiveTool('triangle')}
                title="Hình tam giác (Viền)"
              >
                <Triangle size={18} />
              </button>
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'triangle_fill' ? 'active' : ''}`}
                onClick={() => setActiveTool('triangle_fill')}
                title="Hình tam giác (Tô kín đặc)"
              >
                <Triangle size={18} fill="currentColor" />
              </button>

              {/* Hàng 6: Ngôi sao đặc | Trái tim đặc */}
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'star' ? 'active' : ''}`}
                onClick={() => setActiveTool('star')}
                title="Ngôi sao 5 cánh"
              >
                <Star size={18} fill="currentColor" />
              </button>
              <button
                type="button"
                className={`gartic-tool-btn ${activeTool === 'heart' ? 'active' : ''}`}
                onClick={() => setActiveTool('heart')}
                title="Trái tim"
              >
                <Heart size={18} fill="currentColor" />
              </button>

              {/* Hàng 7: Đường thẳng | Xóa toàn bộ */}
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

              {/* Hàng 8: Hoàn tác (Undo) | Làm lại (Redo) */}
              <button
                type="button"
                className="gartic-tool-btn"
                onClick={handleUndo}
                title="Hoàn tác nét vẽ (Undo)"
              >
                <Undo2 size={18} />
              </button>
              <button
                type="button"
                className="gartic-tool-btn"
                onClick={handleRedo}
                title="Làm lại nét vẽ (Redo)"
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
              onClick={() => onDone(localStrokesRef.current)}
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
