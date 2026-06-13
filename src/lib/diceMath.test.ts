import { describe, expect, it } from "vitest";
import {
  FACE_NORMALS,
  ROTATION_GROUP,
  faceUpQuaternion,
  isCocked,
  qFromAxisAngle,
  qMul,
  qRotateVec,
  remapRotation,
  tiltCorrectedQuaternion,
  upFace,
  type Quat,
  type Vec3,
} from "./diceMath";
import type { Die } from "@/engine/types";

const DICE: readonly Die[] = [1, 2, 3, 4, 5, 6];
const AXES: readonly Vec3[] = Object.values(FACE_NORMALS);

function isFaceNormal(v: Vec3): boolean {
  return AXES.some(
    (n) =>
      Math.abs(v.x - n.x) < 1e-6 &&
      Math.abs(v.y - n.y) < 1e-6 &&
      Math.abs(v.z - n.z) < 1e-6,
  );
}

describe("cube rotation group", () => {
  it("has exactly 24 members", () => {
    expect(ROTATION_GROUP).toHaveLength(24);
  });

  it("every member permutes the face-normal set", () => {
    for (const q of ROTATION_GROUP) {
      for (const face of DICE) {
        expect(isFaceNormal(qRotateVec(q, FACE_NORMALS[face]))).toBe(true);
      }
    }
  });

  it("members preserve opposite-face pairing (1-6, 2-5, 3-4 sum to 7)", () => {
    for (const q of ROTATION_GROUP) {
      const up = upFace(q);
      // The face opposite the up face must point down.
      const opposite: Die = DICE[6 - up];
      const n = qRotateVec(q, FACE_NORMALS[opposite]);
      expect(n.y).toBeCloseTo(-1, 6);
    }
  });
});

describe("upFace / faceUpQuaternion", () => {
  it("round-trips every face", () => {
    for (const face of DICE) {
      expect(upFace(faceUpQuaternion(face))).toBe(face);
    }
  });

  it("each of the 6 faces is up for exactly 4 of the 24 orientations", () => {
    const counts = new Map<Die, number>();
    for (const q of ROTATION_GROUP) {
      const f = upFace(q);
      counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    for (const face of DICE) expect(counts.get(face)).toBe(4);
  });
});

describe("remapRotation — the determinism core", () => {
  it("maps the target face normal onto the observed face normal, all 36 pairs", () => {
    for (const target of DICE) {
      for (const observed of DICE) {
        const r = remapRotation(target, observed);
        const mapped = qRotateVec(r, FACE_NORMALS[target]);
        const want = FACE_NORMALS[observed];
        expect(mapped.x).toBeCloseTo(want.x, 6);
        expect(mapped.y).toBeCloseTo(want.y, 6);
        expect(mapped.z).toBeCloseTo(want.z, 6);
      }
    }
  });

  it("trajectory relabel property: pre-multiplying the initial orientation makes the target land up", () => {
    // Arbitrary world-space trajectory deltas a physics sim might produce.
    const deltas: Quat[] = [
      qFromAxisAngle({ x: 0.27, y: 0.8, z: 0.53 }, 2.13),
      qFromAxisAngle({ x: -0.6, y: 0.64, z: 0.48 }, 4.9),
      qFromAxisAngle({ x: 0.9, y: -0.1, z: 0.42 }, 0.77),
    ].map((q) => {
      const len = Math.hypot(q.x, q.y, q.z, q.w);
      return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
    });

    for (const delta of deltas) {
      for (const q0 of [ROTATION_GROUP[0], ROTATION_GROUP[7], ROTATION_GROUP[18]]) {
        const settled = qMul(delta, q0);
        const observed = upFace(settled);
        for (const target of DICE) {
          const r = remapRotation(target, observed);
          const remappedSettled = qMul(delta, qMul(q0, r));
          // The physics path is identical; only the painted faces moved.
          expect(upFace(tiltCorrectedQuaternion(remappedSettled))).toBe(target);
        }
      }
    }
  });
});

describe("settle snap & cocked detection", () => {
  it("tilt correction brings the up face exactly vertical without changing it", () => {
    const wobble = qFromAxisAngle({ x: 1, y: 0, z: 0 }, 0.12);
    for (const face of DICE) {
      const tilted = qMul(wobble, faceUpQuaternion(face));
      const fixed = tiltCorrectedQuaternion(tilted);
      expect(upFace(fixed)).toBe(face);
      const n = qRotateVec(fixed, FACE_NORMALS[face]);
      expect(n.y).toBeCloseTo(1, 6);
    }
  });

  it("flags a die leaning at 45° as cocked, flat dice as not", () => {
    const leaning = qMul(
      qFromAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI / 4),
      faceUpQuaternion(3),
    );
    expect(isCocked(leaning)).toBe(true);
    expect(isCocked(faceUpQuaternion(5))).toBe(false);
  });
});
