"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EnvironmentParams } from "@/features/garden/hooks/useWeatherEnvironment";

// ---- 雨パーティクル ----
function Rain() {
  const ref = useRef<THREE.Points>(null);
  const COUNT = 600;

  const { positions } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return { positions };
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] -= delta * 12;
      if (pos[i * 3 + 1] < -1) {
        pos[i * 3 + 1] = 20;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#A8C8E8" size={0.05} transparent opacity={0.6} />
    </points>
  );
}

// ---- 雪パーティクル ----
function Snow() {
  const ref = useRef<THREE.Points>(null);
  const COUNT = 400;

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      speeds[i] = 0.5 + Math.random() * 1.0;
    }
    return { positions, speeds };
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 0] += Math.sin(t * 0.5 + i) * 0.003;  // 左右の揺れ
      pos[i * 3 + 1] -= delta * speeds[i];
      if (pos[i * 3 + 1] < -1) {
        pos[i * 3 + 1] = 20;
        pos[i * 3 + 0] = (Math.random() - 0.5) * 30;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#FFFFFF" size={0.12} transparent opacity={0.85} />
    </points>
  );
}

// ---- 雷フラッシュ ----
function ThunderFlash() {
  const ref = useRef<THREE.AmbientLight>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // 非周期的なフラッシュ
    const flash = Math.max(0, Math.sin(t * 3) * Math.sin(t * 7) * Math.sin(t * 11));
    ref.current.intensity = flash * 3.0;
  });

  return <ambientLight ref={ref} color="#FFFFFF" intensity={0} />;
}

// ---- 葉っぱの揺れ（スウェイするグループ） ----
export function TreeSway({
  children,
  swayStrength = 0.03,
  swaySpeed = 1.0,
  offset = 0,
}: {
  children: React.ReactNode;
  swayStrength?: number;
  swaySpeed?: number;
  offset?: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * swaySpeed + offset;
    ref.current.rotation.z = Math.sin(t) * swayStrength;
    ref.current.rotation.x = Math.cos(t * 0.7) * swayStrength * 0.5;
  });

  return <group ref={ref}>{children}</group>;
}

// ---- 川のUVスクロール ----
export function RiverMesh({ position }: { position: [number, number, number] }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    if (!matRef.current?.map) return;
    matRef.current.map.offset.x += delta * 0.2;
  });

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4, 12, 1, 1]} />
      <meshStandardMaterial
        ref={matRef}
        color="#4FC3F7"
        transparent
        opacity={0.7}
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
}

// ---- 霧オーバーレイ（fogはCanvasのfog propで制御、こちらは補助ヘイズ） ----
function FogHaze() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
  });

  return (
    <mesh ref={ref} position={[0, 5, 0]}>
      <sphereGeometry args={[25, 8, 8]} />
      <meshBasicMaterial color="#C8C8C8" transparent opacity={0.15} side={THREE.BackSide} />
    </mesh>
  );
}

// ---- 昼夜サイクル空 ----
function Sky({ skyColor }: { skyColor: string }) {
  return (
    <mesh>
      <sphereGeometry args={[50, 12, 12]} />
      <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
    </mesh>
  );
}

// ---- メインWeatherSystemコンポーネント ----
interface WeatherSystemProps {
  params: EnvironmentParams;
}

export function WeatherSystem({ params }: WeatherSystemProps) {
  return (
    <>
      {/* 空 */}
      <Sky skyColor={params.skyColor} />

      {/* 環境光（時間帯・天候別） */}
      <ambientLight color={params.ambientColor} intensity={params.ambientIntensity} />

      {/* 方向光（太陽 or 月） */}
      <directionalLight
        color={params.directionalColor}
        intensity={params.directionalIntensity}
        position={params.directionalPosition}
        castShadow
      />

      {/* 霧 */}
      {params.fogEnabled && <FogHaze />}

      {/* 雨 */}
      {params.rainEnabled && <Rain />}

      {/* 雪 */}
      {params.snowEnabled && <Snow />}

      {/* 雷フラッシュ */}
      {params.thunderEnabled && <ThunderFlash />}
    </>
  );
}
