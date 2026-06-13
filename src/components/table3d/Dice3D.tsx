"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import type { Die } from "@/engine/types";
import { faceUpQuaternion } from "@/lib/diceMath";
import { useGameStore } from "@/store/gameStore";
import { DICE_REST } from "./coords";
import { DieMesh } from "./DieMesh";
import { useDiceThrowPlayback } from "./useDiceThrowPlayback";

export function Dice3D() {
  const rolling = useGameStore((s) => s.rolling);
  const lastRoll = useGameStore((s) => s.lastRoll);
  const die0 = useRef<Group>(null);
  const die1 = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const playback = useDiceThrowPlayback(die0, die1);

  // Idle pose: last roll's faces at the rest spots (unless dice just landed —
  // they stay where the throw left them).
  useEffect(() => {
    if (rolling || playback.current?.done) return;
    const faces: readonly [Die, Die] = [lastRoll?.d1 ?? 3, lastRoll?.d2 ?? 4];
    [die0, die1].forEach((ref, i) => {
      const g = ref.current;
      if (!g) return;
      g.position.set(DICE_REST[i][0], DICE_REST[i][1], DICE_REST[i][2]);
      const q = faceUpQuaternion(faces[i]);
      g.quaternion.set(q.x, q.y, q.z, q.w);
    });
    invalidate();
  }, [rolling, lastRoll, invalidate, playback]);

  return (
    <group>
      <group ref={die0}>
        <DieMesh />
      </group>
      <group ref={die1}>
        <DieMesh />
      </group>
    </group>
  );
}
