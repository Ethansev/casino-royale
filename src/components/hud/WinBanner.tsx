"use client";

import { formatMoney } from "@/lib/chips";
import { useGameStore } from "@/store/gameStore";

const CONFETTI_COLORS = [
  "var(--mr-accent)",
  "var(--mr-accent2)",
  "var(--mr-up)",
  "#ffffff",
];

function Confetti() {
  return (
    <>
      {Array.from({ length: 24 }, (_, i) => {
        // deterministic per-piece variety, no Math.random
        const style: React.CSSProperties & { "--dur": string } = {
          left: `${8 + ((i * 37) % 84)}%`,
          top: "-4vh",
          width: i % 3 === 0 ? 10 : 7,
          height: i % 2 === 0 ? 12 : 8,
          borderRadius: i % 4 === 0 ? "9999px" : "2px",
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          "--dur": `${1.4 + ((i * 13) % 10) / 10}s`,
          animationDelay: `${((i * 53) % 40) / 100}s`,
        };
        return (
          <span
            key={i}
            className="absolute block motion-safe:[animation:confetti-fall_var(--dur)_ease-in_forwards] motion-reduce:hidden"
            style={style}
          />
        );
      })}
    </>
  );
}

/** "YOU WIN $X" callout after a winning roll; confetti for the good ones. */
export function WinBanner() {
  const fxSeq = useGameStore((s) => s.fxSeq);
  const winTotal = useGameStore((s) => s.winTotal);
  if (fxSeq === 0 || winTotal <= 0) return null;

  const tier =
    winTotal >= 100 ? "text-7xl" : winTotal >= 25 ? "text-6xl" : "text-5xl";

  return (
    <div key={fxSeq} className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {winTotal >= 25 && <Confetti />}
      <p
        className={`absolute left-1/2 top-[38%] whitespace-nowrap font-marquee font-extrabold tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] motion-safe:[animation:win-banner_1.9s_ease-out_forwards] motion-reduce:opacity-0 ${tier}`}
        style={{ color: winTotal >= 25 ? "var(--mr-accent)" : "var(--mr-up)" }}
      >
        YOU WIN {formatMoney(winTotal)}
      </p>
    </div>
  );
}
