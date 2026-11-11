/**
 * THE SKETCH GENERATOR: seeded, deterministic, hand-drawn SVG paths. One generator, used
 * everywhere (sketch components, mini-UI sketch states, the opening, the page sheet, the OG card).
 *
 * Pure functions, no DOM, no React, no Math.random: the same seed and size always produce the
 * same path string, so server and client render identical markup. Every function returns ONE
 * `d` string (several sub-paths), drawn in pen order, so a stroke-dashoffset draw-on traces it
 * like a hand would (see ./draw.ts).
 *
 *   import { roughRect, roughArrow } from "@/components/sketch/rough";
 *   <path d={roughRect(8, 8, 220, 64, { seed: "jd-panel", radius: 10 })} />
 *
 * Coordinates are in the SVG's own units (usually CSS px). Strokes look right at 1.5-2px.
 * Seeds: any string or number. Use a stable, meaningful seed per element ("hero-window",
 * `${project.id}-chunk-2`), never an index that changes when the list changes.
 */

export type Seed = string | number;
export type Point = readonly [number, number];

export type StrokeOptions = {
  /** Stable seed. Same seed + same geometry = same path. Default 1. */
  seed?: Seed;
  /** Endpoint and control jitter, 0 (ruler) .. 3 (scrawl). Default 1. */
  roughness?: number;
  /** How much straight lines bow, 0 .. 3. Default 1. */
  bowing?: number;
  /** 2 = a second, slightly different pass (the double-stroke pencil look). Default 2 for lines/rects/circles. */
  passes?: 1 | 2;
};

type Rand = () => number;

// -------------------------------------------------------------------------------------------
// PRNG
// -------------------------------------------------------------------------------------------

/** FNV-1a 32-bit hash of any seed. */
export function hashSeed(seed: Seed): number {
  const s = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a tiny, fast, well-distributed PRNG. Returns floats in [0, 1). */
export function seeded(seed: Seed): Rand {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Number -> compact SVG string, 1 decimal (stable across engines; never "-0"). */
function f(n: number): string {
  const v = Math.round(n * 10) / 10;
  return (v === 0 ? 0 : v).toString();
}

const spread = (r: Rand, amt: number) => (r() * 2 - 1) * amt;

/**
 * The "tight twin" of any generator call: the same options with no wobble, no bow and no corner
 * overshoot. The PRNG is consumed identically whatever the roughness, so `roughRect(..., o)` and
 * `roughRect(..., tight(o))` have the same commands and the same number count: tween the `d`
 * attribute from one to the other (gsap attr) and a pencil line straightens onto its crisp box.
 * This is how a sketch "compiles" (the mini-UIs; reuse it for diagrams).
 *
 *   const d = roughRect(x, y, w, h, { seed: "node-api", radius: 12 });
 *   const crisp = roughRect(x, y, w, h, tight({ seed: "node-api", radius: 12 }));
 *   gsap.to(path, { attr: { d: crisp }, duration: 0.22, ease: EASE.pen });
 */
export function tight<O extends StrokeOptions & { overshoot?: number }>(o: O): O {
  return { ...o, roughness: 0, bowing: 0, overshoot: 0 };
}

// -------------------------------------------------------------------------------------------
// Lines
// -------------------------------------------------------------------------------------------

/** One bowed, jittered stroke from (x1,y1) to (x2,y2). `pass` 1 is the lighter second pass. */
function segment(r: Rand, x1: number, y1: number, x2: number, y2: number, rough: number, bowing: number, pass: 0 | 1): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // Long lines wobble relatively less (a hand steadies over distance); tiny lines barely at all.
  const gain = (len < 200 ? 1 : len > 500 ? 0.4 : 1 - ((len - 200) / 300) * 0.6) * Math.min(1, len / 24);
  const amp = rough * gain * (pass ? 0.8 : 1.25);
  const nx = -dy / len;
  const ny = dx / len;
  const bow = spread(r, 1) * bowing * Math.min(len * 0.012, 3.2);
  const t1 = 0.22 + r() * 0.14;
  const t2 = 0.62 + r() * 0.16;
  const sx = x1 + spread(r, amp);
  const sy = y1 + spread(r, amp);
  const c1x = x1 + dx * t1 + nx * bow + spread(r, amp * 0.5);
  const c1y = y1 + dy * t1 + ny * bow + spread(r, amp * 0.5);
  const c2x = x1 + dx * t2 + nx * bow * 0.85 + spread(r, amp * 0.5);
  const c2y = y1 + dy * t2 + ny * bow * 0.85 + spread(r, amp * 0.5);
  const ex = x2 + spread(r, amp);
  const ey = y2 + spread(r, amp);
  return `M${f(sx)} ${f(sy)}C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(ex)} ${f(ey)}`;
}

/** A hand-drawn straight line (two passes by default). */
export function roughLine(from: Point, to: Point, { seed = 1, roughness = 1, bowing = 1, passes = 2 }: StrokeOptions = {}): string {
  const r = seeded(`${String(seed)}|line`);
  let d = segment(r, from[0], from[1], to[0], to[1], roughness, bowing, 0);
  if (passes === 2) d += segment(r, from[0], from[1], to[0], to[1], roughness, bowing * 0.6, 1);
  return d;
}

/** A sequence of hand-drawn lines through `points` (open). Set `close` to return to the start. */
export function roughPolyline(points: readonly Point[], { seed = 1, roughness = 1, bowing = 0.6, passes = 1, close = false }: StrokeOptions & { close?: boolean } = {}): string {
  const r = seeded(`${String(seed)}|poly`);
  const pts = close ? [...points, points[0]] : points;
  let d = "";
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < pts.length - 1; i++) {
      d += segment(r, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], roughness, bowing, p ? 1 : 0);
    }
  }
  return d;
}

// -------------------------------------------------------------------------------------------
// Rectangles
// -------------------------------------------------------------------------------------------

export type RectOptions = StrokeOptions & {
  /** Corner radius. 0 = four separate strokes crossing at the corners; > 0 = one continuous stroke. */
  radius?: number;
  /** How far square corners overshoot (px). Default 3.5. */
  overshoot?: number;
};

/**
 * A hand-drawn rectangle. Square corners cross and overshoot (the double-stroke pencil corner);
 * rounded corners are drawn as one continuous stroke that overlaps its start.
 */
export function roughRect(x: number, y: number, w: number, h: number, { seed = 1, roughness = 1, bowing = 1, passes = 2, radius = 0, overshoot = 3.5 }: RectOptions = {}): string {
  const r = seeded(`${String(seed)}|rect`);
  let d = "";
  for (let p = 0; p < passes; p++) {
    const pass = (p ? 1 : 0) as 0 | 1;
    if (radius <= 0) {
      const os = () => overshoot * (0.3 + r() * 0.9) * (pass ? 0.7 : 1);
      d += segment(r, x - os(), y, x + w + os(), y, roughness, bowing, pass);
      d += segment(r, x + w, y - os(), x + w, y + h + os(), roughness, bowing, pass);
      d += segment(r, x + w + os(), y + h, x - os(), y + h, roughness, bowing, pass);
      d += segment(r, x, y + h + os(), x, y - os(), roughness, bowing, pass);
    } else {
      d += roundedPass(r, x, y, w, h, Math.min(radius, w / 2, h / 2), roughness * (pass ? 0.7 : 1), bowing * (pass ? 0.6 : 1));
    }
  }
  return d;
}

/** One continuous stroke around a rounded rectangle, starting near the top-left, overlapping its start. */
function roundedPass(r: Rand, x: number, y: number, w: number, h: number, rad: number, rough: number, bowing: number): string {
  const j = (a = 1) => spread(r, rough * a);
  const bowOf = (len: number) => spread(r, 1) * bowing * Math.min(len * 0.01, 2.6);
  const k = 0.5523; // circle-ish quarter control factor
  const x0 = x + rad;
  const y0 = y + j(0.8);
  const startX = x0 + rad * 0.2 + r() * 6;
  let d = `M${f(startX)} ${f(y0)}`;
  // edge helper: cubic from current to (ex, ey) along an axis with a perpendicular bow
  const edge = (sx: number, sy: number, ex: number, ey: number) => {
    const len = Math.hypot(ex - sx, ey - sy) || 1;
    const nx = -(ey - sy) / len;
    const ny = (ex - sx) / len;
    const b = bowOf(len);
    const c1x = sx + (ex - sx) * 0.33 + nx * b + j(0.4);
    const c1y = sy + (ey - sy) * 0.33 + ny * b + j(0.4);
    const c2x = sx + (ex - sx) * 0.67 + nx * b + j(0.4);
    const c2y = sy + (ey - sy) * 0.67 + ny * b + j(0.4);
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(ex)} ${f(ey)}`;
  };
  const corner = (c1x: number, c1y: number, c2x: number, c2y: number, ex: number, ey: number) => {
    d += `C${f(c1x + j(0.5))} ${f(c1y + j(0.5))} ${f(c2x + j(0.5))} ${f(c2y + j(0.5))} ${f(ex)} ${f(ey)}`;
  };
  // top edge -> top-right corner
  const tr = [x + w - rad + j(0.6), y + j(0.6)] as const;
  edge(startX, y0, tr[0], tr[1]);
  const rTop = [x + w + j(0.6), y + rad + j(0.6)] as const;
  corner(tr[0] + rad * k, tr[1], rTop[0], rTop[1] - rad * k, rTop[0], rTop[1]);
  // right edge -> bottom-right
  const rb = [x + w + j(0.6), y + h - rad + j(0.6)] as const;
  edge(rTop[0], rTop[1], rb[0], rb[1]);
  const bR = [x + w - rad + j(0.6), y + h + j(0.6)] as const;
  corner(rb[0], rb[1] + rad * k, bR[0] + rad * k, bR[1], bR[0], bR[1]);
  // bottom edge -> bottom-left
  const bl = [x + rad + j(0.6), y + h + j(0.6)] as const;
  edge(bR[0], bR[1], bl[0], bl[1]);
  const lB = [x + j(0.6), y + h - rad + j(0.6)] as const;
  corner(bl[0] - rad * k, bl[1], lB[0], lB[1] + rad * k, lB[0], lB[1]);
  // left edge -> top-left, then overlap past the start
  const lt = [x + j(0.6), y + rad + j(0.6)] as const;
  edge(lB[0], lB[1], lt[0], lt[1]);
  const tL = [x + rad + j(0.6), y + j(1.2) - 0.6] as const;
  corner(lt[0], lt[1] - rad * k, tL[0] - rad * k, tL[1], tL[0], tL[1]);
  const over = startX + 8 + r() * Math.min(18, w * 0.15);
  edge(tL[0], tL[1], over, y + j(1.4) + 0.8);
  return d;
}

// -------------------------------------------------------------------------------------------
// Ellipses
// -------------------------------------------------------------------------------------------

/** Catmull-Rom spline through points -> cubic Bezier path (open). */
function spline(pts: readonly Point[]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/**
 * A hand-drawn ellipse: one loop that does not quite close, overshooting its start (the way a
 * hand circles a word). Two passes by default.
 */
export function roughEllipse(cx: number, cy: number, rx: number, ry: number, { seed = 1, roughness = 1, passes = 2 }: StrokeOptions = {}): string {
  const r = seeded(`${String(seed)}|ellipse`);
  let d = "";
  for (let p = 0; p < passes; p++) {
    const circ = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2);
    const n = Math.max(7, Math.min(18, Math.round(circ / 26)));
    const start = r() * Math.PI * 2;
    const overlap = 0.25 + r() * 0.45;
    const total = Math.PI * 2 + overlap;
    const drift = spread(r, 0.05); // radius drifts over the turn so the overlap does not coincide
    const pts: Point[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = start + total * t;
      const k = 1 + spread(r, 0.03 * roughness) + drift * t;
      pts.push([cx + Math.cos(a) * rx * k + spread(r, 0.6 * roughness), cy + Math.sin(a) * ry * k + spread(r, 0.6 * roughness)]);
    }
    d += spline(pts);
  }
  return d;
}

export function roughCircle(cx: number, cy: number, radius: number, o: StrokeOptions = {}): string {
  return roughEllipse(cx, cy, radius, radius, o);
}

// -------------------------------------------------------------------------------------------
// Arrows, underlines, scribbles, marks
// -------------------------------------------------------------------------------------------

export type ArrowOptions = StrokeOptions & {
  /** Curvature: perpendicular offset of the midpoint as a fraction of the length (-0.5..0.5). Default 0.18. */
  bend?: number;
  /** Arrowhead length in px. Default 11. */
  head?: number;
  /** Half-angle of the arrowhead in degrees. Default 28. */
  headAngle?: number;
  /** Which ends get a head. Default "end". */
  heads?: "end" | "start" | "both" | "none";
};

/** The shaft of an arrow on its own (for dashed connectors), plus the end tangents. */
export function arrowGeometry(from: Point, to: Point, { seed = 1, roughness = 1, bend = 0.18 }: ArrowOptions = {}) {
  const r = seeded(`${String(seed)}|arrow`);
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const qx = (x1 + x2) / 2 + nx * bend * len;
  const qy = (y1 + y2) / 2 + ny * bend * len;
  const j = (a: number) => spread(r, a * roughness);
  // quadratic -> cubic, with a little life in the controls
  const c1x = x1 + (2 / 3) * (qx - x1) + j(2);
  const c1y = y1 + (2 / 3) * (qy - y1) + j(2);
  const c2x = x2 + (2 / 3) * (qx - x2) + j(2);
  const c2y = y2 + (2 / 3) * (qy - y2) + j(2);
  const shaft = `M${f(x1)} ${f(y1)}C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x2)} ${f(y2)}`;
  return { shaft, endAngle: Math.atan2(y2 - c2y, x2 - c2x), startAngle: Math.atan2(y1 - c1y, x1 - c1x), rand: r };
}

function headAt(r: Rand, tip: Point, angle: number, size: number, half: number, roughness: number): string {
  const a1 = angle + Math.PI - half + spread(r, 0.08 * roughness);
  const a2 = angle + Math.PI + half + spread(r, 0.08 * roughness);
  const l1 = size * (0.9 + r() * 0.2);
  const l2 = size * (0.9 + r() * 0.2);
  const p1x = tip[0] + Math.cos(a1) * l1;
  const p1y = tip[1] + Math.sin(a1) * l1;
  const p2x = tip[0] + Math.cos(a2) * l2;
  const p2y = tip[1] + Math.sin(a2) * l2;
  return `M${f(p1x)} ${f(p1y)}L${f(tip[0] + spread(r, 0.6))} ${f(tip[1] + spread(r, 0.6))}L${f(p2x)} ${f(p2y)}`;
}

/** A doodled arrow: one curved shaft plus quick V heads. Returns one path (shaft first, then heads). */
export function roughArrow(from: Point, to: Point, o: ArrowOptions = {}): string {
  const { head = 11, headAngle = 28, heads = "end", roughness = 1 } = o;
  const g = arrowGeometry(from, to, o);
  return g.shaft + arrowHeads(from, to, { ...o, head, headAngle, heads, roughness });
}

/** Only the head strokes of roughArrow() (same seed = same heads), for dashed shafts with solid heads. */
export function arrowHeads(from: Point, to: Point, o: ArrowOptions = {}): string {
  const { head = 11, headAngle = 28, heads = "end", roughness = 1 } = o;
  const g = arrowGeometry(from, to, o);
  const half = (headAngle * Math.PI) / 180;
  let d = "";
  if (heads === "end" || heads === "both") d += headAt(g.rand, to, g.endAngle, head, half, roughness);
  if (heads === "start" || heads === "both") d += headAt(g.rand, from, g.startAngle, head, half, roughness);
  return d;
}

export type UnderlineOptions = StrokeOptions & {
  /** single: one confident stroke. double: two strokes (emphasis). swash: one stroke ending in a small upward flick. */
  style?: "single" | "double" | "swash";
};

/** A hand underline starting at (x, y), `w` wide, drifting very slightly upward. */
export function roughUnderline(x: number, y: number, w: number, { seed = 1, roughness = 1, bowing = 1, style = "single" }: UnderlineOptions = {}): string {
  const r = seeded(`${String(seed)}|underline`);
  const rise = w * (0.006 + r() * 0.01);
  let d = segment(r, x - 2, y + 0.5, x + w + 2, y - rise, roughness, bowing * 1.2, 0);
  if (style === "double") {
    d += segment(r, x + w * (0.04 + r() * 0.05), y + 5 + spread(r, 0.8), x + w * (0.9 + r() * 0.08), y + 4 - rise, roughness, bowing, 1);
  } else if (style === "swash") {
    const ex = x + w + 2;
    const ey = y - rise;
    d += `M${f(ex - 6)} ${f(ey + 1)}Q${f(ex + 7)} ${f(ey + 2)} ${f(ex + 10)} ${f(ey - 9)}`;
  }
  return d;
}

export type ScribbleOptions = StrokeOptions & {
  /** Zig-zag density (1 = ~7px between turns). */
  density?: number;
  /** Slant of the zig-zag in degrees. Default -12. */
  slant?: number;
};

/** A scribble that fills a box with a loose zig-zag (where a word "will be"; crossed-out ideas). */
export function scribble(x: number, y: number, w: number, h: number, { seed = 1, roughness = 1, density = 1, slant = -12 }: ScribbleOptions = {}): string {
  const r = seeded(`${String(seed)}|scribble`);
  const step = 7 / Math.max(0.2, density);
  const n = Math.max(2, Math.ceil(w / step));
  const lean = Math.tan((slant * Math.PI) / 180) * h;
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const top = i % 2 === 1;
    const px = x + (i / n) * w + (top ? lean / 2 : -lean / 2) + spread(r, 1.4 * roughness);
    const py = (top ? y : y + h) + spread(r, Math.min(3, h * 0.12) * roughness);
    pts.push([px, py]);
  }
  // rounded turns: quadratic through midpoints
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(mx)} ${f(my)}`;
  }
  const last = pts[pts.length - 1];
  d += `L${f(last[0])} ${f(last[1])}`;
  return d;
}

/** A quick hand-drawn check mark inside a `size` box at (x, y). */
export function roughCheck(x: number, y: number, size: number, { seed = 1, roughness = 1 }: StrokeOptions = {}): string {
  const r = seeded(`${String(seed)}|check`);
  const j = (a: number) => spread(r, a * roughness);
  const ax = x + size * 0.06 + j(0.8);
  const ay = y + size * 0.55 + j(0.8);
  const bx = x + size * 0.38 + j(0.8);
  const by = y + size * 0.86 + j(0.6);
  const cx = x + size * 0.96 + j(0.8);
  const cy = y + size * 0.1 + j(0.8);
  return `M${f(ax)} ${f(ay)}Q${f((ax + bx) / 2 + j(1))} ${f((ay + by) / 2 + 1 + j(1))} ${f(bx)} ${f(by)}Q${f((bx + cx) / 2 - 1 + j(1.5))} ${f((by + cy) / 2 + j(1.5))} ${f(cx)} ${f(cy)}`;
}

/** A small hand-drawn cross (x) inside a `size` box at (x, y). */
export function roughCross(x: number, y: number, size: number, o: StrokeOptions = {}): string {
  const seed = o.seed ?? 1;
  return (
    roughLine([x, y], [x + size, y + size], { ...o, seed: `${String(seed)}a`, passes: 1 }) +
    roughLine([x + size, y], [x, y + size], { ...o, seed: `${String(seed)}b`, passes: 1 })
  );
}

/**
 * A vertical torn / hand-cut edge from (x, y0) to (x, y1): the leading edge of the page sheet.
 * `amp` is the horizontal wobble in px. Returns an open path (stroke it, or close it into a fill).
 */
export function roughEdge(x: number, y0: number, y1: number, { seed = 1, amp = 10, step = 46 }: { seed?: Seed; amp?: number; step?: number } = {}): string {
  const r = seeded(`${String(seed)}|edge`);
  const n = Math.max(3, Math.round(Math.abs(y1 - y0) / step));
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([x + spread(r, amp) * (i === 0 || i === n ? 0.4 : 1), y0 + (y1 - y0) * t + (i > 0 && i < n ? spread(r, step * 0.18) : 0)]);
  }
  return spline(pts);
}
