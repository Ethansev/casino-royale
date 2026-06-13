"use client";

import { chipStyle } from "@/lib/chips";
import {
  clearAllBets,
  clearLastBets,
  doubleBets,
  repeatLastBets,
} from "@/store/engineBridge";
import { useGameStore } from "@/store/gameStore";
import { CHIP_DENOMS, useUiStore } from "@/store/uiStore";

function TrayButton({
  label,
  sub,
  onClick,
  disabled,
}: {
  label: string;
  sub?: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      disabled={disabled}
      className="flex h-12 flex-col items-center justify-center rounded-xl bg-white/6 px-4 text-[11px] font-bold uppercase leading-tight tracking-wider ring-1 ring-white/12 transition hover:-translate-y-0.5 hover:bg-white/12 active:translate-y-0 active:scale-95 disabled:opacity-40"
      style={{ color: "var(--mr-text)", transitionTimingFunction: "var(--ease-out-soft)" }}
    >
      <span>{label}</span>
      {sub && <span style={{ color: "var(--mr-dim)" }}>{sub}</span>}
    </button>
  );
}

export function ChipTray() {
  const chipDenom = useUiStore((s) => s.chipDenom);
  const setChipDenom = useUiStore((s) => s.setChipDenom);
  const rolling = useGameStore((s) => s.rolling);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
      <TrayButton label="Clear" sub="last bet" onClick={clearLastBets} disabled={rolling} />
      <TrayButton label="Take Down" sub="all bets" onClick={clearAllBets} disabled={rolling} />
      <div
        className="flex flex-wrap items-center justify-center gap-1.5"
        role="radiogroup"
        aria-label="Chip value"
      >
        {CHIP_DENOMS.map((denom) => {
          const style = chipStyle(denom);
          const selected = denom === chipDenom;
          return (
            <span key={denom} className="chip-well">
              <button
                role="radio"
                aria-checked={selected}
                onClick={() => setChipDenom(denom)}
                onMouseDown={(e) => e.preventDefault()}
                className={`flex items-center justify-center rounded-full border-4 border-dashed text-sm font-bold shadow-lg transition-all sm:text-base ${
                  selected
                    ? "h-12 w-12 -translate-y-1.5 sm:h-14 sm:w-14"
                    : "h-10 w-10 hover:-translate-y-0.5 sm:h-12 sm:w-12"
                }`}
                style={{
                  background: style.fill,
                  borderColor: style.stroke,
                  color: style.text,
                  transitionTimingFunction: "var(--ease-spring)",
                  boxShadow: selected
                    ? "0 0 0 2px var(--mr-accent), 0 0 18px 4px var(--mr-glow)"
                    : undefined,
                }}
              >
                ${denom}
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <TrayButton label="×2 Double" sub="bet" onClick={doubleBets} disabled={rolling} />
        <TrayButton label="Repeat" sub="last bet" onClick={repeatLastBets} disabled={rolling} />
      </div>
    </div>
  );
}
