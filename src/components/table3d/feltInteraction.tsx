"use client";

import { Html } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import type { VariantConfig } from "@/engine/types";
import { chipPositionForBet, type BetZone } from "@/lib/betZones";
import { flyChipSprite } from "@/lib/chipFx";
import { formatMoney } from "@/lib/chips";
import { useGameStore } from "@/store/gameStore";
import { FELT_D, FELT_W, SCALE, boardToFelt, feltToBoard } from "./coords";

export interface FeltPointer {
  bx: number;
  by: number;
  clientX: number;
  clientY: number;
}

/** Invisible plane over the felt that turns pointer events into board coords.
 *  Chip drags are driven by window pointer events + a manual screen→felt
 *  raycast (R3F's own mesh events go deaf once a drag starts, so we can't rely
 *  on them mid-gesture). */
export function FeltHitLayer({
  onMove,
  onLeave,
  onTap,
  onRightTap,
  onDown,
  onUp,
}: {
  onMove: (p: FeltPointer) => void;
  onLeave: () => void;
  onTap: (p: FeltPointer) => void;
  onRightTap: (p: FeltPointer) => void;
  /** Returns true if the press grabbed a chip (starts a drag). */
  onDown: (p: FeltPointer) => boolean;
  onUp: (p: FeltPointer | null) => void;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const raycaster = useMemo(() => new Raycaster(), []);
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const draggingRef = useRef(false);
  const moveRef = useRef(onMove);
  const upRef = useRef(onUp);
  moveRef.current = onMove;
  upRef.current = onUp;

  const toPointer = (e: ThreeEvent<PointerEvent | MouseEvent>): FeltPointer => {
    const { bx, by } = feltToBoard(e.point.x, e.point.z);
    return { bx, by, clientX: e.nativeEvent.clientX, clientY: e.nativeEvent.clientY };
  };

  const screenToPointer = (clientX: number, clientY: number): FeltPointer | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = new Vector3();
    if (!raycaster.ray.intersectPlane(plane, hit)) return null;
    const { bx, by } = feltToBoard(hit.x, hit.z);
    return { bx, by, clientX, clientY };
  };

  useEffect(() => {
    const onWindowMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const p = screenToPointer(ev.clientX, ev.clientY);
      if (p) moveRef.current(p);
    };
    const onWindowUp = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      upRef.current(screenToPointer(ev.clientX, ev.clientY));
    };
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    return () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
    };
    // raycast inputs are stable refs/memos; callbacks are read via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl, raycaster, plane]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.002, 0]}
      onPointerMove={(e) => {
        if (!draggingRef.current) onMove(toPointer(e));
      }}
      onPointerOut={() => {
        if (!draggingRef.current) onLeave();
      }}
      onPointerDown={(e) => {
        if (onDown(toPointer(e))) draggingRef.current = true;
      }}
      onClick={(e) => {
        // Ignore clicks that were actually orbit drags.
        if (e.delta > 6) return;
        onTap(toPointer(e));
      }}
      onContextMenu={(e) => {
        e.nativeEvent.preventDefault();
        if (e.delta > 6) return;
        onRightTap(toPointer(e));
      }}
    >
      <planeGeometry args={[FELT_W, FELT_D]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** Themed hover glow over a zone's rect on the felt (3D match for the 2D board). */
export function ZoneHighlight({ zone, color }: { zone: BetZone; color: string }) {
  const invalidate = useThree((s) => s.invalidate);
  // frameloop="demand": request a frame when the highlight mounts/changes.
  useEffect(() => {
    invalidate();
  }, [invalidate, zone, color]);
  if (zone.shape.kind !== "rect") return null;
  const { x, y, w, h } = zone.shape;
  const pad = 8;
  const c = boardToFelt(x + w / 2, y + h / 2);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[c.x, 0.02, c.z]}>
      <planeGeometry args={[(w + pad) / SCALE, (h + pad) / SCALE]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.32}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Floating "+$X" win labels anchored to the felt (3D counterpart of WinFloaters). */
export function WinFloaters3D({ config }: { config: VariantConfig }) {
  const fxSeq = useGameStore((s) => s.fxSeq);
  const resolutions = useGameStore((s) => s.lastResolutions);
  if (fxSeq === 0) return null;
  const winners = resolutions.filter((r) => r.profit > 0);

  return (
    <group key={fxSeq}>
      {winners.map((r, i) => {
        const pos = chipPositionForBet(config, { key: r.key });
        if (!pos) return null;
        const { x, z } = boardToFelt(pos.x, pos.y);
        return (
          <Html key={r.key} position={[x, 0.7, z]} center zIndexRange={[30, 20]}>
            <span
              className="whitespace-nowrap text-xl font-extrabold text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] motion-safe:[animation:float-up_2.4s_ease-out_forwards] motion-reduce:opacity-0"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              +{formatMoney(r.profit)}
            </span>
          </Html>
        );
      })}
    </group>
  );
}

/** Projects winning bet spots through the camera and launches chip-flight sprites. */
export function FlyingChipsLauncher({ config }: { config: VariantConfig }) {
  const fxSeq = useGameStore((s) => s.fxSeq);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    if (fxSeq === 0) return;
    const winners = useGameStore
      .getState()
      .lastResolutions.filter((r) => r.profit > 0);
    if (winners.length === 0) return;
    const rect = gl.domElement.getBoundingClientRect();
    for (const [i, r] of winners.entries()) {
      const pos = chipPositionForBet(config, { key: r.key });
      if (!pos) continue;
      const { x, z } = boardToFelt(pos.x, pos.y);
      const v = new Vector3(x, 0.1, z).project(camera);
      flyChipSprite(
        rect.left + ((v.x + 1) / 2) * rect.width,
        rect.top + ((1 - v.y) / 2) * rect.height,
        r.profit,
        i * 80,
      );
    }
  }, [fxSeq, camera, gl, config]);

  return null;
}

/** Dev-only: lets Playwright resolve board coords to screen pixels. */
export function DevProjectionHook() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const boardToScreen = (bx: number, by: number) => {
      const { x, z } = boardToFelt(bx, by);
      const v = new Vector3(x, 0.02, z).project(camera);
      const rect = gl.domElement.getBoundingClientRect();
      return {
        x: rect.left + ((v.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - v.y) / 2) * rect.height,
      };
    };
    Object.assign(window, { __boardToScreen: boardToScreen });
    return () => {
      Object.assign(window, { __boardToScreen: undefined });
    };
  }, [camera, gl]);

  return null;
}
