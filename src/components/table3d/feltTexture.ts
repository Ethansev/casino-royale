import { CanvasTexture, SRGBColorSpace } from "three";
import type { VariantConfig } from "@/engine/types";
import { PIPS } from "@/components/table2d/Dice2D";
import { BOARD_H, BOARD_W, boardDecorFor, zonesForCached } from "@/lib/betZones";
import { boardColor, type Theme } from "@/lib/themes";

const FONT = '"Baloo 2", Helvetica, Arial, sans-serif';
const TEXTURE_W = 2048;

const cache = new Map<string, CanvasTexture>();

function drawMiniDie(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: 1 | 2 | 3 | 4 | 5 | 6,
) {
  ctx.fillStyle = "#f8f7f4";
  ctx.strokeStyle = "#b9b4aa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, size * 0.2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#23272f";
  for (const [px, py] of PIPS[value]) {
    ctx.beginPath();
    ctx.arc(x + px * size, y + py * size, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws the table layout straight from the betZones spec onto a canvas —
 * the same single source of truth as the 2D board, no SVG round-trip.
 */
export function createFeltTexture(
  config: VariantConfig,
  theme: Theme,
  fontsReady = true,
): CanvasTexture {
  const key = `${config.variant}|${theme.id}|${fontsReady}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_W;
  canvas.height = Math.round((TEXTURE_W * BOARD_H) / BOARD_W);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  const s = TEXTURE_W / BOARD_W;
  ctx.scale(s, s);

  const bg = ctx.createLinearGradient(0, 0, 0, BOARD_H);
  bg.addColorStop(0, theme.board.feltTop);
  bg.addColorStop(0.5, theme.board.feltMid);
  bg.addColorStop(1, theme.board.feltBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  for (const d of boardDecorFor(config)) {
    if (d.shape.kind === "rect") {
      const { x, y, w, h, rx } = d.shape;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, rx ?? 0);
      const dFill = boardColor(theme, d.fill);
      if (dFill) {
        ctx.fillStyle = dFill;
        ctx.fill();
      }
      ctx.strokeStyle = d.stroke ?? theme.board.line;
      ctx.globalAlpha = d.stroke ? 1 : 0.35;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const t of d.texts ?? []) {
      ctx.fillStyle = boardColor(theme, t.color) ?? theme.board.text;
      ctx.font = `${t.weight ?? 600} ${t.size ?? 16}px ${FONT}`;
      ctx.fillText(t.text, t.x, t.y);
    }
  }

  for (const zone of zonesForCached(config)) {
    ctx.setLineDash(zone.dashed ? [8, 6] : []);
    if (zone.shape.kind === "rect") {
      const { x, y, w, h, rx } = zone.shape;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, rx ?? 0);
      const zFill = boardColor(theme, zone.fill);
      if (zFill) {
        ctx.fillStyle = zFill;
        ctx.fill();
        // Inner shadow: clip to the box and stroke a blurred shadow inside it
        ctx.save();
        ctx.clip();
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        ctx.lineWidth = 8;
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.stroke();
        ctx.restore();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = theme.board.line;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = theme.board.line;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 2;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.setLineDash([]);

    for (const c of zone.circles ?? []) {
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
      ctx.strokeStyle = theme.board.line;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (zone.label) {
      ctx.fillStyle = boardColor(theme, zone.labelColor) ?? theme.board.text;
      ctx.font = `800 ${zone.fontSize ?? 26}px ${FONT}`;
      ctx.fillText(zone.label, zone.labelX, zone.labelY);
    }

    for (const t of zone.extraText ?? []) {
      ctx.font = `${t.weight ?? 500} ${t.size ?? 14}px ${FONT}`;
      ctx.globalAlpha = t.opacity ?? 1;
      ctx.fillStyle = boardColor(theme, t.color) ?? theme.board.text;
      ctx.fillText(t.text, t.x, t.y);
      ctx.globalAlpha = 1;
    }

    for (const d of zone.dice ?? []) {
      drawMiniDie(ctx, d.x, d.y, d.size, d.d1);
      drawMiniDie(ctx, d.x + d.size + 8, d.y, d.size, d.d2);
    }
  }

  // Felt grain
  const noise = document.createElement("canvas");
  noise.width = 128;
  noise.height = 128;
  const nctx = noise.getContext("2d");
  if (nctx) {
    const img = nctx.createImageData(128, 128);
    let seed = 9973;
    for (let i = 0; i < img.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const v = seed % 256;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
    const pattern = ctx.createPattern(noise, "repeat");
    if (pattern) {
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  // Vignette
  const vg = ctx.createRadialGradient(
    BOARD_W / 2,
    BOARD_H * 0.42,
    BOARD_W * 0.35,
    BOARD_W / 2,
    BOARD_H * 0.42,
    BOARD_W * 0.72,
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  cache.set(key, texture);
  return texture;
}
