/**
 * THE ROAD SO FAR (pure geometry: no React, no DOM). A hand-drawn map of the part of Karnataka his
 * route crosses, in a fixed 480 x 440 drawing, north up, not to scale: the Arabian Sea and the
 * coast on the west, the Western Ghats (hills and trees) down the middle, the plateau to the east.
 * Koppa (Malnad) in the hills to the north, Sullia (Dakshina Kannada) to the south, Bengaluru on
 * the plateau to the east, in that order, from src/content/profile.ts `route`.
 *
 * The road: Koppa down through the Ghats in hairpins to Sullia, then up and across the plateau to
 * Bengaluru, as two smooth legs (the bus drives one, stops, drives the other).
 */
import type { Point } from "@/components/sketch/rough";

export const MAP = { w: 480, h: 440 } as const;

const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Point) => `${r1(p[0])} ${r1(p[1])}`;

/** A smooth curve through points (Catmull-Rom as cubic Beziers). */
function smooth(points: Point[], tension = 0.5): string {
  let d = `M${pt(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1: Point = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2: Point = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}

const circle = (c: Point, r: number) => `M${r1(c[0] - r)} ${r1(c[1])}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const rect = (x: number, y: number, w: number, h: number) => `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;

/** The stops, in route order. */
export const STOPS: Point[] = [
  [148, 76],
  [126, 352],
  [394, 234],
];

const LEG1: Point[] = [STOPS[0], [166, 104], [138, 134], [174, 160], [144, 190], [178, 220], [148, 252], [170, 284], [140, 314], STOPS[1]];
const LEG2: Point[] = [STOPS[1], [168, 344], [198, 320], [232, 304], [268, 298], [304, 282], [338, 264], [368, 246], STOPS[2]];
export const ROAD = { leg1: smooth(LEG1), leg2: smooth(LEG2) };

// a seeded sequence, so the hills and trees never move between renders
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const near = (p: Point, pts: Point[], d: number) => pts.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < d);
const ROADPTS = [...LEG1, ...LEG2];

export const LAND = (() => {
  // the coast, wavering down the west edge
  const coastPts: Point[] = [];
  for (let y = -6; y <= MAP.h + 6; y += 22) coastPts.push([52 + 7 * Math.sin(y * 0.05) + 4 * Math.sin(y * 0.13), y]);
  const coast = smooth(coastPts);
  const sea = `${coast}L-6 ${MAP.h + 6}L-6 -6Z`;
  let waves = "";
  for (const [x, y] of [
    [20, 60],
    [30, 150],
    [16, 228],
    [28, 330],
    [18, 404],
  ] as Point[]) {
    waves += `M${x - 7} ${y}q3.5 -4 7 0t7 0`;
  }

  // the Western Ghats: humps of hills (with a stroke of shade) and clusters of trees
  const rand = rng(23);
  let hills = "";
  let shade = "";
  let trees = "";
  for (let k = 0; k < 46; k++) {
    const x = 74 + rand() * 132;
    const y = 18 + rand() * 410;
    const w = 16 + rand() * 18;
    const h = 7 + rand() * 9;
    if (near([x, y], ROADPTS, 20) || near([x, y], STOPS, 30)) continue;
    hills += `M${r1(x - w / 2)} ${r1(y)}Q${r1(x - w * 0.15)} ${r1(y - h * 1.6)} ${r1(x)} ${r1(y - h)}Q${r1(x + w * 0.2)} ${r1(y - h * 1.5)} ${r1(x + w / 2)} ${r1(y)}`;
    shade += `M${r1(x + w * 0.05)} ${r1(y - h * 0.7)}L${r1(x + w * 0.28)} ${r1(y - 1)}`;
  }
  for (let k = 0; k < 70; k++) {
    const x = 66 + rand() * 170;
    const y = 12 + rand() * 420;
    if (near([x, y], ROADPTS, 13) || near([x, y], STOPS, 26)) continue;
    trees += circle([x, y], 2.6 + rand() * 1.8);
  }

  // rivers: one west to the sea past Sullia, one north-east from the hills near Koppa
  const rivers = smooth([
    [206, 386],
    [178, 380],
    [150, 392],
    [118, 384],
    [88, 400],
    [58, 404],
  ]) + smooth([
    [126, 50],
    [168, 40],
    [214, 44],
    [262, 30],
    [312, 26],
    [360, 10],
  ]);

  // the plateau: fields and a few villages
  let fields = "";
  for (const [x, y, w, h] of [
    [262, 126, 40, 22],
    [306, 120, 30, 30],
    [250, 160, 26, 18],
    [420, 120, 34, 26],
    [440, 300, 30, 22],
    [300, 352, 44, 24],
    [350, 376, 30, 26],
    [244, 392, 34, 20],
    [418, 352, 36, 30],
  ] as [number, number, number, number][]) {
    fields += rect(x, y, w, h);
    fields += `M${x + w / 3} ${y}v${h}M${x + (2 * w) / 3} ${y}v${h}`;
  }
  let villages = "";
  for (const p of [
    [286, 214],
    [232, 252],
    [330, 168],
    [460, 196],
    [376, 318],
  ] as Point[]) {
    villages += circle(p, 2.2);
  }

  // Bengaluru: a skyline round its pin
  let city = "";
  const [bx, by] = STOPS[2];
  for (const [dx, w, h] of [
    [-34, 9, 18],
    [-24, 8, 30],
    [-15, 10, 22],
    [10, 9, 34],
    [20, 8, 24],
    [29, 11, 40],
    [41, 8, 20],
  ] as [number, number, number][]) {
    city += rect(bx + dx, by - 10 - h, w, h);
  }
  let windows = "";
  for (const [dx, h] of [
    [-22, 30],
    [12, 34],
    [31, 40],
  ] as Point[]) {
    for (let y = by - 10 - h + 5; y < by - 14; y += 6) windows += rect(bx + dx + 1, y, 2, 2.4) + rect(bx + dx + 4, y, 2, 2.4);
  }

  // the compass
  const cx = 444;
  const cy = 44;
  const compass = `M${cx} ${cy - 20}L${cx + 6} ${cy}L${cx} ${cy + 20}L${cx - 6} ${cy}Z` + `M${cx - 18} ${cy}H${cx + 18}`;
  const needle = `M${cx} ${cy - 20}L${cx + 6} ${cy}H${cx - 6}Z`;

  // a small container ship off the coast (the port's MV SHIPPED, passing)
  const sx = 14;
  const sy = 282;
  const ship = `M${sx} ${sy}h30l-4 7h-23Z`;
  const shipBoxes = rect(sx + 5, sy - 6, 6, 6) + rect(sx + 11, sy - 6, 6, 6) + rect(sx + 17, sy - 6, 6, 6) + rect(sx + 8, sy - 12, 6, 6) + rect(sx + 14, sy - 12, 6, 6);
  const shipHouse = rect(sx + 25, sy - 11, 5, 11);

  return { coast, sea, waves, hills, shade, trees, rivers, fields, villages, city, windows, compass, needle, ship, shipBoxes, shipHouse };
})();

/** A small bus seen from above, facing +x, centred on 0,0. */
export const BUS = {
  body: "M-13 -6.5h22a4 4 0 0 1 4 4v5a4 4 0 0 1 -4 4h-22a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2Z",
  glass: "M9 -4.8h2.6a1.6 1.6 0 0 1 1.6 1.6v6.4a1.6 1.6 0 0 1 -1.6 1.6h-2.6Z",
  roof: "M-8 -3.2h11v6.4h-11Z",
  rear: "M-14.2 -4.2h1.6v8.4h-1.6Z",
};
