export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  points = 5,
  isFilled = false,
) {
  ctx.beginPath();
  const step = Math.PI / points;
  let angle = -Math.PI / 2;

  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    angle += step;
  }
  ctx.closePath();
  if (isFilled) ctx.fill();
  ctx.stroke();
}

export function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  isFilled = false,
) {
  const topY = cy - h / 2;
  const bottomY = cy + h / 2;
  const leftX = cx - w / 2;
  const rightX = cx + w / 2;

  ctx.beginPath();
  ctx.moveTo(cx, topY + h * 0.3);
  ctx.bezierCurveTo(cx - w * 0.35, topY - h * 0.15, leftX, topY + h * 0.3, cx, bottomY);
  ctx.bezierCurveTo(rightX, topY + h * 0.3, cx + w * 0.35, topY - h * 0.15, cx, topY + h * 0.3);
  ctx.closePath();
  if (isFilled) ctx.fill();
  ctx.stroke();
}

export function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isFilled = false,
) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const midX = (minX + maxX) / 2;

  ctx.beginPath();
  ctx.moveTo(midX, minY);
  ctx.lineTo(maxX, maxY);
  ctx.lineTo(minX, maxY);
  ctx.closePath();
  if (isFilled) ctx.fill();
  ctx.stroke();
}
