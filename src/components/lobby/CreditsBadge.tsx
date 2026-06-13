"use client";

import { useSyncExternalStore } from "react";
import { formatMoney } from "@/lib/chips";
import { useStatsStore } from "@/store/statsStore";

const KEY = "craps-bankroll";
const EVENT = "craps-credits";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

const getSnapshot = () => window.localStorage.getItem(KEY) ?? "1000";
const getServerSnapshot = () => null;

function parse(raw: string | null): number {
  const value = raw === null ? NaN : Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 1000;
}

/** Casino-wide credit balance (shared with the games via localStorage). */
export function CreditsBadge({ className = "" }: { className?: string }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      onClick={() => {
        window.localStorage.setItem(KEY, String(parse(raw) + 1000));
        window.dispatchEvent(new Event(EVENT));
        useStatsStore.getState().recordTopUp(1000);
      }}
      onMouseDown={(e) => e.preventDefault()}
      title="Tap to top up $1,000 (testing)"
      data-testid="lobby-credits"
      className={`text-right transition hover:opacity-80 ${className}`}
    >
      <span className="block text-[10px] uppercase tracking-[0.25em] opacity-60">
        Credits
      </span>
      <span className="block text-xl font-bold tabular-nums">
        {raw === null ? "—" : formatMoney(parse(raw))}
      </span>
    </button>
  );
}
