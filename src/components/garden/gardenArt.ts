/**
 * THE GARDEN (pure geometry: no React, no DOM). One 1200 x 640 drawing: a sky over distant hills
 * and a tree line; on the lawn, the potting shed (tiled roof, plank walls, a window with a pot,
 * the name board, a water barrel, tools, terracotta pots), a picket fence with a gate and two
 * mynahs on it, the scarecrow, the plot of dark soil with seven furrows (Sunday at the back,
 * Saturday at the front) in perspective, the gravel path in front with stepping stones, the
 * wheelbarrow; the plants (one per day, by GitHub's level), the prize sunflower, a butterfly, the
 * gardener with his watering can.
 */
import type { Point } from "@/components/sketch/rough";

export const W = 1200;
export const H = 680;
export const WEEKS = 53;

export const f = (n: number) => Math.round(n * 10) / 10;
export const pt = (p: Point) => `${f(p[0])} ${f(p[1])}`;
export const rect = (x: number, y: number, w: number, h: number) =>
  `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
export const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
export const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
export const poly = (pts: Point[]) => `M${pts.map(pt).join("L")}Z`;

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

export function smooth(points: Point[], tension = 0.55): string {
  let d = `M${pt(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1: Point = [
      p1[0] + ((p2[0] - p0[0]) * tension) / 3,
      p1[1] + ((p2[1] - p0[1]) * tension) / 3,
    ];
    const c2: Point = [
      p2[0] - ((p3[0] - p1[0]) * tension) / 3,
      p2[1] - ((p3[1] - p1[1]) * tension) / 3,
    ];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}

/* ---- the field: seven furrows in perspective ---------------------------------------------- */
const CX = 650;
const COL = 19.8;
/** The furrow of weekday `r` (0 Sunday, at the back): its line and its scale (a deep perspective:
 *  the back furrow at 0.56, the front one at 1). */
export const rowY = (r: number) => 384 + 28 * r + 1.6 * r * r;
export const rowScale = (r: number) => 0.56 + (r * 0.44) / 6;
/** The furrow under the pointer at y (a plant stands up to ~60 units above its furrow). */
export function rowAt(y: number): number | null {
  for (let r = 6; r >= 0; r--)
    if (
      y <= rowY(r) + 12 * rowScale(r) &&
      y >= rowY(r) - 60 * rowScale(r) &&
      (r === 0 || y > rowY(r - 1) + 4)
    )
      return r;
  return null;
}
/** Where day (week `c`, weekday `r`) is planted. */
export const cellAt = (c: number, r: number): Point => [
  CX + (c - (WEEKS - 1) / 2) * COL * rowScale(r),
  rowY(r),
];
/** Inverse, for the pointer: the nearest week on furrow `r` at x. */
export const weekAt = (x: number, r: number) =>
  Math.round((x - CX) / (COL * rowScale(r)) + (WEEKS - 1) / 2);

export const PLOT = (() => {
  const back = rowY(0) - 22;
  const front = rowY(6) + 20;
  const [bl] = cellAt(-1.2, 0);
  const [br] = cellAt(WEEKS + 0.2, 0);
  const [fl] = cellAt(-1.6, 6);
  const [fr] = cellAt(WEEKS + 0.6, 6);
  const soil = `M${f(bl)} ${back}L${f(br)} ${back}L${f(fr)} ${front}L${f(fl)} ${front}Z`;
  // the furrows: a mound per weekday, and the shadow line in front of it
  let mounds = "";
  let shadows = "";
  for (let r = 0; r < 7; r++) {
    const s = rowScale(r);
    const [x0, y] = cellAt(-0.8, r);
    const [x1] = cellAt(WEEKS - 0.2, r);
    mounds += `M${f(x0)} ${f(y + 3 * s)}Q${f(x0)} ${f(y - 7 * s)} ${f(x0 + 10)} ${f(y - 7 * s)}H${f(x1 - 10)}Q${f(x1)} ${f(y - 7 * s)} ${f(x1)} ${f(y + 3 * s)}Z`;
    shadows += `M${f(x0 + 4)} ${f(y + 6 * s)}H${f(x1 - 4)}`;
  }
  // clods in the soil
  const r = rng(41);
  let clods = "";
  for (let k = 0; k < 140; k++) {
    const row = Math.floor(r() * 7);
    const [x, y] = cellAt(r() * WEEKS - 0.5, row);
    clods += ellipse(
      x,
      y + 12 * rowScale(row) + r() * 4,
      1.2 + r() * 1.6,
      0.8 + r() * 0.8,
    );
  }
  return {
    soil,
    mounds,
    shadows,
    clods,
    front,
    back,
    frontLeft: fl,
    frontRight: fr,
  };
})();

/* ---- the scenery -------------------------------------------------------------------------- */
export const SKY = (() => {
  const cloud = (x: number, y: number, s: number) =>
    circle(x, y, 12 * s) +
    circle(x + 15 * s, y - 7 * s, 15 * s) +
    circle(x + 33 * s, y, 11 * s) +
    rect(x - 3 * s, y, 44 * s, 8 * s);
  const clouds =
    cloud(300, 74, 1.1) +
    cloud(560, 48, 0.9) +
    cloud(860, 86, 1.2) +
    cloud(1080, 52, 0.8);
  const hills = `${smooth([
    [0, 206],
    [90, 186],
    [190, 200],
    [300, 168],
    [420, 194],
    [540, 176],
    [660, 198],
    [790, 162],
    [900, 188],
    [1010, 174],
    [1110, 196],
    [1200, 184],
  ])}L1200 300L0 300Z`;
  // the tree line behind the fence: round canopies and two coconut palms
  const r = rng(7);
  let canopies = "";
  for (let x = 200; x < 1220; x += 34 + r() * 26) {
    const h = 26 + r() * 22;
    canopies +=
      circle(x, 270 - h * 0.5, h * 0.55) +
      circle(x + h * 0.45, 274 - h * 0.35, h * 0.45);
  }
  const palms = [
    [742, 286, 92, 8],
    [1150, 286, 104, -10],
  ]
    .map(([x, base, h, lean]) => {
      const top: Point = [x + lean, base - h];
      const trunk = `M${x - 3} ${base}Q${f(x + lean * 0.3)} ${f(base - h * 0.5)} ${f(top[0] - 1.5)} ${f(top[1])}L${f(top[0] + 1.5)} ${f(top[1])}Q${f(x + lean * 0.3 + 4)} ${f(base - h * 0.5)} ${x + 3} ${base}Z`;
      const fronds = [
        [-30, 14],
        [-24, -6],
        [-8, -16],
        [12, -15],
        [26, -4],
        [32, 14],
      ]
        .map(
          ([dx, dy]) =>
            `M${pt(top)}Q${f(top[0] + dx * 0.55)} ${f(top[1] + dy - 10)} ${f(top[0] + dx)} ${f(top[1] + dy)}`,
        )
        .join("");
      return { trunk, fronds };
    })
    .reduce(
      (a, p) => ({ trunk: a.trunk + p.trunk, fronds: a.fronds + p.fronds }),
      { trunk: "", fronds: "" },
    );
  return { clouds, hills, canopies, palms };
})();

export const SHED = (() => {
  const body = rect(30, 168, 176, 134);
  let planks = "";
  for (let x = 46; x < 206; x += 16) planks += `M${x} 170V300`;
  const roof = poly([
    [16, 172],
    [220, 172],
    [190, 122],
    [46, 122],
  ]);
  const tiles =
    "M36 138H200M26 155H210M70 122L60 172M100 122L96 172M136 122L136 172M168 122L176 172";
  const door = rect(54, 206, 50, 96);
  const doorPlanks = "M66 208V300M79 208V300M92 208V300M56 248H102";
  const knob = circle(96, 256, 2.6);
  const window = rect(128, 206, 58, 44);
  const panes = "M157 206V250M128 228H186";
  const sill = rect(122, 250, 70, 6);
  const sillPot = poly([
    [146, 250],
    [168, 250],
    [165, 238],
    [149, 238],
  ]);
  const sillLeaves =
    "M157 238Q150 226 146 224M157 238Q158 222 160 218M157 238Q166 228 170 226";
  const board = rect(40, 144, 156, 22);
  const barrel = `M214 302V254Q214 248 220 248H252Q258 248 258 254V302Z`;
  const hoops = "M214 266H258M214 288H258";
  const tools = "M206 302L232 196M240 302L262 210";
  const rake =
    "M224 198L240 194M226 206L242 202M228 192V202M234 191V200M240 190V199";
  const spade = poly([
    [256, 214],
    [270, 208],
    [274, 226],
    [262, 232],
  ]);
  const pots = [
    poly([
      [12, 302],
      [36, 302],
      [33, 284],
      [15, 284],
    ]),
    poly([
      [228, 312],
      [256, 312],
      [253, 292],
      [231, 292],
    ]),
  ].join("");
  const potLeaves =
    "M24 284Q16 268 10 266M24 284Q24 264 28 258M24 284Q32 272 38 270M242 292Q234 278 228 276M242 292Q242 274 246 268M242 292Q252 282 258 282";
  return {
    body,
    planks,
    roof,
    tiles,
    door,
    doorPlanks,
    knob,
    window,
    panes,
    sill,
    sillPot,
    sillLeaves,
    board,
    boardText: [118, 159.5] as Point,
    barrel,
    hoops,
    tools,
    rake,
    spade,
    pots,
    potLeaves,
  };
})();

export const FENCE = (() => {
  let pickets = "";
  for (let x = 270; x < 1200; x += 17) {
    if (x > 960 && x < 1020) continue; // the gate
    pickets += `M${x} 304V272L${x + 5.5} 264L${x + 11} 272V304Z`;
  }
  const rails = "M262 280H962M1018 280H1200M262 296H962M1018 296H1200";
  const gate = `M964 304V268H1016V304Z M964 268L1016 304M964 286H1016`;
  const latch = rect(1006, 282, 8, 5);
  return { pickets, rails, gate, latch };
})();

/** A mynah on the fence: body, head, beak, eye patch (x, y = its feet). */
export const birdAt = (x: number, y: number, flip = false) => {
  const s = flip ? -1 : 1;
  const X = (dx: number) => f(x + dx * s);
  return {
    body: `M${X(-10)} ${f(y - 6)}C${X(-10)} ${f(y - 14)} ${X(-2)} ${f(y - 17)} ${X(5)} ${f(y - 15)}C${X(10)} ${f(y - 13)} ${X(10)} ${f(y - 5)} ${X(4)} ${f(y - 3)}C${X(-1)} ${f(y - 1)} ${X(-7)} ${f(y - 2)} ${X(-10)} ${f(y - 6)}Z M${X(-10)} ${f(y - 6)}L${X(-17)} ${f(y - 3)}L${X(-11)} ${f(y - 3)}Z`,
    head: circle(x + 7 * s, y - 18, 5),
    beak: `M${X(11)} ${f(y - 19)}L${X(16)} ${f(y - 17.5)}L${X(11)} ${f(y - 16.5)}Z`,
    eye: circle(x + 8 * s, y - 19, 1.6),
    wing: `M${X(-6)} ${f(y - 10)}Q${X(0)} ${f(y - 13)} ${X(4)} ${f(y - 8)}`,
    legs: `M${X(-1)} ${f(y - 3)}V${f(y)}M${X(3)} ${f(y - 3)}V${f(y)}`,
  };
};

export const SCARECROW = (() => {
  const x = 1150;
  const base = 470;
  return {
    pole: `M${x} ${base}V${base - 118}M${x - 46} ${base - 92}H${x + 46}`,
    shirt: poly([
      [x - 30, base - 98],
      [x + 30, base - 98],
      [x + 22, base - 50],
      [x - 22, base - 50],
    ]),
    sleeves:
      poly([
        [x - 30, base - 98],
        [x - 50, base - 96],
        [x - 50, base - 84],
        [x - 28, base - 82],
      ]) +
      poly([
        [x + 30, base - 98],
        [x + 50, base - 96],
        [x + 50, base - 84],
        [x + 28, base - 82],
      ]),
    patch: rect(x + 4, base - 80, 12, 10),
    straw: `M${x - 50} ${base - 90}l-8 -3M${x - 50} ${base - 88}l-8 2M${x + 50} ${base - 90}l8 -3M${x + 50} ${base - 88}l8 2M${x - 10} ${base - 50}l-3 9M${x} ${base - 50}v10M${x + 10} ${base - 50}l3 9`,
    head: circle(x, base - 112, 13),
    hat: `M${x - 26} ${base - 118}H${x + 26}M${x - 14} ${base - 118}V${base - 132}Q${x} ${base - 138} ${x + 14} ${base - 132}V${base - 118}`,
    face: `${circle(x - 5, base - 114, 1.6)}${circle(x + 5, base - 114, 1.6)}M${x - 5} ${base - 106}Q${x} ${base - 103} ${x + 5} ${base - 106}`,
  };
})();

export const PATH = (() => {
  const top = 640;
  const gravel = `M0 ${top}Q600 ${top - 6} 1200 ${top}V682Q600 688 0 682Z`;
  const r = rng(13);
  let stones = "";
  for (let k = 0; k < 120; k++)
    stones += circle(r() * 1200, top + 6 + r() * 34, 0.8 + r() * 1.2);
  return { gravel, stones, top, walk: 668 };
})();

export const WHEELBARROW = (() => {
  const x = 1084;
  const y = 668;
  return {
    tray: poly([
      [x, y - 30],
      [x + 66, y - 30],
      [x + 56, y - 12],
      [x + 10, y - 12],
    ]),
    soil: `M${x + 4} ${y - 30}Q${x + 33} ${y - 44} ${x + 62} ${y - 30}Z`,
    legs: `M${x + 16} ${y - 12}L${x + 12} ${y}M${x + 66} ${y - 30}L${x + 96} ${y - 40}M${x + 50} ${y - 12}L${x + 26} ${y - 9}`,
    wheel: circle(x + 22, y - 8, 9),
    hub: circle(x + 22, y - 8, 2.4),
  };
})();

/* ---- the plants (drawn up from their root at 0,0; y up is negative) ----------------------- */
/** GitHub's level (1..4), as a plant: a sprout, a seedling, a leafy bush, a plant in flower. */
export const PLANTS = {
  1: {
    leaf: "M0 0V-9M0 -9C-6 -14 -10 -11 -10 -8C-6 -7 -3 -8 0 -9ZM0 -9C6 -14 10 -11 10 -8C6 -7 3 -8 0 -9Z",
    dark: "",
    bloom: "",
    stem: "M0 0V-9",
  },
  2: {
    stem: "M0 0V-20",
    leaf: "M0 -8C-8 -10 -12 -6 -12 -3C-7 -3 -3 -5 0 -8ZM0 -14C8 -17 12 -13 12 -10C7 -9 3 -11 0 -14ZM0 -20C-5 -27 -9 -25 -9 -21C-5 -20 -2 -20 0 -20ZM0 -20C5 -27 9 -25 9 -21C5 -20 2 -20 0 -20Z",
    dark: "M0 -8C-8 -10 -12 -6 -12 -3C-7 -3 -3 -5 0 -8Z",
    bloom: "",
  },
  3: {
    stem: "M0 0V-14M0 -14L-7 -22M0 -14L7 -24M0 -10V-30",
    leaf: "M-2 -6C-14 -6 -18 -14 -16 -20C-9 -19 -4 -14 -2 -6ZM2 -8C14 -9 18 -17 16 -23C9 -22 4 -17 2 -8ZM-6 -20C-16 -24 -16 -32 -12 -36C-6 -32 -5 -26 -6 -20ZM6 -22C16 -27 16 -35 11 -38C6 -34 5 -28 6 -22ZM0 -28C-5 -36 -2 -42 1 -44C5 -38 4 -32 0 -28Z",
    dark: "M2 -8C14 -9 18 -17 16 -23C9 -22 4 -17 2 -8ZM-6 -20C-16 -24 -16 -32 -12 -36C-6 -32 -5 -26 -6 -20Z",
    bloom: circle(-12, -36, 2.6) + circle(11, -38, 2.4),
  },
  4: {
    stem: "M0 0C-1 -14 1 -30 0 -46M0 -18L-9 -28M0 -26L9 -36",
    leaf: "M0 -6C-12 -6 -17 -13 -16 -19C-9 -18 -4 -13 0 -6ZM0 -10C12 -11 17 -18 15 -24C8 -23 4 -18 0 -10ZM-9 -28C-19 -30 -21 -38 -18 -42C-12 -39 -10 -33 -9 -28ZM9 -36C19 -39 21 -46 17 -50C12 -47 10 -41 9 -36Z",
    dark: "M0 -10C12 -11 17 -18 15 -24C8 -23 4 -18 0 -10ZM-9 -28C-19 -30 -21 -38 -18 -42C-12 -39 -10 -33 -9 -28Z",
    bloom: [0, 60, 120, 180, 240, 300]
      .map((a) => {
        const r0 = (a * Math.PI) / 180;
        return ellipse(Math.cos(r0) * 5.5, -50 + Math.sin(r0) * 5.5, 4.2, 4.2);
      })
      .join(""),
  },
} as const;
/** The flower's centre on a level-4 plant. */
export const BLOOM_HEART = circle(0, -50, 3.2);

/** The prize sunflower (the busiest day): a tall stem, broad leaves, a big head. */
export const SUNFLOWER = (() => {
  const top = -96;
  let petals = "";
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    const cx = Math.cos(a) * 15;
    const cy = top + Math.sin(a) * 15;
    const tx = Math.cos(a) * 24;
    const ty = top + Math.sin(a) * 24;
    const nx = -Math.sin(a) * 4;
    const ny = Math.cos(a) * 4;
    petals += `M${f(cx + nx)} ${f(cy + ny)}Q${f(tx + nx)} ${f(ty + ny)} ${f(tx)} ${f(ty)}Q${f(tx - nx)} ${f(ty - ny)} ${f(cx - nx)} ${f(cy - ny)}Z`;
  }
  let seeds = "";
  const r = rng(3);
  for (let k = 0; k < 22; k++) {
    const a = r() * Math.PI * 2;
    const d = r() * 9;
    seeds += circle(Math.cos(a) * d, top + Math.sin(a) * d, 0.9);
  }
  return {
    stem: `M0 0C-3 -30 3 -60 0 ${top + 10}`,
    leaves:
      "M-1 -26C-20 -26 -28 -38 -26 -48C-14 -46 -6 -38 -1 -26ZM1 -48C20 -50 28 -62 25 -72C13 -70 5 -61 1 -48Z",
    dark: "M1 -48C20 -50 28 -62 25 -72C13 -70 5 -61 1 -48Z",
    veins: "M-1 -26L-20 -42M1 -48L20 -66",
    petals,
    head: circle(0, top, 12),
    seeds,
    stake: "M14 4V-70",
    tie: "M10 -40L18 -42M10 -60L18 -62",
  };
})();
/** The prize rosette tied to the sunflower's stake. */
export const ROSETTE = (() => {
  let d = "";
  const c: Point = [14, -76];
  for (let k = 0; k <= 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const r0 = k % 2 ? 7 : 9.5;
    d += `${k ? "L" : "M"}${f(c[0] + Math.cos(a) * r0)} ${f(c[1] + Math.sin(a) * r0)}`;
  }
  return {
    star: `${d}Z`,
    ribbons: `M10 -70L6 -56L11 -59L13 -54L14 -69ZM18 -70L22 -56L17 -59L15 -54L14 -69Z`,
    heart: circle(c[0], c[1], 4.4),
    c,
  };
})();

/** A butterfly (centre at 0,0). */
export const BUTTERFLY = {
  wings:
    "M0 0C-6 -10 -14 -9 -13 -2C-12 3 -5 3 0 0ZM0 0C6 -10 14 -9 13 -2C12 3 5 3 0 0ZM0 1C-4 6 -9 8 -9 4C-8 1 -4 1 0 1ZM0 1C4 6 9 8 9 4C8 1 4 1 0 1Z",
  body: "M0 -4V4M0 -4L-3 -9M0 -4L3 -9",
};

/** A plant tag stuck in the soil (row labels): a white tag on a stake, its text drawn by the component. */
export const tagAt = (x: number, y: number) => ({
  tag: `M${x - 13} ${y - 26}H${x + 13}V${y - 12}L${x} ${y - 6}L${x - 13} ${y - 12}Z`,
  stake: `M${x} ${y - 8}V${y + 4}`,
});

/* ---- the gardener (origin: between his feet; he faces right) ------------------------------ */
export const GARDENER = {
  /** a leg from the hip (0,-38): `a` is its swing in degrees */
  leg: "M-4 -38L-5 -4L4 -4L4 -38Z",
  boot: "M-6 -6H6Q10 -6 10 -2V0H-6Z",
  shirt: "M-11 -66Q-12 -50 -9 -36H10Q12 -50 10 -66Q0 -70 -11 -66Z",
  backArm: "M-8 -62Q-16 -50 -12 -40",
  frontArm: "M6 -62Q14 -54 20 -48",
  hand: circle(21, -47, 3),
  neck: rect(-3, -72, 6, 6),
  head: circle(0, -79, 8),
  hatBrim: "M-17 -84Q0 -90 17 -84Q0 -80 -17 -84Z",
  hatCrown: "M-9 -86Q-8 -98 0 -98Q8 -98 9 -86Z",
  hatBand: "M-9 -88Q0 -91 9 -88",
  /** the watering can, in his hand (its rose at the spout's end) */
  can: "M16 -50H40V-30Q40 -27 37 -27H19Q16 -27 16 -30Z",
  canHandle: "M18 -50Q28 -64 38 -50",
  spout: "M40 -36L60 -52",
  rose: "M57 -55L63 -49L66 -53L60 -58Z",
  /** where the water leaves the rose */
  water: [64, -50] as Point,
};

/* ---- the seed packets' plants, by language ---------------------------------------------- */
export type Species =
  "cornflower" | "marigold" | "tomato" | "lavender" | "fern" | "sprout";
export function speciesOf(language: string | null): Species {
  switch (language) {
    case "TypeScript":
      return "cornflower";
    case "JavaScript":
      return "marigold";
    case "HTML":
      return "tomato";
    case "CSS":
      return "lavender";
    case "Jupyter Notebook":
    case "Python":
      return "fern";
    default:
      return "sprout";
  }
}
export const SPECIES_NAME: Record<Species, string> = {
  cornflower: "Cornflower",
  marigold: "Marigold",
  tomato: "Tomato",
  lavender: "Lavender",
  fern: "Fern",
  sprout: "Seedling",
};
