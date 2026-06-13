"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/chips";
import { useMyBankroll, useMyTotalOnFelt } from "@/store/gameStore";

/** The value itself updates instantly; only a short color flash marks the change. */
function useChangeFlash(value: number): "up" | "down" | null {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const direction = value > prev.current ? "up" : "down";
    prev.current = value;
    const raf = requestAnimationFrame(() => setFlash(direction));
    const timer = setTimeout(() => setFlash(null), 650);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [value]);

  return flash;
}

// Shared size so Credits and On-the-felt read at the same scale.
const VALUE_SIZE = "clamp(22px, 2.1vw, 28px)";

function Stat({
  label,
  value,
  color,
  testId,
}: {
  label: string;
  value: string;
  color: string;
  testId?: string;
}) {
  return (
    <div className="px-4 py-1 text-right">
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--mr-dim)" }}
      >
        {label}
      </div>
      <div
        data-testid={testId}
        className="font-marquee font-bold tabular-nums"
        style={{ color, fontSize: VALUE_SIZE, lineHeight: 1.05 }}
      >
        {value}
      </div>
    </div>
  );
}

/** CREDITS rides boxless top-left; the bet stats live in one capsule. */
export function TopMeters() {
  const bankroll = useMyBankroll();
  const onFelt = useMyTotalOnFelt();
  const flash = useChangeFlash(bankroll);

  const creditColor =
    flash === "up"
      ? "var(--mr-up)"
      : flash === "down"
        ? "var(--mr-down)"
        : "var(--mr-accent)";

  return (
    <div className="flex w-full flex-wrap items-end justify-between gap-2">
      <div className="px-1">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--mr-dim)" }}
        >
          Credits
        </div>
        <div
          data-testid="bankroll"
          className="font-marquee font-bold tabular-nums transition-colors"
          style={{
            fontSize: VALUE_SIZE,
            lineHeight: 1.05,
            color: creditColor,
            textShadow: "0 0 18px var(--mr-glow)",
          }}
        >
          {formatMoney(bankroll)}
        </div>
      </div>

      <div className="flex items-stretch rounded-full bg-black/25 ring-1 ring-white/10">
        <Stat
          label="On the felt"
          value={formatMoney(onFelt)}
          color="var(--mr-accent)"
          testId="on-felt"
        />
      </div>
    </div>
  );
}
