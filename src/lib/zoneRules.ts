import { BET_DEFINITIONS } from "@/engine/bets/definitions";
import type { EngineState, PlayerId, VariantConfig } from "@/engine/types";
import type { BetZone } from "./betZones";

export function zoneEnabled(
  zone: BetZone,
  snapshot: EngineState,
  config: VariantConfig,
  playerId: PlayerId,
): boolean {
  const def = BET_DEFINITIONS[zone.defId];
  if (!def.availableIn(config)) return false;
  if (def.placeablePhases !== "ANY" && !def.placeablePhases.includes(snapshot.phase))
    return false;
  if (zone.defId === "PASS_ODDS")
    return (
      snapshot.phase === "POINT_ON" &&
      snapshot.bets.some((b) => b.playerId === playerId && b.key === "PASS")
    );
  return true;
}
