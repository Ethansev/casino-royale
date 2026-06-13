import type { BetInstance, Phase, Roll, VariantConfig } from "../types";
import {
  ACES_PAYOUT,
  ALL_NUMBERS,
  ALL_PAYOUT,
  ALL_SMALL_PAYOUT,
  ALL_TALL_PAYOUT,
  ANY_CRAPS_PAYOUT,
  ANY_SEVEN_PAYOUT,
  EVEN,
  HARDWAY_PAYOUT,
  HOP_EASY_PAYOUT,
  HOP_HARD_PAYOUT,
  SMALL_NUMBERS,
  TALL_NUMBERS,
  THREE_PAYOUT,
  TWELVE_PAYOUT,
  VIG_RATE,
  YO_PAYOUT,
  inverse,
  profitFor,
} from "./payouts";

export interface ResolveCtx {
  roll: Roll;
  phase: Phase;
  point: number | null;
  config: VariantConfig;
  /** Totals rolled since the last 7 (includes the current roll). */
  rolledSince7: ReadonlySet<number>;
}

export type Resolution =
  | { kind: "WIN"; profit: number }
  | { kind: "LOSE" }
  | { kind: "PUSH" }
  | { kind: "MOVE"; toNumber: number }
  | { kind: "NONE" };

const LOSE: Resolution = { kind: "LOSE" };
const PUSH: Resolution = { kind: "PUSH" };
const NONE: Resolution = { kind: "NONE" };

function win(profit: number): Resolution {
  return { kind: "WIN", profit };
}

/**
 * Whether a bet is live for the current roll. Place/buy and come odds are
 * off during the come-out by default, matching standard casino practice.
 */
export function isWorking(bet: BetInstance, phase: Phase): boolean {
  if (bet.workingOverride !== undefined) return bet.workingOverride;
  switch (bet.defId) {
    case "PLACE":
    case "BUY":
    case "COME_ODDS":
      return phase === "POINT_ON";
    default:
      return true;
  }
}

export function resolveBet(bet: BetInstance, ctx: ResolveCtx): Resolution {
  const { roll, phase, point, config, rolledSince7 } = ctx;
  const t = roll.total;
  const amount = bet.amount;
  const working = isWorking(bet, phase);

  switch (bet.defId) {
    case "PASS": {
      if (phase === "COME_OUT") {
        if (config.passComeOutWin.includes(t)) return win(profitFor(amount, EVEN));
        if (config.passComeOutLose.includes(t)) return LOSE;
        return NONE;
      }
      if (t === point) return win(profitFor(amount, EVEN));
      if (t === 7) return LOSE;
      return NONE;
    }

    case "DONT_PASS": {
      if (phase === "COME_OUT") {
        if (config.dontComeOutWin.includes(t)) return win(profitFor(amount, EVEN));
        if (config.dontComeOutPush.includes(t)) return PUSH;
        if (config.passComeOutWin.includes(t)) return LOSE;
        return NONE;
      }
      if (t === 7) return win(profitFor(amount, EVEN));
      if (t === point) return LOSE;
      return NONE;
    }

    case "PASS_ODDS": {
      if (phase !== "POINT_ON" || point === null) return NONE;
      if (t === point) return win(profitFor(amount, config.trueOdds[point]));
      if (t === 7) return LOSE;
      return NONE;
    }

    case "DONT_PASS_ODDS": {
      if (phase !== "POINT_ON" || point === null) return NONE;
      if (t === 7) return win(profitFor(amount, inverse(config.trueOdds[point])));
      if (t === point) return LOSE;
      return NONE;
    }

    case "COME": {
      if (bet.number === undefined) {
        // Still in the come box: resolves like its own come-out roll.
        if (config.passComeOutWin.includes(t)) return win(profitFor(amount, EVEN));
        if (config.passComeOutLose.includes(t)) return LOSE;
        if (config.pointNumbers.includes(t)) return { kind: "MOVE", toNumber: t };
        return NONE;
      }
      if (t === bet.number) return win(profitFor(amount, EVEN));
      if (t === 7) return LOSE;
      return NONE;
    }

    case "DONT_COME": {
      if (bet.number === undefined) {
        if (config.dontComeOutWin.includes(t)) return win(profitFor(amount, EVEN));
        if (config.dontComeOutPush.includes(t)) return PUSH;
        if (config.passComeOutWin.includes(t)) return LOSE;
        if (config.pointNumbers.includes(t)) return { kind: "MOVE", toNumber: t };
        return NONE;
      }
      if (t === 7) return win(profitFor(amount, EVEN));
      if (t === bet.number) return LOSE;
      return NONE;
    }

    case "COME_ODDS": {
      const n = bet.number;
      if (n === undefined) return NONE;
      if (t !== n && t !== 7) return NONE;
      // Odds called off are returned when the flat bet resolves.
      if (!working) return PUSH;
      if (t === n) return win(profitFor(amount, config.trueOdds[n]));
      return LOSE;
    }

    case "DONT_COME_ODDS": {
      const n = bet.number;
      if (n === undefined) return NONE;
      if (t === 7) return win(profitFor(amount, inverse(config.trueOdds[n])));
      if (t === n) return LOSE;
      return NONE;
    }

    case "PLACE": {
      const n = bet.number;
      if (n === undefined || !working) return NONE;
      if (t === n) return win(profitFor(amount, config.placePayout[n]));
      if (t === 7) return LOSE;
      return NONE;
    }

    case "BUY": {
      const n = bet.number;
      if (n === undefined || !working) return NONE;
      if (t === n)
        return win(profitFor(amount, config.trueOdds[n]) - amount * VIG_RATE);
      if (t === 7) return LOSE;
      return NONE;
    }

    case "LAY": {
      const n = bet.number;
      if (n === undefined || !working) return NONE;
      if (t === 7) {
        const w = profitFor(amount, inverse(config.trueOdds[n]));
        return win(w * (1 - VIG_RATE));
      }
      if (t === n) return LOSE;
      return NONE;
    }

    case "BIG_6": {
      if (t === 6) return win(profitFor(amount, EVEN));
      if (t === 7) return LOSE;
      return NONE;
    }

    case "BIG_8": {
      if (t === 8) return win(profitFor(amount, EVEN));
      if (t === 7) return LOSE;
      return NONE;
    }

    case "FIELD": {
      const r = config.fieldPayout[t];
      return r ? win(profitFor(amount, r)) : LOSE;
    }

    case "HARDWAY": {
      const n = bet.number;
      if (n === undefined || !working) return NONE;
      if (t === 7) return LOSE;
      if (t === n) return roll.isHard ? win(profitFor(amount, HARDWAY_PAYOUT[n])) : LOSE;
      return NONE;
    }

    case "ANY_SEVEN":
      return t === 7 ? win(profitFor(amount, ANY_SEVEN_PAYOUT)) : LOSE;

    case "ANY_CRAPS":
      return t === 2 || t === 3 || t === 12
        ? win(profitFor(amount, ANY_CRAPS_PAYOUT))
        : LOSE;

    case "YO":
      return t === 11 ? win(profitFor(amount, YO_PAYOUT)) : LOSE;

    case "THREE":
      return t === 3 ? win(profitFor(amount, THREE_PAYOUT)) : LOSE;

    case "ACES":
      return t === 2 ? win(profitFor(amount, ACES_PAYOUT)) : LOSE;

    case "TWELVE":
      return t === 12 ? win(profitFor(amount, TWELVE_PAYOUT)) : LOSE;

    case "HOP": {
      if (!bet.hop) return NONE;
      const [a, b] = bet.hop;
      const match =
        (roll.d1 === a && roll.d2 === b) || (roll.d1 === b && roll.d2 === a);
      if (!match) return LOSE;
      const r = a === b ? HOP_HARD_PAYOUT : HOP_EASY_PAYOUT;
      return win(profitFor(amount, r));
    }

    case "HORN": {
      // One bet split in four equal legs on 2, 3, 11, 12.
      const leg = amount / 4;
      if (t === 2 || t === 12)
        return win(profitFor(leg, ACES_PAYOUT) - 3 * leg);
      if (t === 3 || t === 11) return win(profitFor(leg, YO_PAYOUT) - 3 * leg);
      return LOSE;
    }

    case "CE": {
      // Half on any craps, half on yo.
      const half = amount / 2;
      if (t === 2 || t === 3 || t === 12)
        return win(profitFor(half, ANY_CRAPS_PAYOUT) - half);
      if (t === 11) return win(profitFor(half, YO_PAYOUT) - half);
      return LOSE;
    }

    case "ALL_SMALL": {
      if (t === 7) return LOSE;
      return SMALL_NUMBERS.every((n) => rolledSince7.has(n))
        ? win(profitFor(amount, ALL_SMALL_PAYOUT))
        : NONE;
    }

    case "ALL_TALL": {
      if (t === 7) return LOSE;
      return TALL_NUMBERS.every((n) => rolledSince7.has(n))
        ? win(profitFor(amount, ALL_TALL_PAYOUT))
        : NONE;
    }

    case "ALL": {
      if (t === 7) return LOSE;
      return ALL_NUMBERS.every((n) => rolledSince7.has(n))
        ? win(profitFor(amount, ALL_PAYOUT))
        : NONE;
    }
  }
}
