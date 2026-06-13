"use client";

import { DieFace } from "@/components/table2d/Dice2D";
import type { Die } from "@/engine/types";
import { placeBet } from "@/store/engineBridge";
import { useUiStore } from "@/store/uiStore";
import { DialogShell } from "./DialogShell";

const DICE: readonly Die[] = [1, 2, 3, 4, 5, 6];

export function HopPicker({ onClose }: { onClose: () => void }) {
  const chipDenom = useUiStore((s) => s.chipDenom);
  const pairs: Array<readonly [Die, Die]> = [];
  for (const a of DICE) for (const b of DICE) if (b >= a) pairs.push([a, b]);

  return (
    <DialogShell label="Hop the dice" onClose={onClose} maxWidth="max-w-lg">
      <h3 className="mb-1 font-marquee text-2xl font-bold">Hop the dice</h3>
      <p className="mb-4 text-sm" style={{ color: "var(--mr-dim)" }}>
        One roll, exact combination. Pairs pay 30:1, everything else 15:1.
      </p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
        {pairs.map(([a, b]) => {
          const hard = a === b;
          return (
            <button
              key={`${a}-${b}`}
              aria-label={`${a}-${b}`}
              onClick={() => {
                placeBet("HOP", chipDenom, undefined, [a, b]);
                onClose();
              }}
              className="flex flex-col items-center gap-1 rounded-xl bg-white/6 p-2 transition hover:-translate-y-0.5 hover:bg-white/12 active:scale-95"
              style={{
                boxShadow: hard
                  ? "0 0 0 1px var(--mr-accent)"
                  : "0 0 0 1px rgba(255,255,255,0.12)",
                transitionTimingFunction: "var(--ease-spring)",
              }}
            >
              <span className="flex gap-1">
                <DieFace value={a} size={18} />
                <DieFace value={b} size={18} />
              </span>
              <span
                className="text-[9px] font-bold tracking-wider"
                style={{ color: hard ? "var(--mr-accent)" : "var(--mr-dim)" }}
              >
                {hard ? "30:1" : "15:1"}
              </span>
            </button>
          );
        })}
      </div>
      <button
        className="mt-4 w-full rounded-xl bg-white/8 py-2 text-sm font-semibold ring-1 ring-white/12 transition hover:bg-white/15"
        onClick={onClose}
      >
        Close
      </button>
    </DialogShell>
  );
}
