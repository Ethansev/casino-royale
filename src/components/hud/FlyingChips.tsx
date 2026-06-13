"use client";

import { useEffect } from "react";
import { BOARD_H, BOARD_W, chipPositionForBet } from "@/lib/betZones";
import { flyChipSprite } from "@/lib/chipFx";
import { getEngineConfig } from "@/store/engineBridge";
import { useGameStore } from "@/store/gameStore";

/** Winning chips fly from their bet spot to the credits meter (2D board view). */
export function FlyingChips() {
  const fxSeq = useGameStore((s) => s.fxSeq);

  useEffect(() => {
    if (fxSeq === 0) return;
    const config = getEngineConfig();
    // Absent in the 3D view — FlyingChipsLauncher handles it there.
    const board = document.querySelector("[data-board-container]");
    if (!config || !board) return;
    const winners = useGameStore
      .getState()
      .lastResolutions.filter((r) => r.profit > 0);
    const b = board.getBoundingClientRect();
    for (const [i, r] of winners.entries()) {
      const pos = chipPositionForBet(config, { key: r.key });
      if (!pos) continue;
      flyChipSprite(
        b.left + (pos.x / BOARD_W) * b.width,
        b.top + (pos.y / BOARD_H) * b.height,
        r.profit,
        i * 80,
      );
    }
  }, [fxSeq]);

  return null;
}
