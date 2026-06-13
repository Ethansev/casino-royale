"use client";

import type { BetInfo } from "@/engine/info/betInfo";
import { edgeColor } from "./BetTooltip";
import { DialogShell } from "./DialogShell";
import { SparkIcon } from "./icons";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/8 py-2 text-sm">
      <span className="shrink-0" style={{ color: "var(--mr-dim)" }}>
        {label}
      </span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function BetInfoCard({
  info,
  onBet,
  onClose,
  betLabel,
}: {
  info: BetInfo;
  onBet?: () => void;
  onClose: () => void;
  betLabel?: string;
}) {
  return (
    <DialogShell label={`About ${info.name}`} onClose={onClose}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-marquee text-2xl font-bold">{info.name}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${edgeColor(info.houseEdgePct)}`}
          style={{ background: "color-mix(in oklab, currentColor 15%, transparent)" }}
        >
          {info.houseEdgePct === 0 ? "0% edge" : `${info.houseEdgePct}% edge`}
        </span>
      </div>
      <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--mr-text)" }}>
        {info.description}
      </p>
      <Row label="Wins" value={info.winsWhen} />
      <Row label="Loses" value={info.losesWhen} />
      <Row label="Pays" value={<strong>{info.payoutText}</strong>} />
      {info.trueOddsText && <Row label="True odds" value={info.trueOddsText} />}
      {info.tip && (
        <p
          className="mt-3 flex items-start gap-2 rounded-lg p-3 text-sm leading-relaxed"
          style={{
            background: "color-mix(in oklab, var(--mr-accent) 12%, transparent)",
            color: "var(--mr-accent)",
          }}
        >
          <span className="mt-0.5 shrink-0">
            <SparkIcon />
          </span>
          {info.tip}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        {onBet && (
          <button
            onClick={() => {
              onBet();
              onClose();
            }}
            className="flex-1 rounded-xl py-2.5 font-bold transition hover:brightness-110 active:scale-[0.98]"
            style={{ background: "var(--mr-accent)", color: "var(--mr-accent-text)" }}
          >
            {betLabel ?? "Place bet"}
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-1 rounded-xl bg-white/8 py-2.5 font-semibold ring-1 ring-white/12 transition hover:bg-white/15"
        >
          Got it
        </button>
      </div>
    </DialogShell>
  );
}
