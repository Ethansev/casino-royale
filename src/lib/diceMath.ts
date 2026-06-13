import type { Die } from "@/engine/types";

/**
 * Die face convention (local space): 1=+Y, 6=−Y, 2=+X, 5=−X, 3=+Z, 4=−Z.
 * Opposite faces sum to 7. Dice3D's per-face textures must follow
 * FACE_MATERIAL_ORDER, which maps this convention onto three.js BoxGeometry's
 * material slots [+X, −X, +Y, −Y, +Z, −Z].
 */
export const FACE_MATERIAL_ORDER: readonly Die[] = [2, 5, 1, 6, 3, 4];

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const FACE_NORMALS: Readonly<Record<Die, Vec3>> = {
  1: { x: 0, y: 1, z: 0 },
  6: { x: 0, y: -1, z: 0 },
  2: { x: 1, y: 0, z: 0 },
  5: { x: -1, y: 0, z: 0 },
  3: { x: 0, y: 0, z: 1 },
  4: { x: 0, y: 0, z: -1 },
};

export const QUAT_IDENTITY: Quat = { x: 0, y: 0, z: 0, w: 1 };

export function qMul(a: Quat, b: Quat): Quat {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

export function qFromAxisAngle(axis: Vec3, angle: number): Quat {
  const half = angle / 2;
  const s = Math.sin(half);
  return { x: axis.x * s, y: axis.y * s, z: axis.z * s, w: Math.cos(half) };
}

export function qRotateVec(q: Quat, v: Vec3): Vec3 {
  // v' = q v q*
  const { x, y, z, w } = q;
  const tx = 2 * (y * v.z - z * v.y);
  const ty = 2 * (z * v.x - x * v.z);
  const tz = 2 * (x * v.y - y * v.x);
  return {
    x: v.x + w * tx + (y * tz - z * ty),
    y: v.y + w * ty + (z * tx - x * tz),
    z: v.z + w * tz + (x * ty - y * tx),
  };
}

function quatKey(q: Quat): string {
  // Round first so ±1e-17 noise can't flip the sign canonicalization,
  // then normalize sign (q and −q are the same rotation).
  const r = (n: number) => Math.round(n * 1e6) / 1e6 + 0;
  let x = r(q.x);
  let y = r(q.y);
  let z = r(q.z);
  let w = r(q.w);
  if (w < 0 || (w === 0 && (x < 0 || (x === 0 && (y < 0 || (y === 0 && z < 0)))))) {
    x = -x + 0;
    y = -y + 0;
    z = -z + 0;
    w = -w + 0;
  }
  return `${x},${y},${z},${w}`;
}

function buildRotationGroup(): Quat[] {
  const X: Vec3 = { x: 1, y: 0, z: 0 };
  const Y: Vec3 = { x: 0, y: 1, z: 0 };
  const Z: Vec3 = { x: 0, y: 0, z: 1 };
  const generators = [
    qFromAxisAngle(X, Math.PI / 2),
    qFromAxisAngle(Y, Math.PI / 2),
    qFromAxisAngle(Z, Math.PI / 2),
  ];
  const found = new Map<string, Quat>([[quatKey(QUAT_IDENTITY), QUAT_IDENTITY]]);
  const queue: Quat[] = [QUAT_IDENTITY];
  while (queue.length > 0) {
    const q = queue.pop();
    if (!q) break;
    for (const g of generators) {
      const next = qMul(g, q);
      const key = quatKey(next);
      if (!found.has(key)) {
        found.set(key, next);
        queue.push(next);
      }
    }
  }
  return [...found.values()];
}

/** The 24 orientation-preserving symmetries of the cube. */
export const ROTATION_GROUP: readonly Quat[] = buildRotationGroup();

const DICE: readonly Die[] = [1, 2, 3, 4, 5, 6];
const UP: Vec3 = { x: 0, y: 1, z: 0 };

/** Which painted face points up for a die in world orientation `q`. */
export function upFace(q: Quat): Die {
  let best: Die = 1;
  let bestDot = -Infinity;
  for (const face of DICE) {
    const n = qRotateVec(q, FACE_NORMALS[face]);
    const dot = n.x * UP.x + n.y * UP.y + n.z * UP.z;
    if (dot > bestDot) {
      bestDot = dot;
      best = face;
    }
  }
  return best;
}

/** True if no face is within ~15° of straight up (die leaning on something). */
export function isCocked(q: Quat, toleranceDeg = 15): boolean {
  const cos = Math.cos((toleranceDeg * Math.PI) / 180);
  for (const face of DICE) {
    const n = qRotateVec(q, FACE_NORMALS[face]);
    if (n.y >= cos) return false;
  }
  return true;
}

function approxEq(a: Vec3, b: Vec3): boolean {
  return (
    Math.abs(a.x - b.x) < 1e-6 &&
    Math.abs(a.y - b.y) < 1e-6 &&
    Math.abs(a.z - b.z) < 1e-6
  );
}

/**
 * Group member R mapping the TARGET face's normal onto the OBSERVED face's
 * normal. Pre-multiplying a die's initial orientation by R leaves the physics
 * trajectory identical (cube symmetry) but relabels which painted face ends up
 * on top: if the pre-sim settled with `observed` up, the remapped die settles
 * with `target` up.
 */
export function remapRotation(target: Die, observed: Die): Quat {
  const want = FACE_NORMALS[observed];
  for (const q of ROTATION_GROUP) {
    if (approxEq(qRotateVec(q, FACE_NORMALS[target]), want)) return q;
  }
  throw new Error(`no cube rotation maps face ${target} onto ${observed}`);
}

/** A canonical orientation showing `face` up — for static posing and settle snaps. */
export function faceUpQuaternion(face: Die): Quat {
  for (const q of ROTATION_GROUP) {
    if (upFace(q) === face) return q;
  }
  throw new Error(`no orientation found for face ${face}`);
}

/**
 * Settle snap: minimal world rotation that brings the current up-face's normal
 * exactly vertical while preserving the die's resting heading (yaw).
 */
export function tiltCorrectedQuaternion(q: Quat): Quat {
  const n = qRotateVec(q, FACE_NORMALS[upFace(q)]);
  const dot = Math.min(1, Math.max(-1, n.y));
  const angle = Math.acos(dot);
  if (angle < 1e-7) return q;
  // axis = n × UP
  const axis = { x: -n.z, y: 0, z: n.x };
  const len = Math.hypot(axis.x, axis.z);
  if (len < 1e-9) return q;
  const correction = qFromAxisAngle(
    { x: axis.x / len, y: 0, z: axis.z / len },
    angle,
  );
  return qMul(correction, q);
}
