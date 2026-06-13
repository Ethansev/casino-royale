"use client";

import { getBetInfo, type BetInfo } from "@/engine/info/betInfo";
import type { BetTarget } from "@/engine/info/exactEdge";
import type { BetDefId, VariantConfig } from "@/engine/types";
import { edgeColor } from "./BetTooltip";
import { DialogShell } from "./DialogShell";
import { CloseIcon } from "./icons";

function chartRows(config: VariantConfig): BetInfo[] {
  const entries: Array<[BetDefId, BetTarget]> = [
    ["PASS", {}],
    ["COME", {}],
    ["PASS_ODDS", {}],
    ["FIELD", {}],
    ...config.placeNumbers.map((n): [BetDefId, BetTarget] => ["PLACE", { number: n }]),
    ...config.buyNumbers.map((n): [BetDefId, BetTarget] => ["BUY", { number: n }]),
    ...config.layNumbers.map((n): [BetDefId, BetTarget] => ["LAY", { number: n }]),
    ["BIG_6", {}],
    ["BIG_8", {}],
    ["HARDWAY", { number: 6 }],
    ["HARDWAY", { number: 8 }],
    ["HARDWAY", { number: 4 }],
    ["HARDWAY", { number: 10 }],
    ["ANY_SEVEN", {}],
    ["ANY_CRAPS", {}],
    ["YO", {}],
    ["THREE", {}],
    ["ACES", {}],
    ["TWELVE", {}],
    ["HOP", { hop: [2, 5] }],
    ["HOP", { hop: [3, 3] }],
    ["HORN", {}],
    ["CE", {}],
  ];
  if (config.dontBetsAllowed) {
    entries.splice(2, 0, ["DONT_PASS", {}], ["DONT_COME", {}], ["DONT_PASS_ODDS", {}]);
  }
  const rows = entries.map(([defId, target]) => getBetInfo(defId, target, config));
  rows.sort((a, b) => a.houseEdgePct - b.houseEdgePct);
  return rows;
}

const MAX_EDGE = 17;

export function OddsChartModal({
  config,
  onClose,
}: {
  config: VariantConfig;
  onClose: () => void;
}) {
  const rows = chartRows(config);
  return (
    <DialogShell label="Odds chart" onClose={onClose} fixed maxWidth="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-marquee text-2xl font-bold">
          Every bet, ranked by house edge
        </h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 ring-1 ring-white/12 transition hover:bg-white/15"
        >
          <CloseIcon />
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="sticky top-0 backdrop-blur" style={{ background: "var(--mr-surface)" }}>
          <tr
            className="border-b border-white/15 text-left text-xs uppercase tracking-wider"
            style={{ color: "var(--mr-dim)" }}
          >
            <th className="py-2 pr-2">Bet</th>
            <th className="py-2 pr-2">Pays</th>
            <th className="py-2 pr-2">True odds</th>
            <th className="py-2 text-right">House edge</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((info, i) => (
            <tr key={i} className="border-b border-white/8 transition hover:bg-white/5">
              <td className="py-2 pr-2 font-semibold">{info.name}</td>
              <td className="py-2 pr-2" style={{ color: "var(--mr-text)" }}>
                {info.payoutText}
              </td>
              <td className="py-2 pr-2" style={{ color: "var(--mr-dim)" }}>
                {info.trueOddsText ?? "—"}
              </td>
              <td className="relative py-2 pl-4 text-right">
                <span
                  className={`absolute inset-y-1.5 right-0 rounded-sm opacity-15 ${edgeColor(info.houseEdgePct)}`}
                  style={{
                    width: `${Math.min(100, (info.houseEdgePct / MAX_EDGE) * 100)}%`,
                    background: "currentColor",
                  }}
                />
                <span className={`relative font-bold ${edgeColor(info.houseEdgePct)}`}>
                  {info.houseEdgePct === 0 ? "0%" : `${info.houseEdgePct.toFixed(2)}%`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--mr-dim)" }}>
        House edge is the casino&apos;s long-run take per dollar wagered, per bet
        resolved. Lower is better for you. Free odds are the only zero-edge bet —
        that&apos;s why every craps regular tells you to take them.
      </p>
    </DialogShell>
  );
}
