import { useState, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function resolveUrl(modelPath: string): string {
  if (modelPath.startsWith("/uploads")) {
    return modelPath.startsWith("http") ? modelPath : `${BASE}${modelPath}`;
  }
  if (modelPath.startsWith("/models")) return modelPath;
  return modelPath.startsWith("http") ? modelPath : `${BASE}${modelPath}`;
}

// キャッシュとシングルトンレンダラー（WebGL コンテキスト1つのみ）
const snapshotCache = new Map<string, string>();
let sharedRenderer: THREE.WebGLRenderer | null = null;

function getRenderer(): THREE.WebGLRenderer {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    sharedRenderer.setSize(200, 200);
    sharedRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  return sharedRenderer;
}

// レンダリングをシリアライズするキュー
let renderQueue: Promise<void> = Promise.resolve();

async function renderSnapshot(url: string, bgColor: string): Promise<string> {
  if (snapshotCache.has(url)) return snapshotCache.get(url)!;

  const renderer = getRenderer();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0.15, 2.5);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  const dir1 = new THREE.DirectionalLight(0xffffff, 1.2);
  dir1.position.set(4, 6, 4);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dir2.position.set(-2, 3, -4);
  scene.add(ambient, dir1, dir2);

  const loader = new GLTFLoader();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gltf = await new Promise<any>((resolve, reject) =>
    loader.load(url, resolve, undefined, reject)
  );

  const model: THREE.Group = gltf.scene.clone(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) model.scale.setScalar(1.2 / maxDim);
  const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  model.position.sub(center);
  scene.add(model);

  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL("image/png");
  snapshotCache.set(url, dataUrl);

  // ジオメトリ・マテリアル解放
  model.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => m.dispose());
    }
  });

  return dataUrl;
}

function enqueueSnapshot(url: string, bgColor: string): Promise<string> {
  if (snapshotCache.has(url)) return Promise.resolve(snapshotCache.get(url)!);

  return new Promise<string>((resolve, reject) => {
    const prev = renderQueue;
    renderQueue = new Promise<void>((done) => {
      prev.then(async () => {
        try {
          const dataUrl = await renderSnapshot(url, bgColor);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        } finally {
          done();
        }
      });
    });
  });
}

/**
 * GLB モデルをオフスクリーンでレンダリングして静止画（data URL）として返す。
 * シングルトンレンダラーを使うため WebGL コンテキストを1つしか消費しない。
 */
export function useGlbSnapshot(
  modelPath: string | null | undefined,
  bgColor = "#F5F5F2"
): string | null {
  const [snapshot, setSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (!modelPath || typeof window === "undefined") return;
    let cancelled = false;

    enqueueSnapshot(resolveUrl(modelPath), bgColor)
      .then((url) => { if (!cancelled) setSnapshot(url); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [modelPath, bgColor]);

  return snapshot;
}
