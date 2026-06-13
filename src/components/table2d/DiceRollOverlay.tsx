"use client";

import { Canvas } from "@react-three/fiber";
import { useRef, useState } from "react";
import { OrthographicCamera, type Group } from "three";
import { FELT_D, FELT_W } from "@/components/table3d/coords";
import { DieMesh } from "@/components/table3d/DieMesh";
import { useDiceThrowPlayback } from "@/components/table3d/useDiceThrowPlayback";
import { useGameStore } from "@/store/gameStore";

const LINGER_MS = 1300;
const FADE_MS = 600;

function OverlayScene({ onDone }: { onDone: () => void }) {
  const die0 = useRef<Group>(null);
  const die1 = useRef<Group>(null);
  useDiceThrowPlayback(die0, die1, onDone);

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight
        position={[3, 9, 2]}
        intensity={2.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Invisible ground that only catches the dice shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FELT_W, FELT_D]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
      <group ref={die0} scale={1.25}>
        <DieMesh />
      </group>
      <group ref={die1} scale={1.25}>
        <DieMesh />
      </group>
    </>
  );
}

/**
 * The physics dice throw rendered straight over the 2D board: a transparent
 * top-down orthographic canvas whose frustum maps 1:1 onto the board, so the
 * dice tumble across the table the player is betting on.
 */
export default function DiceRollOverlay() {
  const rollSeq = useGameStore((s) => s.rollSeq);
  const rolling = useGameStore((s) => s.rolling);
  // Seq-tracked visibility instead of effect-driven state: a new rollSeq
  // re-activates the overlay; a fresh mount while idle stays hidden.
  const [landedSeq, setLandedSeq] = useState(0);
  const [fadingSeq, setFadingSeq] = useState(0);
  const [hiddenSeq, setHiddenSeq] = useState(0);

  const handleDone = () => {
    const seq = rollSeq;
    setLandedSeq(seq);
    setTimeout(() => setFadingSeq(seq), LINGER_MS);
    setTimeout(() => setHiddenSeq(seq), LINGER_MS + FADE_MS + 80);
  };

  const lingering = rollSeq === landedSeq && rollSeq !== hiddenSeq;
  if (!rolling && !lingering) return null;
  const fading = rollSeq === fadingSeq;

  return (
    <div
      data-dice-overlay
      className="pointer-events-none absolute inset-0 z-10 transition-opacity"
      style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      <Canvas
        orthographic
        shadows
        dpr={[1, 2]}
        frameloop="demand"
        gl={{ alpha: true }}
        camera={{ manual: true }}
        onCreated={({ camera }) => {
          if (camera instanceof OrthographicCamera) {
            camera.left = -FELT_W / 2;
            camera.right = FELT_W / 2;
            camera.top = FELT_D / 2;
            camera.bottom = -FELT_D / 2;
            camera.near = 0.1;
            camera.far = 40;
            camera.zoom = 1;
            camera.position.set(0, 12, 0);
            camera.up.set(0, 0, -1);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
          }
        }}
      >
        <OverlayScene onDone={handleDone} />
      </Canvas>
    </div>
  );
}
