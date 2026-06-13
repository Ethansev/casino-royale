"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { BET_DEFINITIONS } from "@/engine/bets/definitions";
import { makeKey } from "@/engine/bets/keys";
import { isWorking } from "@/engine/bets/resolvers";
import { getBetInfo } from "@/engine/info/betInfo";
import type { BetInstance, Die, EngineState, VariantConfig } from "@/engine/types";
import { BetInfoCard } from "@/components/hud/BetInfoCard";
import { BetTooltip } from "@/components/hud/BetTooltip";
import { WinFloaters } from "@/components/hud/WinFloaters";
import {
  BOARD_H,
  BOARD_W,
  boardDecorFor,
  chipPositionForBet,
  puckPositionFor,
  zonesFor,
  type BetZone,
} from "@/lib/betZones";
import { chipStyle } from "@/lib/chips";
import {
  getEngineConfig,
  moveBet,
  placeBet,
  removeBet,
  setWorking,
} from "@/store/engineBridge";
import { zoneEnabled } from "@/lib/zoneRules";
import { HopPicker } from "@/components/hud/HopPicker";
import { boardColor, type Theme } from "@/lib/themes";
import { useGameStore, useMyBet, YOU } from "@/store/gameStore";
import { useTheme, useUiStore } from "@/store/uiStore";
import { ChipStack2D } from "./ChipStack2D";
import { PIPS } from "./Dice2D";


const DiceRollOverlay = dynamic(() => import("./DiceRollOverlay"), { ssr: false });

/**
 * Pointer interactions must not leave a zone focused — otherwise Space
 * re-triggers the zone instead of rolling. Keyboard focus is unaffected.
 */
function blurActive() {
  const el = document.activeElement;
  if (el instanceof HTMLElement || el instanceof SVGElement) el.blur();
}

function ZoneShapeEl({ zone, theme }: { zone: BetZone; theme: Theme }) {
  const filled = zone.fill !== undefined;
  const common = {
    stroke: theme.board.line,
    strokeOpacity: filled ? 0.45 : 0.9,
    strokeWidth: filled ? 1.5 : 2,
    strokeDasharray: zone.dashed ? "8 6" : undefined,
    strokeLinejoin: "round" as const,
    pointerEvents: "all",
    filter: filled ? "url(#zone-inset)" : undefined,
    className: filled
      ? "transition group-hover:brightness-125"
      : "fill-transparent transition-[fill] group-hover:fill-white/15",
  };
  if (zone.shape.kind === "rect") {
    const { x, y, w, h, rx } = zone.shape;
    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={boardColor(theme, zone.fill)}
        {...common}
      />
    );
  }
  return <path d={zone.shape.d} fill={boardColor(theme, zone.fill)} {...common} />;
}

function MiniDie({
  x,
  y,
  size,
  value,
}: {
  x: number;
  y: number;
  size: number;
  value: Die;
}) {
  return (
    <g transform={`translate(${x},${y})`} pointerEvents="none">
      <rect
        width={size}
        height={size}
        rx={size * 0.2}
        fill="#f8f7f4"
        stroke="#b9b4aa"
        strokeWidth={1}
      />
      {PIPS[value].map(([px, py], i) => (
        <circle key={i} cx={px * size} cy={py * size} r={size * 0.1} fill="#23272f" />
      ))}
    </g>
  );
}

function WorkingBadge({
  x,
  y,
  bet,
  phase,
}: {
  x: number;
  y: number;
  bet: BetInstance;
  phase: EngineState["phase"];
}) {
  if (!BET_DEFINITIONS[bet.defId].canToggleWorking) return null;
  const working = isWorking(bet, phase);
  // Only surface the badge when the default would surprise: come-out rolls.
  if (phase !== "COME_OUT" && bet.workingOverride === undefined) return null;
  return (
    <g
      role="button"
      aria-label={working ? "called on — click to call off" : "off — click to call on"}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setWorking(bet.key, !working);
      }}
    >
      <rect x={x - 19} y={y + 12} width={38} height={17} rx={8} fill={working ? "#16a34a" : "#374151"} stroke="#111827" />
      <text x={x} y={y + 25} textAnchor="middle" fontSize={11} fontWeight={700} fill="#f9fafb">
        {working ? "ON" : "OFF"}
      </text>
    </g>
  );
}

function Zone({
  zone,
  enabled,
  helpMode,
  draggingKey,
  onHopOpen,
  onHover,
  onLeave,
  onInfo,
  onChipDown,
  onChipMove,
  onChipUp,
}: {
  zone: BetZone;
  enabled: boolean;
  helpMode: boolean;
  draggingKey: string | null;
  onHopOpen: () => void;
  onHover: (zone: BetZone, e: React.MouseEvent) => void;
  onLeave: () => void;
  onInfo: (zone: BetZone) => void;
  onChipDown: (zone: BetZone, key: string, amount: number, e: React.PointerEvent) => void;
  onChipMove: (e: React.PointerEvent) => void;
  onChipUp: (zone: BetZone, e: React.PointerEvent) => void;
}) {
  const chipDenom = useUiStore((s) => s.chipDenom);
  const theme = useTheme();
  const phase = useGameStore((s) => s.snapshot?.phase ?? "COME_OUT");
  const key = makeKey(zone.defId, zone.number);
  const bet = useMyBet(key);

  const act = () => {
    if (helpMode) {
      onInfo(zone);
      return;
    }
    if (!enabled) return;
    if (zone.defId === "HOP") {
      onHopOpen();
      return;
    }
    placeBet(zone.defId, chipDenom, zone.number);
  };

  const name = zone.aria ?? zone.label;
  const interactive = enabled || helpMode;
  return (
    <g
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-label={
        helpMode ? `Learn about ${name}` : `${name}, bet ${chipDenom}`
      }
      aria-disabled={!interactive}
      className={
        helpMode
          ? "group cursor-help outline-none"
          : enabled
            ? "group cursor-pointer outline-none transition [&:hover]:[filter:drop-shadow(0_0_10px_var(--mr-glow))]"
            : "opacity-40 saturate-50"
      }
      onClick={() => {
        act();
        blurActive();
      }}
      onMouseMove={(e) => onHover(zone, e)}
      onMouseLeave={onLeave}
      onContextMenu={(e) => {
        e.preventDefault();
        if (bet && !helpMode) removeBet(key);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          act();
        }
      }}
    >
      <ZoneShapeEl zone={zone} theme={theme} />
      {zone.circles?.map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill="none"
          stroke={theme.board.line}
          strokeWidth={2}
          pointerEvents="none"
        />
      ))}
      {zone.label && (
        <text
          x={zone.labelX}
          y={zone.labelY}
          textAnchor="middle"
          fontSize={zone.fontSize ?? 26}
          fontWeight={800}
          fontFamily="var(--font-marquee)"
          fill={boardColor(theme, zone.labelColor) ?? theme.board.text}
          pointerEvents="none"
          style={{ letterSpacing: "0.08em" }}
        >
          {zone.label}
        </text>
      )}
      {zone.extraText?.map((t, i) => (
        <text
          key={i}
          x={t.x}
          y={t.y}
          textAnchor="middle"
          fontSize={t.size ?? 14}
          fontWeight={t.weight ?? 500}
          fill={boardColor(theme, t.color) ?? theme.board.text}
          opacity={t.opacity ?? 1}
          pointerEvents="none"
        >
          {t.text}
        </text>
      ))}
      {zone.dice?.map((d, i) => (
        <g key={i}>
          <MiniDie x={d.x} y={d.y} size={d.size} value={d.d1} />
          <MiniDie x={d.x + d.size + 8} y={d.y} size={d.size} value={d.d2} />
        </g>
      ))}
      {bet && (
        <g opacity={draggingKey === key ? 0.25 : 1}>
          <ChipStack2D x={zone.anchorX} y={zone.anchorY} amount={bet.amount} />
        </g>
      )}
      {bet && !helpMode && (
        <circle
          cx={zone.anchorX}
          cy={zone.anchorY}
          r={26}
          fill="transparent"
          className="cursor-grab"
          onPointerDown={(e) => {
            e.stopPropagation();
            onChipDown(zone, key, bet.amount, e);
          }}
          onPointerMove={onChipMove}
          onPointerUp={(e) => onChipUp(zone, e)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {/* Painted after the drag handle so the on/off call stays clickable. */}
      {bet && (
        <WorkingBadge x={zone.anchorX} y={zone.anchorY} bet={bet} phase={phase} />
      )}
    </g>
  );
}

const TRAVEL_KEY = /^(COME|DONT_COME|COME_ODDS|DONT_COME_ODDS):(\d+)$/;

/** Chips for bets without a static zone: traveled come/don't-come (+odds) and hops. */
function TravelingChips({ config }: { config: VariantConfig }) {
  const snapshot = useGameStore((s) => s.snapshot);
  const phase = snapshot?.phase ?? "COME_OUT";
  if (!snapshot) return null;
  const mine = snapshot.bets.filter((b) => b.playerId === YOU);
  let hopIndex = 0;

  return (
    <g>
      {mine.map((bet) => {
        const m = TRAVEL_KEY.exec(bet.key);
        if (m) {
          const pos = chipPositionForBet(config, bet);
          if (!pos) return null;
          return (
            <g key={bet.key}>
              <ChipStack2D x={pos.x} y={pos.y} amount={bet.amount} />
              <WorkingBadge x={pos.x} y={pos.y} bet={bet} phase={phase} />
            </g>
          );
        }
        if (bet.hop) {
          const x = 1190 + (hopIndex++ % 4) * 46;
          return (
            <g key={bet.key}>
              <ChipStack2D x={x} y={650} amount={bet.amount} />
              <text x={x} y={678} textAnchor="middle" fontSize={12} fill="#fde68a">
                {bet.hop[0]}-{bet.hop[1]}
              </text>
            </g>
          );
        }
        return null;
      })}
    </g>
  );
}

function OddsPill({
  x,
  y,
  label,
  onClick,
}: {
  x: number;
  y: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <g
      role="button"
      aria-label={label}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <rect x={x - 38} y={y - 12} width={76} height={24} rx={12} fill="#f59e0b" stroke="#92400e" strokeWidth={1.5} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#1c1917">
        {label}
      </text>
    </g>
  );
}

/** "+ODDS" affordances on traveled come bets and the don't side. */
function OddsPills({ config }: { config: VariantConfig }) {
  const snapshot = useGameStore((s) => s.snapshot);
  const chipDenom = useUiStore((s) => s.chipDenom);
  if (!snapshot) return null;
  const mine = snapshot.bets.filter((b) => b.playerId === YOU);
  const pills: Array<{ key: string; x: number; y: number; act: () => void }> = [];

  for (const bet of mine) {
    if (
      (bet.defId === "COME" || bet.defId === "DONT_COME") &&
      bet.number !== undefined
    ) {
      const n = bet.number;
      const oddsDefId = bet.defId === "COME" ? "COME_ODDS" : "DONT_COME_ODDS";
      const oddsKey = `${oddsDefId}:${n}`;
      const pos = chipPositionForBet(config, { key: oddsKey });
      if (pos) {
        pills.push({
          key: oddsKey,
          x: pos.x,
          y: pos.y + (mine.some((b) => b.key === oddsKey) ? 30 : 0),
          act: () => placeBet(oddsDefId, chipDenom, n),
        });
      }
    }
    if (bet.defId === "DONT_PASS" && snapshot.phase === "POINT_ON") {
      pills.push({
        key: "dpo",
        x: 1300,
        y: 636,
        act: () => placeBet("DONT_PASS_ODDS", chipDenom),
      });
    }
  }

  return (
    <g>
      {pills.map((p) => (
        <OddsPill key={p.key} x={p.x} y={p.y} label="+ ODDS" onClick={p.act} />
      ))}
    </g>
  );
}

function PointPuck({ config }: { config: VariantConfig }) {
  const point = useGameStore((s) => s.snapshot?.point ?? null);
  const pos = puckPositionFor(config, point);
  if (!pos) return null;
  return (
    <g pointerEvents="none">
      <circle
        cx={pos.x}
        cy={pos.y}
        r={22}
        fill="#f9fafb"
        stroke="#a8a29e"
        strokeWidth={2.5}
      />
      <text
        x={pos.x}
        y={pos.y + 5}
        textAnchor="middle"
        fontSize={15}
        fontWeight={800}
        fill="#111827"
      >
        ON
      </text>
    </g>
  );
}

function zoneEnabledHere(
  zone: BetZone,
  snapshot: EngineState,
  config: VariantConfig,
): boolean {
  return zoneEnabled(zone, snapshot, config, YOU);
}

interface ChipDrag {
  key: string;
  amount: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
}

export function Table2D() {
  const snapshot = useGameStore((s) => s.snapshot);
  const [hopOpen, setHopOpen] = useState(false);
  const [hover, setHover] = useState<{ zone: BetZone; x: number; y: number } | null>(
    null,
  );
  const [infoZone, setInfoZone] = useState<BetZone | null>(null);
  const [drag, setDrag] = useState<ChipDrag | null>(null);
  const helpMode = useUiStore((s) => s.helpMode);
  const showTooltips = useUiStore((s) => s.showTooltips);
  const chipDenom = useUiStore((s) => s.chipDenom);
  const viewMode = useUiStore((s) => s.viewMode);
  const theme2d = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const config = getEngineConfig();
  if (!snapshot || !config) return null;
  const zones = zonesFor(config);

  const handleHover = (zone: BetZone, e: React.MouseEvent) => {
    if (!showTooltips || drag) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({
      zone,
      x: Math.min(e.clientX - rect.left, rect.width - 290),
      y: Math.min(e.clientY - rect.top, rect.height - 150),
    });
  };

  const handleChipDown = (
    zone: BetZone,
    key: string,
    amount: number,
    e: React.PointerEvent,
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      key,
      amount,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: false,
    });
  };

  const handleChipMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const moved =
      Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 8;
    setDrag({
      ...drag,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: drag.active || moved,
    });
    if (drag.active || moved) setHover(null);
  };

  const handleChipUp = (sourceZone: BetZone, e: React.PointerEvent) => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    blurActive();
    if (!d.active) {
      // A simple tap/click on the chip adds another unit, like clicking the zone.
      if (zoneEnabledHere(sourceZone, snapshot, config))
        placeBet(sourceZone.defId, chipDenom, sourceZone.number);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inside) {
      removeBet(d.key);
      return;
    }
    const bx = ((e.clientX - rect.left) / rect.width) * BOARD_W;
    const by = ((e.clientY - rect.top) / rect.height) * BOARD_H;
    const target = zones.find(
      (z) =>
        z.defId !== "HOP" &&
        z.shape.kind === "rect" &&
        bx >= z.shape.x &&
        bx <= z.shape.x + z.shape.w &&
        by >= z.shape.y &&
        by <= z.shape.y + z.shape.h,
    );
    if (!target) return;
    const targetKey = makeKey(target.defId, target.number);
    if (targetKey === d.key) return;
    moveBet(d.key, target.defId, target.number);
  };

  return (
    <div
      ref={containerRef}
      data-board-container
      className={`relative w-full select-none ${drag?.active ? "cursor-grabbing" : ""}`}
      style={{ touchAction: "manipulation" }}
    >
      <svg
        viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
        className="w-full rounded-2xl shadow-2xl"
        style={{ background: "var(--felt)" }}
      >
        <defs>
          <radialGradient id="board-vignette" cx="50%" cy="42%" r="75%">
            <stop offset="58%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.34" />
          </radialGradient>
          <filter id="board-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          </filter>
          <filter id="zone-inset" x="-20%" y="-20%" width="140%" height="140%">
            <feComponentTransfer in="SourceAlpha">
              <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="5" />
            <feOffset dx="0" dy="3" result="inset" />
            <feFlood floodColor="black" floodOpacity="0.55" />
            <feComposite in2="inset" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>
        </defs>
        {boardDecorFor(config).map((d, i) => (
          <g key={i} pointerEvents="none">
            {d.shape.kind === "rect" && (
              <rect
                x={d.shape.x}
                y={d.shape.y}
                width={d.shape.w}
                height={d.shape.h}
                rx={d.shape.rx}
                fill={boardColor(theme2d, d.fill)}
                stroke={d.stroke ?? theme2d.board.line}
                strokeOpacity={0.35}
                strokeWidth={1.5}
              />
            )}
            {d.texts?.map((t, j) => (
              <text
                key={j}
                x={t.x}
                y={t.y}
                textAnchor="middle"
                fontSize={t.size ?? 16}
                fontWeight={t.weight ?? 600}
                fill={boardColor(theme2d, t.color) ?? theme2d.board.text}
                style={{ letterSpacing: "0.15em" }}
              >
                {t.text}
              </text>
            ))}
          </g>
        ))}
        {zones.map((zone) => (
          <Zone
            key={zone.id}
            zone={zone}
            enabled={zoneEnabledHere(zone, snapshot, config)}
            helpMode={helpMode}
            draggingKey={drag?.active ? drag.key : null}
            onHopOpen={() => setHopOpen(true)}
            onHover={handleHover}
            onLeave={() => setHover(null)}
            onInfo={setInfoZone}
            onChipDown={handleChipDown}
            onChipMove={handleChipMove}
            onChipUp={handleChipUp}
          />
        ))}
        <rect
          width={BOARD_W}
          height={BOARD_H}
          filter="url(#board-grain)"
          opacity={0.05}
          pointerEvents="none"
          style={{ mixBlendMode: "overlay" }}
        />
        <rect
          width={BOARD_W}
          height={BOARD_H}
          fill="url(#board-vignette)"
          pointerEvents="none"
        />
        <TravelingChips config={config} />
        <OddsPills config={config} />
        <PointPuck config={config} />
      </svg>
      {viewMode === "2d" && <DiceRollOverlay />}
      <WinFloaters config={config} />
      {drag?.active && (
        <div
          className="pointer-events-none absolute z-30 flex items-center justify-center rounded-full border-4 border-dashed text-sm font-extrabold shadow-2xl"
          style={{
            left: drag.x - 23,
            top: drag.y - 23,
            width: 46,
            height: 46,
            background: chipStyle(drag.amount).fill,
            borderColor: chipStyle(drag.amount).stroke,
            color: chipStyle(drag.amount).text,
          }}
        >
          {drag.amount}
        </div>
      )}
      {hover && !infoZone && !hopOpen && (
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
            infoZone.defId !== "HOP" && zoneEnabledHere(infoZone, snapshot, config)
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
