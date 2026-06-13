"use client";

import { DieFace } from "@/components/table2d/Dice2D";
import type { RollRecord, VariantConfig } from "@/engine/types";
import { getEngineConfig } from "@/store/engineBridge";
import { useGameStore } from "@/store/gameStore";

const TOTALS: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function tileStyle(
  r: RollRecord,
  config: VariantConfig | null,
  latest: boolean,
): React.CSSProperties {
  if (latest)
    return {
      boxShadow: "0 0 0 2px var(--mr-accent), 0 0 12px var(--mr-glow)",
    };
  if (r.total === 7 && r.phase === "POINT_ON")
    return { boxShadow: "0 0 0 2px var(--mr-down)" };
  if (r.phase === "POINT_ON" && r.total === r.point)
    return { boxShadow: "0 0 0 2px var(--mr-up)" };
  if (r.phase === "COME_OUT" && config?.passComeOutWin.includes(r.total))
    return { boxShadow: "0 0 0 2px var(--mr-accent)" };
  if (r.phase === "COME_OUT" && config?.pointNumbers.includes(r.total))
    return { boxShadow: "0 0 0 1px rgba(255,255,255,0.4)" };
  return { boxShadow: "0 0 0 1px rgba(255,255,255,0.12)" };
}

function titleFor(r: RollRecord, config: VariantConfig | null): string {
  const dice = `${r.d1}-${r.d2}`;
  if (r.total === 7 && r.phase === "POINT_ON") return `${dice} · seven out`;
  if (r.phase === "POINT_ON" && r.total === r.point) return `${dice} · point made`;
  if (r.phase === "COME_OUT" && config?.passComeOutWin.includes(r.total))
    return `${dice} · natural`;
  if (r.phase === "COME_OUT" && config?.pointNumbers.includes(r.total))
    return `${dice} · point set`;
  return dice;
}

function FrequencyStrip({ history }: { history: readonly RollRecord[] }) {
  const counts = new Map<number, number>();
  for (const r of history) counts.set(r.total, (counts.get(r.total) ?? 0) + 1);
  const max = Math.max(1, ...counts.values());

  return (
    <div className="flex shrink-0 items-end gap-[3px] pr-3" aria-label="Roll frequency">
      {TOTALS.map((t) => {
        const count = counts.get(t) ?? 0;
        return (
          <div key={t} className="flex flex-col items-center" title={`${t}: rolled ${count}×`}>
            <div
              className="w-2 rounded-sm transition-[height] duration-150"
              style={{
                height: 2 + (count / max) * 22,
                background: t === 7 ? "var(--mr-accent2)" : "var(--mr-accent)",
                opacity: 0.75,
              }}
            />
            <span className="text-[8px] leading-3" style={{ color: "var(--mr-dim)" }}>
              {t}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Boxless ribbon of recent rolls — newest first, dissolving at the right edge. */
export function HistoryRibbon() {
  const history = useGameStore((s) => s.snapshot?.rollHistory ?? []);
  const config = getEngineConfig();
  const recent = history.slice(-14).reverse();

  return (
    <div className="flex w-full items-center px-1" aria-label="Roll history">
      <FrequencyStrip history={history} />
      <div
        className="flex flex-1 items-center gap-1.5 overflow-hidden border-l border-white/10 pl-3"
        style={{
          maskImage: "linear-gradient(to right, black 86%, transparent)",
        }}
      >
        {recent.length === 0 && (
          <span className="text-xs italic" style={{ color: "var(--mr-dim)" }}>
            No rolls yet — dice are waiting
          </span>
        )}
        {recent.map((r, i) => (
          <span
            key={`${history.length}-${i}`}
            title={titleFor(r, config)}
            className={`flex flex-col items-center rounded-lg bg-black/30 px-1.5 py-1 ${
              i === 0 && history.length > 0
                ? "ring-white motion-safe:[animation:tile-in_200ms_var(--ease-emph)]"
                : ""
            }`}
            style={tileStyle(r, config, i === 0)}
          >
            <span className="flex gap-[3px]">
              <DieFace value={r.d1} size={20} />
              <DieFace value={r.d2} size={20} />
            </span>
            <span className="text-[13px] font-bold leading-tight">{r.total}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
