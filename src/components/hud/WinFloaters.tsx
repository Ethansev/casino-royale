"use client";

import type { VariantConfig } from "@/engine/types";
import { BOARD_H, BOARD_W, chipPositionForBet } from "@/lib/betZones";
import { formatMoney } from "@/lib/chips";
import { useGameStore } from "@/store/gameStore";

/** Floating "+$X" at each winning bet's spot; restarts via key={fxSeq}. */
export function WinFloaters({ config }: { config: VariantConfig }) {
  const fxSeq = useGameStore((s) => s.fxSeq);
  const resolutions = useGameStore((s) => s.lastResolutions);
  if (fxSeq === 0) return null;

  const winners = resolutions.filter((r) => r.profit > 0);
  return (
    <div key={fxSeq} className="pointer-events-none absolute inset-0 z-20">
      {winners.map((r, i) => {
        const pos = chipPositionForBet(config, { key: r.key });
        if (!pos) return null;
        return (
          <span
            key={r.key}
            className="absolute text-xl font-extrabold text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] motion-safe:[animation:float-up_1.5s_ease-out_forwards] motion-reduce:opacity-0"
            style={{
              left: `${(pos.x / BOARD_W) * 100}%`,
              top: `${(pos.y / BOARD_H) * 100}%`,
              animationDelay: `${i * 90}ms`,
            }}
          >
            +{formatMoney(r.profit)}
          </span>
        );
      })}
    </div>
  );
}
