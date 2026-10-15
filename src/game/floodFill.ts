function hexToRgba(hex: string): [number, number, number, number] {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c || '000000', 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

/**
 * Thuật toán Flood Fill (Thùng sơn đổ màu) siêu tốc độ cao bằng Uint32Array
 * Quét 4 hướng (trái, phải, trên, dưới) tự động dừng lại khi gặp đường viền
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  width: number,
  height: number,
) {
  const x0 = Math.floor(startX);
  const y0 = Math.floor(startY);
  if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const data32 = new Uint32Array(data.buffer);

  const [fillR, fillG, fillB, fillA] = hexToRgba(fillColorHex);
  const targetIdx = y0 * width + x0;
  const targetR = data[targetIdx * 4];
  const targetG = data[targetIdx * 4 + 1];
  const targetB = data[targetIdx * 4 + 2];
  const targetA = data[targetIdx * 4 + 3];

  // Nếu màu click vào đã trùng với màu muốn tô thì dừng
  if (
    Math.abs(targetR - fillR) < 8 &&
    Math.abs(targetG - fillG) < 8 &&
    Math.abs(targetB - fillB) < 8 &&
    Math.abs(targetA - fillA) < 8
  ) {
    return;
  }

  // Đóng gói màu đích theo định dạng 32-bit Little Endian (ABGR)
  const newColor32 = ((fillA & 0xff) << 24) | ((fillB & 0xff) << 16) | ((fillG & 0xff) << 8) | (fillR & 0xff);

  // So sánh dung sai màu (tolerance) để phủ kín cả các điểm viền răng cưa khử răng cưa
  const colorMatch = (pos: number) => {
    const p = pos * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const a = data[p + 3];
    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;
    const da = a - targetA;
    return dr * dr + dg * dg + db * db + da * da <= 2000; // Dung sai ~45
  };

  const visited = new Uint8Array(width * height);
  const stack: number[] = [targetIdx];
  visited[targetIdx] = 1;

  while (stack.length > 0) {
    const pos = stack.pop()!;
    data32[pos] = newColor32;

    const x = pos % width;
    const y = Math.floor(pos / width);

    // Trái
    if (x > 0) {
      const left = pos - 1;
      if (!visited[left] && colorMatch(left)) {
        visited[left] = 1;
        stack.push(left);
      }
    }
    // Phải
    if (x < width - 1) {
      const right = pos + 1;
      if (!visited[right] && colorMatch(right)) {
        visited[right] = 1;
        stack.push(right);
      }
    }
    // Trên
    if (y > 0) {
      const up = pos - width;
      if (!visited[up] && colorMatch(up)) {
        visited[up] = 1;
        stack.push(up);
      }
    }
    // Dưới
    if (y < height - 1) {
      const down = pos + width;
      if (!visited[down] && colorMatch(down)) {
        visited[down] = 1;
        stack.push(down);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
