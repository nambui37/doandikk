import { useEffect, useRef } from 'react';

interface Props {
  avatarAnchorRef: React.RefObject<HTMLDivElement | null>;
  onPointerUpdate?: (normalized: { x: number; y: number }, raw: { x: number; y: number }) => void;
}

interface DustParticle {
  progress: number; // 0 (tại mắt) -> 1 (tại chuột)
  lateralOffset: number; // độ lệch so với trục chính (-1 đến 1)
  size: number;
  speed: number;
  opacity: number;
  pulsePhase: number;
}

export default function FlashlightEyeOverlay({ avatarAnchorRef, onPointerUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });
  const dustParticlesRef = useRef<DustParticle[]>([]);

  // Khởi tạo hạt bụi ánh sáng lơ lửng trong luồng đèn pin
  useEffect(() => {
    const particles: DustParticle[] = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        progress: Math.random(),
        lateralOffset: (Math.random() - 0.5) * 1.6,
        size: Math.random() * 2.2 + 0.8,
        speed: Math.random() * 0.003 + 0.0015,
        opacity: Math.random() * 0.7 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    dustParticlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mặc định ban đầu nếu chuột chưa di chuyển, hướng đèn pin về giữa màn hình bên phải
    if (!mouseRef.current.active) {
      const defaultX = window.innerWidth * 0.65;
      const defaultY = window.innerHeight * 0.45;
      mouseRef.current.x = defaultX;
      mouseRef.current.y = defaultY;
      mouseRef.current.targetX = defaultX;
      mouseRef.current.targetY = defaultY;
    }

    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.active = true;

      // Chuẩn hóa tọa độ đưa vào Three.js [-1, 1]
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -((e.clientY / window.innerHeight) * 2 - 1);
      onPointerUpdate?.({ x: normX, y: normY }, { x: e.clientX, y: e.clientY });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // VÒNG LẶP RENDER HIỆU ỨNG ÁNH SÁNG ĐÈN PIN (60FPS)
    let time = 0;
    const render = () => {
      time += 0.03;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Lerp mượt mà vị trí đèn pin theo chuột
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.16;
      m.y += (m.targetY - m.y) * 0.16;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Xác định tọa độ mắt nhân vật trên toàn màn hình
      const anchorEl = avatarAnchorRef.current;
      let eyeX = w * 0.22;
      let eyeY = h * 0.48;

      if (anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        eyeX = rect.left + rect.width * 0.5;
        eyeY = rect.top + rect.height * 0.44; // Vị trí ngang tầm mắt avatar
      }

      const dx = m.x - eyeX;
      const dy = m.y - eyeY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // Bán kính quầng sáng rọi tại vị trí chuột
      const spotRadius = Math.max(90, Math.min(200, dist * 0.35 + 60));
      const perpAngle = angle + Math.PI / 2;

      // Điểm tỏa của chùm nón đèn pin tại vị trí chuột
      const beamHalfWidth = Math.max(35, spotRadius * 0.85);
      const targetP1X = m.x + Math.cos(perpAngle) * beamHalfWidth;
      const targetP1Y = m.y + Math.sin(perpAngle) * beamHalfWidth;
      const targetP2X = m.x - Math.cos(perpAngle) * beamHalfWidth;
      const targetP2Y = m.y - Math.sin(perpAngle) * beamHalfWidth;

      // Hai mắt avatar
      const eyeSeparation = 10;
      const leftEyeX = eyeX + Math.cos(perpAngle) * eyeSeparation;
      const leftEyeY = eyeY + Math.sin(perpAngle) * eyeSeparation;
      const rightEyeX = eyeX - Math.cos(perpAngle) * eyeSeparation;
      const rightEyeY = eyeY - Math.sin(perpAngle) * eyeSeparation;

      ctx.globalCompositeOperation = 'screen';

      // 1. CHÙM SÁNG NÓN ĐÈN PIN CHÍNH (VOLUMETRIC LIGHT CONE)
      const beamGrad = ctx.createLinearGradient(eyeX, eyeY, m.x, m.y);
      const breath = Math.sin(time * 2) * 0.05;
      beamGrad.addColorStop(0, 'rgba(255, 255, 230, 0.7)'); // Gốc mắt
      beamGrad.addColorStop(0.15, 'rgba(254, 240, 138, 0.45)');
      beamGrad.addColorStop(0.65, `rgba(234, 179, 8, ${0.22 + breath})`);
      beamGrad.addColorStop(1, 'rgba(192, 132, 252, 0.08)');

      ctx.beginPath();
      ctx.moveTo(leftEyeX, leftEyeY);
      ctx.lineTo(targetP1X, targetP1Y);
      ctx.lineTo(targetP2X, targetP2Y);
      ctx.lineTo(rightEyeX, rightEyeY);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // 2. DẢI TIA SÁNG TRUNG TÂM SẮC NÉT HƠN (CORE BEAM)
      const coreGrad = ctx.createLinearGradient(eyeX, eyeY, m.x, m.y);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      coreGrad.addColorStop(0.2, 'rgba(254, 249, 195, 0.5)');
      coreGrad.addColorStop(0.7, 'rgba(250, 204, 21, 0.15)');
      coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.moveTo(eyeX, eyeY);
      ctx.lineTo(m.x + Math.cos(perpAngle) * (beamHalfWidth * 0.45), m.y + Math.sin(perpAngle) * (beamHalfWidth * 0.45));
      ctx.lineTo(m.x - Math.cos(perpAngle) * (beamHalfWidth * 0.45), m.y - Math.sin(perpAngle) * (beamHalfWidth * 0.45));
      ctx.closePath();
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // 3. QUẦNG SÁNG SPOTLIGHT RỌI XUỐNG VỊ TRÍ CHUỘT (TARGET SPOTLIGHT GLOW)
      const spotGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, spotRadius);
      spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      spotGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.5)');
      spotGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.22)');
      spotGrad.addColorStop(0.8, 'rgba(168, 85, 247, 0.12)');
      spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(m.x, m.y, spotRadius, 0, Math.PI * 2);
      ctx.fillStyle = spotGrad;
      ctx.fill();

      // Vòng tròn hào quang nhỏ ở đầu ngón tay / con trỏ chuột
      const innerSpot = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 22);
      innerSpot.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      innerSpot.addColorStop(0.5, 'rgba(254, 240, 138, 0.6)');
      innerSpot.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.beginPath();
      ctx.arc(m.x, m.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = innerSpot;
      ctx.fill();

      // 4. HẠT BỤI ÁNH SÁNG LƠ LỬNG TRONG LUỒNG ĐÈN PIN (FLOATING DUST PARTICLES)
      const particles = dustParticlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.progress += p.speed;
        if (p.progress > 1) {
          p.progress = 0;
          p.lateralOffset = (Math.random() - 0.5) * 1.6;
        }

        const curX = eyeX + dx * p.progress;
        const curY = eyeY + dy * p.progress;
        const curHalfWidth = beamHalfWidth * p.progress;
        const finalX = curX + Math.cos(perpAngle) * (curHalfWidth * p.lateralOffset * 0.7);
        const finalY = curY + Math.sin(perpAngle) * (curHalfWidth * p.lateralOffset * 0.7);

        const flicker = Math.sin(time * 3 + p.pulsePhase) * 0.3 + 0.7;
        const partAlpha = p.opacity * flicker * Math.sin(p.progress * Math.PI);

        ctx.beginPath();
        ctx.arc(finalX, finalY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 220, ${Math.max(0, Math.min(1, partAlpha))})`;
        ctx.fill();
      }

      // Đã loại bỏ 2 dấu chữ thập ++ theo yêu cầu người dùng
      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [avatarAnchorRef, onPointerUpdate]);

  return (
    <canvas
      ref={canvasRef}
      className="flashlight-overlay-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 25,
        mixBlendMode: 'screen',
      }}
    />
  );
}
