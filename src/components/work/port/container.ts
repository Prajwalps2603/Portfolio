/**
 * THE OPEN CONTAINER (pure geometry; a fixed 600 x 400 drawing). A shipping container seen from
 * its door end, looking in, in one-point perspective: the viewer stands D in front of the door
 * end, the box runs DEPTH back (a 40-foot box: the back wall is 0.45 of the opening). Inside:
 * corrugated walls (ridges bunching toward the back), a ceiling, a planked floor, the back wall.
 * The two doors hinge at the opening's sides; `doorShapes(side, theta)` draws one at theta 0
 * (shut, covering its half) to 1 (swung out toward you to 115 degrees), with its ridges, two locking
 * bars with their keepers and handles, and the rubber seal on its free edge.
 * The cargo stands on the floor just inside the doors: CARGO is that floor strip, in percent of
 * the drawing, for the HTML crates laid over it.
 */
import type { Point } from "@/components/sketch/rough";

/** The drawing's window (the doors open to about x 34..566; the box stands on y 361). */
export const VIEW = { x: 22, y: 30, w: 556, h: 342 } as const;
const VP: Point = [300, 194];
const D = 2000;
const DEPTH = 2444;
export const FRAME = { x0: 132, x1: 468, y0: 44, y1: 350 } as const;
const T = 11;
export const OPENING = { x0: FRAME.x0 + T, x1: FRAME.x1 - T, y0: FRAME.y0 + T, y1: FRAME.y1 - T } as const;
const OPEN_DEG = 115;

const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Point) => `${r1(p[0])} ${r1(p[1])}`;
const poly = (pts: Point[]) => `M${pts.map(pt).join("L")}Z`;
const seg = (a: Point, b: Point) => `M${pt(a)}L${pt(b)}`;

/** Project a point at depth z (into the box; negative = toward the viewer). */
function proj(x: number, y: number, z: number): Point {
  const s = D / (D + z);
  return [VP[0] + (x - VP[0]) * s, VP[1] + (y - VP[1]) * s];
}

const { x0, x1, y0, y1 } = OPENING;

export const INTERIOR = (() => {
  const B = (x: number, y: number) => proj(x, y, DEPTH);
  const back = poly([B(x0, y0), B(x1, y0), B(x1, y1), B(x0, y1)]);
  const left = poly([[x0, y0], B(x0, y0), B(x0, y1), [x0, y1]]);
  const right = poly([[x1, y0], B(x1, y0), B(x1, y1), [x1, y1]]);
  const ceiling = poly([[x0, y0], [x1, y0], B(x1, y0), B(x0, y0)]);
  const floor = poly([[x0, y1], [x1, y1], B(x1, y1), B(x0, y1)]);
  let ridgesL = "";
  let ridgesR = "";
  let ridgesC = "";
  const N = 16;
  for (let k = 1; k < N; k++) {
    const z = (DEPTH * k) / N;
    ridgesL += seg(proj(x0, y0 + 4, z), proj(x0, y1 - 4, z));
    ridgesR += seg(proj(x1, y0 + 4, z), proj(x1, y1 - 4, z));
    if (k % 2 === 0) ridgesC += seg(proj(x0 + 3, y0, z), proj(x1 - 3, y0, z));
  }
  let planks = "";
  const P = 9;
  for (let i = 1; i < P; i++) {
    const x = x0 + ((x1 - x0) * i) / P;
    planks += seg([x, y1], proj(x, y1, DEPTH));
  }
  let joints = "";
  for (const f of [0.18, 0.42, 0.7]) joints += seg(proj(x0, y1, DEPTH * f), proj(x1, y1, DEPTH * f));
  // the door end's frame: the outer rectangle with the opening cut out (even-odd)
  const frame = `M${FRAME.x0} ${FRAME.y0}H${FRAME.x1}V${FRAME.y1}H${FRAME.x0}Z` + `M${x0} ${y0}V${y1}H${x1}V${y0}Z`;
  const c = 9;
  const castings = [
    [FRAME.x0, FRAME.y0],
    [FRAME.x1 - c, FRAME.y0],
    [FRAME.x0, FRAME.y1 - c],
    [FRAME.x1 - c, FRAME.y1 - c],
  ]
    .map(([x, y]) => `M${x} ${y}h${c}v${c}h${-c}Z`)
    .join("");
  const shadow = `M${FRAME.x0 - 18} ${FRAME.y1 + 1}H${FRAME.x1 + 18}L${FRAME.x1 + 6} ${FRAME.y1 + 11}H${FRAME.x0 - 6}Z`;
  let hinges = "";
  for (const v of [0.12, 0.38, 0.62, 0.88]) {
    const y = y0 + (y1 - y0) * v;
    hinges += `M${FRAME.x0 - 2} ${r1(y - 4)}h6v8h-6Z` + `M${FRAME.x1 - 4} ${r1(y - 4)}h6v8h-6Z`;
  }
  return { back, left, right, ceiling, floor, ridgesL, ridgesR, ridgesC, planks, joints, frame, castings, shadow, hinges };
})();

/** The floor strip just inside the doors where the crates stand, in percent of the drawing. */
export const CARGO = (() => {
  const z = DEPTH * 0.14;
  const a = proj(x0 + 10, y1, z);
  const b = proj(x1 - 10, y1, z);
  const top = proj(x0, y0 + 46, z);
  const fx = (x: number) => ((x - VIEW.x) / VIEW.w) * 100;
  const fy = (y: number) => ((y - VIEW.y) / VIEW.h) * 100;
  return {
    left: r1(fx(a[0])),
    right: r1(100 - fx(b[0])),
    bottom: r1(100 - fy(a[1])),
    top: r1(fy(top[1])),
  };
})();

export type DoorShapes = {
  leaf: string;
  ridges: string;
  bars: string;
  keepers: string;
  handles: string;
  seal: string;
  /** Past 90 degrees you see the door's inside face. */
  inner: boolean;
};

/** One door at theta (0 shut .. 1 open). */
export function doorShapes(side: "left" | "right", theta: number): DoorShapes {
  const hinge = side === "left" ? x0 : x1;
  const dir = side === "left" ? 1 : -1;
  const w = VP[0] - x0;
  const a = (Math.max(0, Math.min(1, theta)) * OPEN_DEG * Math.PI) / 180;
  const at = (u: number, v: number): Point => {
    const X = hinge + dir * u * w * Math.cos(a);
    const z = -u * w * Math.sin(a);
    return proj(X, y0 + v * (y1 - y0), z);
  };
  let ridges = "";
  for (let k = 1; k < 10; k++) ridges += seg(at(k / 10, 0.04), at(k / 10, 0.96));
  let bars = "";
  let keepers = "";
  let handles = "";
  for (const u of [0.3, 0.66]) {
    bars += seg(at(u, 0.015), at(u, 0.985));
    keepers += seg(at(u - 0.035, 0.03), at(u + 0.035, 0.03)) + seg(at(u - 0.035, 0.97), at(u + 0.035, 0.97));
    handles += seg(at(u, 0.56), at(u + 0.1, 0.56)) + seg(at(u + 0.1, 0.56), at(u + 0.1, 0.6));
  }
  return {
    leaf: poly([at(0, 0), at(1, 0), at(1, 1), at(0, 1)]),
    ridges,
    bars,
    keepers,
    handles,
    seal: seg(at(0.985, 0.01), at(0.985, 0.99)),
    inner: theta * OPEN_DEG > 90,
  };
}

// ---------------------------------------------------------------------------------------------
// the cargo: the stack as crates packed inside, in perspective
// ---------------------------------------------------------------------------------------------

export type CargoCrate = {
  /** The tech stencilled on it; null for the other goods packed behind. */
  label: string | null;
  front: string;
  top: string | null;
  side: string | null;
  /** The crate's slats (labelled crates) or its tape (cartons), on the front face. */
  marks: string;
  /** Label placement and size (projected). */
  text: { x: number; y: number; size: number } | null;
};

/** A seeded 0..1 sequence (mulberry32), so a project always packs the same way. */
function rng(seed: string): () => number {
  let a = 0;
  for (let i = 0; i < seed.length; i++) a = (Math.imul(a ^ seed.charCodeAt(i), 0x01000193) + 0x811c9dc5) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Block = { x0: number; x1: number; yTop: number; yBot: number; z0: number; z1: number; label: string | null };

function crateOf(b: Block): CargoCrate {
  const P = (x: number, y: number, z: number) => proj(x, y, z);
  const f = [P(b.x0, b.yTop, b.z0), P(b.x1, b.yTop, b.z0), P(b.x1, b.yBot, b.z0), P(b.x0, b.yBot, b.z0)];
  const top = b.yTop > VP[1] ? poly([P(b.x0, b.yTop, b.z0), P(b.x1, b.yTop, b.z0), P(b.x1, b.yTop, b.z1), P(b.x0, b.yTop, b.z1)]) : null;
  const side =
    b.x1 < VP[0]
      ? poly([P(b.x1, b.yTop, b.z0), P(b.x1, b.yTop, b.z1), P(b.x1, b.yBot, b.z1), P(b.x1, b.yBot, b.z0)])
      : b.x0 > VP[0]
        ? poly([P(b.x0, b.yTop, b.z0), P(b.x0, b.yTop, b.z1), P(b.x0, b.yBot, b.z1), P(b.x0, b.yBot, b.z0)])
        : null;
  const [a, c] = [f[0], f[2]];
  const w = c[0] - a[0];
  const h = c[1] - a[1];
  let marks = "";
  if (b.label) {
    // a wooden crate: a frame of slats round the stencil plate
    const i = Math.min(w, h) * 0.12;
    marks = `M${pt([a[0] + i, a[1] + i])}H${r1(c[0] - i)}V${r1(c[1] - i)}H${r1(a[0] + i)}Z`;
  } else {
    // a carton: the tape down its middle
    marks = `M${pt([a[0] + w / 2, a[1]])}V${r1(c[1])}`;
  }
  const s = D / (D + b.z0);
  return {
    label: b.label,
    front: poly(f),
    top,
    side,
    marks,
    text: b.label ? { x: r1(a[0] + w / 2), y: r1(a[1] + h / 2 + 4.4 * s), size: r1(12.5 * s) } : null,
  };
}

/**
 * Pack a stack into the box: the techs as stencilled crates in the front row (tiers of crates
 * sized to their names, centred, up to three high), and behind them two rows of other goods,
 * cartons up toward the ceiling, so the box reads as full. Back to front, outside in (painter's
 * order). Seeded by `seed`, so a project always packs the same way.
 */
export function packCargo(labels: readonly string[], seed: string): CargoCrate[] {
  const left = x0 + 6;
  const right = x1 - 6;
  const width = right - left;
  const floor = y1;
  const blocks: Block[] = [];
  const rand = rng(seed);

  // behind: rows of cartons, rising toward the ceiling
  const fill = (z0: number, z1: number, tiers: number, h: number) => {
    for (let t = 0; t < tiers; t++) {
      let x = left + rand() * 10;
      while (x < right - 24) {
        const w = Math.min(right - x, 52 + rand() * 46);
        const hh = h * (0.82 + rand() * 0.18);
        const yBot = floor - t * h;
        blocks.push({ x0: x, x1: x + w - 3, yTop: yBot - hh, yBot, z0, z1, label: null });
        x += w;
      }
    }
  };
  fill(DEPTH * 0.5, DEPTH * 0.62, 5, 52);
  fill(DEPTH * 0.24, DEPTH * 0.34, 3, 52);

  // the front row: the stack, a tier at a time
  const cH = 50;
  const zf = DEPTH * 0.06;
  const zb = zf + DEPTH * 0.1;
  const widths = labels.map((l) => Math.min(width, Math.max(66, l.length * 7.7 + 26)));
  const tiers: number[][] = [];
  let row: number[] = [];
  let used = 0;
  widths.forEach((w, i) => {
    if (row.length && used + w + 4 > width) {
      tiers.push(row);
      row = [];
      used = 0;
    }
    row.push(i);
    used += w + 4;
  });
  if (row.length) tiers.push(row);
  tiers.slice(0, 4).forEach((ids, t) => {
    const total = ids.reduce((sum, i) => sum + widths[i] + 4, -4);
    let x = VP[0] - total / 2;
    const yBot = floor - t * cH;
    for (const i of ids) {
      blocks.push({ x0: x, x1: x + widths[i], yTop: yBot - cH + 2, yBot, z0: zf, z1: zb, label: labels[i] });
      x += widths[i] + 4;
    }
  });

  // painter's order: far rows first; within a row lower tiers first, then outside in
  blocks.sort((a, b) => b.z0 - a.z0 || b.yBot - a.yBot || Math.abs((b.x0 + b.x1) / 2 - VP[0]) - Math.abs((a.x0 + a.x1) / 2 - VP[0]));
  return blocks.map(crateOf);
}
