"use client";

import { CanvasTexture, SRGBColorSpace } from "three";
import type { VariantConfig } from "@/engine/types";
import { puckPositionFor } from "@/lib/betZones";
import { useGameStore } from "@/store/gameStore";
import { boardToFelt } from "./coords";

const cache = new Map<string, CanvasTexture>();

function puckTexture(on: boolean): CanvasTexture {
  const key = on ? "on" : "off";
  const existing = cache.get(key);
  if (existing) return existing;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.fillStyle = on ? "#f9fafb" : "#111827";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = on ? "#111827" : "#f9fafb";
  ctx.font = "bold 44px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(on ? "ON" : "OFF", 64, 64);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}

export function PointPuck3D({ config }: { config: VariantConfig }) {
  const point = useGameStore((s) => s.snapshot?.point ?? null);
  const board = puckPositionFor(config, point);
  if (!board) return null;
  const { x, z } = boardToFelt(board.x, board.y);

  return (
    <group position={[x, 0.03, z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 32]} />
        <meshStandardMaterial attach="material-0" color="#e5e7eb" roughness={0.4} />
        <meshStandardMaterial attach="material-1" map={puckTexture(true)} roughness={0.4} />
        <meshStandardMaterial attach="material-2" color="#e5e7eb" roughness={0.4} />
      </mesh>
    </group>
  );
}
