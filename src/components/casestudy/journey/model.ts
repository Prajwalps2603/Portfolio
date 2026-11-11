import type { ArchitectureLayer, Project } from "@/content";
import { journeys } from "@/content/journeys";
import { seeded, type Seed } from "@/components/sketch/rough";

/**
 * THE REQUEST JOURNEY, as data: a featured project's `flow` (the stops, in order) joined with
 * src/content/journeys.ts (what happens at each stop and in which layer), laid out on the project's
 * architecture lanes. Pure (no DOM), server-safe.
 *
 * Diagram vocabulary (shared with every diagram on the site, DIAGRAM GRAMMAR):
 *   stop 0 = "You" · stops 1..N = the flow's steps (nodes) · stop N+1 = "You" again (the response)
 *   segment j joins stop j and stop j+1: segments 0..N-1 carry the lime request in, segment N is the
 *   return path the tangerine response takes back to you.
 * `s` (0..N+1) is the journey position: an integer = the packet is inside that stop.
 */

export type Lane = ArchitectureLayer["layer"];

const ORDER: Lane[] = ["Interface", "API", "Intelligence", "Data", "Infrastructure"];

/** The mono micro-label of each layer (the grammar's INTERFACE / API / INTELLIGENCE / DATA / INFRA). */
export const LANE_LABEL: Record<Lane, string> = {
  Interface: "Interface",
  API: "API",
  Intelligence: "Intelligence",
  Data: "Data",
  Infrastructure: "Infra",
};

export type JourneyStop = {
  /** 1-based position in the flow. */
  k: number;
  /** The flow step, verbatim from projects.ts. */
  step: string;
  layer: Lane;
  /** Index into JourneyModel.lanes (the column). */
  lane: number;
  tech?: string;
  does?: string;
  note?: string;
};

export type JourneyModel = {
  id: string;
  name: string;
  /** The architecture's layers in canonical order (plus any layer a step needs), with their items. */
  lanes: { layer: Lane; items: string[] }[];
  stops: JourneyStop[];
};

export function buildJourney(project: Project): JourneyModel | null {
  const flow = project.flow ?? [];
  if (flow.length < 2) return null;
  const details = journeys[project.id] ?? [];
  // a step without details stays in the previous step's layer (a content gap never breaks the diagram)
  let last: Lane = project.architecture[0]?.layer ?? "Interface";
  const layers = flow.map((_, i) => {
    last = details[i]?.layer ?? last;
    return last;
  });
  const used = new Set<Lane>([...project.architecture.map((l) => l.layer), ...layers]);
  const lanes = ORDER.filter((l) => used.has(l)).map((layer) => ({
    layer,
    items: project.architecture.find((a) => a.layer === layer)?.items ?? [],
  }));
  const stops = flow.map((step, i) => ({
    k: i + 1,
    step,
    layer: layers[i],
    lane: lanes.findIndex((l) => l.layer === layers[i]),
    tech: details[i]?.tech,
    does: details[i]?.does,
    note: details[i]?.note,
  }));
  return { id: project.id, name: project.shortTitle, lanes, stops };
}

/**
 * What the request touched, per layer, in board (lane) order: each stop's `tech` (journeys.ts),
 * split on its " · " list separator and de-duplicated; the step's own name when a stop has no
 * tech. Only the layers the request passes through, so `.length` is the layer count.
 */
export function touchedLayers(model: JourneyModel): { layer: Lane; tech: string[] }[] {
  return model.lanes
    .map((l, j) => {
      const tech: string[] = [];
      for (const s of model.stops) {
        if (s.lane !== j) continue;
        for (const part of (s.tech ?? s.step).split(" · ")) {
          const t = part.trim();
          if (t && !tech.includes(t)) tech.push(t);
        }
      }
      return { layer: l.layer, tech };
    })
    .filter((r) => r.tech.length > 0);
}

/** Which stops and segments a focused node (1..N) is connected to; null = nothing focused. */
export function connected(focus: number | null, n: number) {
  return {
    stop: (i: number) => focus === null || Math.abs(i - focus) <= 1 || (i === 0 && focus === n) || (i === n + 1 && focus <= 1),
    seg: (j: number) => focus === null || j === focus || j === focus - 1,
  };
}

// -------------------------------------------------------------------------------------------
// Hand-drawn connectors (the seeded generator's PRNG, so server and client agree)
// -------------------------------------------------------------------------------------------

export type Pt = readonly [number, number];

/** Number -> compact SVG string, 1 decimal, never "-0" (same as the generator). */
function f(n: number): string {
  const v = Math.round(n * 10) / 10;
  return (v === 0 ? 0 : v).toString();
}

/**
 * A top-down connector from `a` (the bottom edge of one box) to `b` (the top edge of the next):
 * one cubic with vertical tangents, so a step into another lane reads as a smooth S and a step in
 * the same lane as a straight drop. `amp` is the hand's wobble in px; `passes` 2 = pencil look.
 */
export function roughDrop(a: Pt, b: Pt, seed: Seed, { amp = 1.2, passes = 1 }: { amp?: number; passes?: 1 | 2 } = {}): string {
  const r = seeded(`${String(seed)}|drop`);
  const j = (k: number) => (r() * 2 - 1) * amp * k;
  const dy = b[1] - a[1];
  let d = "";
  for (let p = 0; p < passes; p++) {
    const k = p ? 0.75 : 1;
    const ax = a[0] + j(0.5 * k);
    const bx = b[0] + j(0.5 * k);
    d += `M${f(ax)} ${f(a[1])}C${f(ax + j(k))} ${f(a[1] + dy * 0.5 + j(k))} ${f(bx + j(k))} ${f(b[1] - dy * 0.5 + j(k))} ${f(bx)} ${f(b[1])}`;
  }
  return d;
}

/** The middle of roughDrop's curve and its direction (radians), for a doodled arrowhead. */
export function dropMid(a: Pt, b: Pt): { at: Pt; angle: number } {
  return { at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], angle: Math.atan2(b[1] - a[1], 2 * (b[0] - a[0])) };
}

/** A quick V arrowhead pointing along `angle`, its tip a little past `at`. */
export function roughHead(at: Pt, angle: number, seed: Seed, size = 7): string {
  const r = seeded(`${String(seed)}|head`);
  const tip: Pt = [at[0] + Math.cos(angle) * 3, at[1] + Math.sin(angle) * 3];
  const arm = (side: 1 | -1) => {
    const a = angle + Math.PI + side * (0.5 + (r() * 2 - 1) * 0.06);
    const l = size * (0.92 + r() * 0.16);
    return `${f(tip[0] + Math.cos(a) * l)} ${f(tip[1] + Math.sin(a) * l)}`;
  };
  return `M${arm(1)}L${f(tip[0])} ${f(tip[1])}L${arm(-1)}`;
}

/**
 * The return path: out of the last stop's left side, along the left rail, up, and back into
 * "You" from the left. Rounded corners; drawn dashed, so the wobble stays small.
 */
export function returnPath(from: Pt, railX: number, to: Pt, seed: Seed, radius = 14): string {
  const r = seeded(`${String(seed)}|return`);
  const j = () => (r() * 2 - 1) * 0.8;
  const rad = Math.max(4, Math.min(radius, (from[1] - to[1]) / 2, (from[0] - railX) / 2, (to[0] - railX) / 2));
  const y1 = from[1];
  const y2 = to[1];
  return (
    `M${f(from[0])} ${f(y1)}` +
    `C${f(from[0] - (from[0] - railX) * 0.35)} ${f(y1 + j())} ${f(railX + rad * 2)} ${f(y1 + j())} ${f(railX + rad)} ${f(y1)}` +
    `Q${f(railX)} ${f(y1)} ${f(railX)} ${f(y1 - rad)}` +
    `C${f(railX + j())} ${f(y1 - (y1 - y2) * 0.35)} ${f(railX + j())} ${f(y2 + (y1 - y2) * 0.35)} ${f(railX)} ${f(y2 + rad)}` +
    `Q${f(railX)} ${f(y2)} ${f(railX + rad)} ${f(y2)}` +
    `C${f(railX + rad * 2)} ${f(y2 + j())} ${f(to[0] - (to[0] - railX) * 0.3)} ${f(y2 + j())} ${f(to[0])} ${f(y2)}`
  );
}

// -------------------------------------------------------------------------------------------
// Scroll -> journey position
// -------------------------------------------------------------------------------------------

const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))) / 2;

export type JourneyPlan = {
  /** Scroll distances (px past the pin start) at which stop k (1..N) is centred: its card is on the reading line. */
  at: number[];
  /** Half-width of the dwell around each stop (the packet rests inside it while you read). */
  dwell: number;
  /** Scroll distance of the first leg (You -> stop 1). */
  lead: number;
  /** Scroll distance of the return leg. */
  back: number;
};

/**
 * The journey position s (0..N+1) for a scroll distance d: the packet rests in each stop while its
 * card crosses the reading line, and travels between stops (eased in and out) in between.
 */
export function positionAt(d: number, plan: JourneyPlan): number {
  const { at, dwell, lead, back } = plan;
  const n = at.length;
  if (!n) return 0;
  const go = at[0] - dwell - lead;
  if (d <= go) return 0;
  if (d < at[0] - dwell) return easeInOut((d - go) / lead);
  for (let i = 0; i < n; i++) {
    if (d <= at[i] + dwell) return i + 1;
    if (i + 1 < n && d < at[i + 1] - dwell) {
      const from = at[i] + dwell;
      return i + 1 + easeInOut((d - from) / Math.max(1, at[i + 1] - dwell - from));
    }
  }
  const from = at[n - 1] + dwell;
  return d < from + back ? n + easeInOut((d - from) / back) : n + 1;
}

/** Inverse for seeking: the scroll distance that centres stop k (1..N). */
export function distanceFor(k: number, plan: JourneyPlan): number {
  return plan.at[Math.max(0, Math.min(plan.at.length - 1, k - 1))] ?? 0;
}

// -------------------------------------------------------------------------------------------
// Path sampling (packets follow the drawn path without calling getPointAtLength per frame)
// -------------------------------------------------------------------------------------------

export type Lut = { pts: Float32Array; len: number };

/** Sample a path into `count` + 1 points (x, y pairs). */
export function sampleLut(path: SVGGeometryElement, count = 64): Lut {
  let len = 0;
  try {
    len = path.getTotalLength();
  } catch {
    len = 0;
  }
  const pts = new Float32Array((count + 1) * 2);
  for (let i = 0; i <= count; i++) {
    const p = len ? path.getPointAtLength((len * i) / count) : { x: 0, y: 0 };
    pts[i * 2] = p.x;
    pts[i * 2 + 1] = p.y;
  }
  return { pts, len };
}

/** Point and heading (radians) at t (0..1) along a sampled path. */
export function lutAt(lut: Lut, t: number): [number, number, number] {
  const count = lut.pts.length / 2 - 1;
  const x = Math.min(count, Math.max(0, t * count));
  const i = Math.min(count - 1, Math.floor(x));
  const u = x - i;
  const ax = lut.pts[i * 2];
  const ay = lut.pts[i * 2 + 1];
  const bx = lut.pts[i * 2 + 2];
  const by = lut.pts[i * 2 + 3];
  return [ax + (bx - ax) * u, ay + (by - ay) * u, Math.atan2(by - ay, bx - ax)];
}
