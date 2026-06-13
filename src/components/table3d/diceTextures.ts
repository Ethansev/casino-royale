import { CanvasTexture, SRGBColorSpace } from "three";
import type { Die } from "@/engine/types";
import { PIPS } from "@/components/table2d/Dice2D";
import type { Theme } from "@/lib/themes";

const cache = new Map<string, CanvasTexture>();

export function pipTexture(face: Die, theme: Theme): CanvasTexture {
  const key = `${face}|${theme.id}`;
  const existing = cache.get(key);
  if (existing) return existing;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  ctx.fillStyle = theme.scene.dice.body;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = theme.scene.dice.pip;
  for (const [px, py] of PIPS[face]) {
    ctx.beginPath();
    ctx.arc(px * size, py * size, size * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}
