"use client";

import type { BetInfo } from "@/engine/info/betInfo";

export function edgeColor(pct: number): string {
  if (pct <= 0.01) return "text-emerald-400";
  if (pct < 2) return "text-emerald-300";
  if (pct < 5) return "text-yellow-300";
  if (pct < 10) return "text-orange-400";
  return "text-red-400";
}

export function BetTooltip({
  info,
  x,
  y,
}: {
  info: BetInfo;
  x: number;
  y: number;
}) {
  return (
    <div
      className="pointer-events-none absolute z-20 w-64 rounded-xl border border-neutral-700 bg-neutral-900/95 p-3 shadow-2xl"
      style={{ left: x + 14, top: y + 14 }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold text-amber-200">{info.name}</span>
        <span className="text-sm font-semibold text-neutral-200">
          pays {info.payoutText}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-neutral-400">House edge</span>
        <span className={`font-bold ${edgeColor(info.houseEdgePct)}`}>
          {info.houseEdgePct === 0 ? "0% — free!" : `${info.houseEdgePct}%`}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
        Click the ? toggle for full details
      </p>
    </div>
  );
}
