"use client";

import type { Die } from "@/engine/types";

export const PIPS: Readonly<Record<Die, ReadonlyArray<readonly [number, number]>>> = {
  1: [[0.5, 0.5]],
  2: [
    [0.25, 0.25],
    [0.75, 0.75],
  ],
  3: [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
  4: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  5: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.5, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  6: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.5],
    [0.75, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
};

export function DieFace({
  value,
  size = 44,
  rolling = false,
}: {
  value: Die;
  size?: number;
  rolling?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1 1"
      className={rolling ? "motion-safe:animate-spin" : undefined}
      aria-label={rolling ? "rolling die" : `die showing ${value}`}
    >
      <rect
        x={0.02}
        y={0.02}
        width={0.96}
        height={0.96}
        rx={0.18}
        fill="#fef2f2"
        stroke="#b91c1c"
        strokeWidth={0.04}
      />
      {PIPS[value].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={0.09} fill="#b91c1c" />
      ))}
    </svg>
  );
}
