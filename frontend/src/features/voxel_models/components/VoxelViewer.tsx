"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { PixelData } from "@/features/voxel_models/types";

const PIXEL_SIZE = 0.1;

function InstancedVoxels({ color, voxels }: { color: string; voxels: PixelData[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!ref.current) return;
    voxels.forEach((v, i) => {
      dummy.position.set(
        v.x * PIXEL_SIZE + PIXEL_SIZE / 2,
        v.y * PIXEL_SIZE + PIXEL_SIZE / 2,
        v.z * PIXEL_SIZE + PIXEL_SIZE / 2,
      );
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [voxels, dummy]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, voxels.length]}>
      <boxGeometry args={[PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE]} />
      <meshStandardMaterial color={color} />
    </instancedMesh>
  );
}

function VoxelMesh({ pixels }: { pixels: PixelData[] }) {
  const colorGroups = useMemo(() => {
    const groups = new Map<string, PixelData[]>();
    for (const p of pixels) {
      if (!groups.has(p.colorHex)) groups.set(p.colorHex, []);
      groups.get(p.colorHex)!.push(p);
    }
    return groups;
  }, [pixels]);

  const offset = useMemo(() => {
    if (pixels.length === 0) return [0, 0, 0] as [number, number, number];
    const maxX = Math.max(...pixels.map((p) => p.x));
    const maxY = Math.max(...pixels.map((p) => p.y));
    const maxZ = Math.max(...pixels.map((p) => p.z));
    return [
      -((maxX + 1) * PIXEL_SIZE) / 2,
      -((maxY + 1) * PIXEL_SIZE) / 2,
      -((maxZ + 1) * PIXEL_SIZE) / 2,
    ] as [number, number, number];
  }, [pixels]);

  return (
    <group position={offset}>
      {Array.from(colorGroups.entries()).map(([color, voxels]) => (
        <InstancedVoxels key={color} color={color} voxels={voxels} />
      ))}
    </group>
  );
}

interface VoxelViewerProps {
  pixels: PixelData[];
  height?: number;
  interactive?: boolean;
}

export function VoxelViewer({ pixels, height = 300, interactive = true }: VoxelViewerProps) {
  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden bg-[#F5F5F2]">
      <Canvas camera={{ position: [3, 3, 3], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <VoxelMesh pixels={pixels} />
        {interactive && <OrbitControls makeDefault />}
      </Canvas>
    </div>
  );
}
