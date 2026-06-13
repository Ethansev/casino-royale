import RAPIER from "@dimforge/rapier3d-compat";
import type { Die } from "@/engine/types";
import {
  faceUpQuaternion,
  isCocked,
  qFromAxisAngle,
  qMul,
  remapRotation,
  tiltCorrectedQuaternion,
  upFace,
  type Quat,
} from "@/lib/diceMath";
import { DIE_SIZE } from "./DieMesh";
import { DICE_REST, FELT_D, FELT_W, RAIL_THICKNESS } from "./coords";

const DT = 1 / 60;
const MAX_STEPS = 480;
const GRAVITY = -25;
const SETTLE_LIN = 0.05;
const SETTLE_ANG = 0.12;
const SETTLE_STEPS = 12;

export interface DieTrajectory {
  /** xyz triplets, one per step. */
  positions: number[];
  rotations: Quat[];
  settleRotation: Quat;
}

export interface DiceTrajectory {
  dt: number;
  count: number;
  dice: [DieTrajectory, DieTrajectory];
}

let rapierReady: Promise<void> | null = null;

function ensureRapier(): Promise<void> {
  rapierReady ??= RAPIER.init().then(() => undefined);
  return rapierReady;
}

function randomQuat(rand: () => number): Quat {
  // Random axis, random angle — cosmetic variety only.
  const u = rand() * 2 - 1;
  const phi = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return qFromAxisAngle({ x: s * Math.cos(phi), y: u, z: s * Math.sin(phi) }, rand() * Math.PI * 2);
}

function addTable(world: RAPIER.World): void {
  const floor = RAPIER.ColliderDesc.cuboid(FELT_W / 2 + 0.6, 0.1, FELT_D / 2 + 0.6)
    .setTranslation(0, -0.1, 0)
    .setFriction(0.7)
    .setRestitution(0.25);
  world.createCollider(floor);

  const wallH = 1.6;
  const t = RAIL_THICKNESS;
  // Back wall — the one dice must bounce off; springy like real pyramid rubber.
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(FELT_W / 2 + t, wallH, t / 2)
      .setTranslation(0, wallH, -(FELT_D / 2 + t / 2))
      .setRestitution(0.72)
      .setFriction(0.4),
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(FELT_W / 2 + t, wallH, t / 2)
      .setTranslation(0, wallH, FELT_D / 2 + t / 2)
      .setRestitution(0.4),
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(t / 2, wallH, FELT_D / 2 + t)
      .setTranslation(-(FELT_W / 2 + t / 2), wallH, 0)
      .setRestitution(0.4),
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(t / 2, wallH, FELT_D / 2 + t)
      .setTranslation(FELT_W / 2 + t / 2, wallH, 0)
      .setRestitution(0.4),
  );
}

function simulate(
  target: readonly [Die, Die],
  rand: () => number,
): DiceTrajectory | null {
  const world = new RAPIER.World({ x: 0, y: GRAVITY, z: 0 });
  world.timestep = DT;
  addTable(world);

  const half = DIE_SIZE / 2;
  const bodies = [0, 1].map((i) => {
    const q0 = randomQuat(rand);
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(1.4 + i * 0.6 + rand() * 0.25, 0.9 + rand() * 0.4, 2.1 + rand() * 0.2)
      .setRotation(q0)
      .setLinvel(-(0.6 + rand() * 1.4), 0.5 + rand() * 0.9, -(6.8 + rand() * 2.2))
      .setAngvel({
        x: (rand() - 0.5) * 26,
        y: (rand() - 0.5) * 26,
        z: (rand() - 0.5) * 26,
      })
      .setLinearDamping(0.25)
      .setAngularDamping(0.55);
    const body = world.createRigidBody(desc);
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(half, half, half)
        .setRestitution(0.45)
        .setFriction(0.45),
      body,
    );
    return body;
  });

  const positions: [number[], number[]] = [[], []];
  const rotations: [Quat[], Quat[]] = [[], []];
  let steps = 0;
  let calmStreak = 0;

  while (steps < MAX_STEPS) {
    world.step();
    steps++;
    let calm = true;
    bodies.forEach((body, i) => {
      const p = body.translation();
      positions[i].push(p.x, p.y, p.z);
      const r = body.rotation();
      rotations[i].push({ x: r.x, y: r.y, z: r.z, w: r.w });
      const lv = body.linvel();
      const av = body.angvel();
      if (
        Math.hypot(lv.x, lv.y, lv.z) > SETTLE_LIN ||
        Math.hypot(av.x, av.y, av.z) > SETTLE_ANG
      ) {
        calm = false;
      }
    });
    calmStreak = calm ? calmStreak + 1 : 0;
    if (calmStreak >= SETTLE_STEPS && steps > 60) break;
  }
  world.free();

  if (steps >= MAX_STEPS) return null;

  const dice: DieTrajectory[] = [];
  for (let i = 0; i < 2; i++) {
    const settled = rotations[i][rotations[i].length - 1];
    if (isCocked(settled)) return null;
    const r = remapRotation(target[i], upFace(settled));
    const remapped = rotations[i].map((q) => qMul(q, r));
    const settleRotation = tiltCorrectedQuaternion(remapped[remapped.length - 1]);
    if (upFace(settleRotation) !== target[i]) return null;
    dice.push({ positions: positions[i], rotations: remapped, settleRotation });
  }

  return { dt: DT, count: steps, dice: [dice[0], dice[1]] };
}

function fallbackTrajectory(target: readonly [Die, Die]): DiceTrajectory {
  const dice = [0, 1].map((i): DieTrajectory => {
    const q = faceUpQuaternion(target[i]);
    const rest = DICE_REST[i];
    return {
      positions: [rest[0], rest[1], rest[2]],
      rotations: [q],
      settleRotation: q,
    };
  });
  return { dt: DT, count: 1, dice: [dice[0], dice[1]] };
}

/**
 * Plans a dice throw whose recorded physics trajectory settles showing the
 * engine-decided faces: simulate headlessly with cosmetic random params, then
 * relabel orientations via the cube-symmetry remap (the motion is identical —
 * only the painted faces move). The scene plays the recording back.
 */
export async function planThrow(
  target: readonly [Die, Die],
  rand: () => number = Math.random,
): Promise<DiceTrajectory> {
  await ensureRapier();
  for (let attempt = 0; attempt < 5; attempt++) {
    const trajectory = simulate(target, rand);
    if (trajectory) return trajectory;
  }
  return fallbackTrajectory(target);
}
