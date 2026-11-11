import { roughRect, seeded, tight, type Point } from "@/components/sketch/rough";
import type { DiagramEdge, DiagramSpec } from "./spec";

/**
 * DIAGRAM GEOMETRY: pure functions (no DOM, no React). Deterministic: the same spec and boxes give
 * the same paths.
 *
 * 1. orderLanes()  - the order of the nodes inside each lane, chosen so edges stay short, hops
 *                    inside a lane are neighbours and long edges do not run through nodes.
 * 2. planGrid()    - a CSS grid that lays the lanes out (rows = top to bottom, columns = left to
 *                    right), centring short lanes; the DOM does the sizing (real text, real fonts).
 * 3. routeEdges()  - given the MEASURED node boxes: every edge as a hand-drawn path (+ its tight
 *                    twin, same commands, for the compile) and a sampled track that packets follow
 *                    from the inside of one card to the inside of the next (they slide under them).
 */

export type Orientation = "rows" | "columns";
export type Box = { x: number; y: number; w: number; h: number };

// -------------------------------------------------------------------------------------------
// 1. Ordering
// -------------------------------------------------------------------------------------------

function permutations<T>(list: T[]): T[][] {
  if (list.length <= 1) return [list];
  const out: T[][] = [];
  list.forEach((item, i) => {
    for (const rest of permutations([...list.slice(0, i), ...list.slice(i + 1)])) out.push([item, ...rest]);
  });
  return out;
}

/**
 * Node order per lane. Small lanes (<= 5 nodes) try every permutation against a whole-diagram
 * cost: cross-lane edges want equal positions, hops inside a lane want to be neighbours, edges that
 * skip lanes should not pass over a node, and the content's own order breaks ties.
 */
export function orderLanes(spec: DiagramSpec): string[][] {
  return layoutLanes(spec).order;
}

/**
 * The order of every lane (see orderLanes) and its sideways offset, in slots (0 = centred): a lane
 * of ONE part, in a diagram whose widest lane has more, may sit under any slot or half-slot, so it
 * lines up with the parts it talks to and a long edge into it gets a straight run down a gutter
 * instead of a detour round the outside. Centred wins ties. (planGrid applies the offsets only
 * when no lane wraps.)
 */
export function layoutLanes(spec: DiagramSpec): { order: string[][]; offsets: number[] } {
  const order = spec.lanes.map((l) => [...l.nodes]);
  const slots = Math.max(1, ...order.map((r) => r.length));
  const offsets = order.map(() => 0);
  const origIdx = new Map<string, number>();
  spec.lanes.forEach((l) => l.nodes.forEach((n, i) => origIdx.set(n, i)));
  const laneOf = (n: string) => spec.nodes[n].lane;

  const cost = (): number => {
    const pos = new Map<string, number>();
    const idx = new Map<string, number>();
    order.forEach((row, li) => row.forEach((n, i) => (pos.set(n, i - (row.length - 1) / 2 + offsets[li]), idx.set(n, i))));
    let c = 0;
    offsets.forEach((off) => (c += 0.05 * Math.abs(off)));
    for (const e of spec.edges) {
      const w = e.kind === "route" ? 2 : 1;
      const la = laneOf(e.a);
      const lb = laneOf(e.b);
      if (la === lb) {
        c += w * 3 * Math.max(0, Math.abs((idx.get(e.a) ?? 0) - (idx.get(e.b) ?? 0)) - 1);
        continue;
      }
      const pa = pos.get(e.a) ?? 0;
      const pb = pos.get(e.b) ?? 0;
      c += w * Math.abs(pa - pb);
      const lo = Math.min(la, lb);
      const hi = Math.max(la, lb);
      for (let t = lo + 1; t < hi; t++) {
        const p = pa + ((pb - pa) * (t - la)) / (lb - la);
        if (order[t].some((n) => Math.abs((pos.get(n) ?? 0) - p) < 0.45)) c += w * 0.75;
      }
    }
    order.forEach((row) => row.forEach((n, i) => (c += 0.01 * Math.abs(i - (origIdx.get(n) ?? i)))));
    return c;
  };

  const L = order.length;
  for (let sweep = 0; sweep < 4; sweep++) {
    const seq = Array.from({ length: L }, (_, i) => (sweep % 2 === 0 ? i : L - 1 - i));
    for (const li of seq) {
      const k = order[li].length;
      if (k === 1 && slots > 1) {
        // a lone part: every slot and half-slot, centred first
        const room = (slots - 1) / 2;
        let bestOff = offsets[li];
        let bestCost = cost();
        for (let o = -room; o <= room + 1e-9; o += 0.5) {
          offsets[li] = o;
          const c = cost();
          if (c < bestCost - 1e-9) {
            bestOff = o;
            bestCost = c;
          }
        }
        offsets[li] = bestOff;
        continue;
      }
      if (k < 2 || k > 5) continue;
      let best = order[li];
      let bestCost = cost();
      for (const perm of permutations(order[li])) {
        order[li] = perm;
        const c = cost();
        if (c < bestCost - 1e-9) {
          best = perm;
          bestCost = c;
        }
      }
      order[li] = best;
    }
  }
  return { order, offsets };
}

// -------------------------------------------------------------------------------------------
// 2. Grid plan
// -------------------------------------------------------------------------------------------

export type GridPlan = {
  orientation: Orientation;
  /** Slots per track (the widest track). */
  slots: number;
  /** Node ids per track (a lane wraps into several tracks when it is wider than `slots`), in cross order. */
  tracks: string[][];
  /** Lane index of every track. */
  trackLane: number[];
  /** Track index of every node. */
  trackOf: Record<string, number>;
  /** Grid templates: the lane axis (with gap tracks) and the slot axis. */
  templateLanes: string;
  templateSlots: string;
  /** grid-row / grid-column per node. */
  area: Record<string, { gridRow: string; gridColumn: string }>;
  /** Nodes alone in their track (rows): they span a stretch of the row centred on their place and may grow past one slot. */
  alone: Record<string, boolean>;
  /** Slots the grid area of a lone node spans (its minimum width is still one slot). */
  spanSlots: Record<string, number>;
};

/**
 * The grid: 2 x slots tracks on the slot axis (a node spans 2, so a short track sits centred,
 * offset by half a slot), and on the lane axis one track per node track with gap tracks between
 * lanes (`fill`: the gaps share the free space, so the diagram fills its window).
 */
export function planGrid(order: string[][], orientation: Orientation, maxPerTrack: number, fill: boolean, offsets?: readonly number[]): GridPlan {
  const per = Math.max(1, orientation === "rows" ? maxPerTrack : Math.max(1, ...order.map((r) => r.length)));
  const tracks: string[][] = [];
  const trackLane: number[] = [];
  order.forEach((row, li) => {
    if (!row.length) return;
    const n = Math.ceil(row.length / per);
    const size = Math.ceil(row.length / n);
    for (let t = 0; t < n; t++) {
      tracks.push(row.slice(t * size, (t + 1) * size));
      trackLane.push(li);
    }
  });
  const slots = Math.max(1, ...tracks.map((t) => t.length));
  // lane offsets (layoutLanes) hold in the frame of the widest lane: only while no lane wraps
  const wraps = tracks.length !== order.filter((r) => r.length).length;
  const offsetOf = (ti: number) => (offsets && !wraps ? (offsets[trackLane[ti]] ?? 0) : 0);
  const laneGap = fill ? "minmax(var(--dg-lane-gap),1fr)" : "var(--dg-lane-gap)";
  const parts: string[] = [];
  const line: number[] = [];
  tracks.forEach((_, ti) => {
    if (ti > 0) parts.push(trackLane[ti] === trackLane[ti - 1] ? "var(--dg-sub-gap)" : laneGap);
    parts.push(orientation === "columns" ? "minmax(0,1fr)" : "auto");
    line.push(parts.length);
  });
  const trackOf: Record<string, number> = {};
  const area: Record<string, { gridRow: string; gridColumn: string }> = {};
  const alone: Record<string, boolean> = {};
  const spanSlots: Record<string, number> = {};
  tracks.forEach((ids, ti) => {
    const k = ids.length;
    const off = Math.round(offsetOf(ti) * 2);
    ids.forEach((id, i) => {
      trackOf[id] = ti;
      const single = orientation === "rows" && k === 1 && slots > 1;
      alone[id] = single;
      // a lone part spans the widest stretch of the row centred on its place (all of it when it is
      // centred), so a long label can still grow past one slot instead of wrapping
      const start = slots - k + 1 + 2 * i + off;
      const grow = single ? Math.min(start - 1, slots * 2 - (start + 1)) : 0;
      const slot = `${start - grow} / span ${2 + grow * 2}`;
      spanSlots[id] = 1 + grow;
      const lane = `${line[ti]}`;
      area[id] = orientation === "rows" ? { gridRow: lane, gridColumn: slot } : { gridRow: slot, gridColumn: lane };
    });
  });
  return {
    orientation,
    slots,
    tracks,
    trackLane,
    trackOf,
    templateLanes: parts.join(" "),
    templateSlots: `repeat(${slots * 2},minmax(0,1fr))`,
    area,
    alone,
    spanSlots,
  };
}

/**
 * Rows (top to bottom) or columns (left to right): whichever lets the nodes keep a comfortable
 * size in this box.
 */
export function chooseOrientation(spec: DiagramSpec, width: number, height: number): Orientation {
  const lanes = spec.lanes.filter((l) => l.nodes.length).length || 1;
  const most = Math.max(1, ...spec.lanes.map((l) => l.nodes.length));
  const nodeW = 150;
  const nodeH = 54;
  const rows = Math.min(width / (most * nodeW + (most - 1) * 20), height / (lanes * nodeH + (lanes - 1) * 16));
  const cols = Math.min(width / (lanes * nodeW + (lanes - 1) * 20), height / (most * nodeH + (most - 1) * 16));
  return cols > rows * 1.08 ? "columns" : "rows";
}

/** How many nodes fit side by side across `cross` px. */
export function fitPerTrack(spec: DiagramSpec, cross: number, minNode: number, gap: number): number {
  const most = Math.max(1, ...spec.lanes.map((l) => l.nodes.length));
  return Math.max(1, Math.min(most, Math.floor((cross + gap) / (minNode + gap))));
}

// -------------------------------------------------------------------------------------------
// 3. Routing
// -------------------------------------------------------------------------------------------

type Vec = readonly [number, number];
/** A waypoint in abstract (main, cross) space and the direction the path travels through it. */
type Way = { p: Vec; d: Vec };
type Seg = { p0: Point; c1: Point; c2: Point; p3: Point };

export type Track = {
  /** x, y pairs. */
  pts: Float32Array;
  /** Arc length at every point. */
  acc: Float32Array;
  total: number;
  /** Arc lengths where the visible part (between the two cards) starts and ends. */
  visStart: number;
  visEnd: number;
};

export type EdgeGeom = {
  id: string;
  a: string;
  b: string;
  kind: DiagramEdge["kind"];
  /** Hand-drawn path, 2 passes (sketch + ship). */
  rough: string;
  /** Its tight twin (same commands). */
  tight: string;
  /** The exact visible curve, one pass, from a's border to b's border (ink traces). */
  line: string;
  /** Packet track from inside a to inside b. */
  track: Track;
};

type ABox = { m0: number; m1: number; c0: number; c1: number; mc: number; cc: number };

function abox(b: Box, o: Orientation): ABox {
  return o === "rows"
    ? { m0: b.y, m1: b.y + b.h, c0: b.x, c1: b.x + b.w, mc: b.y + b.h / 2, cc: b.x + b.w / 2 }
    : { m0: b.x, m1: b.x + b.w, c0: b.y, c1: b.y + b.h, mc: b.x + b.w / 2, cc: b.y + b.h / 2 };
}

const toXY = (v: Vec, o: Orientation): Point => (o === "rows" ? [v[1], v[0]] : [v[0], v[1]]);
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
const add = (a: Vec, b: Vec, k = 1): Vec => [a[0] + b[0] * k, a[1] + b[1] * k];
const len = (v: Vec) => Math.hypot(v[0], v[1]);
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1];

/** One cubic between two waypoints: leaves along the first direction, arrives along the second. */
function cubicBetween(P: Way, Q: Way): [Vec, Vec, Vec, Vec] {
  const dv = sub(Q.p, P.p);
  const dist = len(dv) || 1;
  const k1 = Math.max(dist * 0.18, Math.min(dist * 0.9, Math.abs(dot(dv, P.d)) * 0.55));
  const k2 = Math.max(dist * 0.18, Math.min(dist * 0.9, Math.abs(dot(dv, Q.d)) * 0.55));
  return [P.p, add(P.p, P.d, k1), add(Q.p, Q.d, -k2), Q.p];
}

type Port = { node: string; side: "m+" | "m-" | "c+" | "c-"; key: number; at: number };

/** How a long edge gets past the tracks between its ends. */
type Pick = "greedy" | "left" | "right";
const PICKS: Pick[] = ["greedy", "left", "right"];

const orient = (a: Vec, b: Vec, c: Vec) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
/** Two segments cross properly (touching ends, e.g. two edges leaving one card, do not count). */
function segmentsCross(a: Vec, b: Vec, c: Vec, d: Vec): boolean {
  const d1 = orient(c, d, a);
  const d2 = orient(c, d, b);
  const d3 = orient(a, b, c);
  const d4 = orient(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
/** Proper crossings between two polylines (waypoints of the visible edges: their curves' skeletons). */
function crossings(p: Vec[], q: Vec[]): number {
  let n = 0;
  for (let i = 0; i < p.length - 1; i++) for (let j = 0; j < q.length - 1; j++) if (segmentsCross(p[i], p[i + 1], q[j], q[j + 1])) n++;
  return n;
}

/**
 * Route every edge between measured node boxes. `cross` is the extent of the cross axis (the
 * width in rows), `pad` the margin long edges keep from it.
 */
export function routeEdges({
  spec,
  plan,
  boxes,
  cross,
  pad,
  roughness = 1,
}: {
  spec: DiagramSpec;
  plan: GridPlan;
  boxes: Record<string, Box>;
  cross: number;
  pad: number;
  roughness?: number;
}): Record<string, EdgeGeom> {
  const o = plan.orientation;
  const ab: Record<string, ABox> = {};
  for (const id of Object.keys(boxes)) ab[id] = abox(boxes[id], o);

  // track bands (main axis) and free cross intervals
  const bands = plan.tracks.map((ids) => {
    const bs = ids.map((id) => ab[id]).filter(Boolean);
    return { m0: Math.min(...bs.map((b) => b.m0)), m1: Math.max(...bs.map((b) => b.m1)), spans: bs.map((b) => [b.c0, b.c1] as const).sort((p, q) => p[0] - q[0]) };
  });
  const clear = 7;
  const free = bands.map((band) => {
    const out: [number, number][] = [];
    let lo = pad;
    for (const [c0, c1] of band.spans) {
      if (c0 - clear >= lo) out.push([lo, c0 - clear]);
      else if (c0 - lo >= 4) out.push([(lo + c0) / 2, (lo + c0) / 2]);
      lo = Math.max(lo, c1 + clear);
    }
    if (cross - pad >= lo) out.push([lo, cross - pad]);
    return out;
  });
  // The cards' overall extent across the box: beyond it lies the window's padding, which a long
  // edge uses only when there is no way down a gutter between the columns (the vertical bus).
  const extent0 = Math.min(...bands.map((b) => b.spans[0]?.[0] ?? cross / 2));
  const extent1 = Math.max(...bands.map((b) => b.spans[b.spans.length - 1]?.[1] ?? cross / 2));
  const outside = (c: number) => c < extent0 - 1 || c > extent1 + 1;
  /** px a pass through the padding counts as further than it is (a gutter wins near-ties). */
  const OUTSIDE = 60;
  /** Where an edge crosses track `t` near `ideal`: the closest free gap, kept clear of the cards. */
  const passAt = (t: number, ideal: number): { c: number; narrow: boolean } => {
    let best = ideal;
    let bestD = Infinity;
    let narrow = false;
    for (const [lo0, hi0] of free[t]) {
      const lo = Math.min(lo0 + clear, (lo0 + hi0) / 2);
      const hi = Math.max(hi0 - clear, (lo0 + hi0) / 2);
      const x = Math.min(hi, Math.max(lo, ideal));
      const d = Math.abs(x - ideal) + (outside(x) ? OUTSIDE : 0);
      if (d < bestD) {
        bestD = d;
        best = x;
        narrow = hi0 - lo0 < 40;
      }
    }
    return { c: best, narrow };
  };

  /**
   * The ways a long edge can take through the tracks between its ends: the greedy path through the
   * nearest gaps (down the gutters between columns: the vertical bus), or a straight corridor
   * outside every card on the left or right. Each with its cost (sideways travel, turns,
   * squeezing); a corridor in the window's padding pays a premium, so the outside route only wins
   * when the inside one squeezes or zig-zags (or crosses another edge: pass 0).
   */
  const corridorOptions = (tracks: number[], ca: number, cb: number, exitM: number, entryM: number): { kind: Pick; cs: number[]; cost: number }[] => {
    if (!tracks.length) return [];
    const greedy = tracks.map((t) => {
      const band = bands[t];
      const f = ((band.m0 + band.m1) / 2 - exitM) / (entryM - exitM || 1);
      return passAt(t, ca + (cb - ca) * f);
    });
    const firsts = tracks.map((t) => bands[t].spans[0]?.[0] ?? cross / 2);
    const lasts = tracks.map((t) => bands[t].spans[bands[t].spans.length - 1]?.[1] ?? cross / 2);
    // a corridor keeps 2 x clear from the cards, or tucks into a narrow padding (5px at least)
    const lo = Math.min(...firsts);
    const hi = Math.max(...lasts);
    const left = Math.max(lo - clear * 2, pad) <= lo - 5 ? Math.max(lo - clear * 2, pad) : -1;
    const right = Math.min(hi + clear * 2, cross - pad) >= hi + 5 ? Math.min(hi + clear * 2, cross - pad) : Infinity;
    const cost = (cs: number[], bias: number, squeeze: number) => {
      const seq = [ca, ...cs, cb];
      let travel = 0;
      let turns = 0;
      let dir = 0;
      for (let i = 1; i < seq.length; i++) {
        const dx = seq[i] - seq[i - 1];
        travel += Math.abs(dx);
        // a jog of a few px into a port is not a turn
        const s = Math.abs(dx) < 12 ? 0 : Math.sign(dx);
        if (s && dir && s !== dir) turns += 1;
        if (s) dir = s;
      }
      return (travel + turns * 90 + squeeze) * bias;
    };
    const g = greedy.map((x) => x.c);
    const out: { kind: Pick; cs: number[]; cost: number }[] = [{ kind: "greedy", cs: g, cost: cost(g, 1, greedy.filter((x) => x.narrow).length * 60 + greedy.filter((x) => outside(x.c)).length * OUTSIDE) }];
    for (const [kind, c] of [
      ["left", left],
      ["right", right],
    ] as const) {
      if (c < pad || c > cross - pad) continue;
      const cs = tracks.map(() => c);
      out.push({ kind, cs, cost: cost(cs, outside(c) ? 1.6 : 1, 0) });
    }
    return out;
  };
  /** The way pass 0 picked for an edge (else the calmest). */
  const pickOf = new Map<string, Pick>();
  const corridor = (id: string, tracks: number[], ca: number, cb: number, exitM: number, entryM: number): { kind: Pick; cs: number[]; cost: number } | null => {
    const opts = corridorOptions(tracks, ca, cb, exitM, entryM);
    if (!opts.length) return null;
    const forced = pickOf.get(id);
    return opts.find((x) => x.kind === forced) ?? opts.reduce((a, b) => (b.cost < a.cost ? b : a));
  };

  const usable = spec.edges.filter((e) => ab[e.a] && ab[e.b] && plan.trackOf[e.a] !== undefined && plan.trackOf[e.b] !== undefined);

  /** Waypoints of an edge, given the port coordinate at each end. */
  const ways = (
    e: DiagramEdge,
    pa: number | null,
    pb: number | null,
  ): { list: Way[]; vis: [number, number]; sides: [Port["side"], Port["side"]]; keys: [number, number]; pick?: Pick; cost?: number } => {
    const A = ab[e.a];
    const B = ab[e.b];
    const ta = plan.trackOf[e.a];
    const tb = plan.trackOf[e.b];
    if (ta !== tb) {
      const s = tb > ta ? 1 : -1;
      const d: Vec = [s, 0];
      const ca = pa ?? A.cc;
      const cb = pb ?? B.cc;
      const exitM = s > 0 ? A.m1 : A.m0;
      const entryM = s > 0 ? B.m0 : B.m1;
      const list: Way[] = [{ p: [A.mc, ca], d }, { p: [exitM, ca], d }];
      const lo = Math.min(ta, tb);
      const hi = Math.max(ta, tb);
      const mids: number[] = [];
      for (let t = lo + 1; t < hi; t++) mids.push(t);
      if (s < 0) mids.reverse();
      const way = corridor(e.id, mids, ca, cb, exitM, entryM);
      const cs = way?.cs ?? [];
      mids.forEach((t, i) => {
        const band = bands[t];
        const enter = s > 0 ? band.m0 : band.m1;
        const leave = s > 0 ? band.m1 : band.m0;
        list.push({ p: [enter, cs[i]], d }, { p: [leave, cs[i]], d });
      });
      list.push({ p: [entryM, cb], d }, { p: [B.mc, cb], d });
      const firstCross = list.length > 4 ? list[2].p[1] : cb;
      const lastCross = list.length > 4 ? list[list.length - 3].p[1] : ca;
      return { list, vis: [1, list.length - 2], sides: [s > 0 ? "m+" : "m-", s > 0 ? "m-" : "m+"], keys: [firstCross, lastCross], pick: way?.kind, cost: way?.cost };
    }
    // same track: neighbours meet side to side, others dip into the gap after the track
    const row = plan.tracks[ta];
    const ia = row.indexOf(e.a);
    const ib = row.indexOf(e.b);
    if (Math.abs(ia - ib) === 1) {
      const s = ib > ia ? 1 : -1;
      const d: Vec = [0, s];
      const ma = pa ?? A.mc;
      const mb = pb ?? B.mc;
      const list: Way[] = [
        { p: [ma, A.cc], d },
        { p: [ma, s > 0 ? A.c1 : A.c0], d },
        { p: [mb, s > 0 ? B.c0 : B.c1], d },
        { p: [mb, B.cc], d },
      ];
      return { list, vis: [1, 2], sides: [s > 0 ? "c+" : "c-", s > 0 ? "c-" : "c+"], keys: [B.mc, A.mc] };
    }
    const last = ta === plan.tracks.length - 1;
    const s = last ? -1 : 1;
    const band = bands[ta];
    const next = bands[ta + s];
    const edge = s > 0 ? band.m1 : band.m0;
    const gapM = next ? (edge + (s > 0 ? next.m0 : next.m1)) / 2 : edge + s * 14;
    const ca = pa ?? A.cc;
    const cb = pb ?? B.cc;
    const dir = cb > ca ? 1 : -1;
    const list: Way[] = [
      { p: [A.mc, ca], d: [s, 0] },
      { p: [s > 0 ? A.m1 : A.m0, ca], d: [s, 0] },
      { p: [gapM, (ca + cb) / 2], d: [0, dir] },
      { p: [s > 0 ? B.m1 : B.m0, cb], d: [-s, 0] },
      { p: [B.mc, cb], d: [-s, 0] },
    ];
    const side = s > 0 ? "m+" : "m-";
    return { list, vis: [1, 3], sides: [side, side], keys: [cb, ca] };
  };

  // pass 0: a long edge weighs each way by its cost plus the edges it would cut across (a solid
  // route crossing another solid route costs most; a dashed link may cross a little): a gutter
  // that would cut through the journey loses to the corridor round the outside, so the journey
  // stays planar; otherwise the gutter (the bus) wins
  const longs = usable.filter((e) => Math.abs(plan.trackOf[e.a] - plan.trackOf[e.b]) > 1);
  if (longs.length) {
    const line = (w: ReturnType<typeof ways>) => w.list.slice(w.vis[0], w.vis[1] + 1).map((x) => x.p);
    const drawn = new Map(usable.map((e) => [e.id, line(ways(e, null, null))]));
    for (const e of longs) {
      let best: { kind: Pick; score: number } | null = null;
      for (const kind of PICKS) {
        pickOf.set(e.id, kind);
        const w = ways(e, null, null);
        if (w.pick !== kind) continue;
        const mine = line(w);
        let score = w.cost ?? 0;
        for (const f of usable) {
          if (f.id === e.id) continue;
          const n = crossings(mine, drawn.get(f.id) ?? []);
          if (n) score += n * (e.kind === "route" && f.kind === "route" ? 240 : 110);
        }
        if (!best || score < best.score) best = { kind, score };
      }
      if (!best) {
        pickOf.delete(e.id);
        continue;
      }
      pickOf.set(e.id, best.kind);
      drawn.set(e.id, line(ways(e, null, null)));
    }
  }

  // pass 1: centred ports, to learn which way each end leaves
  const ports: Port[] = [];
  const portOf = new Map<string, [Port, Port]>();
  for (const e of usable) {
    const w = ways(e, null, null);
    const pa: Port = { node: e.a, side: w.sides[0], key: w.keys[0], at: 0 };
    const pb: Port = { node: e.b, side: w.sides[1], key: w.keys[1], at: 0 };
    ports.push(pa, pb);
    portOf.set(e.id, [pa, pb]);
  }
  // spread the ports that share a side, in the order of where they head
  const groups = new Map<string, Port[]>();
  for (const p of ports) {
    const k = `${p.node}|${p.side}`;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  for (const list of groups.values()) {
    list.sort((p, q) => p.key - q.key);
    const b = ab[list[0].node];
    const main = list[0].side === "m+" || list[0].side === "m-";
    const lo = main ? b.c0 : b.m0;
    const size = main ? b.c1 - b.c0 : b.m1 - b.m0;
    const n = list.length;
    const step = n > 1 ? Math.min(0.24, 0.62 / (n - 1)) : 0;
    list.forEach((p, i) => {
      p.at = lo + size * (0.5 + (i - (n - 1) / 2) * step);
    });
  }

  // pass 2: final waypoints -> curves
  const out: Record<string, EdgeGeom> = {};
  for (const e of usable) {
    const [pa, pb] = portOf.get(e.id) ?? [null, null];
    const w = ways(e, pa?.at ?? null, pb?.at ?? null);
    const segs: Seg[] = [];
    for (let i = 0; i < w.list.length - 1; i++) {
      const [p0, c1, c2, p3] = cubicBetween(w.list[i], w.list[i + 1]);
      segs.push({ p0: toXY(p0, o), c1: toXY(c1, o), c2: toXY(c2, o), p3: toXY(p3, o) });
    }
    const visible = segs.slice(w.vis[0], w.vis[1]);
    out[e.id] = {
      id: e.id,
      a: e.a,
      b: e.b,
      kind: e.kind,
      rough: chainPath(visible, { seed: `${spec.id}|${e.id}`, roughness: e.kind === "link" ? roughness * 0.8 : roughness, passes: 2 }),
      tight: chainPath(visible, { seed: `${spec.id}|${e.id}`, roughness: 0, passes: 2 }),
      line: chainPath(visible, { seed: 0, roughness: 0, passes: 1 }),
      track: buildTrack(segs, w.vis[0], w.vis[1]),
    };
  }
  return out;
}

const f = (n: number) => {
  const v = Math.round(n * 10) / 10;
  return (v === 0 ? 0 : v).toString();
};

/**
 * A chain of cubics as one SVG path, optionally hand-drawn: jittered points and controls, and a
 * second lighter pass. roughness 0 gives the exact chain with the same commands (the tight twin).
 */
function chainPath(segs: Seg[], { seed, roughness, passes }: { seed: string | number; roughness: number; passes: 1 | 2 }): string {
  if (!segs.length) return "";
  const r = seeded(`${String(seed)}|dg-edge`);
  const j = (amt: number) => (r() * 2 - 1) * amt * roughness;
  let d = "";
  for (let p = 0; p < passes; p++) {
    const k = p ? 0.75 : 1;
    const start = segs[0].p0;
    d += `M${f(start[0] + j(0.7 * k))} ${f(start[1] + j(0.7 * k))}`;
    segs.forEach((s, i) => {
      const L = Math.hypot(s.p3[0] - s.p0[0], s.p3[1] - s.p0[1]);
      // a steady hand: long strokes wobble a little, the second pass stays close to the first
      const amp = (0.9 + Math.min(L, 240) * 0.007) * (p ? 0.55 : 1);
      const end = i === segs.length - 1 ? 0.7 : 0.9;
      d += `C${f(s.c1[0] + j(amp))} ${f(s.c1[1] + j(amp))} ${f(s.c2[0] + j(amp))} ${f(s.c2[1] + j(amp))} ${f(s.p3[0] + j(end * k))} ${f(s.p3[1] + j(end * k))}`;
    });
  }
  return d;
}

function cubicAt(s: Seg, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * s.p0[0] + b * s.c1[0] + c * s.c2[0] + d * s.p3[0], a * s.p0[1] + b * s.c1[1] + c * s.c2[1] + d * s.p3[1]];
}

/** Sample a chain of cubics into an arc-length table (constant-speed packets, no DOM). */
function buildTrack(segs: Seg[], visFrom: number, visTo: number): Track {
  const xs: number[] = [];
  const ys: number[] = [];
  const acc: number[] = [];
  let total = 0;
  let visStart = 0;
  let visEnd = 0;
  const push = (p: Point) => {
    if (xs.length) total += Math.hypot(p[0] - xs[xs.length - 1], p[1] - ys[ys.length - 1]);
    xs.push(p[0]);
    ys.push(p[1]);
    acc.push(total);
  };
  segs.forEach((s, i) => {
    if (i === 0) push(s.p0);
    if (i === visFrom) visStart = total;
    const approx = Math.hypot(s.c1[0] - s.p0[0], s.c1[1] - s.p0[1]) + Math.hypot(s.c2[0] - s.c1[0], s.c2[1] - s.c1[1]) + Math.hypot(s.p3[0] - s.c2[0], s.p3[1] - s.c2[1]);
    const n = Math.max(3, Math.min(48, Math.ceil(approx / 5)));
    for (let k = 1; k <= n; k++) push(cubicAt(s, k / n));
    if (i === visTo - 1) visEnd = total;
  });
  const pts = new Float32Array(xs.length * 2);
  xs.forEach((x, i) => {
    pts[i * 2] = x;
    pts[i * 2 + 1] = ys[i];
  });
  return { pts, acc: Float32Array.from(acc), total, visStart, visEnd };
}

/** Point and heading (radians) at arc length `s` along a track (`reverse` walks it from the end). */
export function trackPoint(tr: Track, s: number, reverse = false): { x: number; y: number; a: number } {
  const n = tr.acc.length;
  if (n < 2) return { x: tr.pts[0] ?? 0, y: tr.pts[1] ?? 0, a: 0 };
  const at = Math.min(tr.total, Math.max(0, reverse ? tr.total - s : s));
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (tr.acc[mid] < at) lo = mid;
    else hi = mid;
  }
  const span = tr.acc[hi] - tr.acc[lo] || 1;
  const t = (at - tr.acc[lo]) / span;
  const x0 = tr.pts[lo * 2];
  const y0 = tr.pts[lo * 2 + 1];
  const x1 = tr.pts[hi * 2];
  const y1 = tr.pts[hi * 2 + 1];
  const a = Math.atan2(y1 - y0, x1 - x0) + (reverse ? Math.PI : 0);
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, a };
}

// -------------------------------------------------------------------------------------------
// 4. The inspect note
// -------------------------------------------------------------------------------------------

export type NoteSize = { w: number; h: number };

/**
 * Where the handwritten note of an inspected part goes: the spot nearest its card that buries the
 * least. Covering a card costs (the inspected one practically never, its neighbours more than the
 * rest: the note must not hide any part), so does covering the part's own ink edges, and so does
 * distance (the note stays with its card). `sizes` are the shapes the note can take, in order of
 * preference (the natural note, then a one-line strip that fits a lane gap); a later one pays a
 * small premium. Every candidate stays inside the box. Pure: boxes in, a position out.
 */
export function placeNote({
  W,
  H,
  node,
  inspect,
  boxes,
  near,
  sizes,
  avoid = [],
  pad = 4,
}: {
  W: number;
  H: number;
  node: Box;
  inspect: string;
  boxes: Record<string, Box>;
  near: Set<string>;
  sizes: NoteSize[];
  /** x, y pairs to keep clear (the inspected part's edges). */
  avoid?: Float32Array[];
  pad?: number;
}): { x: number; y: number; size: number } {
  const ids = Object.keys(boxes);
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  let best = { x: Math.max(pad, cx - (sizes[0]?.w ?? 0) / 2), y: node.y + node.h + 6, size: 0 };
  let bestScore = Infinity;
  // a note may kiss a card's edge (the border and its shadow), not cover its face
  const KISS = 3;
  const overlap = (x: number, y: number, w: number, h: number, b: Box) =>
    Math.max(0, Math.min(x + w, b.x + b.w - KISS) - Math.max(x, b.x + KISS)) * Math.max(0, Math.min(y + h, b.y + b.h - KISS) - Math.max(y, b.y + KISS));
  // near is cheap, far is not: a note two rows away no longer reads as its card's
  const away = (d: number) => d * 18 + Math.max(0, d - 16) ** 2 * 2;
  sizes.forEach(({ w, h }, k) => {
    if (w > W - pad * 2 || h > H - pad * 2) return;
    const x1 = W - w - pad;
    const y1 = H - h - pad;
    const clampX = (x: number) => Math.min(x1, Math.max(pad, x));
    const clampY = (y: number) => Math.min(y1, Math.max(pad, y));
    // the classic spots around the card first (ties go to them), then a scan of the whole box
    const xs = [cx - w / 2, node.x, node.x + node.w - w, node.x + node.w + 8, node.x - w - 8].map(clampX);
    const ys = [node.y + node.h + 6, node.y - h - 6, cy - h / 2].map(clampY);
    for (let x = pad; x <= x1; x += 8) xs.push(x);
    for (let y = pad; y <= y1; y += 4) ys.push(y);
    for (const x of xs) {
      for (const y of ys) {
        const dx = Math.max(0, node.x - (x + w), x - (node.x + node.w));
        const dy = Math.max(0, node.y - (y + h), y - (node.y + node.h));
        // above or below its card, the note's middle stays within the card's width (beside it,
        // within its height); a corner spot drifts on both axes and pays for the lesser: drifting
        // under a neighbour would hand the note to that neighbour
        const drift = Math.min(Math.max(0, Math.abs(x + w / 2 - cx) - node.w / 2), Math.max(0, Math.abs(y + h / 2 - cy) - node.h / 2));
        let s = k * 150 + away(Math.hypot(dx, dy)) + drift * 24 + Math.abs(x + w / 2 - cx) * 0.02;
        if (s >= bestScore) continue;
        for (const id of ids) {
          const a = overlap(x, y, w, h, boxes[id]);
          if (!a) continue;
          s += a * (id === inspect ? 14 : near.has(id) ? 3.2 : 1.8);
          if (s >= bestScore) break;
        }
        if (s >= bestScore) continue;
        for (const pts of avoid) {
          for (let i = 0; i < pts.length; i += 2) {
            const px = pts[i];
            const py = pts[i + 1];
            if (px > x - 2 && px < x + w + 2 && py > y - 2 && py < y + h + 2) s += 45;
          }
          if (s >= bestScore) break;
        }
        if (s < bestScore) {
          bestScore = s;
          best = { x, y, size: k };
        }
      }
    }
  });
  return best;
}

/** The visible part of a track (between the two cards), every `step`-th point: what a note should not cover. */
export function visiblePoints(tr: Track, step = 2): Float32Array {
  const out: number[] = [];
  for (let i = 0; i < tr.acc.length; i += step) {
    const s = tr.acc[i];
    if (s < tr.visStart || s > tr.visEnd) continue;
    out.push(tr.pts[i * 2], tr.pts[i * 2 + 1]);
  }
  return Float32Array.from(out);
}

/** The pencil box of a node and its tight twin (same commands): the sketch twin of a card. */
export function nodeBox(b: Box, seed: string, radius: number): { rough: string; tight: string } {
  const inset = 0.75;
  const x = b.x + inset;
  const y = b.y + inset;
  const w = Math.max(1, b.w - inset * 2);
  const h = Math.max(1, b.h - inset * 2);
  const o = { seed, radius: Math.min(radius, w / 2, h / 2), passes: 2 as const };
  return { rough: roughRect(x, y, w, h, { ...o, roughness: 0.9 }), tight: roughRect(x, y, w, h, tight(o)) };
}
