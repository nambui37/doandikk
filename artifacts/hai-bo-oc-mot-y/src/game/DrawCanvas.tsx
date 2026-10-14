import { Eraser } from 'lucide-react';
import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

type DrawCanvasProps = { onClear: () => void };

export default function DrawCanvas({ onClear }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) };
  };
  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const ctx = canvasRef.current?.getContext('2d');
    const p = point(event);
    if (!ctx || !p) return;
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    const p = point(event);
    if (!ctx || !p) return;
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#27313b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  const stop = () => { drawing.current = false; };
  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  }, [onClear]);

  return (
    <>
      <div className="draw-tools">
        <span>Bảng vẽ của người ra hiệu</span>
        <button type="button" className="clear-btn" onClick={clear} data-testid="button-clear-drawing"><Eraser /> Xóa bảng</button>
      </div>
      <div className="draw-area" data-testid="canvas-drawing-area">
        <canvas ref={canvasRef} width={1000} height={360} onPointerDown={start} onPointerMove={draw} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop} aria-label="Bảng vẽ cảm ứng" data-testid="canvas-clue-drawing" />
      </div>
    </>
  );
}
