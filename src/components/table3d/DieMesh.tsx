"use client";

import { FACE_MATERIAL_ORDER } from "@/lib/diceMath";
import { useTheme } from "@/store/uiStore";
import { pipTexture } from "./diceTextures";

export const DIE_SIZE = 0.36;

/** A die whose painted faces follow the diceMath convention (1=+Y, 2=+X, 3=+Z…). */
export function DieMesh({ size = DIE_SIZE }: { size?: number }) {
  const theme = useTheme();
  const emissive = theme.scene.dice.pipEmissive;

  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      {FACE_MATERIAL_ORDER.map((face, i) =>
        theme.scene.toon ? (
          <meshToonMaterial
            key={`${face}-${theme.id}`}
            attach={`material-${i}`}
            map={pipTexture(face, theme)}
          />
        ) : (
          <meshStandardMaterial
            key={`${face}-${theme.id}`}
            attach={`material-${i}`}
            map={pipTexture(face, theme)}
            roughness={0.3}
            emissive={emissive ?? "#000000"}
            emissiveMap={emissive ? pipTexture(face, theme) : null}
            emissiveIntensity={emissive ? 0.9 : 0}
          />
        ),
      )}
    </mesh>
  );
}
