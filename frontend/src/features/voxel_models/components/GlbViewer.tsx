"use client";

import { Component, ReactNode, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Box3, Vector3 } from "three";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function resolveModelUrl(modelPath: string): string {
  if (modelPath.startsWith("/uploads")) {
    return modelPath.startsWith("http") ? modelPath : `${BASE}${modelPath}`;
  }
  if (modelPath.startsWith("/models")) return modelPath;
  return modelPath.startsWith("http") ? modelPath : `${BASE}${modelPath}`;
}

/** フォールバック（モデルパスがない / エラー時）*/
function PlaceholderBox({ color = "#E5E7EB" }: { color?: string }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/**
 * useGLTF は Suspense パターン（ロード中に Promise を throw する）を使う。
 * try/catch でラップすると thrown Promise が捕捉されて Suspense が動かなくなるため、
 * hooks は try/catch の外で呼び出し、エラーは ErrorBoundary で処理する。
 */
function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  // モデルを正規化（最大辺 1.2）
  const box = new Box3().setFromObject(scene);
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 1.2 / maxDim : 1;

  // モデルの中心を原点に配置（useGlbSnapshot と同じロジック）
  scene.scale.setScalar(scale);
  const scaledBox = new Box3().setFromObject(scene);
  const center = scaledBox.getCenter(new Vector3());
  scene.position.sub(center);

  return <primitive object={scene} />;
}

/** GlbModel のレンダリングエラーをキャッチして PlaceholderBox を表示する */
class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    console.error("Failed to load 3D model:", err);
  }

  render() {
    if (this.state.hasError) return <PlaceholderBox />;
    return this.props.children;
  }
}

interface GlbViewerProps {
  modelPath?: string | null;
  height?: number;
  backgroundColor?: string;
  enableInteraction?: boolean;
}

export function GlbViewer({
  modelPath,
  height = 300,
  backgroundColor = "#F5F5F2",
  enableInteraction = false,
}: GlbViewerProps) {
  const url = modelPath ? resolveModelUrl(modelPath) : null;

  return (
    <div
      style={{ height, background: backgroundColor, touchAction: enableInteraction ? "none" : "auto" }}
      className="w-full rounded-xl overflow-hidden"
    >
      <Canvas camera={{ position: [0, 0.15, 2.5], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 4]} intensity={1.2} />
        <directionalLight position={[-2, 3, -4]} intensity={0.5} />

        <ModelErrorBoundary>
          <Suspense fallback={<PlaceholderBox />}>
            {url ? <GlbModel url={url} /> : <PlaceholderBox />}
          </Suspense>
        </ModelErrorBoundary>

        {enableInteraction && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            enableDamping={true}
            dampingFactor={0.1}
            minDistance={0.5}
            maxDistance={5}
            autoRotate={false}
          />
        )}
      </Canvas>
    </div>
  );
}
