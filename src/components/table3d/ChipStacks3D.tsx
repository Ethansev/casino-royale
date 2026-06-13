"use client";

import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { BET_DEFINITIONS } from "@/engine/bets/definitions";
import { isWorking } from "@/engine/bets/resolvers";
import type { BetInstance, EngineState, VariantConfig } from "@/engine/types";
import { chipPositionForBet } from "@/lib/betZones";
import { chipStyle, formatMoney } from "@/lib/chips";
import { setWorking } from "@/store/engineBridge";
import { useGameStore, YOU } from "@/store/gameStore";
import { useTheme } from "@/store/uiStore";
import { chipEdgeTexture, chipTopTexture } from "./chipTextures";
import { boardToFelt } from "./coords";

const CHIP_R = 0.19;
const CHIP_H = 0.045;

/** Billboarded amount label that floats above a chip stack. */
function AmountPill({ amount, y = 0.3 }: { amount: number; y?: number }) {
  return (
    <Html position={[0, y, 0]} center zIndexRange={[24, 14]}>
      <span className="whitespace-nowrap rounded-full bg-black/75 px-2 py-0.5 text-xs font-bold text-white ring-1 ring-white/20">
        {formatMoney(amount)}
      </span>
    </Html>
  );
}

/** A single chip lifted off the felt that tracks the cursor during a drag. */
export function DraggedChip3D({
  amount,
  bx,
  by,
}: {
  amount: number;
  bx: number;
  by: number;
}) {
  const theme = useTheme();
  const invalidate = useThree((s) => s.invalidate);
  const { x, z } = boardToFelt(bx, by);
  // frameloop="demand": repaint as the lifted chip moves with the cursor.
  useEffect(() => {
    invalidate();
  }, [invalidate, bx, by]);
  const style = chipStyle(amount);
  return (
    <group position={[x, 0.34, z]} rotation={[0, Math.PI / 2, 0]} scale={1.1}>
      <mesh castShadow>
        <cylinderGeometry args={[CHIP_R, CHIP_R, CHIP_H, 32]} />
        <meshStandardMaterial
          attach="material-0"
          map={chipEdgeTexture(amount)}
          roughness={0.4}
        />
        <meshStandardMaterial
          attach="material-1"
          map={chipTopTexture(amount, theme)}
          roughness={0.35}
        />
        <meshStandardMaterial attach="material-2" color={style.fill} roughness={0.45} />
      </mesh>
      <AmountPill amount={amount} y={0.42} />
    </group>
  );
}

function WorkingPill({
  bet,
  phase,
}: {
  bet: BetInstance;
  phase: EngineState["phase"];
}) {
  if (!BET_DEFINITIONS[bet.defId].canToggleWorking) return null;
  const working = isWorking(bet, phase);
  // Mirror the 2D badge: only surface when the default could surprise.
  if (phase !== "COME_OUT" && bet.workingOverride === undefined) return null;
  return (
    <Html position={[0, 0.42, 0]} center zIndexRange={[25, 15]}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setWorking(bet.key, !working);
        }}
        onMouseDown={(e) => e.preventDefault()}
        title={working ? "Working — click to call off" : "Off — click to call on"}
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 transition hover:scale-110 ${
          working
            ? "bg-emerald-600 text-white ring-emerald-300"
            : "bg-neutral-800/95 text-neutral-200 ring-neutral-500"
        }`}
      >
        {working ? "ON" : "OFF"}
      </button>
    </Html>
  );
}

export function ChipStacks3D({
  config,
  dragKey,
}: {
  config: VariantConfig;
  dragKey?: string | null;
}) {
  const bets = useGameStore((s) => s.snapshot?.bets);
  const phase = useGameStore((s) => s.snapshot?.phase ?? "COME_OUT");
  const theme = useTheme();
  if (!bets) return null;
  let hopIndex = 0;

  return (
    <group>
      {bets
        .filter((b) => b.playerId === YOU)
        .map((bet) => {
          const pos = chipPositionForBet(config, bet, bet.hop ? hopIndex++ : 0);
          if (!pos) return null;
          const { x, z } = boardToFelt(pos.x, pos.y);
          const layers = Math.min(5, Math.max(1, Math.floor(bet.amount / 5)));
          const style = chipStyle(bet.amount);
          const edge = chipEdgeTexture(bet.amount);
          // While dragging, the lifted ghost chip stands in for this stack.
          if (bet.key === dragKey) return null;
          return (
            <group
              key={`${bet.key}|${theme.id}`}
              position={[x, 0, z]}
              rotation={[0, Math.PI / 2, 0]}
            >
              {Array.from({ length: layers }, (_, i) => {
                const top = i === layers - 1;
                return (
                  <mesh
                    key={i}
                    position={[0, CHIP_H / 2 + i * CHIP_H, 0]}
                    castShadow
                  >
                    <cylinderGeometry args={[CHIP_R, CHIP_R, CHIP_H, 32]} />
                    <meshStandardMaterial
                      attach="material-0"
                      map={edge}
                      roughness={0.4}
                    />
                    {top ? (
                      <meshStandardMaterial
                        attach="material-1"
                        map={chipTopTexture(bet.amount, theme)}
                        roughness={0.35}
                      />
                    ) : (
                      <meshStandardMaterial
                        attach="material-1"
                        color={style.fill}
                        roughness={0.45}
                      />
                    )}
                    <meshStandardMaterial
                      attach="material-2"
                      color={style.fill}
                      roughness={0.45}
                    />
                  </mesh>
                );
              })}
              <AmountPill amount={bet.amount} />
              <WorkingPill bet={bet} phase={phase} />
            </group>
          );
        })}
    </group>
  );
}
