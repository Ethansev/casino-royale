"use client";

import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef, type ComponentRef } from "react";
import { useTheme } from "@/store/uiStore";

export type CameraPreset = "shooter" | "overhead" | "corner";

const PRESETS: Readonly<
  Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }>
> = {
  shooter: { position: [0, 3.6, 6.2], target: [0, 0, -0.6] },
  overhead: { position: [0, 8.2, 0.01], target: [0, 0, 0] },
  corner: { position: [4.8, 3.4, 4.2], target: [0, 0, 0] },
};

export function Scene({ preset }: { preset: CameraPreset }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const p = PRESETS[preset];
    camera.position.set(p.position[0], p.position[1], p.position[2]);
    controls.current?.target.set(p.target[0], p.target[1], p.target[2]);
    controls.current?.update();
    invalidate();
  }, [preset, camera, invalidate]);

  const theme = useTheme();
  return (
    <>
      <ambientLight intensity={theme.scene.ambient} />
      <spotLight
        position={[0, 9, 2.5]}
        angle={0.7}
        penumbra={0.6}
        intensity={theme.scene.spot.intensity}
        color={theme.scene.spot.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {theme.scene.points.map((p, i) => (
        <pointLight
          key={i}
          position={[p.position[0], p.position[1], p.position[2]]}
          intensity={p.intensity}
          color={p.color}
        />
      ))}
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.42}
        minAzimuthAngle={-Math.PI / 3.5}
        maxAzimuthAngle={Math.PI / 3.5}
        minDistance={3}
        maxDistance={11}
      />
    </>
  );
}
