"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/chips";
import { useGameStore } from "@/store/gameStore";

const COIN_COUNT = 40;
const SPARKLES = 7;

/** Gold coins raining from the top of the screen. */
function GoldCoins() {
  return (
    <>
      {Array.from({ length: COIN_COUNT }, (_, i) => {
        const size = i % 3 === 0 ? 26 : 20;
        const style: React.CSSProperties & { "--dur": string } = {
          left: `${4 + ((i * 41) % 92)}%`,
          top: "-12vh",
          width: size,
          height: size,
          borderRadius: "9999px",
          background:
            "radial-gradient(circle at 35% 30%, #ffe9a8, #f5c542 55%, #b8860b)",
          boxShadow:
            "inset 0 0 0 2px rgba(255,255,255,0.45), 0 2px 6px rgba(0,0,0,0.5)",
          "--dur": `${1.0 + ((i * 17) % 8) / 10}s`,
          animationDelay: `${((i * 53) % 28) / 100}s`,
        };
        return (
          <span
            key={i}
            className="absolute block motion-safe:[animation:coin-fall_var(--dur)_ease-in_forwards] motion-reduce:hidden"
            style={style}
          />
        );
      })}
    </>
  );
}

/** Twinkling sparkles ringing the win card. */
function Sparkles() {
  return (
    <>
      {Array.from({ length: SPARKLES }, (_, i) => {
        // Place around the card's edges (top/bottom rows alternating).
        const onTop = i % 2 === 0;
        const style: React.CSSProperties = {
          left: `${6 + ((i * 27) % 88)}%`,
          [onTop ? "top" : "bottom"]: "-14px",
          animationDelay: `${((i * 31) % 60) / 100}s`,
          color: "var(--mr-accent)",
        };
        return (
          <span
            key={i}
            className="absolute text-3xl drop-shadow-[0_0_8px_var(--mr-glow)] motion-safe:[animation:sparkle_1.2s_ease-in-out_infinite] motion-reduce:hidden"
            style={style}
          >
            ✦
          </span>
        );
      })}
    </>
  );
}

/** Counting "YOU WIN $X" banner that drops from the top with coins + sparkles. */
export function WinBanner() {
  const fxSeq = useGameStore((s) => s.fxSeq);
  const winTotal = useGameStore((s) => s.winTotal);
  const show = fxSeq > 0 && winTotal > 0;

  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!show) return;
    let raf = 0;
    let startTs: number | null = null;
    const dur = 800;
    const tick = (now: number) => {
      if (startTs === null) startTs = now;
      const p = Math.min(1, (now - startTs) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(winTotal * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setShown(winTotal);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show, winTotal, fxSeq]);

  if (!show) return null;

  const tier =
    winTotal >= 100 ? "text-8xl" : winTotal >= 25 ? "text-7xl" : "text-6xl";

  return (
    <div
      key={fxSeq}
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      <div className="absolute inset-0 bg-black/35 motion-safe:[animation:win-dim_2.2s_ease-out_forwards] motion-reduce:opacity-100" />
      <GoldCoins />
      <div
        className="absolute left-1/2 top-[22%] motion-safe:[animation:win-card-in_2.2s_ease-out_forwards] motion-reduce:opacity-100"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div
          className="relative flex flex-col items-center gap-2 rounded-3xl border-2 px-12 py-9 backdrop-blur-md sm:px-16 sm:py-11"
          style={{
            background: "var(--mr-surface)",
            borderColor: "var(--mr-accent)",
            boxShadow:
              "0 0 0 1px rgba(0,0,0,0.4), 0 24px 80px rgba(0,0,0,0.6), 0 0 60px var(--mr-glow)",
          }}
        >
          <Sparkles />
          <span
            className="font-marquee text-2xl font-bold uppercase tracking-[0.4em] sm:text-3xl"
            style={{ color: "var(--mr-up)" }}
          >
            You Win
          </span>
          <span
            className={`whitespace-nowrap font-marquee font-extrabold tracking-tight ${tier}`}
            style={{
              color: "var(--mr-accent)",
              textShadow: "0 2px 4px rgba(0,0,0,0.6), 0 0 34px var(--mr-glow)",
            }}
          >
            {formatMoney(shown)}
          </span>
        </div>
      </div>
    </div>
  );
}
