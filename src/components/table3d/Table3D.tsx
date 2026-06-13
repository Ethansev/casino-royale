"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useRef, useState } from "react";
import { getBetInfo } from "@/engine/info/betInfo";
import type { BetInstance } from "@/engine/types";
import { BetInfoCard } from "@/components/hud/BetInfoCard";
import { BetTooltip } from "@/components/hud/BetTooltip";
import { HopPicker } from "@/components/hud/HopPicker";
import { chipPositionForBet, zoneAtBoardPoint, type BetZone } from "@/lib/betZones";
import { zoneEnabled } from "@/lib/zoneRules";
import { getEngineConfig, placeBet, removeBet } from "@/store/engineBridge";
import { useGameStore, YOU } from "@/store/gameStore";
import { useTheme, useUiStore } from "@/store/uiStore";
import { ChipStacks3D } from "./ChipStacks3D";
import { Dice3D } from "./Dice3D";
import {
  DevProjectionHook,
  FeltHitLayer,
  FlyingChipsLauncher,
  WinFloaters3D,
  ZoneHighlight,
  type FeltPointer,
} from "./feltInteraction";
import { PointPuck3D } from "./PointPuck3D";
import { Scene, type CameraPreset } from "./Scene";
import { TableModel } from "./TableModel";

const PRESET_LABELS: ReadonlyArray<[CameraPreset, string]> = [
  ["overhead", "Overhead"],
  ["shooter", "Shooter"],
  ["corner", "Corner"],
];

export default function Table3D() {
  const [preset, setPreset] = useState<CameraPreset>("overhead");
  const [hover, setHover] = useState<{ zone: BetZone; x: number; y: number } | null>(
    null,
  );
  const [infoZone, setInfoZone] = useState<BetZone | null>(null);
  const [hopOpen, setHopOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const snapshot = useGameStore((s) => s.snapshot);
  const helpMode = useUiStore((s) => s.helpMode);
  const showTooltips = useUiStore((s) => s.showTooltips);
  const chipDenom = useUiStore((s) => s.chipDenom);
  const theme = useTheme();
  const config = getEngineConfig();
  if (!config || !snapshot) return null;

  const toLocal = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    return rect
      ? { x: clientX - rect.left, y: clientY - rect.top }
      : { x: 0, y: 0 };
  };

  const handleMove = (p: FeltPointer) => {
    const zone = zoneAtBoardPoint(config, p.bx, p.by);
    if (!zone) {
      setHover(null);
      return;
    }
    const { x, y } = toLocal(p.clientX, p.clientY);
    setHover({ zone, x, y });
  };

  const myChipAt = (bx: number, by: number): BetInstance | null => {
    let best: BetInstance | null = null;
    let bestDist = 34;
    let hopIdx = 0;
    for (const b of snapshot.bets) {
      if (b.playerId !== YOU) continue;
      const pos = chipPositionForBet(config, b, b.hop ? hopIdx++ : 0);
      if (!pos) continue;
      const dist = Math.hypot(bx - pos.x, by - pos.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = b;
      }
    }
    return best;
  };

  // Left click adds: pressing your own chip re-bets it (traveled come flats
  // are contracts, so their chip adds odds instead).
  const handleTap = (p: FeltPointer) => {
    const zone = zoneAtBoardPoint(config, p.bx, p.by);
    if (helpMode) {
      if (zone) setInfoZone(zone);
      return;
    }
    const chip = myChipAt(p.bx, p.by);
    if (chip) {
      const traveledCome =
        (chip.defId === "COME" || chip.defId === "DONT_COME") &&
        chip.number !== undefined;
      if (traveledCome && chip.number !== undefined) {
        placeBet(
          chip.defId === "COME" ? "COME_ODDS" : "DONT_COME_ODDS",
          chipDenom,
          chip.number,
        );
      } else {
        placeBet(chip.defId, chipDenom, chip.number, chip.hop);
      }
      return;
    }
    if (!zone) return;
    if (zone.defId === "HOP") {
      setHopOpen(true);
      return;
    }
    if (!zoneEnabled(zone, snapshot, config, YOU)) return;
    placeBet(zone.defId, chipDenom, zone.number);
  };

  // Right click takes the bet down.
  const handleRightTap = (p: FeltPointer) => {
    if (helpMode) return;
    const chip = myChipAt(p.bx, p.by);
    if (chip) removeBet(chip.key);
  };

  const showHighlight =
    hover && (helpMode || zoneEnabled(hover.zone, snapshot, config, YOU));

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative h-[68vh] w-full select-none overflow-hidden rounded-3xl bg-black shadow-2xl ${
        helpMode ? "cursor-help" : ""
      }`}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        frameloop="demand"
        camera={{ fov: 45, position: [0, 8.2, 0.01] }}
      >
        <Scene preset={preset} />
        <TableModel config={config} />
        <ChipStacks3D config={config} />
        <PointPuck3D config={config} />
        <Dice3D />
        <FeltHitLayer
          onMove={handleMove}
          onLeave={() => setHover(null)}
          onTap={handleTap}
          onRightTap={handleRightTap}
        />
        {showHighlight && <ZoneHighlight zone={hover.zone} />}
        <WinFloaters3D config={config} />
        <FlyingChipsLauncher config={config} />
        <DevProjectionHook />
        {theme.scene.bloom && (
          <EffectComposer>
            <Bloom intensity={0.5} luminanceThreshold={0.4} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>

      <div className="absolute right-3 top-3 z-10 flex gap-1.5">
        {PRESET_LABELS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPreset(id)}
            onMouseDown={(e) => e.preventDefault()}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              preset === id ? "" : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800"
            }`}
            style={
              preset === id
                ? { background: "var(--mr-accent)", color: "var(--mr-accent-text)" }
                : undefined
            }
          >
            {label}
          </button>
        ))}
      </div>

      {hover && showTooltips && !infoZone && !hopOpen && (
        <BetTooltip
          info={getBetInfo(hover.zone.defId, { number: hover.zone.number }, config)}
          x={hover.x}
          y={hover.y}
        />
      )}
      {infoZone && (
        <BetInfoCard
          info={getBetInfo(infoZone.defId, { number: infoZone.number }, config)}
          onClose={() => setInfoZone(null)}
          onBet={
            infoZone.defId !== "HOP" && zoneEnabled(infoZone, snapshot, config, YOU)
              ? () => placeBet(infoZone.defId, chipDenom, infoZone.number)
              : undefined
          }
          betLabel={`Bet $${chipDenom}`}
        />
      )}
      {hopOpen && <HopPicker onClose={() => setHopOpen(false)} />}
    </div>
  );
}
