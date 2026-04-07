"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { WeatherSystem, TreeSway, RiverMesh } from "@/features/garden/components/WeatherSystem";
import { useWeatherEnvironment, type EnvironmentData } from "@/features/garden/hooks/useWeatherEnvironment";

function Scene({ overrideTimeOfDay }: { overrideTimeOfDay?: EnvironmentData["time_of_day"] }) {
  const { params, env } = useWeatherEnvironment(overrideTimeOfDay);

  return (
    <>
      {/* 天候・時間帯システム */}
      <WeatherSystem params={params} />

      {/* 霧 */}
      {params.fogEnabled && (
        <fog attach="fog" args={[params.fogColor, params.fogNear, params.fogFar]} />
      )}

      {/* カメラ操作 */}
      <OrbitControls
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={30}
      />

      {/* グラウンド */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={params.groundColor} />
      </mesh>

      {/* 川 */}
      <RiverMesh position={[8, 0.01, 0]} />

      {/* 木（葉っぱが揺れる） */}
      <TreeSway swayStrength={0.04} swaySpeed={0.8} offset={0}>
        <group position={[-4, 0, -2]}>
          {/* 幹 */}
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
            <meshStandardMaterial color="#78350F" />
          </mesh>
          {/* 葉 */}
          <mesh position={[0, 3, 0]} castShadow>
            <coneGeometry args={[1.2, 2.5, 8]} />
            <meshStandardMaterial color="#22C55E" />
          </mesh>
          <mesh position={[0, 4.2, 0]} castShadow>
            <coneGeometry args={[0.9, 2, 8]} />
            <meshStandardMaterial color="#16A34A" />
          </mesh>
        </group>
      </TreeSway>

      <TreeSway swayStrength={0.03} swaySpeed={1.1} offset={1.5}>
        <group position={[2, 0, -5]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.25, 1.6, 8]} />
            <meshStandardMaterial color="#92400E" />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <sphereGeometry args={[1.0, 10, 10]} />
            <meshStandardMaterial color="#166534" />
          </mesh>
        </group>
      </TreeSway>

      <TreeSway swayStrength={0.05} swaySpeed={0.6} offset={3.0}>
        <group position={[-7, 0, 2]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 2.4, 8]} />
            <meshStandardMaterial color="#78350F" />
          </mesh>
          <mesh position={[0, 3.5, 0]} castShadow>
            <coneGeometry args={[1.5, 3, 8]} />
            <meshStandardMaterial color="#15803D" />
          </mesh>
          <mesh position={[0, 5, 0]} castShadow>
            <coneGeometry args={[1.0, 2, 8]} />
            <meshStandardMaterial color="#22C55E" />
          </mesh>
        </group>
      </TreeSway>

      {/* 小屋 */}
      <group position={[0, 0, 2]}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[2.5, 1.5, 2]} />
          <meshStandardMaterial color="#D6B896" />
        </mesh>
        <mesh position={[0, 1.8, 0]} castShadow>
          <coneGeometry args={[1.8, 1.2, 4]} />
          <meshStandardMaterial color="#B91C1C" />
        </mesh>
      </group>

      {/* 天気インジケーター（デバッグ用、本番では非表示可） */}
    </>
  );
}

export function GardenCanvas({ overrideTimeOfDay }: { overrideTimeOfDay?: EnvironmentData["time_of_day"] } = {}) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 8, 18], fov: 50 }}
        shadows
      >
        <Suspense fallback={null}>
          <Scene overrideTimeOfDay={overrideTimeOfDay} />
        </Suspense>
      </Canvas>
    </div>
  );
}
