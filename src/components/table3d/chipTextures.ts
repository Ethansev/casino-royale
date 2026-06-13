import { CanvasTexture, SRGBColorSpace } from "three";
import { chipStyle } from "@/lib/chips";
import type { Theme } from "@/lib/themes";

const topCache = new Map<string, CanvasTexture>();
const edgeCache = new Map<string, CanvasTexture>();

/** Chip top: denomination color, theme accent ring, dashed inlay, dollar label. */
export function chipTopTexture(amount: number, theme: Theme): CanvasTexture {
  const key = `${amount}|${theme.id}`;
  const cached = topCache.get(key);
  if (cached) return cached;
  if (topCache.size > 300) topCache.clear();

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  const style = chipStyle(amount);
  const c = size / 2;

  ctx.fillStyle = style.fill;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  // Theme accent outer ring
  ctx.strokeStyle = theme.scene.chipRing;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(c, c, c - 7, 0, Math.PI * 2);
  ctx.stroke();

  // Dashed inlay ring
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 7;
  ctx.setLineDash([20, 14]);
  ctx.beginPath();
  ctx.arc(c, c, c - 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const label = `$${Math.round(amount)}`;
  const fontSize = label.length <= 3 ? 84 : label.length === 4 ? 68 : 54;
  ctx.fillStyle = style.text;
  ctx.font = `800 ${fontSize}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, c, c + 4);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  topCache.set(key, texture);
  return texture;
}

/** Chip edge: denomination color with white stripes (wraps the cylinder side). */
export function chipEdgeTexture(amount: number): CanvasTexture {
  const style = chipStyle(amount);
  const cached = edgeCache.get(style.fill);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  ctx.fillStyle = style.fill;
  ctx.fillRect(0, 0, 256, 32);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let i = 0; i < 8; i++) ctx.fillRect(i * 32 + 10, 0, 12, 32);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  edgeCache.set(style.fill, texture);
  return texture;
}
