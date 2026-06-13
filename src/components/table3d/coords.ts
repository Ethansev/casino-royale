import { BOARD_H, BOARD_W } from "@/lib/betZones";

/** World units: felt is FELT_W × FELT_D on the XZ plane, centered at origin, top at y=0. */
export const SCALE = 160;
export const FELT_W = BOARD_W / SCALE; // 10
export const FELT_D = BOARD_H / SCALE; // 5.75

export function boardToFelt(bx: number, by: number): { x: number; z: number } {
  return { x: (bx - BOARD_W / 2) / SCALE, z: (by - BOARD_H / 2) / SCALE };
}

export function feltToBoard(x: number, z: number): { bx: number; by: number } {
  return { bx: x * SCALE + BOARD_W / 2, by: z * SCALE + BOARD_H / 2 };
}

export const RAIL_HEIGHT = 0.55;
export const RAIL_THICKNESS = 0.45;

/** Resting spots for idle dice (right of center, out of the chip zones). */
export const DICE_REST: ReadonlyArray<readonly [number, number, number]> = [
  [0.7, 0.19, 0.9],
  [1.25, 0.19, 1.05],
];
