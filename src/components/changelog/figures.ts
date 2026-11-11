/**
 * THE ROLE FIGURES (pure geometry: no React, no DOM). Each role in the changelog gets one small
 * diagram of the work it describes, drawn from that role's own highlights and stack
 * (src/content/experience.ts). Nothing is invented: no numbers, no products he did not list.
 *
 *   cloud (Techbyheart, v1.0): users reach EC2 through network security, EC2 talks to RDS and
 *         S3 on AWS; a threat is stopped at the shield and a vulnerability scan ticks each part.
 *   ml    (Rooman, v2.0):      a notebook-style run (eda, preprocess, train, evaluate, tune)
 *         beside a chart: the data lands, outliers are struck out, a straight fit and its
 *         errors, then the tuned curve pulls the errors in: the model.
 *   java  (Dyashin, v3.0):     a pull request is reviewed and merged into main; then a request
 *         runs the stack (React, REST, Spring Boot, Hibernate, SQL, MySQL) and comes back.
 *   ops   (Maruti Flex, v4.0): Google Sheets (through Apps Script) and MongoDB (through a REST
 *         API) feed a React / Next.js app; it fills on the laptop and the phone and goes live.
 *
 * Every scene is laid out for the box it is given, in CSS px (1 unit = 1px, so labels stay
 * 11-12px at any size): from a phone panel (about 190 x 205) to a desktop column (360 x 440).
 * The output is the FINISHED picture; ./RoleFigure.tsx hides the parts and plays them (`k`
 * names the parts its timelines move, `marks` carries the numbers they need).
 */
import { roughPolyline, roughRect, seeded, type Point } from "@/components/sketch/rough";

export type FigureId = "cloud" | "ml" | "java" | "ops";
export type PacketKind = "request" | "data" | "response";
export type Tone = "ink" | "graphite" | "pencil" | "blue" | "lime" | "tangerine" | "line";
export type Fill = "card" | "paper" | "paper-2" | "line" | "pencil" | "lime" | "lime-soft" | "blue" | "blue-soft" | "tangerine" | "tangerine-soft" | "ink";

export type Shape = {
  d: string;
  /** The rough pencil twin, drawn before the ink (wires and nodes only). */
  pencil?: string;
  tone?: Tone;
  fill?: Fill;
  width?: number;
  /** Dashed ink (it fades in instead of tracing). */
  dash?: boolean;
  /** Handle for the timeline (data-k); several shapes may share one. */
  k?: string;
  /** Hidden in the finished picture (a moment of the story only). */
  gone?: boolean;
  /** Opacity in the finished picture. */
  rest?: number;
};

export type Label = { x: number; y: number; text: string; anchor?: "start" | "middle" | "end"; tone?: Tone; k?: string };
export type Packet = { k: string; kind: PacketKind; track: Point[] };

export type Scene = {
  id: FigureId;
  w: number;
  h: number;
  /** Label size in px (11 compact, 12 roomy). */
  fs: number;
  /** Behind everything (the highlighter band). */
  under: Shape[];
  /** Connectors and frames: pencil, then ink. Packets run over them and under the nodes. */
  wires: Shape[];
  /** Filled parts: chips, tiles, windows (pencil, ink, fill). `k` is the node's name. */
  nodes: Shape[];
  /** On a node's fill, under its outline (a highlighted row, a window's contents, a flash). */
  inside: Shape[];
  /** Pictograms (they arrive with the labels). */
  icons: Shape[];
  /** The story's own parts (k-addressed). */
  over: Shape[];
  labels: Label[];
  packets: Packet[];
  marks: Record<string, number | number[] | number[][] | Point | Point[]>;
};

/** Which figure each role gets (experience id -> figure). */
export const FIGURE_OF: Record<string, FigureId> = {
  techbyheart: "cloud",
  rooman: "ml",
  dyashin: "java",
  "maruti-flex": "ops",
};

/** One-line descriptions (the figure is decoration; the card's text carries the facts). */
export const FIGURE_ALT: Record<FigureId, string> = {
  cloud: "Users reach EC2 through network security on AWS; EC2 uses RDS and S3; a threat is blocked and a scan checks each resource.",
  ml: "A model pipeline: EDA, preprocessing, training, evaluation and tuning, shown as a curve fitted to data.",
  java: "A reviewed pull request merges into main, then a request runs from React through a REST API on Spring Boot and Hibernate to MySQL and back.",
  ops: "Google Sheets through Apps Script and MongoDB through a REST API feed a responsive React / Next.js app that goes live.",
};

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (n: number) => Math.round(n * 10) / 10;
const P = (x: number, y: number): Point => [r1(x), r1(y)];
const pt = (p: Point) => `${r1(p[0])} ${r1(p[1])}`;

/** Width of type-micro text (JetBrains Mono advances 0.6em, +0.02em tracking). */
const tw = (s: string, fs: number) => s.length * fs * 0.62;

function rect(x: number, y: number, w: number, h: number, r: number): string {
  const k = Math.min(r, w / 2, h / 2);
  const a = (ex: number, ey: number) => `A${r1(k)} ${r1(k)} 0 0 1 ${pt([ex, ey])}`;
  return `M${pt([x + k, y])}H${r1(x + w - k)}${a(x + w, y + k)}V${r1(y + h - k)}${a(x + w - k, y + h)}H${r1(x + k)}${a(x, y + h - k)}V${r1(y + k)}${a(x + k, y)}Z`;
}

function poly(points: readonly Point[]): string {
  return points.map((p, i) => `${i ? "L" : "M"}${pt(p)}`).join("");
}

/** A polyline whose corners are rounded (radius r). */
function bend(points: readonly Point[], r = 7): string {
  if (points.length < 3) return poly(points);
  let d = `M${pt(points[0])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1];
    const b = points[i];
    const c = points[i + 1];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
    const k = Math.min(r, l1 / 2, l2 / 2);
    d += `L${pt([b[0] + ((a[0] - b[0]) / l1) * k, b[1] + ((a[1] - b[1]) / l1) * k])}Q${pt(b)} ${pt([b[0] + ((c[0] - b[0]) / l2) * k, b[1] + ((c[1] - b[1]) / l2) * k])}`;
  }
  return d + `L${pt(points[points.length - 1])}`;
}

function circle(c: Point, r: number): string {
  return `M${r1(c[0] - r)} ${r1(c[1])}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
}

function check(c: Point, s: number): string {
  return `M${pt([c[0] - s * 0.42, c[1] + s * 0.02])}L${pt([c[0] - s * 0.12, c[1] + s * 0.32])}L${pt([c[0] + s * 0.44, c[1] - s * 0.34])}`;
}

function cross(c: Point, s: number): string {
  const h = s / 2;
  return `M${pt([c[0] - h, c[1] - h])}L${pt([c[0] + h, c[1] + h])}M${pt([c[0] + h, c[1] - h])}L${pt([c[0] - h, c[1] + h])}`;
}

// ---- pictograms (centred on c, about s px) -------------------------------------------------------

type IconKind = "server" | "db" | "bucket" | "window" | "braces" | "orm" | "grid" | "bolt";

function icon(kind: IconKind, c: Point, s: number): Shape[] {
  const [x, y] = c;
  switch (kind) {
    case "server":
      return [
        { d: rect(x - s * 0.5, y - s * 0.42, s, s * 0.84, s * 0.14) + `M${pt([x - s * 0.5, y])}H${r1(x + s * 0.5)}`, width: 1.2 },
        { d: circle([x + s * 0.27, y - s * 0.21], s * 0.07) + circle([x + s * 0.27, y + s * 0.21], s * 0.07), fill: "ink", width: 0 },
      ];
    case "db": {
      const rx = s * 0.44;
      const ry = s * 0.15;
      const t = y - s * 0.34;
      const b = y + s * 0.34;
      return [
        {
          d:
            `M${pt([x - rx, t])}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z` +
            `M${pt([x - rx, t])}V${r1(b)}a${r1(rx)} ${r1(ry)} 0 0 0 ${r1(2 * rx)} 0V${r1(t)}` +
            `M${pt([x - rx, y])}a${r1(rx)} ${r1(ry)} 0 0 0 ${r1(2 * rx)} 0`,
          width: 1.2,
        },
      ];
    }
    case "bucket": {
      const rx = s * 0.46;
      const ry = s * 0.14;
      const t = y - s * 0.3;
      return [
        {
          d:
            `M${pt([x - rx, t])}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z` +
            `M${pt([x - rx, t])}L${pt([x - s * 0.3, y + s * 0.38])}a${r1(s * 0.3)} ${r1(ry * 0.8)} 0 0 0 ${r1(s * 0.6)} 0L${pt([x + rx, t])}`,
          width: 1.2,
        },
      ];
    }
    case "window":
      return [{ d: rect(x - s * 0.52, y - s * 0.4, s * 1.04, s * 0.8, s * 0.12) + `M${pt([x - s * 0.52, y - s * 0.14])}H${r1(x + s * 0.52)}`, width: 1.2 }];
    case "braces": {
      const half = (dir: 1 | -1) => {
        const o = x + dir * s * 0.1;
        const e = x + dir * s * 0.32;
        const m = x + dir * s * 0.46;
        return `M${pt([o, y - s * 0.44])}Q${pt([e, y - s * 0.44])} ${pt([e, y - s * 0.24])}V${r1(y - s * 0.1)}Q${pt([e, y])} ${pt([m, y])}Q${pt([e, y])} ${pt([e, y + s * 0.1])}V${r1(y + s * 0.24)}Q${pt([e, y + s * 0.44])} ${pt([o, y + s * 0.44])}`;
      };
      return [{ d: half(-1) + half(1), width: 1.2 }];
    }
    case "orm":
      return [
        {
          d:
            `M${pt([x - s * 0.46, y - s * 0.18])}H${r1(x + s * 0.4)}M${pt([x + s * 0.2, y - s * 0.36])}L${pt([x + s * 0.44, y - s * 0.18])}L${pt([x + s * 0.2, y])}` +
            `M${pt([x + s * 0.46, y + s * 0.2])}H${r1(x - s * 0.4)}M${pt([x - s * 0.2, y + s * 0.02])}L${pt([x - s * 0.44, y + s * 0.2])}L${pt([x - s * 0.2, y + s * 0.38])}`,
          width: 1.2,
        },
      ];
    case "grid":
      return [
        {
          d: rect(x - s * 0.46, y - s * 0.4, s * 0.92, s * 0.8, s * 0.1) + `M${pt([x - s * 0.46, y - s * 0.12])}H${r1(x + s * 0.46)}M${pt([x - s * 0.46, y + s * 0.14])}H${r1(x + s * 0.46)}M${pt([x - s * 0.12, y - s * 0.4])}V${r1(y + s * 0.4)}`,
          width: 1.2,
        },
      ];
    case "bolt":
      return [
        {
          d: `M${pt([x + s * 0.12, y - s * 0.5])}L${pt([x - s * 0.3, y + s * 0.08])}H${r1(x - s * 0.02)}L${pt([x - s * 0.12, y + s * 0.5])}L${pt([x + s * 0.3, y - s * 0.1])}H${r1(x + s * 0.02)}Z`,
          fill: "lime",
          width: 1.1,
        },
      ];
  }
}

/** Three people: one in front, two behind. */
function users(c: Point, s: number): Shape[] {
  const person = (px: number, py: number, k: number) =>
    circle([px, py - s * 0.26 * k], s * 0.2 * k) +
    `M${pt([px - s * 0.4 * k, py + s * 0.46 * k])}C${pt([px - s * 0.4 * k, py - s * 0.02 * k])} ${pt([px + s * 0.4 * k, py - s * 0.02 * k])} ${pt([px + s * 0.4 * k, py + s * 0.46 * k])}Z`;
  return [
    { d: person(c[0] - s * 0.62, c[1] + s * 0.06, 0.82) + person(c[0] + s * 0.62, c[1] + s * 0.06, 0.82), fill: "paper-2", width: 1.1 },
    { d: person(c[0], c[1], 1), fill: "card", width: 1.2 },
  ];
}

function shield(c: Point, w: number): string {
  const h = w * 1.18;
  const [x, y] = c;
  const t = y - h / 2;
  return (
    `M${pt([x, t])}C${pt([x + w * 0.2, t + h * 0.08])} ${pt([x + w * 0.38, t + h * 0.1])} ${pt([x + w / 2, t + h * 0.1])}` +
    `V${r1(y + h * 0.02)}C${pt([x + w / 2, y + h * 0.26])} ${pt([x + w * 0.24, y + h * 0.4])} ${pt([x, y + h / 2])}` +
    `C${pt([x - w * 0.24, y + h * 0.4])} ${pt([x - w / 2, y + h * 0.26])} ${pt([x - w / 2, y + h * 0.02])}` +
    `V${r1(t + h * 0.1)}C${pt([x - w * 0.38, t + h * 0.1])} ${pt([x - w * 0.2, t + h * 0.08])} ${pt([x, t])}Z`
  );
}

/** A small bug (a threat), head up, centred on c: a filled body and its legs. */
function bug(c: Point, s: number): { body: string; legs: string } {
  const [x, y] = c;
  const body = `M${pt([x - s * 0.3, y + s * 0.06])}a${r1(s * 0.3)} ${r1(s * 0.38)} 0 1 0 ${r1(s * 0.6)} 0a${r1(s * 0.3)} ${r1(s * 0.38)} 0 1 0 ${r1(-s * 0.6)} 0Z` + circle([x, y - s * 0.4], s * 0.15);
  let legs = "";
  for (const side of [-1, 1]) {
    legs += `M${pt([x + side * s * 0.26, y - s * 0.12])}L${pt([x + side * s * 0.56, y - s * 0.28])}`;
    legs += `M${pt([x + side * s * 0.3, y + s * 0.08])}L${pt([x + side * s * 0.62, y + s * 0.08])}`;
    legs += `M${pt([x + side * s * 0.26, y + s * 0.3])}L${pt([x + side * s * 0.54, y + s * 0.5])}`;
    legs += `M${pt([x + side * s * 0.06, y - s * 0.52])}L${pt([x + side * s * 0.22, y - s * 0.72])}`;
  }
  return { body, legs };
}

// ---------------------------------------------------------------------------------------------
// the frame every scene is laid out in
// ---------------------------------------------------------------------------------------------

type Frame = { x: number; y: number; w: number; h: number; d: number; fs: number };

/** The usable box (centred, capped) and its density d: 0 = a narrow phone panel, 1 = roomy. */
function frame(W: number, H: number): Frame {
  const pad = W < 280 ? 12 : 18;
  const w = Math.min(W - 2 * pad, 360);
  const h = Math.min(H - 2 * pad, 440);
  const d = clamp((Math.min(w / 340, h / 320) - 0.56) / 0.4, 0, 1);
  return { x: r1((W - w) / 2), y: r1((H - h) / 2), w, h, d, fs: d > 0.5 ? 12 : 11 };
}

function draft(id: FigureId, W: number, H: number, fs: number): Scene {
  return { id, w: W, h: H, fs, under: [], wires: [], nodes: [], inside: [], icons: [], over: [], labels: [], packets: [], marks: {} };
}

/** A connector: ink with rounded corners and its pencil twin. */
function wire(s: Scene, k: string, points: Point[], opts: Partial<Shape> = {}) {
  s.wires.push({ d: bend(points), pencil: roughPolyline(points, { seed: `${s.id}-${k}`, roughness: 0.7 }), k, ...opts });
}

/** A filled node outline (rounded rect) and its pencil twin. */
function node(s: Scene, k: string, x: number, y: number, w: number, h: number, r: number, opts: Partial<Shape> = {}) {
  s.nodes.push({ d: rect(x, y, w, h, r), pencil: roughRect(x, y, w, h, { seed: `${s.id}-${k}`, radius: r, roughness: 0.8 }), fill: "card", k, ...opts });
}

type Chip = { x: number; y: number; w: number; h: number; cx: number; cy: number };

/** A chip: [pictogram] label [status dot], centred on cx. */
function chip(s: Scene, fr: Frame, k: string, label: string, cx: number, top: number, opts: { icon?: IconKind; dot?: boolean; width?: number } = {}): Chip {
  const h = lerp(22, 27, fr.d);
  const padX = lerp(7, 9, fr.d);
  const ic = opts.icon ? lerp(11, 13, fr.d) : 0;
  const gap = opts.icon ? lerp(5, 6, fr.d) : 0;
  const dot = opts.dot ? 9 : 0;
  const w = opts.width ?? padX * 2 + ic + gap + tw(label, s.fs) + dot;
  const x = cx - w / 2;
  const cy = top + h / 2;
  node(s, k, x, top, w, h, h * 0.32);
  const content = ic + gap + tw(label, s.fs) + dot;
  const left = x + (w - content) / 2;
  if (opts.icon) s.icons.push(...icon(opts.icon, [left + ic / 2, cy], ic));
  s.labels.push({ x: r1(left + ic + gap), y: r1(cy + s.fs * 0.36), text: label });
  if (opts.dot) s.over.push({ d: circle([left + content - 3, cy], 2.7), fill: "tangerine", width: 0, k: `dot-${k}` });
  return { x, y: top, w, h, cx, cy };
}

// ---------------------------------------------------------------------------------------------
// cloud: Techbyheart (AWS EC2, S3, RDS; network security, threat detection, vulnerability
// assessment)
// ---------------------------------------------------------------------------------------------

function cloud(W: number, H: number): Scene {
  const fr = frame(W, H);
  const { x, y, w, h, d } = fr;
  const s = draft("cloud", W, H, fr.fs);
  const cx = x + w / 2;
  const ch = lerp(22, 27, d);
  const uY = y + lerp(10, 14, d);
  const bTop = y + lerp(46, 64, d);
  const bBot = y + h;
  const kidTop = bBot - lerp(16, 32, d) - ch;
  const ec2Top = bTop + Math.max(lerp(24, 38, d), (kidTop - bTop - ch) * 0.3);
  const trunkY = (ec2Top + ch + kidTop) / 2;
  const rdsX = x + w * 0.27;
  const s3X = x + w * 0.73;

  // AWS: the dashed account boundary
  s.wires.push({ d: rect(x, bTop, w, bBot - bTop, 12), pencil: roughRect(x, bTop, w, bBot - bTop, { seed: "cloud-aws", radius: 12, roughness: 0.8 }), dash: true, tone: "graphite", width: 1.3, k: "aws" });
  s.labels.push({ x: r1(x + 11), y: r1(bTop + 13 + s.fs * 0.36), text: "AWS", tone: "graphite" });

  // users -> network security -> EC2 -> RDS / S3
  const sw = lerp(15, 19, d);
  wire(s, "in", [P(cx, uY + 11), P(cx, bTop - sw * 0.6)]);
  wire(s, "gate", [P(cx, bTop + sw * 0.6), P(cx, ec2Top)]);
  wire(s, "to-rds", [P(cx, ec2Top + ch), P(cx, trunkY), P(rdsX, trunkY), P(rdsX, kidTop)]);
  wire(s, "to-s3", [P(cx, ec2Top + ch), P(cx, trunkY), P(s3X, trunkY), P(s3X, kidTop)]);

  const ui = lerp(12, 15, d);
  s.icons.push(...users([cx, uY], ui));
  s.labels.push({ x: r1(cx + ui * 1.3), y: r1(uY + s.fs * 0.36), text: "users", tone: "graphite" });

  s.nodes.push({ d: shield([cx, bTop], sw), pencil: roughRect(cx - sw / 2, bTop - sw * 0.59, sw, sw * 1.18, { seed: "cloud-shield", radius: sw * 0.4, roughness: 0.8 }), fill: "card", k: "shield" });
  s.inside.push({ d: shield([cx, bTop], sw), fill: "blue-soft", width: 0, k: "shield-flash", gone: true });
  s.icons.push({ d: check([cx, bTop + 0.5], sw * 0.5), width: 1.4, k: "shield-ok" });

  const ec2 = chip(s, fr, "ec2", "EC2", cx, ec2Top, { icon: "server", dot: true });
  const rds = chip(s, fr, "rds", "RDS", rdsX, kidTop, { icon: "db", dot: true });
  const s3 = chip(s, fr, "s3", "S3", s3X, kidTop, { icon: "bucket", dot: true });

  // the vulnerability scan: a line sweeps the account and ticks each resource as it passes
  const tick = lerp(7, 9, d);
  const scanTop = bTop + 6;
  const travel = bBot - bTop - 12;
  const okAt: number[] = [];
  for (const [k, c] of [["ec2", ec2], ["rds", rds], ["s3", s3]] as const) {
    s.over.push({ d: check([c.x + c.w + tick * 0.5 + 6, c.cy], tick), width: 1.6, tone: "blue", k: `ok-${k}` });
    okAt.push(r1((c.cy - scanTop) / travel * 100) / 100);
  }
  s.over.push({ d: `M${pt([x + 6, scanTop])}H${r1(x + w - 6)}`, tone: "blue", width: 1.6, k: "scan", gone: true });
  s.marks.scan = r1(travel);
  s.marks.okAt = okAt;

  // a threat, stopped at the shield
  const bs = lerp(12, 15, d);
  const rest: Point = P(cx - lerp(36, 52, d), bTop - lerp(15, 20, d));
  const b = bug(rest, bs);
  s.over.push({ d: b.body, fill: "ink", width: 0, k: "bug" }, { d: b.legs, width: 1.1, k: "bug" });
  s.over.push({ d: cross(rest, bs * 1.25), width: 1.8, tone: "tangerine", k: "bug-x" });
  s.labels.push({ x: r1(rest[0] - bs * 0.95), y: r1(rest[1] + s.fs * 0.36), text: "blocked", anchor: "end", k: "blocked" });
  s.marks.bugAt = rest;
  s.marks.bugFrom = P(x + 8 - rest[0], y + 2 - rest[1]);
  s.marks.bugHit = P(cx - sw * 0.85 - rest[0], bTop - sw * 0.25 - rest[1]);

  s.packets.push(
    { k: "req", kind: "request", track: [P(cx, uY + 11), P(cx, ec2.cy)] },
    { k: "to-rds", kind: "data", track: [P(cx, ec2.cy), P(cx, trunkY), P(rdsX, trunkY), P(rdsX, rds.cy)] },
    { k: "to-s3", kind: "data", track: [P(cx, ec2.cy), P(cx, trunkY), P(s3X, trunkY), P(s3X, s3.cy)] },
    { k: "resp", kind: "response", track: [P(cx, ec2.cy), P(cx, uY + 11)] },
  );
  return s;
}

// ---------------------------------------------------------------------------------------------
// ml: Rooman (Python; EDA, preprocessing, model building, evaluation, tuning)
// ---------------------------------------------------------------------------------------------

export const ML_STEPS = ["eda", "preprocess", "train", "evaluate", "tune"] as const;

function ml(W: number, H: number): Scene {
  const fr = frame(W, H);
  const { x, y, w, h, d } = fr;
  const s = draft("ml", W, H, fr.fs);
  const lh = lerp(16, 21, d);
  const logTop = y + h - ML_STEPS.length * lh;
  const top = y + 2;
  const bot = logTop - lerp(14, 24, d);
  const ax0 = x + 4;
  const ax1 = x + w - 2;

  // axes and a few ticks
  wire(s, "axes", [P(ax0, top), P(ax0, bot), P(ax1, bot)], { width: 1.4 });
  let ticks = "";
  for (let i = 1; i <= 4; i++) ticks += `M${pt([ax0 + ((ax1 - ax0) * i) / 5, bot])}v4`;
  for (let i = 1; i <= 3; i++) ticks += `M${pt([ax0, bot - ((bot - top) * i) / 4])}h-4`;
  s.icons.push({ d: ticks, width: 1.1, tone: "graphite" });

  // the data: an S-shaped relationship with noise, and two outliers
  const f = (t: number) => 0.1 + 0.76 / (1 + Math.exp(-8 * (t - 0.5)));
  const rnd = seeded("ml-points");
  const n = d > 0.4 ? 16 : 13;
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const t = 0.05 + (0.9 * i) / (n - 1) + (rnd() - 0.5) * 0.03;
    pts.push([t, f(t) + (rnd() - 0.5) * 0.15]);
  }
  const outs: Point[] = [
    [0.27, 0.84],
    [0.76, 0.18],
  ];
  // the data stops short of the axis end: the curve is labelled where it ends, "model"
  const room = tw("model", s.fs) + 14;
  const X = (t: number) => ax0 + 10 + t * (ax1 - ax0 - 12 - room);
  const Y = (v: number) => bot - 8 - v * (bot - top - 14);

  // least squares over the clean points: the first, straight fit
  const mt = pts.reduce((a, p) => a + p[0], 0) / n;
  const mv = pts.reduce((a, p) => a + p[1], 0) / n;
  const slope = pts.reduce((a, p) => a + (p[0] - mt) * (p[1] - mv), 0) / pts.reduce((a, p) => a + (p[0] - mt) ** 2, 0);
  const line = (t: number) => mv + slope * (t - mt);

  s.over.push({ d: `M${pt([X(0.02), Y(line(0.02))])}L${pt([X(0.98), Y(line(0.98))])}`, tone: "graphite", width: 1.4, k: "fit", rest: 0.35 });
  const curve: Point[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = 0.02 + (0.96 * i) / 28;
    curve.push(P(X(t), Y(f(t))));
  }
  const res: number[][] = [];
  pts.forEach((p, i) => {
    const px = X(p[0]);
    s.over.push({ d: `M${pt([px, Y(p[1])])}V${r1(Y(f(p[0])))}`, tone: "blue", width: 1.3, k: `res-${i}`, gone: true });
    res.push([r1(px), r1(Y(p[1])), r1(Y(line(p[0]))), r1(Y(f(p[0])))]);
  });
  s.over.push({ d: poly(curve), width: 2, k: "curve" });
  const r = lerp(2.3, 2.9, d);
  pts.forEach((p, i) => s.over.push({ d: circle(P(X(p[0]), Y(p[1])), r), fill: "ink", width: 0, k: `pt-${i}` }));
  outs.forEach((p, i) => {
    s.over.push({ d: circle(P(X(p[0]), Y(p[1])), r), fill: "ink", width: 0, k: `out-${i}`, rest: 0.3 });
    s.over.push({ d: cross(P(X(p[0]), Y(p[1])), r * 3.2), width: 1.5, tone: "tangerine", k: `outx-${i}` });
  });
  const end = curve[curve.length - 1];
  s.over.push({ d: circle(end, 4), fill: "tangerine", width: 1.2, k: "model" });
  s.labels.push({ x: r1(end[0] + 9), y: r1(end[1] + s.fs * 0.36), text: "model", tone: "tangerine", k: "model" });
  s.marks.res = res;

  // the run, notebook style: 01 eda ... 05 tune, each ticked when done
  const rows: number[] = [];
  ML_STEPS.forEach((step, i) => {
    const cy = logTop + lh * (i + 0.5);
    rows.push(r1(cy - lh / 2 + 1));
    s.labels.push({ x: r1(x + 8), y: r1(cy + s.fs * 0.36), text: `0${i + 1}`, tone: "graphite" });
    s.labels.push({ x: r1(x + 8 + tw("00  ", s.fs)), y: r1(cy + s.fs * 0.36), text: step });
    s.over.push({ d: circle(P(x + w - 9, cy), 1.6), fill: "pencil", width: 0, k: `pend-${i}`, gone: true });
    s.over.push({ d: check(P(x + w - 9, cy), lerp(8, 9.5, d)), width: 1.6, k: `done-${i}` });
  });
  s.under.push({ d: rect(x, rows[0], w, lh - 2, 4), fill: "lime", width: 0, k: "band", gone: true });
  s.marks.rows = rows;
  return s;
}

// ---------------------------------------------------------------------------------------------
// java: Dyashin (Java, Spring Boot, Hibernate, React, MySQL, REST APIs; Git, pull requests,
// code reviews)
// ---------------------------------------------------------------------------------------------

export const JAVA_LAYERS = [
  { k: "react", label: "React", icon: "window" },
  { k: "spring", label: "Spring Boot", icon: "braces" },
  { k: "hibernate", label: "Hibernate", icon: "orm" },
  { k: "mysql", label: "MySQL", icon: "db" },
] as const;

function java(W: number, H: number): Scene {
  const fr = frame(W, H);
  const { x, y, w, h, d } = fr;
  const s = draft("java", W, H, fr.fs);
  const cx = x + w / 2;
  const lift = lerp(20, 26, d);
  const yb = y + s.fs + 10; // the branch
  const yM = yb + lift; // main
  const bx0 = x + w * 0.12;
  const bx1 = x + w * 0.84;
  const span = bx1 - bx0;

  // main, and the feature branch that leaves it and merges back
  wire(s, "main", [P(x, yM), P(x + w, yM)], { width: 2 });
  s.labels.push({ x: r1(x), y: r1(yM + 15), text: "main", tone: "graphite" });
  s.over.push({ d: `M${pt([bx0, yM])}C${pt([bx0 + 12, yM])} ${pt([bx0 + 7, yb])} ${pt([bx0 + 20, yb])}H${r1(bx1 - 20)}`, tone: "blue", width: 2, k: "branch" });
  s.over.push({ d: `M${pt([bx1 - 20, yb])}C${pt([bx1 - 7, yb])} ${pt([bx1 - 12, yM])} ${pt([bx1, yM])}`, tone: "blue", width: 2, k: "merge" });
  s.over.push({ d: circle(P(bx0, yM), 3.2), fill: "ink", width: 0, k: "fork" });
  const cr = lerp(3.4, 4, d);
  s.over.push({ d: circle(P(bx0 + span * 0.32, yb), cr), fill: "card", tone: "blue", width: 2, k: "c-0" });
  s.over.push({ d: circle(P(bx0 + span * 0.54, yb), cr), fill: "card", tone: "blue", width: 2, k: "c-1" });
  s.labels.push({ x: r1(bx0 + span * 0.38), y: r1(yb - 9), text: "pull request", anchor: "middle", tone: "blue", k: "pr" });
  const rr = lerp(7, 8.5, d);
  const rv: Point = P(bx0 + span * 0.79, yb);
  s.over.push({ d: circle(rv, rr), fill: "lime", width: 1.4, k: "review" });
  s.over.push({ d: check(rv, rr * 1.05), width: 1.6, k: "review" });
  s.over.push({ d: circle(P(bx1, yM), 4.6), fill: "card", width: 2, k: "merged" });
  s.over.push({ d: circle(P(bx1, yM), 1.8), fill: "ink", width: 0, k: "merged" });
  s.labels.push({ x: r1(bx1), y: r1(yM + 15), text: "merged", anchor: "middle", tone: "graphite", k: "merged-l" });
  s.marks.review = rv;
  s.marks.merged = P(bx1, yM);

  // the stack a request runs through
  const ch = lerp(22, 27, d);
  const widest = Math.max(...JAVA_LAYERS.map((l) => tw(l.label, s.fs)));
  const cw = lerp(7, 9, d) * 2 + lerp(11, 13, d) + lerp(5, 6, d) + widest;
  const top = yM + lerp(26, 38, d);
  const room = y + h - top;
  const gap = clamp((room - 4 * ch) / 3, 10, lerp(18, 42, d));
  const used = 4 * ch + 3 * gap;
  const t0 = top + Math.max(0, (room - used) / 2);
  const chips = JAVA_LAYERS.map((l, i) => chip(s, fr, l.k, l.label, cx, t0 + i * (ch + gap), { icon: l.icon, width: cw }));
  chips.slice(0, -1).forEach((c, i) => wire(s, `hop-${i}`, [P(cx, c.y + c.h), P(cx, chips[i + 1].y)]));
  const mid = (i: number) => (chips[i].y + chips[i].h + chips[i + 1].y) / 2;
  s.labels.push({ x: r1(cx + 8), y: r1(mid(0) + s.fs * 0.36), text: "REST", tone: "graphite" });
  s.labels.push({ x: r1(cx + 8), y: r1(mid(2) + s.fs * 0.36), text: "SQL", tone: "graphite" });

  const cys = chips.map((c) => r1(c.cy));
  s.packets.push(
    { k: "req", kind: "request", track: [P(cx, cys[0]), P(cx, cys[3])] },
    { k: "data", kind: "data", track: [P(cx, cys[3]), P(cx, cys[1])] },
    { k: "resp", kind: "response", track: [P(cx, cys[1]), P(cx, cys[0])] },
  );
  s.marks.cys = cys;
  return s;
}

// ---------------------------------------------------------------------------------------------
// ops: Maruti Flex (React / Next.js, MongoDB, Google Apps Script, Google Sheets, REST APIs;
// responsive UIs; production apps)
// ---------------------------------------------------------------------------------------------

function ops(W: number, H: number): Scene {
  const fr = frame(W, H);
  const { x, y, w, h, d } = fr;
  const s = draft("ops", W, H, fr.fs);
  const lx = x + w * 0.24;
  const rx = x + w * 0.76;
  const tile = lerp(26, 34, d);
  const ch = lerp(22, 27, d);
  const head = s.fs + lerp(6, 8, d); // the source labels above the tiles
  const foot = lerp(22, 26, d); // the label row under the app
  const winX = x + w * 0.06;
  const winW = w * 0.78;
  // the window keeps a laptop's proportions: spare height lengthens the pipes, the rest centres it
  let g1 = lerp(16, 24, d);
  let g2 = lerp(16, 26, d);
  const fixed = head + tile + g1 + ch + g2 + foot;
  const winH = clamp(h - fixed, 74, winW * 0.66);
  let spare = Math.max(0, h - fixed - winH);
  const grow = Math.min(spare / 2, 22);
  g1 += grow;
  g2 += grow;
  spare -= grow * 2;
  const oy = y + spare / 2;
  const tileTop = oy + head;
  const chipTop = tileTop + tile + g1;
  const winTop = chipTop + ch + g2;
  const winBot = winTop + winH;
  const footY = winBot + foot - 3;

  // the sources
  s.labels.push({ x: r1(lx), y: r1(oy + s.fs * 0.9), text: "Google Sheets", anchor: "middle" });
  s.labels.push({ x: r1(rx), y: r1(oy + s.fs * 0.9), text: "MongoDB", anchor: "middle" });
  const gx = lx - tile * 0.7;
  const gw = tile * 1.4;
  node(s, "sheets", gx, tileTop, gw, tile, 5);
  node(s, "mongo", rx - tile / 2, tileTop, tile, tile, 6);
  // the sheet: a header row, three rows and the new one
  const rowH = tile / 5;
  s.inside.push({ d: rect(gx + 0.6, tileTop + 0.6, gw - 1.2, rowH, 4), fill: "line", width: 0 });
  s.inside.push({ d: rect(gx + 1, tileTop + rowH * 4, gw - 2, rowH - 0.6, 1), fill: "lime", width: 0, k: "row" });
  let grid = "";
  for (let i = 1; i < 5; i++) grid += `M${pt([gx, tileTop + rowH * i])}h${r1(gw)}`;
  for (let i = 1; i < 4; i++) grid += `M${pt([gx + (gw * i) / 4, tileTop])}v${r1(tile)}`;
  s.icons.push({ d: grid, width: 0.9, tone: "graphite" });
  s.icons.push(...icon("db", [rx, tileTop + tile / 2], tile * 0.6));

  // the pipes
  const roomy = d > 0.35;
  const apps = chip(s, fr, "apps", "Apps Script", lx, chipTop, { icon: roomy ? "bolt" : undefined });
  chip(s, fr, "api", "REST API", rx, chipTop, { icon: roomy ? "braces" : undefined });
  s.inside.push({ d: rect(apps.x, apps.y, apps.w, apps.h, apps.h * 0.32), fill: "lime-soft", width: 0, k: "apps-flash", gone: true });
  wire(s, "sheets-apps", [P(lx, tileTop + tile), P(lx, chipTop)]);
  wire(s, "apps-app", [P(lx, chipTop + ch), P(lx, winTop)]);
  wire(s, "mongo-api", [P(rx, tileTop + tile), P(rx, chipTop)]);
  wire(s, "api-app", [P(rx, chipTop + ch), P(rx, winTop)]);

  // the app on a laptop: a title bar, a heading, three figures, then rows
  node(s, "win", winX, winTop, winW, winH, 8);
  const bar = lerp(11, 14, d);
  s.inside.push({ d: `M${pt([winX, winTop + bar])}H${r1(winX + winW)}`, tone: "line", width: 1 });
  (["lime", "blue", "tangerine"] as const).forEach((fill, i) => {
    s.inside.push({ d: circle(P(winX + 8 + i * 6.5, winTop + bar / 2), lerp(1.8, 2.2, d)), fill, width: 0 });
  });
  const pad = lerp(7, 10, d);
  const inner = winW - pad * 2;
  const sgap = lerp(5, 7, d);
  let cy = winTop + bar + pad * 0.8;
  s.inside.push({ d: rect(winX + pad, cy, winW * 0.32, lerp(4, 5, d), 2), fill: "ink", width: 0, k: "wrow" });
  cy += lerp(9, 13, d);
  const statH = lerp(14, 22, d);
  const statW = (inner - 2 * sgap) / 3;
  let stats = "";
  let bars = "";
  for (let i = 0; i < 3; i++) {
    const sx = winX + pad + i * (statW + sgap);
    stats += rect(sx, cy, statW, statH, 3);
    bars += rect(sx + 5, cy + statH * 0.36, statW * (0.5 - i * 0.08), statH * 0.28, 1.2);
  }
  s.inside.push({ d: stats, fill: "paper-2", width: 0, k: "wrow-s" });
  s.inside.push({ d: bars, fill: "line", width: 0, k: "wrow-b" });
  cy += statH + lerp(7, 10, d);
  const rowStep = lerp(10, 15, d);
  const rowCount = clamp(Math.floor((winBot - pad * 0.6 - cy) / rowStep), 1, 7);
  for (let i = 0; i < rowCount; i++) {
    const ry = cy + i * rowStep;
    const sq = rowStep * 0.56;
    s.inside.push({
      d: rect(winX + pad, ry, sq, sq, 2) + rect(winX + pad + sq + 5, ry + sq * 0.12, inner * 0.46, sq * 0.32, 1.5) + rect(winX + pad + sq + 5, ry + sq * 0.6, inner * 0.28, sq * 0.26, 1.2),
      fill: i === 0 ? "tangerine-soft" : "paper-2",
      width: 0,
      k: `wrow-${i}`,
    });
  }

  // the same app on a phone (responsive), over the laptop's corner
  const phW = lerp(30, 46, d);
  const phH = Math.min(phW * 1.85, winH * 0.92);
  const phX = winX + winW - phW * 0.45;
  const phY = winBot - phH + lerp(8, 12, d);
  node(s, "phone", phX, phY, phW, phH, lerp(5, 7, d));
  s.inside.push({ d: `M${pt([phX + phW * 0.38, phY + 4])}H${r1(phX + phW * 0.62)}`, tone: "line", width: 1.6 });
  const cardH = (phH - 16) / 3 - 3;
  for (let i = 0; i < 3; i++) {
    s.inside.push({ d: rect(phX + 4, phY + 10 + i * (cardH + 3), phW - 8, cardH, 2), fill: i === 0 ? "tangerine-soft" : "paper-2", width: 0, k: `pcard-${i}` });
  }

  // under the app: what it is built with, and that it is live
  s.labels.push({ x: r1(winX), y: r1(footY), text: "React / Next.js" });
  const liveX = winX + winW;
  s.over.push({ d: circle(P(liveX - tw("live", s.fs) - 8, footY - s.fs * 0.34), 3), fill: "tangerine", width: 0, k: "live" });
  s.labels.push({ x: r1(liveX), y: r1(footY), text: "live", anchor: "end", tone: "tangerine", k: "live" });

  s.packets.push(
    { k: "sync", kind: "data", track: [P(lx, tileTop + tile / 2), P(lx, winTop + bar / 2)] },
    { k: "req", kind: "request", track: [P(rx, winTop + bar / 2), P(rx, tileTop + tile / 2)] },
    { k: "data", kind: "data", track: [P(rx, tileTop + tile / 2), P(rx, winTop + bar / 2)] },
  );
  return s;
}

/** The finished figure for a box of W x H CSS px; null when the box is too small to draw in. */
export function buildFigure(id: FigureId, W: number, H: number): Scene | null {
  if (W < 150 || H < 150) return null;
  switch (id) {
    case "cloud":
      return cloud(W, H);
    case "ml":
      return ml(W, H);
    case "java":
      return java(W, H);
    case "ops":
      return ops(W, H);
  }
}

/** A point `t` (0..1) of the way along a polyline. */
export function along(track: readonly Point[], t: number): Point {
  if (track.length < 2) return track[0] ?? [0, 0];
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < track.length; i++) {
    const l = Math.hypot(track[i][0] - track[i - 1][0], track[i][1] - track[i - 1][1]);
    lens.push(l);
    total += l;
  }
  let left = clamp(t, 0, 1) * total;
  for (let i = 0; i < lens.length; i++) {
    if (left <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? Math.min(1, left / lens[i]) : 0;
      return [track[i][0] + (track[i + 1][0] - track[i][0]) * k, track[i][1] + (track[i + 1][1] - track[i][1]) * k];
    }
    left -= lens[i];
  }
  return track[track.length - 1];
}
