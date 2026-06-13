import type { Die, Roll } from "./types";

/** mulberry32 step: returns a uniform value in [0,1) and the next RNG state. */
export function nextRandom(state: number): { value: number; next: number } {
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, next };
}

const FACES: readonly Die[] = [1, 2, 3, 4, 5, 6];

export function rollDie(state: number): { die: Die; next: number } {
  const { value, next } = nextRandom(state);
  return { die: FACES[Math.floor(value * 6)], next };
}

export function makeRoll(d1: Die, d2: Die): Roll {
  return { d1, d2, total: d1 + d2, isHard: d1 === d2 };
}

export function rollDice(state: number): { roll: Roll; next: number } {
  const first = rollDie(state);
  const second = rollDie(first.next);
  return { roll: makeRoll(first.die, second.die), next: second.next };
}
