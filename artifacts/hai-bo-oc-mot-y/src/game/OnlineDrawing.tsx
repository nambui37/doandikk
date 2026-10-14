import { Eraser } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DrawingStroke } from '@workspace/api-client-react';

type Props = { strokes: DrawingStroke[]; revision: number; canDraw: boolean; onChange?: (strokes: DrawingStroke[]) => void };
const MAX_STROKES = 16;
const MAX_POINTS_PER_STROKE = 128;

export default function OnlineDrawing({ strokes, revision, canDraw, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);
  const localStrokes = useRef<DrawingStroke[]>(strokes);
  const observedRevision = useRef(-1);
  const lastSyncAt = useRef(0);

  const paint = useCallback((data: DrawingStroke[]) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#27313b';
    context.lineWidth = 6;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (const stroke of data) {
      if (stroke.points.length < 2) continue;
      context.beginPath();
      context.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (const point of stroke.points.slice(1)) context.lineTo(point.x * canvas.width, point.y * canvas.height);
      context.stroke();
    }
  }, []);

  useEffect(() => {
    if (observedRevision.current === revision) return;
    observedRevision.current = revision;
    if (!drawingRef.current) {
      localStrokes.current = strokes;
      paint(strokes);
    }
  }, [revision, canDraw, paint, strokes]);

  const normalizedPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const pointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const point = normalizedPoint(event);
    currentStroke.current = [point];
    lastSyncAt.current = Date.now();
    const context = canvasRef.current?.getContext('2d');
    if (!context || !canvasRef.current) return;
    context.beginPath();
    context.moveTo(point.x * canvasRef.current.width, point.y * canvasRef.current.height);
  };
  const pointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !drawingRef.current) return;
    const point = normalizedPoint(event);
    if (currentStroke.current.length < MAX_POINTS_PER_STROKE) {
      currentStroke.current.push(point);
    } else if (currentStroke.current.length % 4 === 0) {
      currentStroke.current[currentStroke.current.length - 1] = point;
    }
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.lineTo(point.x * canvas.width, point.y * canvas.height);
    context.strokeStyle = '#27313b';
    context.lineWidth = 6;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
    const now = Date.now();
    if (now - lastSyncAt.current >= 200) {
      lastSyncAt.current = now;
      const previewPoints = [...currentStroke.current];
      if (previewPoints.length === 1) previewPoints.push(previewPoints[0]);
      onChange?.([...localStrokes.current, { points: previewPoints }].slice(-MAX_STROKES));
    }
  };
  const pointerUp = (event?: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const points = currentStroke.current;
    if (event) {
      const finalPoint = normalizedPoint(event);
      if (points.length < MAX_POINTS_PER_STROKE) points.push(finalPoint);
      else points[points.length - 1] = finalPoint;
    }
    if (points.length === 1) points.push(points[0]);
    const next = [...localStrokes.current, { points }].slice(-MAX_STROKES);
    localStrokes.current = next;
    onChange?.(next);
  };
  const clear = () => {
    if (!canDraw) return;
    localStrokes.current = [];
    paint([]);
    onChange?.([]);
  };

  return <>
    <div className="draw-tools"><span>{canDraw ? 'Bảng vẽ của bạn · đang đồng bộ' : 'Nét vẽ trực tiếp của bạn bè'}</span>
      {canDraw && <button type="button" className="clear-btn" onClick={clear} data-testid="button-online-clear-drawing"><Eraser /> Xóa bảng</button>}
    </div>
    <div className={`draw-area ${canDraw ? '' : 'remote-drawing'}`} data-testid="online-drawing-board">
      <canvas ref={canvasRef} width={1000} height={360} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label={canDraw ? 'Bảng vẽ của bạn' : 'Bảng vẽ đang được đồng bộ'} data-testid="canvas-online-drawing" />
    </div>
  </>;
}
