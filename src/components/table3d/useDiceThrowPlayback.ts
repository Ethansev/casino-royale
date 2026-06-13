"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import type { Group } from "three";
import { notifyDiceSettled } from "@/store/engineBridge";
import { useGameStore } from "@/store/gameStore";
import { planThrow, type DiceTrajectory } from "./diceThrow";

interface Playback {
  seq: number;
  trajectory: DiceTrajectory;
  time: number;
  done: boolean;
}

/**
 * Drives two die groups through a planned physics trajectory whenever a roll
 * is in flight. Calls notifyDiceSettled() (reveals the result) on settle.
 * Returns the playback ref so callers can tell whether dice just landed.
 */
export function useDiceThrowPlayback(
  die0: RefObject<Group | null>,
  die1: RefObject<Group | null>,
  onDone?: () => void,
): RefObject<Playback | null> {
  const rolling = useGameStore((s) => s.rolling);
  const pendingRoll = useGameStore((s) => s.pendingRoll);
  const rollSeq = useGameStore((s) => s.rollSeq);
  const playback = useRef<Playback | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!rolling || !pendingRoll) return;
    if (playback.current?.seq === rollSeq) return;
    let live = true;
    planThrow([pendingRoll.d1, pendingRoll.d2])
      .then((trajectory) => {
        if (!live) return;
        playback.current = { seq: rollSeq, trajectory, time: 0, done: false };
        invalidate();
      })
      .catch(() => notifyDiceSettled());
    return () => {
      live = false;
    };
  }, [rollSeq, rolling, pendingRoll, invalidate]);

  useFrame((_, delta) => {
    const pb = playback.current;
    if (!pb || pb.done) return;
    pb.time += Math.min(delta, 0.1);
    const idx = Math.min(Math.floor(pb.time / pb.trajectory.dt), pb.trajectory.count - 1);
    [die0, die1].forEach((ref, i) => {
      const g = ref.current;
      if (!g) return;
      const d = pb.trajectory.dice[i];
      g.position.set(d.positions[idx * 3], d.positions[idx * 3 + 1], d.positions[idx * 3 + 2]);
      const q = d.rotations[idx];
      g.quaternion.set(q.x, q.y, q.z, q.w);
    });
    if (idx >= pb.trajectory.count - 1) {
      pb.done = true;
      [die0, die1].forEach((ref, i) => {
        const q = pb.trajectory.dice[i].settleRotation;
        ref.current?.quaternion.set(q.x, q.y, q.z, q.w);
      });
      notifyDiceSettled();
      onDoneRef.current?.();
    }
    invalidate();
  });

  return playback;
}
