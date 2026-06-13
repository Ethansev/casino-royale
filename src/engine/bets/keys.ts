import type { BetDefId, Die } from "../types";

export function hopKey(hop: readonly [Die, Die]): string {
  const lo = Math.min(hop[0], hop[1]);
  const hi = Math.max(hop[0], hop[1]);
  return `HOP:${lo}-${hi}`;
}

export function makeKey(
  defId: BetDefId,
  number?: number,
  hop?: readonly [Die, Die],
): string {
  if (defId === "HOP" && hop) return hopKey(hop);
  if (number !== undefined) return `${defId}:${number}`;
  return defId;
}
