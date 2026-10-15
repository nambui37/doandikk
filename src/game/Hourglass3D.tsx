import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface Props {
  timeLeft: number;
  totalTime?: number;
}

function HourglassModel({ timeLeft, totalTime = 60 }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const topSandRef = useRef<THREE.Mesh>(null);
  const bottomSandRef = useRef<THREE.Mesh>(null);

  // Tỉ lệ cát đã rơi (0 = vừa bắt đầu, 1 = hết sạch giờ)
  const clampedTime = Math.max(0, Math.min(totalTime, timeLeft));
  const progress = 1 - clampedTime / totalTime;
  const isEmergency = timeLeft <= 10 && timeLeft > 0;

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // 1. Nếu còn dưới 10 giây cuối: RUNG LẮC BẦN BẬT & CẢNH BÁO
    if (isEmergency) {
      const shakeTime = state.clock.getElapsedTime() * 32;
      group.rotation.z = Math.sin(shakeTime) * 0.08;
      group.rotation.x = Math.cos(shakeTime * 0.8) * 0.05;
      group.position.x = Math.sin(shakeTime * 1.5) * 0.04;
    } else {
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, delta * 8);
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0, delta * 8);
      group.position.x = THREE.MathUtils.lerp(group.position.x, 0, delta * 8);
    }

    // 2. Co giãn khối cát trên và dưới
    if (topSandRef.current) {
      const topScaleY = Math.max(0.01, 1 - progress);
      topSandRef.current.scale.set(topScaleY, topScaleY, topScaleY);
    }
    if (bottomSandRef.current) {
      const bottomScaleY = Math.max(0.05, progress);
      bottomSandRef.current.scale.set(bottomScaleY, bottomScaleY, bottomScaleY);
    }

    // 3. Tia cát rơi ở giữa cổ chai nhấp nháy chuyển động
    if (streamRef.current) {
      if (timeLeft > 0 && progress < 0.98) {
        streamRef.current.visible = true;
        streamRef.current.scale.x = 0.8 + Math.sin(state.clock.getElapsedTime() * 20) * 0.2;
      } else {
        streamRef.current.visible = false;
      }
    }
  });

  const sandColor = isEmergency ? '#ef4444' : '#f59e0b';
  const sandEmissive = isEmergency ? '#ef4444' : '#000000';
  const sandEmissiveIntensity = isEmergency ? 0.9 : 0;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* KHUNG GỖ / VÀNG ĐẾ TRÊN & ĐẾ DƯỚI */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.12, 32]} />
        <meshStandardMaterial color={isEmergency ? '#dc2626' : '#d97706'} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.12, 32]} />
        <meshStandardMaterial color={isEmergency ? '#dc2626' : '#d97706'} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 3 CỘT TRỤ ĐỒNG NỐI HAI ĐẾ */}
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 2.2, 16]} />
          <meshStandardMaterial color="#fef08a" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* BẦU THỦY TINH TRONG SUỐT TRÊN */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.55, 32, 16]} />
        <meshPhysicalMaterial
          roughness={0.1}
          transmission={0.9}
          thickness={0.4}
          transparent
          opacity={0.38}
          color={isEmergency ? '#fca5a5' : '#ffffff'}
          ior={1.45}
        />
      </mesh>

      {/* BẦU THỦY TINH TRONG SUỐT DƯỚI */}
      <mesh position={[0, -0.55, 0]}>
        <sphereGeometry args={[0.55, 32, 16]} />
        <meshPhysicalMaterial
          roughness={0.1}
          transmission={0.9}
          thickness={0.4}
          transparent
          opacity={0.38}
          color={isEmergency ? '#fca5a5' : '#ffffff'}
          ior={1.45}
        />
      </mesh>

      {/* CỔ CHAI THẮT HẸP Ở GIỮA */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.25, 24]} />
        <meshPhysicalMaterial
          roughness={0.1}
          transmission={0.9}
          transparent
          opacity={0.35}
          color="#ffffff"
        />
      </mesh>

      {/* KHỐI CÁT TRÊN (VƠI DẦN KHI HẾT GIỜ) */}
      <mesh ref={topSandRef} position={[0, 0.42, 0]}>
        <coneGeometry args={[0.48, 0.55, 32]} />
        <meshStandardMaterial
          color={sandColor}
          emissive={sandEmissive}
          emissiveIntensity={sandEmissiveIntensity}
          roughness={0.7}
        />
      </mesh>

      {/* DÒNG CÁT CHẢY QUA CỔ CHAI */}
      <mesh ref={streamRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.85, 8]} />
        <meshBasicMaterial color={sandColor} />
      </mesh>

      {/* KHỐI CÁT DƯỚI (ĐÙN CAO DẦN LÊN KHI CÁT RƠI) */}
      <mesh ref={bottomSandRef} position={[0, -0.75, 0]}>
        <coneGeometry args={[0.5, 0.55, 32]} />
        <meshStandardMaterial
          color={sandColor}
          emissive={sandEmissive}
          emissiveIntensity={sandEmissiveIntensity}
          roughness={0.7}
        />
      </mesh>

      {/* VẬT THỂ STUDIO 3D TRANG TRÍ: BÚT CHÌ VÀ TẨY CẠNH ĐỒNG HỒ */}
      <group position={[0.9, -1.05, 0.3]} rotation={[0, -0.4, 0.2]}>
        {/* Thân bút chì vàng */}
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1.1, 6]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
        {/* Đầu gọt gỗ */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <coneGeometry args={[0.07, 0.22, 16]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.6} />
        </mesh>
        {/* Ngòi chì đen */}
        <mesh position={[0, 0.77, 0]}>
          <coneGeometry args={[0.025, 0.07, 16]} />
          <meshBasicMaterial color="#18181b" />
        </mesh>
      </group>
    </group>
  );
}

export default function Hourglass3D({ timeLeft, totalTime = 60 }: Props) {
  const isEmergency = timeLeft <= 10 && timeLeft > 0;

  return (
    <div
      className={`hourglass-3d-wrap ${isEmergency ? 'is-emergency-glow' : ''}`}
      style={{
        width: 100,
        height: 120,
        position: 'relative',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 3.4], fov: 45 }}
        dpr={[1, 1.8]}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={isEmergency ? 1.5 : 1.1} />
        <directionalLight position={[3, 5, 4]} intensity={2.2} color={isEmergency ? '#fca5a5' : '#ffffff'} />
        <pointLight position={[-2, 1, 2]} intensity={isEmergency ? 4.5 : 1.5} color={isEmergency ? '#ef4444' : '#fde047'} />

        <HourglassModel timeLeft={timeLeft} totalTime={totalTime} />
      </Canvas>
    </div>
  );
}
