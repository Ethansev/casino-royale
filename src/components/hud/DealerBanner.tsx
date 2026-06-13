"use client";

import { useGameStore } from "@/store/gameStore";

/** Table-placard dealer line: marquee text flanked by hairline rules. */
export function DealerBanner() {
  const banner = useGameStore((s) => s.banner);
  const error = useGameStore((s) => s.error);
  const text = error ?? banner;

  return (
    <div className="flex h-12 w-full items-center gap-4 px-2">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/30" />
      <p
        key={text}
        className="max-w-[70%] truncate text-center font-marquee text-[22px] font-semibold motion-safe:[animation:dealer-in_240ms_var(--ease-emph)]"
        style={{ color: error ? "var(--mr-down)" : "var(--mr-text)" }}
      >
        {error && (
          <span
            className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
            style={{ background: "var(--mr-down)" }}
          />
        )}
        {text}
      </p>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-white/20 to-white/30" />
    </div>
  );
}
