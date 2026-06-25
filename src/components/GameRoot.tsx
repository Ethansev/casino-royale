"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Variant } from "@/engine/types";
import { BRAND } from "./Brand";
import { ChipEmblem } from "./ChipEmblem";
import { PresenceHeartbeat } from "./PresenceHeartbeat";
import { ChatPanel } from "./chat/ChatPanel";
import { tableRoom } from "@/lib/chatRooms";
import { ChipTray } from "./hud/ChipTray";
import { DealerBanner } from "./hud/DealerBanner";
import { FlyingChips } from "./hud/FlyingChips";
import { ChevronLeftIcon } from "./hud/icons";
import { TopMeters } from "./hud/MeterPanel";
import { OddsChartModal } from "./hud/OddsChartModal";
import { HistoryRibbon } from "./hud/RollHistory";
import { SettingsMenu } from "./hud/SettingsMenu";
import { ViewToggle } from "./hud/ViewToggle";
import { WinBanner } from "./hud/WinBanner";
import { Table2D } from "./table2d/Table2D";
import {
  endSession,
  getEngineConfig,
  roll,
  startSession,
} from "@/store/engineBridge";
import { useGameStore } from "@/store/gameStore";
import { useUiStore } from "@/store/uiStore";

const Table3D = dynamic(() => import("./table3d/Table3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[62vh] w-full items-center justify-center rounded-3xl bg-black/40">
      <p style={{ color: "var(--mr-dim)" }}>Bringing up the table…</p>
    </div>
  ),
});

function RollButton() {
  const rolling = useGameStore((s) => s.rolling);
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={roll}
        onMouseDown={(e) => e.preventDefault()}
        disabled={rolling}
        className="rounded-2xl px-12 py-4 font-marquee text-3xl font-extrabold tracking-[0.14em] transition active:translate-y-0.5 disabled:opacity-50 motion-safe:[animation:roll-breathe_2.6s_ease-in-out_infinite] disabled:[animation:none]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--mr-accent) 82%, white), var(--mr-accent) 55%, color-mix(in oklab, var(--mr-accent) 80%, black))",
          color: "var(--mr-accent-text)",
          border: "1px solid color-mix(in oklab, var(--mr-accent) 70%, black)",
        }}
      >
        {rolling ? "ROLLING…" : "ROLL"}
      </button>
      <kbd
        className="hidden rounded-md border border-white/15 px-2 py-1 text-[9px] font-bold uppercase tracking-widest sm:block"
        style={{ color: "var(--mr-dim)" }}
      >
        Space
      </kbd>
    </div>
  );
}

export default function GameRoot({ variant }: { variant: Variant }) {
  const seated = useGameStore((s) => s.snapshot !== null);
  const viewMode = useUiStore((s) => s.viewMode);
  const [oddsOpen, setOddsOpen] = useState(false);
  const config = getEngineConfig();

  // Sessions auto-start from the lobby choice (3-4-5x odds house default).
  useEffect(() => {
    const current = useGameStore.getState().snapshot?.variant;
    if (current === variant) return;
    if (current) endSession();
    startSession(variant, { kind: "THREE_FOUR_FIVE" });
  }, [variant]);

  // Warm the heavy chunks so the first render/roll doesn't stutter.
  useEffect(() => {
    if (!seated) return;
    void import("./table3d/Table3D");
    void import("./table2d/DiceRollOverlay");
  }, [seated]);

  // Spacebar rolls — but never steal Space from a focused control
  // (keyboard users place bets with Space on zone buttons).
  useEffect(() => {
    if (!seated) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const el = document.activeElement;
      if (el && el !== document.body && el.tagName !== "HTML") return;
      e.preventDefault();
      roll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seated]);

  if (!seated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--mr-dim)" }}>Walking to the table…</p>
      </main>
    );
  }

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-[2000px] select-none flex-col items-center gap-3 p-3 sm:p-4"
      style={{ touchAction: "manipulation" }}
    >
      <PresenceHeartbeat game={variant === "crapless" ? "crapless" : "craps"} />
      <ChatPanel room={tableRoom(variant === "crapless" ? "crapless" : "craps")} />
      <div className="flex w-full flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => endSession()}
            aria-label="Back to lobby"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 ring-1 ring-white/10 transition hover:bg-white/15 active:scale-95"
          >
            <ChevronLeftIcon />
          </Link>
          <span className="flex items-center gap-2 font-marquee text-lg font-bold tracking-[0.12em]">
            <ChipEmblem size={22} />
            {BRAND.toUpperCase()}
            <span style={{ color: "var(--mr-dim)" }}>
              · {variant === "crapless" ? "CRAPLESS" : "CRAPS"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle />
          <button
            onClick={() => setOddsOpen(true)}
            onMouseDown={(e) => e.preventDefault()}
            className="rounded-full bg-white/8 px-4 py-1.5 text-sm font-semibold ring-1 ring-white/10 transition hover:bg-white/15 active:scale-95"
          >
            Odds
          </button>
          <SettingsMenu />
        </div>
      </div>
      {oddsOpen && config && (
        <OddsChartModal config={config} onClose={() => setOddsOpen(false)} />
      )}

      {/* The console: everything game-related lives inside one housing */}
      <div className="console flex w-full flex-col items-center gap-2 p-4 sm:p-6">
        <TopMeters />
        <DealerBanner />
        {viewMode === "3d" ? <Table3D /> : <Table2D />}
        <HistoryRibbon />
        <div className="dock mt-2 flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-3">
          <ChipTray />
          <RollButton />
        </div>
      </div>
      <WinBanner />
      <FlyingChips />
    </main>
  );
}
