import { BOARD_W, CHIP_D, CHIP_W, COLS, HEAD, LANE, LANE_TOP, LEGEND, MARGIN_Z, REF_BAND, colX, type Frame } from "./frame";

/**
 * Placement and copper routing for the 3D bench board. Pure geometry (no React, no three.js):
 * the same topology always gives the same board, so a system is routed once and cached.
 *
 * Chips sit in their channel column, top-aligned in content order (the record lists the main
 * part of a layer first, so the main request path runs straight across row 0). Copper is
 * orthogonal with 45° chamfers, like a real single-layer board:
 *   - adjacent columns: out of the facing side, a jog on a track in the gutter between them;
 *   - far columns: down a gutter track to a lane between rows, across, and up the far gutter;
 *   - same column, neighbouring rows: straight down between the chips;
 *   - same column, rows apart: a U through the gutter beside the column.
 * Lanes, sides and track orders are then chosen by a small exhaustive local search that
 * minimises overlaps, crossings, near-parallel runs and length.
 */

export type V2 = [number, number]; // (x, z) on the board plane

export type Poly = { pts: V2[]; cum: number[]; len: number };

export type PlacedChip = { id: string; col: number; row: number; x: number; z: number; index: number };

export type RoutedWire = {
  id: string;
  from: string;
  to: string;
  poly: Poly;
  /** Where a probe clips on: the middle of the longest straight run, and that run's direction. */
  clip: V2;
  clipDir: V2;
};

export type Routed = {
  chips: PlacedChip[];
  byId: Map<string, PlacedChip>;
  wires: RoutedWire[];
  wireById: Map<string, RoutedWire>;
  rowZ: number[];
  rowsUsed: number;
  /** Router quality, for tests: copper crossings and overlapping runs left after the search. */
  stats: { crossings: number; overlaps: number; close: number; evals: number };
};

export type RouteInput = {
  key: string;
  frame: Frame;
  /** Exactly COLS entries, in channel order; the items of each column, top to bottom. */
  columns: string[][];
  conns: { id: string; from: string; to: string }[];
};

type Side = "l" | "r" | "t" | "b";
type Port = { chip: PlacedChip; side: Side; key: string; p: V2 };

type Kind = "h" | "far" | "u" | "v";
type Route = {
  id: string;
  kind: Kind;
  a: Port;
  b: Port;
  /** h / u: the gutter of the jog. far: the gutters beside A and beside B. */
  g: number;
  gb: number;
  /** far: the chosen lane (index into lanes). */
  lane: number;
  laneOptions: number[];
  /** u: the two possible sides. */
  uSides?: [Side, Side];
};

type Lane = { z0: number; z1: number; tracks: string[] };
type Gutter = { x0: number; x1: number; tracks: string[] };

const EPS = 1e-6;
const CHAMFER = 0.1;
const cache = new Map<string, Routed>();

export function routeBoard(input: RouteInput): Routed {
  const hit = cache.get(input.key);
  if (hit) return hit;
  const out = route(input);
  cache.set(input.key, out);
  return out;
}

function route({ frame, columns, conns }: RouteInput): Routed {
  // ---------------------------------------------------------------- placement
  const rowsUsed = Math.max(1, ...columns.map((c) => c.length));
  const zArea0 = -frame.depth / 2 + MARGIN_Z + HEAD + LANE_TOP;
  const pitch = CHIP_D + LANE;
  const offset = ((frame.rows - rowsUsed) * pitch) / 2;
  const rowZ = Array.from({ length: rowsUsed }, (_, r) => zArea0 + offset + CHIP_D / 2 + r * pitch);

  const chips: PlacedChip[] = [];
  columns.forEach((items, col) =>
    items.forEach((id, row) => {
      chips.push({ id, col, row, x: colX(col), z: rowZ[row], index: chips.length });
    }),
  );
  const byId = new Map(chips.map((c) => [c.id, c]));

  // ---------------------------------------------------------------- lanes and gutters
  // Track bands: clear of the chip leads below a row and of the refdes band above the next.
  const laneTop = -frame.depth / 2 + MARGIN_Z + HEAD + 0.02;
  const laneBottom = frame.depth / 2 - MARGIN_Z - LEGEND - 0.04;
  const lanes: Lane[] = [];
  for (let k = 0; k <= rowsUsed; k++) {
    const z0 = k === 0 ? laneTop : rowZ[k - 1] + CHIP_D / 2 + 0.07;
    const z1 = k === rowsUsed ? laneBottom : rowZ[k] - CHIP_D / 2 - REF_BAND;
    lanes.push({ z0, z1, tracks: [] });
  }
  // Slot lanes: the band of a row itself, usable where no chip stands between the ends.
  // They follow the rowsUsed + 1 inter-row lanes.
  const slotLane = (r: number) => rowsUsed + 1 + r;
  for (let r = 0; r < rowsUsed; r++) lanes.push({ z0: rowZ[r] - CHIP_D / 2 + 0.06, z1: rowZ[r] + CHIP_D / 2 - 0.06, tracks: [] });

  const gutters = new Map<number, Gutter>();
  const gutter = (g: number): Gutter => {
    let v = gutters.get(g);
    if (!v) {
      const x0 = g < 0 ? -BOARD_W / 2 + 0.06 : colX(g) + CHIP_W / 2;
      const x1 = g >= COLS - 1 ? BOARD_W / 2 - 0.06 : colX(g + 1) - CHIP_W / 2;
      v = { x0, x1, tracks: [] };
      gutters.set(g, v);
    }
    return v;
  };

  // ---------------------------------------------------------------- route kinds and sides
  const occupied = (c: number, r: number) => (columns[c]?.length ?? 0) > r;
  const routes: Route[] = [];
  for (const c of conns) {
    const A = byId.get(c.from);
    const B = byId.get(c.to);
    if (!A || !B || A === B) continue;
    const mk = (side: Side, chip: PlacedChip): Port => ({ chip, side, key: `${c.id}|${chip.id}`, p: [chip.x, chip.z] });
    if (A.col === B.col) {
      if (Math.abs(A.row - B.row) === 1) {
        const down = B.row > A.row;
        routes.push({ id: c.id, kind: "v", a: mk(down ? "b" : "t", A), b: mk(down ? "t" : "b", B), g: 0, gb: 0, lane: -1, laneOptions: [] });
      } else {
        const right: Side = A.col === COLS - 1 ? "l" : "r";
        routes.push({
          id: c.id,
          kind: "u",
          a: mk(right, A),
          b: mk(right, B),
          g: right === "r" ? A.col : A.col - 1,
          gb: 0,
          lane: -1,
          laneOptions: [],
          uSides: ["r", "l"],
        });
      }
      continue;
    }
    const toRight = B.col > A.col;
    const a = mk(toRight ? "r" : "l", A);
    const b = mk(toRight ? "l" : "r", B);
    if (Math.abs(A.col - B.col) === 1) {
      routes.push({ id: c.id, kind: "h", a, b, g: Math.min(A.col, B.col), gb: 0, lane: -1, laneOptions: [] });
      continue;
    }
    const lo = Math.min(A.row, B.row);
    const hi = Math.max(A.row, B.row);
    const options: number[] = [];
    for (let k = lo; k <= hi + 1; k++) options.push(k);
    const c0 = Math.min(A.col, B.col);
    const c1 = Math.max(A.col, B.col);
    for (let r = lo; r <= hi; r++) {
      let free = true;
      for (let cc = c0 + 1; cc < c1; cc++) if (occupied(cc, r)) free = false;
      if (free) options.push(slotLane(r));
    }
    // Start on the lane nearest both ends.
    const mid = (A.z + B.z) / 2;
    const laneMid = (k: number) => (lanes[k].z0 + lanes[k].z1) / 2;
    const first = options.slice().sort((p, q) => Math.abs(laneMid(p) - mid) - Math.abs(laneMid(q) - mid))[0];
    routes.push({
      id: c.id,
      kind: "far",
      a,
      b,
      g: toRight ? A.col : A.col - 1,
      gb: toRight ? B.col - 1 : B.col,
      lane: first,
      laneOptions: options,
    });
  }

  // ---------------------------------------------------------------- ports
  // Ports on one chip side are spread along it; their order is part of the search.
  const laneMidZ = (k: number) => (lanes[k].z0 + lanes[k].z1) / 2;
  const sideOrder = new Map<string, string[]>();
  const sideKey = (p: Port) => `${p.chip.id}|${p.side}`;
  const assignPorts = () => {
    const groups = new Map<string, { port: Port; toward: number; then: number }[]>();
    for (const r of routes) {
      const ends: [Port, Port][] = [
        [r.a, r.b],
        [r.b, r.a],
      ];
      for (const [p, other] of ends) {
        const vertical = p.side === "t" || p.side === "b";
        const toward = vertical ? other.chip.x : r.kind === "far" ? laneMidZ(r.lane) : other.chip.z;
        const list = groups.get(sideKey(p)) ?? [];
        list.push({ port: p, toward, then: vertical ? 0 : other.chip.z });
        groups.set(sideKey(p), list);
      }
    }
    for (const [key, list] of groups) {
      const keys = list.map((e) => e.port.key);
      const stored = sideOrder.get(key);
      let order: string[];
      if (stored && stored.length === keys.length && keys.every((k) => stored.includes(k))) order = stored;
      else {
        order = list
          .slice()
          .sort((u, v) => u.toward - v.toward || u.then - v.then || (u.port.key < v.port.key ? -1 : 1))
          .map((e) => e.port.key);
        sideOrder.set(key, order);
      }
      const n = list.length;
      for (const { port } of list) {
        const i = order.indexOf(port.key);
        const { chip, side } = port;
        if (side === "l" || side === "r") {
          const sp = n > 1 ? Math.min(0.16, (CHIP_D - 0.2) / (n - 1)) : 0;
          port.p = [chip.x + (side === "r" ? CHIP_W / 2 : -CHIP_W / 2), chip.z + (i - (n - 1) / 2) * sp];
        } else {
          const sp = n > 1 ? Math.min(0.22, (CHIP_W - 0.4) / (n - 1)) : 0;
          port.p = [chip.x + (i - (n - 1) / 2) * sp, chip.z + (side === "b" ? CHIP_D / 2 : -CHIP_D / 2)];
        }
      }
    }
  };

  // ---------------------------------------------------------------- tracks
  const rebuildTracks = (keepOrder: boolean) => {
    const prevG = new Map([...gutters].map(([g, v]) => [g, v.tracks.slice()]));
    const prevL = lanes.map((l) => l.tracks.slice());
    gutters.forEach((v) => (v.tracks = []));
    lanes.forEach((l) => (l.tracks = []));
    for (const r of routes) {
      if (r.kind === "h" || r.kind === "u") gutter(r.g).tracks.push(`${r.id}|g`);
      if (r.kind === "far") {
        gutter(r.g).tracks.push(`${r.id}|ga`);
        gutter(r.gb).tracks.push(`${r.id}|gb`);
        lanes[r.lane].tracks.push(r.id);
      }
    }
    if (!keepOrder) return;
    const reorder = (now: string[], before: string[] | undefined) => {
      if (!before) return now;
      const rank = (t: string) => {
        const i = before.indexOf(t);
        return i < 0 ? 1e6 : i;
      };
      return now.slice().sort((p, q) => rank(p) - rank(q));
    };
    gutters.forEach((v, g) => (v.tracks = reorder(v.tracks, prevG.get(g))));
    lanes.forEach((l, k) => (l.tracks = reorder(l.tracks, prevL[k])));
  };

  const trackX = (g: number, key: string) => {
    const v = gutter(g);
    const n = v.tracks.length;
    const i = Math.max(0, v.tracks.indexOf(key));
    return v.x0 + ((v.x1 - v.x0) * (i + 1)) / (n + 1);
  };
  const trackZ = (k: number, id: string) => {
    const l = lanes[k];
    const n = l.tracks.length;
    const i = Math.max(0, l.tracks.indexOf(id));
    return l.z0 + ((l.z1 - l.z0) * (i + 1)) / (n + 1);
  };

  const build = (r: Route): V2[] => {
    const A = r.a.p;
    const B = r.b.p;
    switch (r.kind) {
      case "v":
        return Math.abs(A[0] - B[0]) < EPS
          ? [A, B]
          : [A, [A[0], (A[1] + B[1]) / 2], [B[0], (A[1] + B[1]) / 2], B];
      case "h":
      case "u": {
        const x = trackX(r.g, `${r.id}|g`);
        return [A, [x, A[1]], [x, B[1]], B];
      }
      case "far": {
        const xa = trackX(r.g, `${r.id}|ga`);
        const xb = trackX(r.gb, `${r.id}|gb`);
        const z = trackZ(r.lane, r.id);
        return [A, [xa, A[1]], [xa, z], [xb, z], [xb, B[1]], B];
      }
    }
  };

  // ---------------------------------------------------------------- cost
  // During the search every run is horizontal or vertical (chamfers come last), so crossings
  // are H x V interval tests and overlaps are H x H / V x V: cheap enough to run thousands.
  type Run = [w: number, at: number, lo: number, hi: number];
  const stats = { crossings: 0, overlaps: 0, close: 0, evals: 0 };
  const parallel = (runs: Run[]) => {
    let overlaps = 0;
    let close = 0;
    for (let i = 0; i < runs.length; i++)
      for (let j = i + 1; j < runs.length; j++) {
        const s = runs[i];
        const t = runs[j];
        if (s[0] === t[0] || Math.min(s[3], t[3]) - Math.max(s[2], t[2]) <= 0.02) continue;
        const off = Math.abs(s[1] - t[1]);
        if (off < 0.03) overlaps += 1;
        else if (off < 0.075) close += 1;
      }
    return [overlaps, close];
  };
  const evaluate = () => {
    stats.evals += 1;
    const H: Run[] = [];
    const V: Run[] = [];
    let length = 0;
    let bends = 0;
    routes.forEach((r, w) => {
      const pts = simplify(build(r));
      bends += Math.max(0, pts.length - 2);
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1];
        const b = pts[k];
        if (Math.abs(a[1] - b[1]) < EPS) H.push([w, a[1], Math.min(a[0], b[0]), Math.max(a[0], b[0])]);
        else V.push([w, a[0], Math.min(a[1], b[1]), Math.max(a[1], b[1])]);
        length += Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
      }
    });
    let crossings = 0;
    for (const h of H)
      for (const v of V)
        if (h[0] !== v[0] && v[1] > h[2] + EPS && v[1] < h[3] - EPS && h[1] > v[2] + EPS && h[1] < v[3] - EPS) crossings += 1;
    const [oh, ch] = parallel(H);
    const [ov, cv] = parallel(V);
    stats.crossings = crossings;
    stats.overlaps = oh + ov;
    stats.close = ch + cv;
    return stats.overlaps * 1000 + crossings * 60 + stats.close * 25 + length + bends * 0.4;
  };

  // ---------------------------------------------------------------- search
  // Compound moves: change one route's lane (or side), re-solve the port orders and track
  // orders it touches, and keep the move only if the whole board got better. Then pairs of
  // routes, then a global polish. Every list is small (<= 6), so each local solve is exhaustive.
  type Snap = { lane: number[]; side: Side[]; g: number[]; gt: [number, string[]][]; lt: string[][]; so: [string, string[]][] };
  const snap = (): Snap => ({
    lane: routes.map((r) => r.lane),
    side: routes.map((r) => r.a.side),
    g: routes.map((r) => r.g),
    gt: [...gutters].map(([g, v]) => [g, v.tracks.slice()] as [number, string[]]),
    lt: lanes.map((l) => l.tracks.slice()),
    so: [...sideOrder].map(([k, v]) => [k, v.slice()] as [string, string[]]),
  });
  const restore = (s: Snap) => {
    routes.forEach((r, i) => {
      r.lane = s.lane[i];
      if (r.kind === "u") {
        r.a.side = s.side[i];
        r.b.side = s.side[i];
      }
      r.g = s.g[i];
    });
    gutters.forEach((v) => (v.tracks = []));
    s.gt.forEach(([g, t]) => (gutter(g).tracks = t.slice()));
    lanes.forEach((l, k) => (l.tracks = s.lt[k].slice()));
    sideOrder.clear();
    s.so.forEach(([k, v]) => sideOrder.set(k, v.slice()));
    assignPorts();
  };

  /** Exhaustive (n <= 6) or adjacent-swap search over one ordered list; returns the new cost. */
  const permOpt = (get: () => string[] | undefined, set: (o: string[]) => void, cur: number) => {
    const base = get();
    if (!base || base.length < 2) return cur;
    let bestOrder = base.slice();
    let bestCost = cur;
    const tryOrder = (o: string[]) => {
      set(o);
      const c = evaluate();
      if (c < bestCost - 1e-9) {
        bestCost = c;
        bestOrder = o.slice();
      }
    };
    if (base.length <= 6) permutations(base, tryOrder);
    else
      for (let i = 0; i < base.length - 1; i++) {
        const o = base.slice();
        [o[i], o[i + 1]] = [o[i + 1], o[i]];
        tryOrder(o);
      }
    set(bestOrder);
    return bestCost;
  };
  const localOpt = (gs: number[], ls: number[], sides: string[]) => {
    const sideOpt = (cur: number) => {
      for (const key of sides)
        cur = permOpt(
          () => sideOrder.get(key),
          (o) => {
            sideOrder.set(key, o);
            assignPorts();
          },
          cur,
        );
      return cur;
    };
    const trackOpt = (cur: number) => {
      for (const g of gs) cur = permOpt(() => gutters.get(g)?.tracks, (o) => (gutter(g).tracks = o), cur);
      for (const k of ls) cur = permOpt(() => lanes[k]?.tracks, (o) => (lanes[k].tracks = o), cur);
      return cur;
    };
    // Tracks first (ports start from the heuristic order), then ports, then tracks again.
    return trackOpt(sideOpt(trackOpt(evaluate())));
  };
  const touched = (rs: Route[]) => ({
    gs: [...new Set(rs.flatMap((r) => (r.kind === "far" ? [r.g, r.gb] : r.kind === "v" ? [] : [r.g])))],
    ls: [...new Set(rs.flatMap((r) => (r.kind === "far" ? [r.lane] : [])))],
    sides: [...new Set(rs.flatMap((r) => [sideKey(r.a), sideKey(r.b)]))],
  });
  let best = Infinity;
  const tryMove = (rs: Route[], mutate: () => void, extraLanes: number[]) => {
    if (stats.evals > BUDGET) return false;
    const before = snap();
    mutate();
    for (const r of rs) {
      sideOrder.delete(sideKey(r.a));
      sideOrder.delete(sideKey(r.b));
    }
    assignPorts();
    rebuildTracks(true);
    const t = touched(rs);
    const c = localOpt(t.gs, [...new Set([...t.ls, ...extraLanes])], t.sides);
    if (c < best - 1e-9) {
      best = c;
      return true;
    }
    restore(before);
    return false;
  };

  assignPorts();
  rebuildTracks(false);
  const everything = () => localOpt([...gutters.keys()], lanes.map((_, k) => k), [...sideOrder.keys()]);
  best = everything();
  const far = routes.filter((r) => r.kind === "far" && r.laneOptions.length > 1);

  const BUDGET = 1200;
  const clean = () => stats.crossings === 0 && stats.overlaps === 0 && stats.close === 0;
  for (let pass = 0; pass < 3; pass++) {
    evaluate();
    if (clean()) break;
    let changed = false;
    for (const r of far) {
      for (const k of r.laneOptions) {
        if (k === r.lane) continue;
        const from = r.lane;
        if (tryMove([r], () => (r.lane = k), [from])) changed = true;
      }
    }
    for (const r of routes) {
      if (r.kind !== "u") continue;
      const other: Side = r.a.side === "r" ? "l" : "r";
      const g = other === "r" ? r.a.chip.col : r.a.chip.col - 1;
      const move = () => {
        r.a.side = other;
        r.b.side = other;
        r.g = g;
      };
      if (tryMove([r], move, [])) changed = true;
    }
    evaluate();
    for (let i = 0; i < far.length && !clean(); i++)
      for (let j = i + 1; j < far.length; j++) {
        const p = far[i];
        const q = far[j];
        if (p.laneOptions.length * q.laneOptions.length > 25) continue;
        for (const kp of p.laneOptions)
          for (const kq of q.laneOptions) {
            if (kp === p.lane || kq === q.lane) continue;
            const from = [p.lane, q.lane];
            const move = () => {
              p.lane = kp;
              q.lane = kq;
            };
            if (tryMove([p, q], move, from)) changed = true;
          }
      }
    const polished = everything();
    if (polished < best - 1e-9) {
      best = polished;
      changed = true;
    }
    if (!changed) break;
  }

  // ---------------------------------------------------------------- final polylines
  evaluate(); // leaves the stats of the final state
  const wires: RoutedWire[] = routes.map((r) => {
    const pts = chamfer(simplify(build(r)), CHAMFER);
    const poly = toPoly(pts);
    const { clip, dir } = clipPoint(pts);
    return { id: r.id, from: r.a.chip.id, to: r.b.chip.id, poly, clip, clipDir: dir };
  });
  return { chips, byId, wires, wireById: new Map(wires.map((w) => [w.id, w])), rowZ, rowsUsed, stats: { ...stats } };
}

// ------------------------------------------------------------------ geometry helpers

/** Drop repeated and collinear points. */
export function simplify(pts: V2[]): V2[] {
  const out: V2[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && Math.abs(last[0] - p[0]) < EPS && Math.abs(last[1] - p[1]) < EPS) continue;
    out.push(p);
  }
  for (let i = out.length - 2; i >= 1; i--) {
    const a = out[i - 1];
    const b = out[i];
    const c = out[i + 1];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) < EPS) out.splice(i, 1);
  }
  return out;
}

/** 45° chamfer at every corner, never longer than 45% of either neighbouring run. */
export function chamfer(pts: V2[], r: number): V2[] {
  if (pts.length < 3) return pts;
  const out: V2[] = [pts[0]];
  for (let k = 1; k < pts.length - 1; k++) {
    const p = pts[k];
    const a = pts[k - 1];
    const b = pts[k + 1];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, la * 0.45, lb * 0.45);
    if (rr < 1e-4) {
      out.push(p);
      continue;
    }
    out.push([p[0] + ((a[0] - p[0]) / la) * rr, p[1] + ((a[1] - p[1]) / la) * rr]);
    out.push([p[0] + ((b[0] - p[0]) / lb) * rr, p[1] + ((b[1] - p[1]) / lb) * rr]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function toPoly(pts: V2[]): Poly {
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
}

function clipPoint(pts: V2[]): { clip: V2; dir: V2 } {
  let best = 1;
  let bl = -1;
  for (let k = 1; k < pts.length; k++) {
    const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    if (l > bl + 1e-6) {
      bl = l;
      best = k;
    }
  }
  const a = pts[best - 1];
  const b = pts[best];
  const l = Math.max(bl, EPS);
  return { clip: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], dir: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] };
}

/** Point at arc length s along a polyline. */
export function pointAt(P: Poly, s: number): V2 {
  const t0 = Math.min(Math.max(s, 0), P.len);
  let k = 1;
  while (k < P.cum.length - 1 && P.cum[k] < t0) k++;
  const span = Math.max(EPS, P.cum[k] - P.cum[k - 1]);
  const t = (t0 - P.cum[k - 1]) / span;
  const a = P.pts[k - 1];
  const b = P.pts[k];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Distance from a point to a 2D polyline (any units, as long as both agree). */
export function distToPolyline(pts: V2[], x: number, y: number): number {
  let d = Infinity;
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1];
    const b = pts[k];
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const l2 = vx * vx + vy * vy;
    const t = l2 ? Math.min(1, Math.max(0, ((x - a[0]) * vx + (y - a[1]) * vy) / l2)) : 0;
    d = Math.min(d, Math.hypot(x - a[0] - vx * t, y - a[1] - vy * t));
  }
  return d;
}

function properCross(a: V2, b: V2, c: V2, d: V2): boolean {
  const o = (p: V2, q: V2, r: V2) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a);
  const d2 = o(c, d, b);
  const d3 = o(a, b, c);
  const d4 = o(a, b, d);
  return ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS));
}

function permutations(list: string[], visit: (order: string[]) => void) {
  const a = list.slice();
  const c = new Array(a.length).fill(0);
  visit(a.slice());
  let i = 1;
  while (i < a.length) {
    if (c[i] < i) {
      const j = i % 2 ? c[i] : 0;
      [a[j], a[i]] = [a[i], a[j]];
      visit(a.slice());
      c[i] += 1;
      i = 1;
    } else {
      c[i] = 0;
      i += 1;
    }
  }
}

// ------------------------------------------------------------------ request path

export type Hop = { id: string; dir: 1 | -1 };

/**
 * The request path as hops along the copper: each stage's connections in order, travelled in
 * whichever direction continues from where the pulse is, bridged over live (non-idle, non-Σ)
 * copper by breadth-first search when a stage starts elsewhere. Stops where no copper leads on.
 */
export function requestHops(
  stages: string[][],
  conns: { id: string; from: string; to: string; idle?: boolean; channel: number | "sigma" }[],
): Hop[] {
  const live = conns.filter((c) => !c.idle && c.channel !== "sigma");
  const byId = new Map(live.map((c) => [c.id, c]));
  const hops: Hop[] = [];
  let at: string | null = null;
  const bridge = (from: string, targets: Set<string>): Hop[] | null => {
    if (targets.has(from)) return [];
    const prev = new Map<string, { node: string; hop: Hop }>();
    const seen = new Set([from]);
    const queue = [from];
    while (queue.length) {
      const n = queue.shift() as string;
      for (const c of live) {
        const next = c.from === n ? c.to : c.to === n ? c.from : null;
        if (!next || seen.has(next)) continue;
        seen.add(next);
        prev.set(next, { node: n, hop: { id: c.id, dir: c.from === n ? 1 : -1 } });
        if (targets.has(next)) {
          const path: Hop[] = [];
          let cur = next;
          while (cur !== from) {
            const p = prev.get(cur);
            if (!p) break;
            path.unshift(p.hop);
            cur = p.node;
          }
          return path;
        }
        queue.push(next);
      }
    }
    return null;
  };
  for (const stage of stages) {
    for (const id of stage) {
      const c = byId.get(id);
      if (!c) continue;
      if (at === null) {
        hops.push({ id, dir: 1 });
        at = c.to;
        continue;
      }
      const path = bridge(at, new Set([c.from, c.to]));
      if (!path) return hops;
      hops.push(...path);
      for (const h of path) {
        const hc = byId.get(h.id);
        if (hc) at = h.dir > 0 ? hc.to : hc.from;
      }
      const dir: 1 | -1 = at === c.from ? 1 : -1;
      hops.push({ id, dir });
      at = dir > 0 ? c.to : c.from;
    }
  }
  return hops;
}
