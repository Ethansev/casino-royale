import type { BetDefId, BetInstance, Phase, VariantConfig } from "../types";

export interface BetDefinition {
  id: BetDefId;
  needsNumber: boolean;
  needsHop: boolean;
  /** Numbers this bet may be placed on (when needsNumber). */
  validNumbers(config: VariantConfig): readonly number[];
  /** Phases during which this bet may be placed; "ANY" = always. */
  placeablePhases: readonly Phase[] | "ANY";
  availableIn(config: VariantConfig): boolean;
  /** Contract bets can't be taken down once they have a point. */
  removable(bet: BetInstance, phase: Phase): boolean;
  canToggleWorking: boolean;
}

const NO_NUMBERS: readonly number[] = [];
const HARDWAY_NUMBERS: readonly number[] = [4, 6, 8, 10];

function def(partial: {
  id: BetDefId;
  needsNumber?: boolean;
  needsHop?: boolean;
  validNumbers?(config: VariantConfig): readonly number[];
  placeablePhases?: readonly Phase[] | "ANY";
  availableIn?(config: VariantConfig): boolean;
  removable?(bet: BetInstance, phase: Phase): boolean;
  canToggleWorking?: boolean;
}): BetDefinition {
  return {
    id: partial.id,
    needsNumber: partial.needsNumber ?? false,
    needsHop: partial.needsHop ?? false,
    validNumbers: partial.validNumbers ?? (() => NO_NUMBERS),
    placeablePhases: partial.placeablePhases ?? "ANY",
    availableIn: partial.availableIn ?? (() => true),
    removable: partial.removable ?? (() => true),
    canToggleWorking: partial.canToggleWorking ?? false,
  };
}

export const BET_DEFINITIONS: Readonly<Record<BetDefId, BetDefinition>> = {
  PASS: def({
    id: "PASS",
    placeablePhases: ["COME_OUT"],
    // Flat line bet is a contract once the point is established.
    removable: (_bet, phase) => phase === "COME_OUT",
  }),
  DONT_PASS: def({
    id: "DONT_PASS",
    placeablePhases: ["COME_OUT"],
    availableIn: (c) => c.dontBetsAllowed,
  }),
  COME: def({
    id: "COME",
    placeablePhases: ["POINT_ON"],
    // Removable only while still in the come box.
    removable: (bet) => bet.number === undefined,
  }),
  DONT_COME: def({
    id: "DONT_COME",
    placeablePhases: ["POINT_ON"],
    availableIn: (c) => c.dontBetsAllowed,
  }),
  PASS_ODDS: def({ id: "PASS_ODDS", placeablePhases: ["POINT_ON"] }),
  DONT_PASS_ODDS: def({
    id: "DONT_PASS_ODDS",
    placeablePhases: ["POINT_ON"],
    availableIn: (c) => c.dontBetsAllowed,
  }),
  COME_ODDS: def({
    id: "COME_ODDS",
    needsNumber: true,
    validNumbers: (c) => c.pointNumbers,
    canToggleWorking: true,
  }),
  DONT_COME_ODDS: def({
    id: "DONT_COME_ODDS",
    needsNumber: true,
    validNumbers: (c) => c.pointNumbers,
    availableIn: (c) => c.dontBetsAllowed,
    canToggleWorking: true,
  }),
  PLACE: def({
    id: "PLACE",
    needsNumber: true,
    validNumbers: (c) => c.placeNumbers,
    canToggleWorking: true,
  }),
  BUY: def({
    id: "BUY",
    needsNumber: true,
    validNumbers: (c) => c.buyNumbers,
    canToggleWorking: true,
  }),
  LAY: def({
    id: "LAY",
    needsNumber: true,
    validNumbers: (c) => c.layNumbers,
    availableIn: (c) => c.layNumbers.length > 0,
    canToggleWorking: true,
  }),
  BIG_6: def({ id: "BIG_6" }),
  BIG_8: def({ id: "BIG_8" }),
  FIELD: def({ id: "FIELD" }),
  HARDWAY: def({
    id: "HARDWAY",
    needsNumber: true,
    validNumbers: () => HARDWAY_NUMBERS,
    canToggleWorking: true,
  }),
  ANY_SEVEN: def({ id: "ANY_SEVEN" }),
  ANY_CRAPS: def({ id: "ANY_CRAPS" }),
  YO: def({ id: "YO" }),
  THREE: def({ id: "THREE" }),
  ACES: def({ id: "ACES" }),
  TWELVE: def({ id: "TWELVE" }),
  HOP: def({ id: "HOP", needsHop: true }),
  HORN: def({ id: "HORN" }),
  CE: def({ id: "CE" }),
  ALL_SMALL: def({ id: "ALL_SMALL" }),
  ALL_TALL: def({ id: "ALL_TALL" }),
  ALL: def({ id: "ALL" }),
};
