import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Sparkles } from '@react-three/drei';
import { Component, type ReactNode, useRef } from 'react';
import type { Mesh } from 'three';

type SceneBoundaryProps = { children: ReactNode; fallback: ReactNode };
type SceneBoundaryState = { failed: boolean };

class SceneBoundary extends Component<SceneBoundaryProps, SceneBoundaryState> {
  state: SceneBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FallbackScene() {
  return (
    <div className="scene-fallback" aria-hidden="true">
      <div className="scene-fallback__floor" />
      <div className="scene-fallback__table">
        <div className="scene-fallback__table-base" />
        <div className="scene-fallback__table-rim" />
        <div className="scene-fallback__table-surface">
          <div className="scene-fallback__stripe" />
          <div className="scene-fallback__token scene-fallback__token--left" />
          <div className="scene-fallback__token scene-fallback__token--right" />
          <div className="scene-fallback__spinner" />
          <div className="scene-fallback__die scene-fallback__die--left" />
          <div className="scene-fallback__die scene-fallback__die--right" />
        </div>
      </div>
      <div className="scene-fallback__glow scene-fallback__glow--left" />
      <div className="scene-fallback__glow scene-fallback__glow--right" />
    </div>
  );
}

let webGLSupport: boolean | null = null;

function supportsWebGL() {
  if (webGLSupport !== null) return webGLSupport;
  try {
    const canvas = document.createElement('canvas');
    webGLSupport = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webGLSupport = false;
  }
  return webGLSupport;
}

function SceneObjects() {
  const spinner = useRef<Mesh>(null);
  const puck = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spinner.current) {
      spinner.current.rotation.y = t * .36;
      spinner.current.rotation.x = Math.sin(t * .4) * .12;
    }
    if (puck.current) puck.current.rotation.y = -t * .24;
  });
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 8, 5]} intensity={2.1} color="#fff0c2" />
      <pointLight position={[-5, 3, 0]} intensity={28} color="#57d7c5" />
      <pointLight position={[4, 2, -5]} intensity={22} color="#ef8a67" />
      <Sparkles count={85} scale={[14, 8, 12]} size={2} speed={.25} opacity={.48} color="#f7d55c" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#171a28" roughness={.86} />
      </mesh>
      <Float speed={1.2} rotationIntensity={.13} floatIntensity={.26}>
        <group position={[0, -.65, 0]} rotation={[-.09, .02, 0]}>
          <RoundedBox args={[8.3, .42, 4.5]} radius={.34} smoothness={5} castShadow receiveShadow>
            <meshStandardMaterial color="#34404b" roughness={.38} metalness={.24} />
          </RoundedBox>
          <RoundedBox args={[7.9, .17, 4.1]} radius={.29} smoothness={5} position={[0, .27, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#e9c96d" roughness={.36} metalness={.12} />
          </RoundedBox>
          <RoundedBox args={[7.62, .12, 3.84]} radius={.25} smoothness={5} position={[0, .39, 0]} receiveShadow>
            <meshStandardMaterial color="#26343d" roughness={.54} />
          </RoundedBox>
          <mesh position={[-2.85, .58, 0]} rotation={[0, 0, .15]} castShadow>
            <boxGeometry args={[1.2, .2, .8]} />
            <meshStandardMaterial color="#e57c63" roughness={.36} />
          </mesh>
          <mesh position={[2.85, .58, 0]} rotation={[0, 0, -.15]} castShadow>
            <boxGeometry args={[1.2, .2, .8]} />
            <meshStandardMaterial color="#5bd0bd" roughness={.36} />
          </mesh>
          <mesh position={[0, .56, -.1]} ref={spinner} castShadow>
            <dodecahedronGeometry args={[.78, 0]} />
            <meshStandardMaterial color="#f5d45e" roughness={.23} metalness={.32} />
          </mesh>
          <mesh position={[0, .59, 1.38]} ref={puck} castShadow>
            <cylinderGeometry args={[.32, .32, .12, 32]} />
            <meshStandardMaterial color="#e57c63" roughness={.3} metalness={.22} />
          </mesh>
          <mesh position={[-3.1, .57, -1.18]} rotation={[.18, .24, .15]} castShadow>
            <boxGeometry args={[.5, .26, .5]} />
            <meshStandardMaterial color="#f4eee0" roughness={.29} />
          </mesh>
          <mesh position={[3.05, .56, 1.15]} rotation={[-.15, -.2, .12]} castShadow>
            <boxGeometry args={[.54, .25, .54]} />
            <meshStandardMaterial color="#f4eee0" roughness={.29} />
          </mesh>
        </group>
      </Float>
      <mesh position={[0, -1.04, 0]} receiveShadow>
        <cylinderGeometry args={[4.8, 4.9, .14, 64]} />
        <meshStandardMaterial color="#202938" roughness={.58} metalness={.22} />
      </mesh>
      <mesh position={[0, -1.14, 0]}>
        <cylinderGeometry args={[5.2, 5.3, .1, 64]} />
        <meshStandardMaterial color="#e0b750" roughness={.48} metalness={.35} />
      </mesh>
    </>
  );
}

export default function GameScene() {
  if (!supportsWebGL()) return <FallbackScene />;

  return (
    <SceneBoundary fallback={<FallbackScene />}>
      <Canvas className="scene-canvas" dpr={[1, 1.5]} camera={{ position: [0, 5.9, 11.8], fov: 38 }} gl={{ alpha: true, antialias: true }}>
        <SceneObjects />
      </Canvas>
    </SceneBoundary>
  );
}
