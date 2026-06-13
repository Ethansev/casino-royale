import type { OddsPolicy, Ratio } from "../types";

export const EVEN: Ratio = { num: 1, den: 1 };

export function ratio(num: number, den: number): Ratio {
  return { num, den };
}

export function profitFor(amount: number, r: Ratio): number {
  return (amount * r.num) / r.den;
}

export function inverse(r: Ratio): Ratio {
  return { num: r.den, den: r.num };
}

/** 5% commission, charged on the win for buy/lay bets. */
export const VIG_RATE = 0.05;

export const HARDWAY_PAYOUT: Readonly<Record<number, Ratio>> = {
  4: { num: 7, den: 1 },
  6: { num: 9, den: 1 },
  8: { num: 9, den: 1 },
  10: { num: 7, den: 1 },
};

export const ANY_SEVEN_PAYOUT: Ratio = { num: 4, den: 1 };
export const ANY_CRAPS_PAYOUT: Ratio = { num: 7, den: 1 };
export const YO_PAYOUT: Ratio = { num: 15, den: 1 };
export const THREE_PAYOUT: Ratio = { num: 15, den: 1 };
export const ACES_PAYOUT: Ratio = { num: 30, den: 1 };
export const TWELVE_PAYOUT: Ratio = { num: 30, den: 1 };
export const HOP_EASY_PAYOUT: Ratio = { num: 15, den: 1 };
export const HOP_HARD_PAYOUT: Ratio = { num: 30, den: 1 };

// Bonus Craps: roll the whole set before a 7.
export const ALL_SMALL_PAYOUT: Ratio = { num: 34, den: 1 };
export const ALL_TALL_PAYOUT: Ratio = { num: 34, den: 1 };
export const ALL_PAYOUT: Ratio = { num: 175, den: 1 };

export const SMALL_NUMBERS: readonly number[] = [2, 3, 4, 5, 6];
export const TALL_NUMBERS: readonly number[] = [8, 9, 10, 11, 12];
export const ALL_NUMBERS: readonly number[] = [...SMALL_NUMBERS, ...TALL_NUMBERS];

/**
 * Max odds as a multiple of the flat bet. Crapless extra points (2,3,11,12)
 * have no 3-4-5x convention; we use 5x, a common house choice.
 */
export function maxOddsMultiplier(policy: OddsPolicy, point: number): number {
  if (policy.kind === "FLAT") return policy.multiplier;
  if (point === 4 || point === 10) return 3;
  if (point === 5 || point === 9) return 4;
  if (point === 6 || point === 8) return 5;
  return 5;
}
