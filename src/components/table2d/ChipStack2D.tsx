"use client";

import { chipStyle, formatMoney } from "@/lib/chips";

export const CHIP_R = 21;

export function ChipStack2D({
  x,
  y,
  amount,
}: {
  x: number;
  y: number;
  amount: number;
}) {
  if (amount <= 0) return null;
  const style = chipStyle(amount);
  const layers = Math.min(4, Math.max(1, Math.floor(amount / 5)));
  return (
    <g pointerEvents="none">
      {Array.from({ length: layers }, (_, i) => (
        <circle
          key={i}
          cx={x}
          cy={y - i * 4}
          r={CHIP_R}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={3}
          strokeDasharray="5 4"
        />
      ))}
      <text
        x={x}
        y={y - (layers - 1) * 4 + 5}
        textAnchor="middle"
        fontSize={15}
        fontWeight={800}
        fill={style.text}
      >
        {formatMoney(amount)}
      </text>
    </g>
  );
}
