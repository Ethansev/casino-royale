"use client";

import { Html } from "@react-three/drei";
import { BET_DEFINITIONS } from "@/engine/bets/definitions";
import { isWorking } from "@/engine/bets/resolvers";
import type { BetInstance, EngineState, VariantConfig } from "@/engine/types";
import { chipPositionForBet } from "@/lib/betZones";
import { chipStyle } from "@/lib/chips";
import { setWorking } from "@/store/engineBridge";
import { useGameStore, YOU } from "@/store/gameStore";
import { useTheme } from "@/store/uiStore";
import { chipEdgeTexture, chipTopTexture } from "./chipTextures";
import { boardToFelt } from "./coords";

const CHIP_R = 0.19;
const CHIP_H = 0.045;

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

export function ChipStacks3D({ config }: { config: VariantConfig }) {
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
          return (
            <group key={`${bet.key}|${theme.id}`} position={[x, 0, z]}>
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
              <WorkingPill bet={bet} phase={phase} />
            </group>
          );
        })}
    </group>
  );
}
