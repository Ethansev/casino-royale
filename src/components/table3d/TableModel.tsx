"use client";

import { useEffect, useMemo, useState } from "react";
import { AdditiveBlending, CanvasTexture, RepeatWrapping } from "three";
import type { VariantConfig } from "@/engine/types";
import type { Theme } from "@/lib/themes";
import { useTheme } from "@/store/uiStore";
import { createFeltTexture } from "./feltTexture";
import { FELT_D, FELT_W, RAIL_HEIGHT, RAIL_THICKNESS } from "./coords";

let scanTex: CanvasTexture | null = null;

function scanlineTexture(): CanvasTexture {
  if (scanTex) return scanTex;
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let y = 0; y < 64; y += 4) ctx.fillRect(0, y, 8, 1);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 24);
  scanTex = texture;
  return texture;
}

function RailMaterial({ theme }: { theme: Theme }) {
  if (theme.scene.toon) return <meshToonMaterial color={theme.scene.rail.color} />;
  return (
    <meshStandardMaterial
      color={theme.scene.rail.color}
      roughness={theme.scene.rail.roughness}
      metalness={theme.scene.rail.metalness}
      emissive={theme.scene.rail.emissive ?? "#000000"}
      emissiveIntensity={theme.scene.rail.emissiveIntensity ?? 0}
    />
  );
}

function Rail({
  position,
  size,
  theme,
}: {
  position: [number, number, number];
  size: [number, number, number];
  theme: Theme;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <RailMaterial theme={theme} />
    </mesh>
  );
}

/** Glowing strip along the top of a rail (neon theme). */
function NeonTrim({
  position,
  length,
  vertical,
  color,
}: {
  position: [number, number, number];
  length: number;
  vertical: boolean;
  color: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry
        args={vertical ? [0.05, 0.02, length] : [length, 0.02, 0.05]}
      />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

export function TableModel({ config }: { config: VariantConfig }) {
  const theme = useTheme();
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    document.fonts.load('700 26px "Baloo 2"').then(() => {
      if (live) setFontsReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  const felt = useMemo(
    () => createFeltTexture(config, theme, fontsReady),
    [config, theme, fontsReady],
  );
  const railY = RAIL_HEIGHT / 2;
  const trimY = RAIL_HEIGHT + 0.02;
  const w = FELT_W + RAIL_THICKNESS * 2;
  const trim = theme.scene.neonTrim;
  const holo = theme.scene.scanlines;

  return (
    <group>
      {/* Felt — slightly above the table body to avoid z-fighting its top face */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[FELT_W, FELT_D]} />
        {theme.scene.toon ? (
          <meshToonMaterial map={felt} />
        ) : (
          <meshStandardMaterial
            map={felt}
            roughness={holo ? 0.4 : 0.95}
            metalness={holo ? 0.3 : 0}
          />
        )}
      </mesh>

      {holo && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
          <planeGeometry args={[FELT_W, FELT_D]} />
          <meshBasicMaterial
            map={scanlineTexture()}
            color={theme.css.accent}
            transparent
            opacity={0.16}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Table body under the felt */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[w, 0.4, FELT_D + RAIL_THICKNESS * 2]} />
        {theme.scene.toon ? (
          <meshToonMaterial color={theme.scene.body} />
        ) : (
          <meshStandardMaterial color={theme.scene.body} roughness={0.9} />
        )}
      </mesh>

      {/* Rails: back (-z, the wall dice bounce off), front, left, right */}
      <Rail
        position={[0, railY, -(FELT_D / 2 + RAIL_THICKNESS / 2)]}
        size={[w, RAIL_HEIGHT, RAIL_THICKNESS]}
        theme={theme}
      />
      <Rail
        position={[0, railY, FELT_D / 2 + RAIL_THICKNESS / 2]}
        size={[w, RAIL_HEIGHT, RAIL_THICKNESS]}
        theme={theme}
      />
      <Rail
        position={[-(FELT_W / 2 + RAIL_THICKNESS / 2), railY, 0]}
        size={[RAIL_THICKNESS, RAIL_HEIGHT, FELT_D]}
        theme={theme}
      />
      <Rail
        position={[FELT_W / 2 + RAIL_THICKNESS / 2, railY, 0]}
        size={[RAIL_THICKNESS, RAIL_HEIGHT, FELT_D]}
        theme={theme}
      />

      {trim && (
        <group>
          <NeonTrim
            position={[0, trimY, -(FELT_D / 2 + RAIL_THICKNESS / 2)]}
            length={w}
            vertical={false}
            color={trim}
          />
          <NeonTrim
            position={[0, trimY, FELT_D / 2 + RAIL_THICKNESS / 2]}
            length={w}
            vertical={false}
            color={trim}
          />
          <NeonTrim
            position={[-(FELT_W / 2 + RAIL_THICKNESS / 2), trimY, 0]}
            length={FELT_D}
            vertical
            color={trim}
          />
          <NeonTrim
            position={[FELT_W / 2 + RAIL_THICKNESS / 2, trimY, 0]}
            length={FELT_D}
            vertical
            color={trim}
          />
        </group>
      )}

      {/* Dark room floor far below */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <circleGeometry args={[40, 32]} />
        <meshStandardMaterial color={theme.scene.floor} roughness={1} />
      </mesh>
    </group>
  );
}
