import { resolveBet } from "../bets/resolvers";
import { makeRoll } from "../rng";
import type {
  BetDefId,
  BetInstance,
  Die,
  Phase,
  VariantConfig,
} from "../types";

const DICE: readonly Die[] = [1, 2, 3, 4, 5, 6];
const ALL_PAIRS: ReadonlyArray<readonly [Die, Die]> = DICE.flatMap((d1) =>
  DICE.map((d2): readonly [Die, Die] => [d1, d2]),
);

/**
 * Exact expected value per unit staked, in percent, by enumerating all 36
 * dice outcomes through the real resolver. `trackTable` follows come-out /
 * point transitions (needed only for line bets). Multi-roll bets self-loop
 * on unresolved rolls; the loop is solved analytically.
 */
export function exactEdgePct(
  bet: BetInstance,
  config: VariantConfig,
  trackTable = false,
  startPhase: Phase = "POINT_ON",
  startPoint: number | null = 8,
): number {
  function ev(
    b: BetInstance,
    phase: Phase,
    point: number | null,
    depth: number,
  ): number {
    if (depth > 4) throw new Error("unexpected state cycle in EV evaluation");
    let resolved = 0;
    let transitions = 0;
    let pSelf = 0;
    const p = 1 / 36;

    for (const [d1, d2] of ALL_PAIRS) {
      const roll = makeRoll(d1, d2);
      const r = resolveBet(b, {
        roll,
        phase,
        point,
        config,
        rolledSince7: new Set<number>(),
      });
      if (r.kind === "WIN") resolved += p * r.profit;
      else if (r.kind === "LOSE") resolved -= p * b.amount;
      else if (r.kind === "PUSH") {
        // profit 0
      } else if (r.kind === "MOVE") {
        transitions += p * ev({ ...b, number: r.toNumber }, phase, point, depth + 1);
      } else {
        let nextPhase = phase;
        let nextPoint = point;
        if (trackTable) {
          if (phase === "COME_OUT" && config.pointNumbers.includes(roll.total)) {
            nextPhase = "POINT_ON";
            nextPoint = roll.total;
          } else if (phase === "POINT_ON" && (roll.total === point || roll.total === 7)) {
            nextPhase = "COME_OUT";
            nextPoint = null;
          }
        }
        if (nextPhase === phase && nextPoint === point) pSelf += p;
        else transitions += p * ev(b, nextPhase, nextPoint, depth + 1);
      }
    }
    return (resolved + transitions) / (1 - pSelf);
  }

  return (ev(bet, startPhase, startPoint, 0) / bet.amount) * 100;
}

export interface BetTarget {
  number?: number;
  hop?: readonly [Die, Die];
}

/** House edge (negative EV %) for a bet type in a given variant. */
export function betEdgePct(
  defId: BetDefId,
  target: BetTarget,
  config: VariantConfig,
): number {
  const amount = defId === "HORN" ? 4 : defId === "CE" ? 2 : 1;
  const needsWorkingOverride =
    defId === "PLACE" || defId === "BUY" || defId === "HARDWAY";
  const bet: BetInstance = {
    key: defId,
    defId,
    playerId: "info",
    amount,
    number: target.number,
    hop: target.hop ?? (defId === "HOP" ? [2, 5] : undefined),
    workingOverride: needsWorkingOverride ? true : undefined,
  };

  switch (defId) {
    case "PASS":
    case "DONT_PASS":
      return exactEdgePct(bet, config, true, "COME_OUT", null);
    // Multi-roll accumulation bets the per-roll enumerator can't model;
    // use published Bonus Craps house edges (as negative EV%).
    case "ALL_SMALL":
    case "ALL_TALL":
      return -7.76;
    case "ALL":
      return -7.46;
    case "PASS_ODDS":
    case "DONT_PASS_ODDS":
    case "COME_ODDS":
    case "DONT_COME_ODDS": {
      const point = target.number ?? config.pointNumbers[0];
      return exactEdgePct({ ...bet, number: point }, config, false, "POINT_ON", point);
    }
    default:
      return exactEdgePct(bet, config);
  }
}
