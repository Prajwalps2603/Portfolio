/**
 * THE DIVER (pure geometry: no React, no DOM). A scuba diver on a small 2D side-view rig, drawn as
 * a wetsuit body (tapered capsules), a buoyancy vest with a strap, a tank with its valve and the
 * hose to his regulator, a hooded head with a mask, gloves, a torch, and long fins with foot
 * pockets and side rails. One figure poses for everything: standing ready on the ice (a hand on
 * his mask), the giant stride off the ledge, the drop in feet first, the survey head down with the
 * torch on the ice, the swim back up head first, and standing on the seabed at the bottom.
 *
 * Angles are screen directions in degrees (0 = right, 90 = down, -90 = up). Limbs are posed
 * RELATIVE to the torso. His front (mask) faces torso + 90: upright (-90) he looks right, out to
 * sea; head down (90) he looks left, at the ice. `s` scales the rig (1 = about 100px, fins to head).
 */
import type { Point } from "@/components/sketch/rough";

/** Limb angles relative to the torso. A = near side, B = far side. */
export type Limbs = {
  shoulder: number;
  elbow: number;
  shoulderB: number;
  elbowB: number;
  hipA: number;
  kneeA: number;
  finA: number;
  hipB: number;
  kneeB: number;
  finB: number;
};
export type Pose = Limbs & { x: number; y: number; s: number; torso: number; beam: number };

/** On the ledge: upright, knees soft, far hand holding his mask (solved for the mask), torch down. */
export const READY: Limbs = { shoulder: 172, elbow: 160, shoulderB: 77, elbowB: -42, hipA: 186, kneeA: 174, finA: 94, hipB: 178, kneeB: 182, finB: 88 };
/** The giant stride: near leg out over the water, far leg trailing, torch arm out for balance. */
export const STRIDE: Limbs = { shoulder: 104, elbow: 96, shoulderB: 77, elbowB: -42, hipA: 146, kneeA: 162, finA: 104, hipB: 206, kneeB: 198, finB: 236 };
/** Dropping in feet first: legs together, fins down, still holding his mask. */
export const DROP: Limbs = { shoulder: 150, elbow: 128, shoulderB: 77, elbowB: -42, hipA: 182, kneeA: 180, finA: 176, hipB: 178, kneeB: 181, finB: 183 };
/** Head down along the ice: torch arm reaching to it, the other arm ahead, legs trailing. */
export const SURVEY: Limbs = { shoulder: 58, elbow: 76, shoulderB: 16, elbowB: 8, hipA: 172, kneeA: 186, finA: 196, hipB: 186, kneeB: 176, finB: 172 };
/** Swimming back up head first: torch lighting the way up, the other arm along his side. */
export const ASCEND: Limbs = { shoulder: 18, elbow: 8, shoulderB: 165, elbowB: 172, hipA: 174, kneeA: 186, finA: 194, hipB: 186, kneeB: 176, finB: 172 };
/** On the seabed: standing upright, knees soft, fins flat, the torch down on the languages. */
export const LAND: Limbs = { shoulder: 150, elbow: 138, shoulderB: 170, elbowB: 176, hipA: 186, kneeA: 172, finA: 94, hipB: 178, kneeB: 184, finB: 88 };

const KEYS: (keyof Limbs)[] = ["shoulder", "elbow", "shoulderB", "elbowB", "hipA", "kneeA", "finA", "hipB", "kneeB", "finB"];

export function blendLimbs(a: Limbs, b: Limbs, t: number): Limbs {
  const out = { ...a };
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

/** Hip to sole, in rig units: how high the pelvis stands above the ice. */
export const LEG = 46;

export type DiverShapes = {
  beam: string;
  farFin: string;
  farLeg: string;
  farArm: string;
  farGlove: string;
  tank: string;
  valve: string;
  body: string;
  bcd: string;
  strap: string;
  seam: string;
  hose: string;
  fin: string;
  rails: string;
  arm: string;
  glove: string;
  torch: string;
  mask: string;
  glint: string;
  reg: string;
  /** The regulator: where his bubbles leave. */
  mouth: Point;
  /** The lowest of his two soles (for the splash). */
  feet: number;
};

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (deg: number): Point => [Math.cos(rad(deg)), Math.sin(rad(deg))];
const at = (p: Point, d: Point, k: number): Point => [p[0] + d[0] * k, p[1] + d[1] * k];
const f = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Point) => `${f(p[0])} ${f(p[1])}`;

/** A tapered capsule from a (radius ra) to b (radius rb), one closed path. */
function capsule(a: Point, b: Point, ra: number, rb: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const n: Point = [-dy / len, dx / len];
  return `M${pt(at(a, n, ra))}L${pt(at(b, n, rb))}A${f(rb)} ${f(rb)} 0 0 0 ${pt(at(b, n, -rb))}L${pt(at(a, n, -ra))}A${f(ra)} ${f(ra)} 0 0 0 ${pt(at(a, n, ra))}Z`;
}

function circle(c: Point, r: number): string {
  return `M${f(c[0] - r)} ${f(c[1])}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

const seg = (a: Point, b: Point) => `M${pt(a)}L${pt(b)}`;

/** A long fin: a foot pocket and a blade that flares to a wide, slightly cut tip; plus its rails. */
function fin(foot: Point, deg: number, s: number, len: number, w: number): { shape: string; rails: string } {
  const d = dir(deg);
  const n: Point = [-d[1], d[0]];
  const b0 = at(foot, d, 3 * s);
  const tip = at(foot, d, len * s);
  const shape =
    capsule(foot, at(foot, d, 6 * s), 3.3 * s, 3 * s) +
    `M${pt(at(b0, n, w * 0.5 * s))}L${pt(at(tip, n, w * s))}L${pt(at(at(tip, d, 1.6 * s), n, w * 0.1 * s))}L${pt(at(tip, n, -w * 0.72 * s))}L${pt(at(b0, n, -w * 0.5 * s))}Z`;
  const rails = seg(at(b0, n, w * 0.42 * s), at(at(foot, d, len * 0.95 * s), n, w * 0.86 * s)) + seg(at(b0, n, -w * 0.42 * s), at(at(foot, d, len * 0.95 * s), n, -w * 0.62 * s));
  return { shape, rails };
}

/** The torch beam: a narrow cone from the lens. */
function cone(tip: Point, deg: number, len: number, spread: number): string {
  return `M${pt(tip)}L${pt(at(tip, dir(deg - spread), len))}L${pt(at(tip, dir(deg + spread), len))}Z`;
}

export function diverShapes(p: Pose): DiverShapes {
  const s = p.s;
  const P: Point = [p.x, p.y];
  const td = dir(p.torso);
  const face = dir(p.torso + 90);
  const back = dir(p.torso - 90);
  const a = (rel: number) => p.torso + rel;

  const N = at(P, td, 36 * s); // neck
  const H = at(N, td, 9.5 * s); // head
  const S = at(N, td, -5 * s); // shoulder
  // near (torch) arm
  const E = at(S, dir(a(p.shoulder)), 17 * s);
  const W = at(E, dir(a(p.elbow)), 15 * s);
  const T = at(W, dir(a(p.elbow)), 10 * s);
  // far arm
  const S2 = at(S, back, 1.4 * s);
  const E2 = at(S2, dir(a(p.shoulderB)), 16.5 * s);
  const W2 = at(E2, dir(a(p.elbowB)), 14.5 * s);
  // legs
  const KA = at(P, dir(a(p.hipA)), 24 * s);
  const FA = at(KA, dir(a(p.kneeA)), 22 * s);
  const KB = at(P, dir(a(p.hipB)), 24 * s);
  const FB = at(KB, dir(a(p.kneeB)), 22 * s);
  // gear
  const tankA = at(at(P, td, 9 * s), back, 9.4 * s);
  const tankB = at(at(P, td, 31 * s), back, 9.4 * s);
  const stage = at(tankB, td, 5.4 * s);
  const maskC = at(at(H, face, 6.4 * s), td, 1 * s);
  const mouth = at(at(H, face, 6.7 * s), td, -5.4 * s);
  const finA = fin(FA, a(p.finA), s, 21, 5.8);
  const finB = fin(FB, a(p.finB), s, 20, 5.3);

  return {
    beam: p.beam > 0.02 ? cone(T, a(p.elbow), 160 * s, 12) : "",
    farFin: finB.shape,
    farLeg: capsule(P, KB, 5.6 * s, 4.4 * s) + capsule(KB, FB, 4.2 * s, 3 * s),
    farArm: capsule(S2, E2, 3.5 * s, 3 * s) + capsule(E2, W2, 3 * s, 2.5 * s),
    farGlove: circle(W2, 2.9 * s),
    tank: capsule(tankA, tankB, 5.7 * s, 5.7 * s),
    valve: capsule(tankB, stage, 2.2 * s, 2 * s) + circle(stage, 2.6 * s),
    body: capsule(P, N, 7.6 * s, 9.2 * s) + capsule(N, H, 4 * s, 4 * s) + circle(H, 7.9 * s) + capsule(P, KA, 6 * s, 4.6 * s) + capsule(KA, FA, 4.4 * s, 3.1 * s),
    bcd: capsule(at(at(P, td, 12 * s), back, 0.8 * s), at(at(P, td, 33 * s), back, 0.8 * s), 9.8 * s, 10.5 * s),
    strap: seg(at(at(P, td, 27 * s), face, 9.9 * s), at(at(P, td, 21 * s), back, 9.9 * s)),
    seam: seg(at(at(P, td, 2 * s), face, 6.4 * s), at(at(P, td, 11 * s), face, 8.4 * s)) + seg(at(KA, dir(a(p.kneeA) + 90), 4.2 * s), at(FA, dir(a(p.kneeA) + 90), 3 * s)),
    hose: `M${pt(stage)}C${pt(at(at(H, back, 11 * s), td, 3 * s))} ${pt(at(at(H, face, 1 * s), td, -12 * s))} ${pt(mouth)}`,
    fin: finA.shape,
    rails: finA.rails + finB.rails,
    arm: capsule(S, E, 3.9 * s, 3.3 * s) + capsule(E, W, 3.3 * s, 2.7 * s),
    glove: circle(W, 3.1 * s),
    torch: capsule(W, T, 2.8 * s, 2.6 * s),
    mask: capsule(at(maskC, td, 2.6 * s), at(maskC, td, -2.6 * s), 3.3 * s, 3.3 * s),
    glint: seg(at(at(maskC, td, 2 * s), face, 1.2 * s), at(at(maskC, td, -0.6 * s), face, 2 * s)),
    reg: circle(mouth, 2.2 * s),
    mouth,
    feet: Math.max(FA[1], FB[1]),
  };
}
