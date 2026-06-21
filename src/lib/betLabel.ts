import type { BetDefId, Variant } from "@/engine/types";

const BET_NAMES: Record<BetDefId, string> = {
  PASS: "Pass Line",
  DONT_PASS: "Don't Pass",
  COME: "Come",
  DONT_COME: "Don't Come",
  PASS_ODDS: "Pass Odds",
  DONT_PASS_ODDS: "Don't Pass Odds",
  COME_ODDS: "Come Odds",
  DONT_COME_ODDS: "Don't Come Odds",
  PLACE: "Place",
  BUY: "Buy",
  LAY: "Lay",
  BIG_6: "Big 6",
  BIG_8: "Big 8",
  FIELD: "Field",
  HARDWAY: "Hardway",
  ANY_SEVEN: "Any Seven",
  ANY_CRAPS: "Any Craps",
  YO: "Yo (11)",
  THREE: "Three",
  ACES: "Aces (2)",
  TWELVE: "Twelve (12)",
  HOP: "Hop",
  HORN: "Horn",
  CE: "C & E",
  ALL_SMALL: "All Small",
  ALL_TALL: "All Tall",
  ALL: "All",
};

/** Human-friendly label for a resolved bet, e.g. "Hardway 8", "Place 6". */
export function betDisplayLabel(defId: BetDefId, number?: number): string {
  const base = BET_NAMES[defId];
  return number !== undefined ? `${base} ${number}` : base;
}

/** Canonical GAMES-registry id for an engine variant. */
export function gameIdForVariant(variant: Variant): string {
  return variant === "crapless" ? "crapless" : "craps";
}

/** Normalize a stored game key (e.g. the engine "standard") to a GAMES id. */
export function normalizeGameId(id: string): string {
  return id === "standard" ? "craps" : id;
}
