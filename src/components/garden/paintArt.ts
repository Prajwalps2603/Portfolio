/**
 * THE GARDEN, PAINTED (pure geometry: no React, no DOM). The same 1200 x 680 garden and the same
 * furrows as ./gardenArt (so the data, the pointer and the tags agree), drawn as a painted
 * background: a golden-afternoon sky with towering cumulus, the Western Ghats in haze, a forest
 * line with coconut palms, a mango tree framing the top left, a bamboo fence with flowering vines,
 * a weathered plank shed with a terracotta roof, a lawn of grass blades, the plot of ridged soil, a
 * flagstone path, blurred grass close to the eye; plants built from shaded leaves (seedlings, chili
 * plants, marigolds, the prize sunflower); the traveling sprinkler that waters the season.
 *
 * Its colours are its own (PAINT): the one place on the site that is painted rather than inked, at
 * Prajwal's request ("it should look like a real garden, not like a cartoon ... like anime").
 */
import type { Point } from "@/components/sketch/rough";
import {
  W,
  H,
  WEEKS,
  cellAt,
  circle,
  ellipse,
  f,
  poly,
  pt,
  rect,
  rng,
  rowScale,
  rowY,
  smooth,
} from "./gardenArt";

export const PAINT = {
  skyTop: "#2a62c8",
  skyMid: "#6ea6e6",
  skyLow: "#bad7f1",
  skyHaze: "#f7e8c6",
  sun: "#fffbea",
  sunGlow: "#ffe9a8",
  cloudTop: "#ffffff",
  cloudMid: "#f1f4fb",
  cloudShade: "#a9badb",
  ridgeFar: "#9fb3d2",
  ridgeFarLow: "#c9d6e7",
  hill: "#6f9178",
  hillLow: "#9fba98",
  forestLit: "#7fae3f",
  forest: "#3f6f2b",
  forestDeep: "#244a1c",
  canopyDeep: "#1d3f17",
  canopy: "#35672a",
  canopyLit: "#6fa43a",
  lawnFar: "#a6c766",
  lawnNear: "#5f9230",
  blade: "#4c7f27",
  bladeLit: "#9ccc55",
  bladeDeep: "#36621d",
  soilTop: "#6c462b",
  soilLow: "#3b2416",
  ridgeLit: "#8d613f",
  ridge: "#5c3b23",
  trough: "#28160c",
  pebble: "#b39579",
  plank: "#9c7752",
  plankDark: "#6b4e34",
  plankLine: "#4f3824",
  roof: "#c4613a",
  roofDark: "#8a3a21",
  roofLine: "#6e2b17",
  window: "#ffe2a3",
  windowFrame: "#5a4330",
  bamboo: "#d8bb80",
  bambooDark: "#9b7642",
  vine: "#3d7a2a",
  flowerPink: "#ee7aa8",
  flowerBlue: "#5b7fe0",
  drum: "#2f6db8",
  drumDark: "#1f4d85",
  terracotta: "#c0643a",
  terracottaDark: "#8f4325",
  stone: "#cdc3b0",
  stoneDark: "#968b78",
  moss: "#6c9a3a",
  leafLit: "#c6ea7c",
  leaf: "#6aa83a",
  leafDark: "#2f6a22",
  stem: "#4c7d2c",
  chili: "#d92d1f",
  chiliLit: "#ff7a5c",
  marigold: "#ffb21c",
  marigoldDeep: "#e8730a",
  marigoldEdge: "#b85000",
  petal: "#ffd84a",
  petalDeep: "#f19a0c",
  seedHead: "#5a3415",
  seedHeadLow: "#2e1a0a",
  shadow: "#1b1209",
  iron: "#2f7a3b",
  ironLit: "#5fb06a",
  ironDark: "#1d4d25",
  hose: "#3f8f3d",
  water: "#cfe9ff",
  spark: "#ffffff",
  butterfly: "#f08a1c",
  butterflyVein: "#2a1a10",
  pollen: "#fff3c4",
  warm: "#ffcf86",
  vignette: "#14200d",
};

/* ---- sky -------------------------------------------------------------------------------- */
/** A cumulus: puffs along a dome over a flat base; `lit` is the same mass nudged toward the sun. */
function cumulus(
  cx: number,
  cy: number,
  w: number,
  h: number,
  seed: number,
  toSun: Point,
) {
  const r = rng(seed);
  let body = "";
  let lit = "";
  let shade = "";
  const n = Math.round(w / 26);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = cx - w / 2 + t * w;
    const dome = Math.sin(Math.PI * t);
    const rad = (h * 0.32 + dome * h * 0.38) * (0.8 + r() * 0.4);
    const y = cy - dome * h * 0.55 + r() * 8;
    body += circle(x, y, rad);
    lit += circle(
      x + toSun[0] * rad * 0.18,
      y + toSun[1] * rad * 0.18 - rad * 0.08,
      rad * 0.78,
    );
    if (dome < 0.7) shade += circle(x, y + rad * 0.35, rad * 0.7);
    // a second tier of puffs on the tall middle
    if (dome > 0.6 && r() > 0.35) {
      const r2 = rad * (0.6 + r() * 0.3);
      body += circle(x + (r() - 0.5) * 20, y - rad * 0.7, r2);
      lit += circle(
        x + (r() - 0.5) * 20 + toSun[0] * 5,
        y - rad * 0.75,
        r2 * 0.75,
      );
    }
  }
  body += rect(cx - w / 2, cy - h * 0.2, w, h * 0.32);
  shade += rect(cx - w / 2 + 10, cy - 4, w - 20, h * 0.18);
  return { body, lit, shade };
}

export const SKYP = (() => {
  const big = cumulus(300, 210, 420, 190, 5, [0.8, -0.5]);
  const mid = cumulus(760, 238, 300, 120, 9, [0.6, -0.6]);
  const small = cumulus(1100, 196, 150, 60, 21, [-0.4, -0.6]);
  const wisps =
    ellipse(560, 96, 90, 9) +
    ellipse(640, 108, 60, 6) +
    ellipse(880, 72, 110, 8) +
    ellipse(150, 70, 70, 6);
  // light rays from the sun (its centre is the origin), falling down and to the left
  const rays = [116, 127, 139, 151, 164]
    .map((deg) => {
      const a = (deg * Math.PI) / 180;
      const b = ((deg + 3) * Math.PI) / 180;
      return poly([
        [0, 0],
        [Math.cos(a) * 900, Math.sin(a) * 900],
        [Math.cos(b) * 900, Math.sin(b) * 900],
      ]);
    })
    .join("");
  const birds = [
    [540, 132, 1],
    [566, 122, 0.8],
    [588, 138, 0.7],
  ]
    .map(
      ([x, y, s]) =>
        `M${x - 8 * s} ${y - 2 * s}Q${x - 4 * s} ${y - 6 * s} ${x} ${y}Q${x + 4 * s} ${y - 6 * s} ${x + 8 * s} ${y - 2 * s}`,
    )
    .join("");
  return { big, mid, small, wisps, rays, birds };
})();

/* ---- the land behind the garden --------------------------------------------------------- */
export const LAND = (() => {
  const ghats = `${smooth([
    [-20, 262],
    [80, 236],
    [170, 250],
    [270, 214],
    [380, 244],
    [470, 222],
    [560, 246],
    [690, 206],
    [790, 236],
    [880, 222],
    [990, 248],
    [1090, 226],
    [1220, 244],
  ])}L1220 360L-20 360Z`;
  const hills = `${smooth([
    [-20, 300],
    [120, 286],
    [260, 298],
    [400, 280],
    [560, 296],
    [720, 284],
    [880, 298],
    [1040, 282],
    [1220, 296],
  ])}L1220 360L-20 360Z`;
  // the forest line: clusters of round crowns, lit on the sun's side
  const r = rng(33);
  let deep = "";
  let body = "";
  let litC = "";
  for (let x = 250; x < 1230; x += 26 + r() * 20) {
    const base = 340 + r() * 6;
    const h = 22 + r() * 26;
    for (let k = 0; k < 4; k++) {
      const cx = x + (r() - 0.5) * 30;
      const cy = base - h * (0.4 + r() * 0.6);
      const rad = 11 + r() * 13;
      deep += circle(cx, cy + rad * 0.3, rad);
      body += circle(cx, cy, rad * 0.92);
      litC += circle(cx + rad * 0.25, cy - rad * 0.3, rad * 0.55);
    }
  }
  // coconut palms over the forest
  const palm = (x: number, base: number, h: number, lean: number) => {
    const top: Point = [x + lean, base - h];
    const trunk = `M${x - 4} ${base}Q${f(x + lean * 0.4)} ${f(base - h * 0.5)} ${f(top[0] - 2)} ${f(top[1])}L${f(top[0] + 2)} ${f(top[1])}Q${f(x + lean * 0.4 + 5)} ${f(base - h * 0.5)} ${x + 4} ${base}Z`;
    let fronds = "";
    let leaflets = "";
    for (const [dx, dy] of [
      [-46, 22],
      [-38, -6],
      [-14, -24],
      [16, -24],
      [40, -6],
      [48, 22],
      [-26, 34],
      [28, 34],
    ]) {
      const end: Point = [top[0] + dx, top[1] + dy];
      const ctrl: Point = [top[0] + dx * 0.5, top[1] + dy - 16];
      fronds += `M${pt(top)}Q${pt(ctrl)} ${pt(end)}`;
      for (let k = 1; k < 9; k++) {
        const t = k / 9;
        const px =
          (1 - t) * (1 - t) * top[0] +
          2 * (1 - t) * t * ctrl[0] +
          t * t * end[0];
        const py =
          (1 - t) * (1 - t) * top[1] +
          2 * (1 - t) * t * ctrl[1] +
          t * t * end[1];
        const len = 12 * (1 - t * 0.5);
        leaflets += `M${f(px)} ${f(py)}l${f(-len * 0.3)} ${f(len)}M${f(px)} ${f(py)}l${f(len * 0.4)} ${f(len * 0.9)}`;
      }
    }
    return { trunk, fronds, leaflets };
  };
  const palms = [
    palm(820, 336, 150, 14),
    palm(1120, 338, 176, -18),
    palm(560, 338, 120, 8),
  ];
  return {
    ghats,
    hills,
    forestDeep: deep,
    forest: body,
    forestLit: litC,
    palms,
  };
})();

/** The mango tree in the top left corner: three tones of leaf masses and a fringe of leaves. */
export const MANGO = (() => {
  const r = rng(71);
  let deep = "";
  let mid = "";
  let lit = "";
  let leaves = "";
  for (let k = 0; k < 46; k++) {
    const a = r() * Math.PI * 0.5;
    const d = 40 + r() * 260;
    const x = -40 + Math.cos(a) * d * 1.1;
    const y = -60 + Math.sin(a) * d * 0.62;
    const rad = 26 + r() * 30;
    deep += circle(x, y + 8, rad);
    mid += circle(x - 4, y, rad * 0.85);
    if (r() > 0.4) lit += circle(x + rad * 0.3, y - rad * 0.25, rad * 0.45);
  }
  // pointed leaves along the canopy's edge
  for (let k = 0; k < 70; k++) {
    const a = (k / 70) * Math.PI * 0.55;
    const d = 270 + r() * 60;
    const x = -40 + Math.cos(a) * d * 1.1;
    const y = -60 + Math.sin(a) * d * 0.62;
    leaves += leafPath(x, y, 18 + r() * 10, 6 + r() * 3, a + (r() - 0.5) * 1.2);
  }
  const trunk = "M-10 680L-10 300Q20 240 60 170L80 178Q46 250 34 320L40 680Z";
  const branch = "M50 200Q110 150 170 130L174 138Q118 160 62 214Z";
  // the dappled light under it
  let dapples = "";
  for (let k = 0; k < 16; k++)
    dapples += ellipse(
      30 + r() * 300,
      400 + r() * 230,
      6 + r() * 14,
      2 + r() * 4,
    );
  return { deep, mid, lit, leaves, trunk, branch, dapples };
})();

/** A pointed leaf from its base (x, y), `len` long and `w` wide, turned by `ang` (radians). */
export function leafPath(
  x: number,
  y: number,
  len: number,
  w: number,
  ang: number,
): string {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const P = (u: number, v: number): string =>
    `${f(x + u * c - v * s)} ${f(y + u * s + v * c)}`;
  return `M${P(0, 0)}Q${P(len * 0.45, -w)} ${P(len, 0)}Q${P(len * 0.45, w)} ${P(0, 0)}Z`;
}
/** Its midrib. */
export function ribPath(
  x: number,
  y: number,
  len: number,
  ang: number,
): string {
  return `M${f(x)} ${f(y)}L${f(x + Math.cos(ang) * len * 0.85)} ${f(y + Math.sin(ang) * len * 0.85)}`;
}

/* ---- the fence, the shed ---------------------------------------------------------------- */
export const BAMBOO = (() => {
  let poles = "";
  let nodes = "";
  for (let x = 296; x < 1210; x += 12) {
    const top = 296 + ((x * 7) % 9);
    poles += `M${x} 364V${top + 3}Q${x} ${top} ${x + 3} ${top}H${x + 6}Q${x + 9} ${top} ${x + 9} ${top + 3}V364Z`;
    nodes += `M${x} ${top + 18}h9M${x} ${top + 40}h9`;
  }
  const rails = rect(290, 314, 920, 5) + rect(290, 344, 920, 5);
  // a creeper along it: leaves on a wave, and its flowers
  const r = rng(91);
  let vine = "";
  let vineLeaves = "";
  let pink = "";
  let blue = "";
  let y0 = 316;
  vine += `M296 ${y0}`;
  for (let x = 296; x < 1210; x += 30) {
    const y = 310 + Math.sin(x / 45) * 10 + r() * 6;
    vine += `Q${x + 15} ${f(y - 14)} ${x + 30} ${f(y)}`;
    y0 = y;
    for (let k = 0; k < 3; k++)
      vineLeaves += leafPath(
        x + r() * 30,
        y + (r() - 0.5) * 16,
        9 + r() * 5,
        3.6,
        r() * Math.PI * 2,
      );
    if (r() > 0.55) {
      const fx = x + r() * 30;
      const fy = y + (r() - 0.5) * 14;
      let fl = "";
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        fl += circle(fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6, 2.4);
      }
      if (r() > 0.5) pink += fl;
      else blue += fl;
    }
  }
  return { poles, nodes, rails, vine, vineLeaves, pink, blue };
})();

export const SHEDP = (() => {
  const x0 = 54;
  const x1 = 286;
  const top = 236;
  const base = 384;
  let planks = "";
  for (let x = x0 + 14; x < x1; x += 14) planks += `M${x} ${top + 4}V${base}`;
  // knots and weathering
  const r = rng(53);
  let grain = "";
  for (let k = 0; k < 40; k++) {
    const x = x0 + 4 + r() * (x1 - x0 - 8);
    const y = top + 10 + r() * (base - top - 20);
    grain += `M${f(x)} ${f(y)}q${f(2 + r() * 2)} ${f(6 + r() * 6)} 0 ${f(14 + r() * 8)}`;
  }
  const body = rect(x0, top, x1 - x0, base - top);
  const roof = poly([
    [x0 - 26, top + 8],
    [x1 + 26, top + 8],
    [x1 - 8, top - 62],
    [x0 + 8, top - 62],
  ]);
  let tiles = "";
  for (let row = 0; row < 5; row++) {
    const y = top - 56 + row * 14;
    const lx = x0 + 8 - (row / 5) * 34;
    const rx = x1 - 8 + (row / 5) * 34;
    for (let x = lx; x < rx; x += 14)
      tiles += `M${f(x)} ${f(y + 13)}q7 -6 14 0`;
  }
  const eave = rect(x0, top, x1 - x0, 12);
  const door = rect(80, 280, 66, base - 280);
  const doorPlanks = "M96 282V384M112 282V384M128 282V384";
  const hinges = rect(80, 296, 26, 4) + rect(80, 356, 26, 4);
  const knob = circle(138, 334, 3);
  const window = rect(176, 284, 78, 56);
  const panes = "M215 284V340M176 312H254";
  const sill = rect(170, 340, 90, 7);
  const board = rect(96, 248, 158, 22);
  const drum = "M298 384V320Q298 312 306 312H346Q354 312 354 320V384Z";
  const drumRibs = "M298 334H354M298 362H354";
  const drumLid = ellipse(326, 313, 28, 5);
  const pots =
    poly([
      [22, 392],
      [56, 392],
      [51, 366],
      [27, 366],
    ]) +
    poly([
      [360, 398],
      [396, 398],
      [391, 370],
      [365, 370],
    ]);
  const potRims = rect(24, 362, 30, 6) + rect(362, 366, 32, 6);
  let potLeaves = "";
  for (const [cx, cy] of [
    [39, 364],
    [378, 368],
  ]) {
    for (let k = 0; k < 9; k++)
      potLeaves += leafPath(
        cx,
        cy,
        20 + (k % 3) * 6,
        6,
        -Math.PI * (0.15 + (k / 9) * 0.7),
      );
  }
  // a creeper up the shed's corner
  let creeper = "";
  for (let k = 0; k < 18; k++)
    creeper += leafPath(
      282 + (r() - 0.5) * 12,
      250 + k * 7.5,
      11 + r() * 5,
      4.5,
      Math.PI * (r() > 0.5 ? 0.15 : 0.85) + (r() - 0.5),
    );
  const shadow = poly([
    [x0, base],
    [x1, base],
    [x1 - 120, base + 30],
    [x0 - 160, base + 30],
  ]);
  const can = {
    body: "M402 404H438V430Q438 436 432 436H408Q402 436 402 430Z",
    spout: "M438 422L466 404L470 408L442 428Z",
    rose: ellipse(468, 405, 4, 6),
    handle: "M406 404Q420 386 434 404",
  };
  return {
    body,
    planks,
    grain,
    roof,
    tiles,
    eave,
    door,
    doorPlanks,
    hinges,
    knob,
    window,
    panes,
    sill,
    board,
    boardText: [175, 263.5] as Point,
    drum,
    drumRibs,
    drumLid,
    pots,
    potRims,
    potLeaves,
    creeper,
    shadow,
    can,
  };
})();

/* ---- the lawn, the plot, the path ------------------------------------------------------- */
export const GROUND = (() => {
  const lawn = `M0 330H${W}V${H}H0Z`;
  // grass blades, bigger toward the eye, kept off the plot
  const r = rng(17);
  const tones = ["", "", ""];
  const inPlot = (x: number, y: number) => {
    if (y < rowY(0) - 26 || y > rowY(6) + 24) return false;
    const t = (y - (rowY(0) - 26)) / (rowY(6) + 24 - (rowY(0) - 26));
    const [l0] = cellAt(-1.6, 0);
    const [l1] = cellAt(-2.2, 6);
    const [r0] = cellAt(WEEKS + 0.6, 0);
    const [r1] = cellAt(WEEKS + 1.2, 6);
    return x > l0 + (l1 - l0) * t && x < r0 + (r1 - r0) * t;
  };
  for (let k = 0; k < 1500; k++) {
    const y = 332 + Math.pow(r(), 0.7) * (H - 332);
    const x = r() * W;
    if (inPlot(x, y) || (y > 636 && y < 684)) continue;
    const s = 0.35 + ((y - 330) / (H - 330)) * 1.1;
    const h = (5 + r() * 7) * s;
    const lean = (r() - 0.5) * 5 * s;
    tones[Math.floor(r() * 3)] +=
      `M${f(x - 1.2 * s)} ${f(y)}Q${f(x + lean * 0.3)} ${f(y - h * 0.6)} ${f(x + lean)} ${f(y - h)}Q${f(x + lean * 0.3 + 0.6)} ${f(y - h * 0.5)} ${f(x + 1.2 * s)} ${f(y)}Z`;
  }
  // the plot: soil with rounded corners, its wooden edge in front
  const back = rowY(0) - 24;
  const front = rowY(6) + 22;
  const [bl] = cellAt(-1.4, 0);
  const [br] = cellAt(WEEKS + 0.4, 0);
  const [fl] = cellAt(-2, 6);
  const [fr] = cellAt(WEEKS + 1, 6);
  const soil = `M${f(bl + 8)} ${back}L${f(br - 8)} ${back}Q${f(br)} ${back} ${f(br + 3)} ${back + 8}L${f(fr)} ${front - 6}Q${f(fr + 2)} ${front} ${f(fr - 8)} ${front}L${f(fl + 8)} ${front}Q${f(fl - 2)} ${front} ${f(fl)} ${front - 6}L${f(bl - 3)} ${back + 8}Q${f(bl)} ${back} ${f(bl + 8)} ${back}Z`;
  const edge = `M${f(fl - 4)} ${front - 2}H${f(fr + 4)}V${front + 12}H${f(fl - 4)}Z`;
  let edgeLines = "";
  for (let x = fl; x < fr; x += 90)
    edgeLines += `M${f(x)} ${front - 2}V${front + 12}`;
  // furrows: a lit ridge, its shadow, a trough behind
  let ridges = "";
  let ridgeLit = "";
  let troughs = "";
  for (let rr = 0; rr < 7; rr++) {
    const s = rowScale(rr);
    const [x0, y] = cellAt(-0.9, rr);
    const [x1] = cellAt(WEEKS - 0.1, rr);
    ridges += `M${f(x0)} ${f(y + 5 * s)}Q${f(x0 + 3)} ${f(y - 11 * s)} ${f(x0 + 18 * s)} ${f(y - 11 * s)}H${f(x1 - 18 * s)}Q${f(x1 - 3)} ${f(y - 11 * s)} ${f(x1)} ${f(y + 5 * s)}Z`;
    ridgeLit += `M${f(x0 + 10)} ${f(y - 10 * s)}H${f(x1 - 10)}`;
    troughs += `M${f(x0)} ${f(y + 9 * s)}H${f(x1)}`;
  }
  // pebbles and clods
  let pebbles = "";
  for (let k = 0; k < 220; k++) {
    const row = Math.floor(r() * 7);
    const s = rowScale(row);
    const [x, y] = cellAt(r() * WEEKS - 0.5, row);
    pebbles += ellipse(
      x,
      y + 12 * s + r() * 6 * s,
      (1 + r() * 1.6) * s,
      (0.7 + r() * 0.7) * s,
    );
  }
  // flagstones
  let stones = "";
  let gaps = "";
  for (let x = -20; x < W + 20;) {
    const w = 60 + r() * 50;
    const y0 = 646 + r() * 4;
    const y1 = 678 + r() * 4;
    stones += poly([
      [x + 4 + r() * 6, y0],
      [x + w - 4 - r() * 6, y0 + r() * 3],
      [x + w - r() * 4, y1 - 4],
      [x + w - 10, y1],
      [x + 8, y1 - r() * 3],
      [x, y0 + 10],
    ]);
    gaps += `M${f(x + w - 2)} ${f(y0 + 2)}Q${f(x + w + 3)} ${f((y0 + y1) / 2)} ${f(x + w - 6)} ${f(y1)}`;
    x += w + 4;
  }
  return {
    lawn,
    blades: tones,
    soil,
    edge,
    edgeLines,
    ridges,
    ridgeLit,
    troughs,
    pebbles,
    stones,
    gaps,
    back,
    front,
  };
})();

/** Blurred grass close to the eye, at the bottom corners. */
export const NEAR_GRASS = (() => {
  const r = rng(101);
  let d = "";
  for (const [x0, x1] of [
    [-30, 230],
    [960, 1230],
  ]) {
    for (let k = 0; k < 22; k++) {
      const x = x0 + r() * (x1 - x0);
      const h = 50 + r() * 70;
      const lean = (r() - 0.5) * 50;
      d += `M${f(x - 7)} ${H + 6}Q${f(x + lean * 0.3)} ${f(H - h * 0.6)} ${f(x + lean)} ${f(H - h)}Q${f(x + lean * 0.3 + 3)} ${f(H - h * 0.5)} ${f(x + 7)} ${H + 6}Z`;
    }
  }
  return d;
})();

/* ---- the plants (root at 0,0; y up is negative) ----------------------------------------- */
export type PaintedPlant = {
  leaves: string[];
  dark: string[];
  ribs: string;
  stem: string;
  fruit?: string;
  fruitLit?: string;
  flowers?: { x: number; y: number; r: number }[];
  height: number;
};

export function paintedPlant(level: number, seed: number): PaintedPlant {
  const r = rng(seed);
  const leaves: string[] = [];
  const dark: string[] = [];
  let ribs = "";
  if (level <= 1) {
    const L = (a: number, len: number) => {
      leaves.push(leafPath(0, -10, len, len * 0.42, a));
      ribs += ribPath(0, -10, len, a);
    };
    L(-Math.PI * 0.86, 10);
    L(-Math.PI * 0.14, 10);
    return { leaves, dark, ribs, stem: "M0 0Q1 -5 0 -10", height: 16 };
  }
  if (level === 2) {
    const stem = "M0 0Q-1 -12 0 -24";
    for (let k = 0; k < 6; k++) {
      const y = -6 - k * 3.6;
      const side = k % 2 ? 1 : -1;
      const a =
        side > 0
          ? -Math.PI * (0.12 + r() * 0.12)
          : -Math.PI * (0.88 - r() * 0.12);
      const len = 12 - k * 0.9;
      (k < 2 ? dark : leaves).push(leafPath(0, y, len, len * 0.38, a));
      ribs += ribPath(0, y, len, a);
    }
    return { leaves, dark, ribs, stem, height: 30 };
  }
  if (level === 3) {
    // a chili plant: a bushy crown of leaves and red chilies hanging
    const stem = "M0 0Q-2 -16 0 -30M0 -14Q-8 -20 -14 -30M0 -18Q9 -24 15 -34";
    for (let k = 0; k < 16; k++) {
      const a = -Math.PI * (0.05 + r() * 0.9);
      const cy = -12 - r() * 26;
      const cx = (r() - 0.5) * 22;
      const len = 11 + r() * 6;
      (cy > -22 ? dark : leaves).push(leafPath(cx, cy, len, len * 0.36, a));
      ribs += ribPath(cx, cy, len, a);
    }
    let fruit = "";
    let fruitLit = "";
    for (let k = 0; k < 4; k++) {
      const x = (r() - 0.5) * 22;
      const y = -18 - r() * 12;
      const tilt = (r() - 0.5) * 0.8;
      fruit += `M${f(x)} ${f(y)}Q${f(x + 3 + tilt * 4)} ${f(y + 6)} ${f(x + 1 + tilt * 8)} ${f(y + 13)}Q${f(x - 2 + tilt * 4)} ${f(y + 6)} ${f(x)} ${f(y)}Z`;
      fruitLit += `M${f(x + 0.6)} ${f(y + 2)}Q${f(x + 1.6 + tilt * 4)} ${f(y + 6)} ${f(x + 1 + tilt * 7)} ${f(y + 10)}`;
    }
    return { leaves, dark, ribs, stem, fruit, fruitLit, height: 46 };
  }
  // level 4: a marigold bush in flower
  const stem = "M0 0Q-1 -20 -2 -40M0 -16Q-10 -26 -16 -40M0 -20Q10 -28 15 -44";
  for (let k = 0; k < 18; k++) {
    const a = -Math.PI * (0.05 + r() * 0.9);
    const cy = -8 - r() * 30;
    const cx = (r() - 0.5) * 26;
    const len = 9 + r() * 5;
    (cy > -20 ? dark : leaves).push(leafPath(cx, cy, len, len * 0.3, a));
  }
  const flowers = [
    { x: -2, y: -44, r: 8 },
    { x: -16, y: -40, r: 6.5 },
    { x: 15, y: -46, r: 7 },
    { x: 6, y: -34, r: 5.5 },
  ];
  return { leaves, dark, ribs, stem, flowers, height: 56 };
}

/** The prize sunflower: tall stem, broad leaves, a head of petals and seeds. */
export const SUNFLOWERP = (() => {
  const top = -104;
  const petals: string[] = [];
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2;
    petals.push(
      leafPath(
        Math.cos(a) * 12,
        top + Math.sin(a) * 12,
        16 + (k % 2) * 3,
        4.6,
        a,
      ),
    );
  }
  const back: string[] = [];
  for (let k = 0; k < 22; k++) {
    const a = ((k + 0.5) / 22) * Math.PI * 2;
    back.push(leafPath(Math.cos(a) * 10, top + Math.sin(a) * 10, 15, 4.2, a));
  }
  let seeds = "";
  const r = rng(3);
  for (let k = 0; k < 60; k++) {
    const a = k * 2.39996;
    const d = Math.sqrt(k / 60) * 11;
    seeds += circle(Math.cos(a) * d, top + Math.sin(a) * d, 0.9 + r() * 0.3);
  }
  return {
    stem: `M0 0C-4 -34 4 -70 0 ${top + 12}`,
    leaves: [
      leafPath(-1, -30, 34, 13, -Math.PI * 0.9),
      leafPath(1, -58, 32, 12, -Math.PI * 0.12),
      leafPath(-1, -78, 24, 9, -Math.PI * 0.8),
    ],
    ribs:
      ribPath(-1, -30, 34, -Math.PI * 0.9) +
      ribPath(1, -58, 32, -Math.PI * 0.12) +
      ribPath(-1, -78, 24, -Math.PI * 0.8),
    petals,
    back,
    head: circle(0, top, 12),
    seeds,
    top,
  };
})();

/* ---- the traveling sprinkler (origin: where it stands on the path) ---------------------- */
export const SPRINKLER = {
  wheelL: circle(-16, -8, 9),
  wheelR: circle(16, -8, 9),
  hubL: circle(-16, -8, 2.6),
  hubR: circle(16, -8, 2.6),
  body: "M-20 -12Q-22 -26 -8 -28H8Q22 -26 20 -12Z",
  bodyLit: "M-14 -24Q-4 -27 6 -26",
  mast: rect(-2.5, -46, 5, 20),
  /** its spray arm turns about (0, -46) */
  arm: "M-22 -47H22V-45H-22Z",
  nozzles: circle(-22, -46, 2.4) + circle(22, -46, 2.4),
  cap: circle(0, -46, 4),
  /** the water it throws over the furrows, left and right of it */
  arcs: "M-22 -46Q-60 -120 -110 -80M22 -46Q60 -124 112 -84M-14 -46Q-30 -150 -50 -96M14 -46Q34 -150 56 -100",
  mist: ellipse(0, -118, 120, 40),
};
/** The hose behind the sprinkler at x (it trails off the left edge). */
export const hoseTo = (x: number) =>
  `M-30 676Q${f(x * 0.35)} 690 ${f(x - 60)} 664T${f(x - 18)} 664`;

/** A butterfly (centre 0,0): two forewings, two hindwings, veins, the body. */
export const BUTTERFLYP = {
  fore: "M0 0C-4 -12 -16 -16 -20 -8C-18 -2 -8 1 0 0ZM0 0C4 -12 16 -16 20 -8C18 -2 8 1 0 0Z",
  hind: "M0 1C-4 8 -12 12 -14 6C-12 2 -6 1 0 1ZM0 1C4 8 12 12 14 6C12 2 6 1 0 1Z",
  veins: "M0 0L-16 -9M0 0L-12 -12M0 0L16 -9M0 0L12 -12M0 1L-11 6M0 1L11 6",
  spots:
    circle(-17, -9, 1.2) +
    circle(17, -9, 1.2) +
    circle(-14, -12, 0.9) +
    circle(14, -12, 0.9),
  body: "M0 -5Q1.5 0 0 6Q-1.5 0 0 -5Z",
  antennae: "M0 -5Q-2 -10 -5 -12M0 -5Q2 -10 5 -12",
};

/** Pollen drifting in the light: seeded start positions. */
export const MOTES = (() => {
  const r = rng(61);
  return Array.from({ length: 26 }, () => ({
    x: r() * W,
    y: 200 + r() * 420,
    r: 1 + r() * 1.8,
    speed: 6 + r() * 10,
    phase: r() * Math.PI * 2,
  }));
})();
