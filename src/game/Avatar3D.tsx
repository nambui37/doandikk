import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Props {
  avatarIndex: number;
  isSpinning?: boolean;
  targetPointer?: { x: number; y: number } | null;
  flashlightEnabled?: boolean;
}

// Màu sắc và phụ kiện cho từng nhân vật Chibi
const AVATAR_3D_THEMES = [
  { name: 'Hiệp sĩ', bodyColor: '#6366f1', hatColor: '#4f46e5', accent: '#fbbf24', type: 'knight' },
  { name: 'Thỏ', bodyColor: '#f472b6', hatColor: '#ec4899', accent: '#fbcfe8', type: 'rabbit' },
  { name: 'Cáo', bodyColor: '#f97316', hatColor: '#ea580c', accent: '#fed7aa', type: 'fox' },
  { name: 'Phù thủy', bodyColor: '#8b5cf6', hatColor: '#6d28d9', accent: '#fde047', type: 'wizard' },
  { name: 'Mèo', bodyColor: '#06b6d4', hatColor: '#0891b2', accent: '#fef08a', type: 'cat' },
  { name: 'Gấu', bodyColor: '#d97706', hatColor: '#b45309', accent: '#fde68a', type: 'bear' },
  { name: 'Robot', bodyColor: '#10b981', hatColor: '#059669', accent: '#6ee7b7', type: 'robot' },
  { name: 'Ninja', bodyColor: '#374151', hatColor: '#1f2937', accent: '#ef4444', type: 'ninja' },
];

function ChibiCharacter({
  avatarIndex,
  isSpinning,
  targetPointer,
  flashlightEnabled = true,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  const spinAngleRef = useRef(0);
  const jumpHeightRef = useRef(0);

  const theme = AVATAR_3D_THEMES[avatarIndex % AVATAR_3D_THEMES.length];

  // Kích hoạt xoay 360 độ và nhảy nảy khi đổi avatar
  useEffect(() => {
    spinAngleRef.current = Math.PI * 2;
    jumpHeightRef.current = 1;
  }, [avatarIndex, isSpinning]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const head = headRef.current;
    if (!group || !head) return;

    // 1. Xử lý hiệu ứng xoay 360 độ nhảy nảy khi bấm đổi
    if (spinAngleRef.current > 0.05) {
      spinAngleRef.current = THREE.MathUtils.lerp(spinAngleRef.current, 0, delta * 8);
      group.rotation.y = spinAngleRef.current;
    } else {
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, 0, delta * 10);
    }

    if (jumpHeightRef.current > 0.05) {
      jumpHeightRef.current = THREE.MathUtils.lerp(jumpHeightRef.current, 0, delta * 7);
      group.position.y = Math.sin(jumpHeightRef.current * Math.PI) * 0.45;
    } else {
      group.position.y = 0;
    }

    // 2. Parallax: Nghiêng đầu và liếc mắt theo con trỏ chuột trên TOÀN BỘ MÀN HÌNH
    const px = targetPointer ? targetPointer.x : state.pointer.x;
    const py = targetPointer ? targetPointer.y : state.pointer.y;

    const targetRotY = px * 0.72; // Góc quay ngang linh hoạt
    const targetRotX = -py * 0.52; // Góc ngước/cúi đầu
    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetRotY, delta * 8);
    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetRotX, delta * 8);

    // Mắt liếc rõ nét và sâu theo con trỏ chuột
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeOffsetX = Math.max(-0.06, Math.min(0.06, px * 0.06));
      const eyeOffsetY = Math.max(-0.06, Math.min(0.06, py * 0.06));
      leftEyeRef.current.position.x = -0.32 + eyeOffsetX;
      leftEyeRef.current.position.y = 0.02 + eyeOffsetY;
      rightEyeRef.current.position.x = 0.32 + eyeOffsetX;
      rightEyeRef.current.position.y = 0.02 + eyeOffsetY;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* THÂN BẦU BĨNH (CHIBI BODY) */}
      <mesh position={[0, -0.65, 0]} castShadow>
        <sphereGeometry args={[0.62, 32, 32]} />
        <meshStandardMaterial
          color={theme.bodyColor}
          roughness={0.4}
          metalness={0.08}
        />
      </mesh>

      {/* CHÂN TRÒN NHỎ XINH */}
      <mesh position={[-0.28, -1.05, 0.08]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={theme.hatColor} roughness={0.5} />
      </mesh>
      <mesh position={[0.28, -1.05, 0.08]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={theme.hatColor} roughness={0.5} />
      </mesh>

      {/* ĐẦU CHIBI TO TRÒN ĐÁNG YÊU (CÓ PARALLAX LIẾC THEO CHUỘT) */}
      <group ref={headRef} position={[0, 0.25, 0]}>
        {/* KHỐI ĐẦU ĐẤT SÉT */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.88, 32, 32]} />
          <meshStandardMaterial
            color={theme.bodyColor}
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>

        {/* MẮT BÊN TRÁI (LUÔN LIẾC THEO CHUỘT, BẬT ĐÈN PIN THÌ PHÁT QUANG) */}
        <group position={[-0.32, 0.02, 0.76]}>
          <mesh ref={leftEyeRef}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial
              color="#18181b"
              roughness={0.1}
              emissive="#fef08a"
              emissiveIntensity={flashlightEnabled ? 0.6 : 0}
            />
          </mesh>
          {/* Tròng mắt phản chiếu long lanh */}
          <mesh position={[-0.03, 0.03, 0.11]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Viền hào quang & đèn rọi chỉ khi bật đèn pin */}
          {flashlightEnabled && (
            <>
              <mesh position={[0, 0, 0.06]}>
                <ringGeometry args={[0.08, 0.14, 16]} />
                <meshBasicMaterial color="#fef08a" transparent opacity={0.65} />
              </mesh>
              <pointLight color="#fffbeb" intensity={1.8} distance={2.5} />
            </>
          )}
        </group>

        {/* MẮT BÊN PHẢI (LUÔN LIẾC THEO CHUỘT, BẬT ĐÈN PIN THÌ PHÁT QUANG) */}
        <group position={[0.32, 0.02, 0.76]}>
          <mesh ref={rightEyeRef}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial
              color="#18181b"
              roughness={0.1}
              emissive="#fef08a"
              emissiveIntensity={flashlightEnabled ? 0.6 : 0}
            />
          </mesh>
          {/* Tròng mắt phản chiếu long lanh */}
          <mesh position={[-0.03, 0.03, 0.11]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Viền hào quang & đèn rọi chỉ khi bật đèn pin */}
          {flashlightEnabled && (
            <>
              <mesh position={[0, 0, 0.06]}>
                <ringGeometry args={[0.08, 0.14, 16]} />
                <meshBasicMaterial color="#fef08a" transparent opacity={0.65} />
              </mesh>
              <pointLight color="#fffbeb" intensity={1.8} distance={2.5} />
            </>
          )}
        </group>

        {/* MÁ HỒNG CHIBI DỄ THƯƠNG */}
        <mesh position={[-0.48, -0.16, 0.68]} rotation={[0, -0.3, 0]}>
          <circleGeometry args={[0.14, 16]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.65} />
        </mesh>
        <mesh position={[0.48, -0.16, 0.68]} rotation={[0, 0.3, 0]}>
          <circleGeometry args={[0.14, 16]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.65} />
        </mesh>

        {/* MIỆNG CƯỜI NHỎ XINH */}
        <mesh position={[0, -0.15, 0.85]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.08, 0.02, 8, 16, Math.PI]} />
          <meshBasicMaterial color="#881337" />
        </mesh>

        {/* ============================================================
            PHỤ KIỆN ĐẶC TRƯNG TỪNG NHÂN VẬT
        ============================================================ */}
        {/* 1. HIỆP SĨ: Mũ giáp & đỉnh mào vàng */}
        {theme.type === 'knight' && (
          <group position={[0, 0.5, 0]}>
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.15, 0.55, 0.6, 24]} />
              <meshStandardMaterial color={theme.hatColor} metalness={0.6} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.65, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color={theme.accent} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* 2. THỎ: Đôi tai dài ngộ nghĩnh */}
        {theme.type === 'rabbit' && (
          <group position={[0, 0.8, 0]}>
            <mesh position={[-0.38, 0.45, -0.1]} rotation={[0, 0, -0.2]}>
              <capsuleGeometry args={[0.14, 0.65, 8, 16]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.4} />
            </mesh>
            <mesh position={[0.38, 0.45, -0.1]} rotation={[0, 0, 0.2]}>
              <capsuleGeometry args={[0.14, 0.65, 8, 16]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.4} />
            </mesh>
          </group>
        )}

        {/* 3. CÁO: Đôi tai tam giác nhọn */}
        {theme.type === 'fox' && (
          <group position={[0, 0.8, 0]}>
            <mesh position={[-0.45, 0.15, 0]} rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.26, 0.5, 16]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.4} />
            </mesh>
            <mesh position={[0.45, 0.15, 0]} rotation={[0, 0, 0.3]}>
              <coneGeometry args={[0.26, 0.5, 16]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.4} />
            </mesh>
          </group>
        )}

        {/* 4. PHÙ THỦY: Mũ chóp nón cao & ngôi sao */}
        {theme.type === 'wizard' && (
          <group position={[0, 0.72, -0.1]} rotation={[-0.15, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.95, 0.95, 0.08, 32]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <coneGeometry args={[0.55, 1.1, 32]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.3} />
            </mesh>
            <mesh position={[0, 1.15, 0.05]}>
              <dodecahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color={theme.accent} metalness={0.8} />
            </mesh>
          </group>
        )}

        {/* 5. MÈO: Tai mèo & vương miện hoàng gia */}
        {theme.type === 'cat' && (
          <group position={[0, 0.8, 0]}>
            <mesh position={[-0.4, 0.1, 0]} rotation={[0, 0, -0.25]}>
              <coneGeometry args={[0.22, 0.35, 16]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.4} />
            </mesh>
            <mesh position={[0.4, 0.1, 0]} rotation={[0, 0, 0.25]}>
              <coneGeometry args={[0.22, 0.35, 16]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.4} />
            </mesh>
            {/* Vương miện vàng */}
            <mesh position={[0, 0.2, 0.1]}>
              <cylinderGeometry args={[0.22, 0.15, 0.18, 5]} />
              <meshStandardMaterial color={theme.accent} metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* 6. GẤU: Tai gấu tròn trĩnh */}
        {theme.type === 'bear' && (
          <group position={[0, 0.75, 0]}>
            <mesh position={[-0.48, 0.08, 0]}>
              <sphereGeometry args={[0.24, 16, 16]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.45} />
            </mesh>
            <mesh position={[0.48, 0.08, 0]}>
              <sphereGeometry args={[0.24, 16, 16]} />
              <meshStandardMaterial color={theme.hatColor} roughness={0.45} />
            </mesh>
          </group>
        )}

        {/* 7. ROBOT: Ăng-ten phát sáng bóng đèn */}
        {theme.type === 'robot' && (
          <group position={[0, 0.85, 0]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}

        {/* 8. NINJA: Dải băng đỏ bay phấp phới */}
        {theme.type === 'ninja' && (
          <group position={[0, 0.2, 0]}>
            <mesh position={[0, 0, 0]}>
              <torusGeometry args={[0.89, 0.08, 12, 32]} />
              <meshStandardMaterial color={theme.accent} roughness={0.3} />
            </mesh>
            <mesh position={[0.82, -0.15, -0.4]} rotation={[0, 0.4, -0.5]}>
              <boxGeometry args={[0.14, 0.5, 0.04]} />
              <meshStandardMaterial color={theme.accent} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

export default function Avatar3D({
  avatarIndex,
  isSpinning = false,
  targetPointer,
  flashlightEnabled = true,
}: Props) {
  return (
    <div className="avatar-3d-canvas-wrap" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0.2, 3.8], fov: 42 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} color="#ffffff" />
        <pointLight position={[-3, 2, 2]} intensity={1.8} color="#a5b4fc" />
        <pointLight position={[3, -2, 2]} intensity={1.4} color="#fbcfe8" />
        <Sparkles count={24} scale={[3.2, 3.2, 2]} size={2} speed={0.4} opacity={0.65} color="#fbbf24" />

        <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.3}>
          <ChibiCharacter
            avatarIndex={avatarIndex}
            isSpinning={isSpinning}
            targetPointer={targetPointer}
            flashlightEnabled={flashlightEnabled}
          />
        </Float>
      </Canvas>
    </div>
  );
}
