/**
 * THE ICEBERG (pure geometry: no React, no DOM). The drawing behind "My stack, all the way down".
 *
 * It is computed from the MEASURED layout (./IcebergArt reads it), so the ice always lines up with
 * the layers beside it: the tip stands above the waterline next to (or, on narrow screens, just
 * under) the Interface layer, every layer of the sea gets its own slice of the submerged body, and
 * the underside floats above the seabed where the languages are.
 *
 * Two modes:
 * - "side" (900px and up): the ice fills the art column left of the rows (its bulk may reach into
 *   the page's left margin, never closer than 24px to the edge), with a leader line from each
 *   layer heading to its slice.
 * - "back" (narrower): the rows take the full width; the tip has its own band right above the
 *   waterline and the submerged body is a large shape behind the rows. No leaders.
 *
 * Every stroke comes from the site's seeded generator (`@/components/sketch/rough`) in two hands:
 * `pencil` (rough, the sketch) and `ink` (its tight twin, the shipped line). The same seeds and the
 * same layout always give the same drawing.
 */
import { roughLine, roughPolyline, seeded, tight, type Point } from "@/components/sketch/rough";

export type DrawMode = "side" | "back";

/** One layer row, measured in px from the top-left of the dive. */
export type LayerBox = {
  id: string;
  top: number;
  bottom: number;
  /** Bottom of the layer's tools (its card, when open, sits below and is not counted). */
  contentBottom: number;
  /** The layer heading's left edge and vertical centre (where its leader line starts). */
  headX: number;
  headY: number;
};

export type IcebergInput = {
  mode: DrawMode;
  width: number;
  height: number;
  /** The art column: beside the rows ("side"), or the tip's band above the waterline ("back"). */
  colX: number;
  colW: number;
  colTop: number;
  /** The sea's top edge. */
  waterY: number;
  /** [the layer above the water, ...the layers of the sea], top to bottom; at least two. */
  layers: LayerBox[];
  /** The seabed line (the top of the languages row). */
  bedY: number;
};

export type LayerArt = {
  id: string;
  above: boolean;
  /** The slice of the silhouette, closed. */
  fill: string;
  outline: { pencil: string; ink: string };
  ridges: { pencil: string; ink: string };
  /** Shadow-side hatching (pencil only: it stays behind as a construction texture). */
  hatch: string;
  /** From the layer heading to the ice, with a dot where it touches ("side" only). */
  leader: { pencil: string; ink: string; dot: Point } | null;
  /** The seam across the ice where this layer begins (the sea layers below the first). */
  seam: { pencil: string; ink: string } | null;
};

/** The sea surface at one moment of its roll (see `drawSurface`). */
export type Surface = {
  /** The front water: its crest line closed down past the sea's straight top edge (ink). */
  fill: string;
  /** The same crest line, stroked (the waterline). */
  ink: string;
  /** A distant swell behind the front water: only its crests show above it. */
  back: string;
  /** Whitecaps: a curl under each tall crest and a broken trail behind it. */
  foam: string;
  /** Two quiet lines under the surface (the water's own layers). */
  sub1: string;
  sub2: string;
};

export type IcebergDrawing = {
  layers: LayerArt[];
  /** The sea surface at rest (phase 0), plus the pencil pass that draws it first. */
  surface: Surface & { pencil: string };
  /** The seabed: a line with ground hatching under it (the drafting sign for earth). */
  bed: { pencil: string; ink: string; ground: string };
  /** What the diver needs (./diver): the ledge he stands on, the ice's right face he follows down,
   *  the underside, the waterline and the seabed, and his scale. */
  diver: { ledge: Point; right: Point[]; lowY: number; waterY: number; bedY: number; cx: number; s: number; laneMax: number };
  /** The submarine's lane (./Submarine): the gap between the Data and AI rows, from off the right
   *  edge to the left part of the rows, and its scale. */
  sub: { y: number; xFrom: number; xTo: number; s: number };
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (n: number) => Math.round(n * 10) / 10;

/** A straight-segment path (the fills, the dense wave). */
function linePath(pts: readonly Point[], close = false): string {
  let d = "";
  pts.forEach((p, i) => {
    d += `${i ? "L" : "M"}${r1(p[0])} ${r1(p[1])}`;
  });
  return close ? `${d}Z` : d;
}

/** x on a top-to-bottom polyline at height y (clamped to its ends). */
function xAt(pts: readonly Point[], y: number): number {
  if (y <= pts[0][1]) return pts[0][0];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (y >= y1 && y <= y2) return y2 === y1 ? x2 : lerp(x1, x2, (y - y1) / (y2 - y1));
  }
  return pts[pts.length - 1][0];
}

/** The part of a top-to-bottom polyline between y0 and y1, cut exactly at both heights. */
function cut(pts: readonly Point[], y0: number, y1: number): Point[] {
  const out: Point[] = [[xAt(pts, y0), y0]];
  for (const p of pts) if (p[1] > y0 && p[1] < y1) out.push(p);
  out.push([xAt(pts, y1), y1]);
  return out;
}

/** Leftmost and rightmost crossing of a closed polygon with the horizontal line y. */
function span(poly: readonly Point[], y: number): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (a[1] === b[1] || y < Math.min(a[1], b[1]) || y > Math.max(a[1], b[1])) continue;
    const x = lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1]));
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
  }
  return lo <= hi ? [lo, hi] : null;
}

/** The swell: a long wave, a shorter sea and a chop on top, each with sharpened crests and flat
 *  troughs (a trochoid-like profile, so it reads as water, not as a sine border). 0 = trough. */
function swell(x: number, phase: number): number {
  const crest = (u: number) => Math.pow(0.5 + 0.5 * Math.sin(u), 1.7);
  const T = Math.PI * 2;
  return 10 * crest((x / 236) * T + phase * 0.6 + 0.3) + 5.2 * crest((x / 97) * T - phase + 1.7) + 2.2 * crest((x / 41) * T + phase * 1.7 + 4.1);
}
const SWELL_MAX = 17.4;

/**
 * The sea surface at one moment of its roll. `phase` advances with the scroll (./IcebergArt), so
 * the waves roll while the page moves and rest when it rests: no loop runs on its own.
 */
export function drawSurface(width: number, waterY: number, mode: DrawMode, phase: number): Surface {
  const k = mode === "side" ? 1 : 0.62;
  const wy = (x: number) => waterY - swell(x, phase) * k;
  const front: Point[] = [];
  for (let x = -4; x <= width + 6; x += 5) front.push([x, wy(x)]);
  const back: Point[] = [];
  for (let x = -4; x <= width + 6; x += 6) back.push([x, waterY - 6 * k - swell(x + 213, phase * 0.7 + 2.1) * 0.6 * k]);
  let foam = "";
  for (let i = 1; i < front.length - 1; i++) {
    const [x, y] = front[i];
    if (!(y < front[i - 1][1] && y <= front[i + 1][1]) || waterY - y < SWELL_MAX * k * 0.56) continue;
    const curl: Point[] = [];
    for (let dx = -13 * k - 4; dx <= 9; dx += 3) curl.push([x + dx, wy(x + dx) + 3.6]);
    foam += linePath(curl);
    foam += `M${r1(x + 13)} ${r1(wy(x + 13) + 6.5)}l${r1(5 * k + 2)} 1.2`;
    foam += `M${r1(x + 24)} ${r1(wy(x + 24) + 8.5)}l${r1(3 * k + 1)} 0.8`;
  }
  const under = (depth: number, shift: number, amp: number, speed: number) => {
    const pts: Point[] = [];
    for (let x = -4; x <= width + 8; x += 8) pts.push([x, waterY + depth - swell(x + shift, phase * speed) * amp * k]);
    return linePath(pts);
  };
  return {
    fill: `${linePath(front)}L${r1(width + 6)} ${r1(waterY + 3)}L-4 ${r1(waterY + 3)}Z`,
    ink: linePath(front),
    back: linePath(back),
    foam,
    sub1: under(17 * k + 4, 60, 0.32, 0.8),
    sub2: under(36 * k + 6, 150, 0.18, 0.6),
  };
}

/** Pencil and ink twins of one open polyline. */
function twin(pts: readonly Point[], seed: string, roughness = 1) {
  return {
    pencil: roughPolyline(pts, { seed, roughness, bowing: 0.7, passes: 2 }),
    ink: roughPolyline(pts, tight({ seed, passes: 1 })),
  };
}

export function drawIceberg(input: IcebergInput): IcebergDrawing {
  const { mode, width, colX, colW, colTop, waterY, layers, bedY } = input;
  const side = mode === "side";
  const rand = seeded("stack-iceberg");
  const jit = (amt: number) => (rand() * 2 - 1) * amt;

  // The axis, and half-widths at the widest point: left (SL) and right (SR). Beside the rows the
  // bulk leans left, into the page margin (never closer than 24px to the edge), so the right side
  // keeps clear of the rows and their leaders; behind the rows it is centred.
  const cx = colX + colW * (side ? 0.47 : 0.5);
  const SL = side ? Math.max(colW * 0.4, Math.min(colW * 0.58, cx - 24)) : colW * 0.42;
  const SR = side ? colW * 0.5 : colW * 0.42;

  const [top, ...sea] = layers;
  // The tip: as tall as the heading and tools beside it (an open card below them never stretches
  // it), or, behind the rows, as tall as its own band.
  const h0 = side ? clamp(top.contentBottom - top.top + 24, 96, Math.max(96, waterY - top.top - 6)) : Math.max(60, waterY - colTop - 6);
  const tipY = waterY - h0;
  /** The ledge on the tip's right foot, just above the water: the diver's spot. */
  const ledgeY = waterY - Math.max(18, 0.13 * h0);
  const last = sea[sea.length - 1];
  const lowY = last.bottom - (last.bottom - last.top) * 0.16;
  /** Waterline, the boundaries between sea layers, the underside. */
  const bounds = [waterY, ...sea.slice(0, -1).map((l, i) => (l.bottom + sea[i + 1].top) / 2), lowY];

  // ---- the silhouette ---------------------------------------------------------------------------
  // Above the water: a broad, blocky tip (wider than it is tall): shoulders, a small plateau, a
  // second peak, a notch, the peak, a step, and down to the right base.
  const above: Point[] = [
    [cx - 0.8 * SL, waterY],
    [cx - 0.7 * SL + jit(0.02 * SL), waterY - 0.22 * h0],
    [cx - 0.53 * SL, waterY - 0.4 * h0],
    [cx - 0.4 * SL, waterY - 0.47 * h0 + jit(0.03 * h0)],
    [cx - 0.24 * SL, tipY + 0.18 * h0],
    [cx - 0.1 * SL, tipY + 0.34 * h0],
    [cx + 0.04 * SR, tipY],
    [cx + 0.2 * SR, tipY + 0.24 * h0],
    [cx + 0.31 * SR, tipY + 0.3 * h0 + jit(0.03 * h0)],
    [cx + 0.46 * SR, waterY - 0.4 * h0],
    [cx + 0.57 * SR, waterY - 0.2 * h0],
    [cx + 0.6 * SR, ledgeY],
    [cx + 0.75 * SR, ledgeY],
    [cx + 0.8 * SR, waterY],
  ];
  // Below: two edges that widen into the bulk of the ice and turn in at the underside.
  const wideL = [0.88, 0.98, 1, 0.9];
  const wideR = [0.86, 0.95, 0.99, 0.8];
  const left: Point[] = [[cx - 0.8 * SL, waterY]];
  const right: Point[] = [[cx + 0.8 * SR, waterY]];
  const n = sea.length;
  for (let i = 0; i < n; i++) {
    const k = Math.min(i, wideL.length - 1);
    const k2 = Math.min(i + 1, wideL.length - 1);
    const y0 = bounds[i];
    const y1 = bounds[i + 1];
    left.push([cx - (wideL[k] + jit(0.035)) * SL, lerp(y0, y1, 0.45 + jit(0.14))]);
    right.push([cx + (wideR[k] + jit(0.035)) * SR, lerp(y0, y1, 0.55 + jit(0.14))]);
    if (i < n - 1) {
      left.push([cx - (lerp(wideL[k], wideL[k2], 0.5) + jit(0.045)) * SL, y1]);
      right.push([cx + (lerp(wideR[k], wideR[k2], 0.5) + jit(0.045)) * SR, y1]);
    }
  }
  const lastTop = bounds[n - 1];
  const dLast = lowY - lastTop;
  left.push([cx - 0.62 * SL, lerp(lastTop, lowY, 0.84)]);
  right.push([cx + 0.56 * SR, lerp(lastTop, lowY, 0.78)]);
  const low: Point = [cx - 0.08 * SL, lowY];
  const underside: Point[] = [[cx - 0.38 * SL, lowY - dLast * 0.05], low, [cx + 0.26 * SR, lowY - dLast * 0.09]];

  // ---- the ridges (facets) ----------------------------------------------------------------------
  // A: from the peak down the whole ice to the lowest point (the light / shadow divide).
  const ridgeA: Point[] = [
    [cx + 0.04 * SR, tipY],
    [cx - 0.02 * SL, tipY + 0.5 * h0],
    [cx - 0.08 * SL, waterY],
    ...bounds.slice(1, -1).map((y, i): Point => [cx + (i % 2 ? 0.06 * SR : -0.16 * SL) + jit(0.04 * SL), y]),
    low,
  ];
  // B: a second facet on the lit side, under the water only.
  const sea1 = bounds[1] ?? lowY;
  const ridgeB: Point[] = [
    [cx + 0.42 * SR, lerp(waterY, sea1, 0.35)],
    [cx + 0.56 * SR, bounds[Math.min(2, n)] ?? lerp(waterY, lowY, 0.5)],
    [cx + 0.48 * SR, bounds[Math.min(3, n)] ?? lerp(waterY, lowY, 0.75)],
    [cx + 0.22 * SR, lowY - dLast * 0.14],
  ];
  ridgeB.sort((a, b) => a[1] - b[1]);
  // C: the shoulder facet of the tip, from the notch down to the waterline.
  const ridgeC: Point[] = [
    [cx - 0.1 * SL, tipY + 0.34 * h0],
    [cx - 0.26 * SL, lerp(tipY, waterY, 0.68)],
    [cx - 0.36 * SL, waterY],
  ];

  /** A ridge's piece inside [y0, y1], or nothing when it does not reach there. */
  const piece = (ridge: readonly Point[], y0: number, y1: number): Point[] | null => {
    const a = Math.max(y0, ridge[0][1]);
    const b = Math.min(y1, ridge[ridge.length - 1][1]);
    return b - a > 4 ? cut(ridge, a, b) : null;
  };

  /** Shadow-side hatching: short slanted strokes from the left edge to ridge A. */
  const gap = side ? 9 : 8;
  const hatch = (poly: readonly Point[], y0: number, y1: number, seed: string): string => {
    let d = "";
    let k = 0;
    for (let y = y0 + gap * 0.6; y < y1 - gap * 0.3; y += gap) {
      const s = span(poly, y);
      if (!s) continue;
      const xl = s[0] + 3;
      const xr = Math.min(xAt(ridgeA, y), s[1]) - 3;
      if (xr - xl < 6) continue;
      const slant = Math.min(7, (xr - xl) * 0.18);
      d += roughLine([xl, y + slant], [xr, y], { seed: `${seed}-${k++}`, roughness: 0.55, bowing: 0.3, passes: 1 });
    }
    return d;
  };

  /** From the layer heading to the ice's right edge, landing inside the layer's own slice. When the
   *  ice is far below the heading (the Interface card is open and the waterline has dropped), the
   *  leader turns a corner instead of slashing across the page: across, down, then onto the ice. */
  const leader = (box: LayerBox, poly: readonly Point[], y0: number, y1: number, seed: string): LayerArt["leader"] => {
    if (!side) return null;
    const ty = clamp(box.headY, y0 + (y1 - y0) * 0.24, y1 - (y1 - y0) * 0.12);
    const s = span(poly, ty);
    const to: Point = [(s ? s[1] : cx) + 8, ty];
    const from: Point = [box.headX - 16, box.headY];
    const pts: Point[] = Math.abs(box.headY - ty) > 140 ? [from, [to[0] + 22, box.headY], [to[0] + 22, ty], to] : [from, to];
    return {
      pencil: roughPolyline(pts, { seed, roughness: 0.8, bowing: 0.5, passes: 1 }),
      ink: roughPolyline(pts, tight({ seed, passes: 1 })),
      dot: to,
    };
  };

  /** A layer boundary drawn across the ice: a slightly jagged seam from edge to edge. */
  const seamAt = (y: number, seed: string): LayerArt["seam"] => {
    const xl = xAt(left, y) + 3;
    const xr = xAt(right, y) - 3;
    if (xr - xl < 12) return null;
    const pts: Point[] = [[xl, y]];
    for (let i = 1; i < 4; i++) pts.push([lerp(xl, xr, i / 4 + jit(0.05)), y + jit(5)]);
    pts.push([xr, y]);
    return { pencil: roughPolyline(pts, { seed, roughness: 0.9, bowing: 0.4, passes: 1 }), ink: roughPolyline(pts, tight({ seed, passes: 1 })) };
  };

  const ridgePaths = (ridges: Point[][], id: string) => ({
    pencil: ridges.map((r, i) => roughPolyline(r, { seed: `${id}-ridge-${i}`, roughness: 0.9, passes: 1 })).join(""),
    ink: ridges.map((r, i) => roughPolyline(r, tight({ seed: `${id}-ridge-${i}`, passes: 1 }))).join(""),
  });

  // ---- the layers -------------------------------------------------------------------------------
  const out: LayerArt[] = [];
  out.push({
    id: top.id,
    above: true,
    fill: linePath(above, true),
    outline: twin(above, `${top.id}-outline`),
    ridges: ridgePaths([piece(ridgeA, tipY, waterY), ridgeC].filter(Boolean) as Point[][], top.id),
    // below the notch only: above it the scanline would bridge the gap between the two peaks
    hatch: hatch(above, tipY + 0.36 * h0, waterY, `${top.id}-hatch`),
    leader: leader(top, above, tipY, waterY, `${top.id}-leader`),
    seam: null,
  });
  sea.forEach((box, i) => {
    const y0 = bounds[i];
    const y1 = bounds[i + 1];
    const isLast = i === n - 1;
    const L = isLast ? cut(left, y0, left[left.length - 1][1]) : cut(left, y0, y1);
    const R = isLast ? cut(right, y0, right[right.length - 1][1]) : cut(right, y0, y1);
    const poly: Point[] = isLast ? [...L, ...underside, ...[...R].reverse()] : [...L, ...[...R].reverse()];
    const ridges = [piece(ridgeA, y0, y1), piece(ridgeB, y0, y1)].filter(Boolean) as Point[][];
    // one facet per layer: from the left edge's middle vertex to ridge A at the layer's foot
    ridges.push([L[Math.floor(L.length / 2)], isLast ? low : [xAt(ridgeA, y1), y1]]);
    let outline: { pencil: string; ink: string };
    if (isLast) outline = twin([...L, ...underside, ...[...R].reverse()], `${box.id}-outline`);
    else {
      const a = twin(L, `${box.id}-outline-l`);
      const b = twin(R, `${box.id}-outline-r`);
      outline = { pencil: a.pencil + b.pencil, ink: a.ink + b.ink };
    }
    out.push({
      id: box.id,
      above: false,
      fill: linePath(poly, true),
      outline,
      ridges: ridgePaths(ridges, box.id),
      hatch: hatch(poly, y0, isLast ? lowY : y1, `${box.id}-hatch`),
      leader: leader(box, poly, y0, isLast ? lowY : y1, `${box.id}-leader`),
      seam: i > 0 ? seamAt(y0, `${box.id}-seam`) : null,
    });
  });

  // ---- the sea surface (at rest; ./IcebergArt rolls it with the scroll) -----------------------------
  const surface = drawSurface(width, waterY, mode, 0);
  const coarse: Point[] = [];
  for (let x = -4; x <= width + 14; x += 14) coarse.push([x, waterY - swell(x, 0) * (side ? 1 : 0.62)]);

  // ---- the seabed -------------------------------------------------------------------------------
  const by = (x: number) => bedY + 2.2 * Math.sin(x / 95 + 1.3);
  const bedDense: Point[] = [];
  for (let x = 0; x <= width + 8; x += 8) bedDense.push([x, by(x)]);
  const bedCoarse: Point[] = [];
  for (let x = 0; x <= width + 26; x += 26) bedCoarse.push([x, by(x)]);
  let ground = "";
  const step = side ? 18 : 15;
  for (let x = 10, k = 0; x < width; x += step, k++) {
    const y = by(x);
    ground += roughLine([x + 2, y + 3], [x - 5, y + 10], { seed: `stack-ground-${k}`, roughness: 0.4, bowing: 0.2, passes: 1 });
  }

  return {
    layers: out,
    surface: { ...surface, pencil: roughPolyline(coarse, { seed: "stack-waterline", roughness: 0.7, bowing: 0.4, passes: 1 }) },
    bed: {
      pencil: roughPolyline(bedCoarse, { seed: "stack-seabed", roughness: 0.8, bowing: 0.4, passes: 1 }),
      ink: linePath(bedDense),
      ground,
    },
    diver: {
      ledge: [cx + 0.675 * SR, ledgeY],
      right: [...right, underside[underside.length - 1]],
      lowY,
      waterY,
      bedY,
      cx,
      s: side ? clamp(colW / 520, 0.55, 0.88) : 0.46,
      // his lane never reaches the rows' headings (behind the rows on narrow screens it may)
      laneMax: side ? Math.min(...sea.map((l) => l.headX)) - 34 : width - 26,
    },
    sub: {
      // the gap between the second and third sea layers (Data and AI): no row ever reaches into it
      y: bounds[Math.min(2, n - 1)],
      xFrom: width + 120,
      xTo: sea[0].headX + (width - sea[0].headX) * (side ? 0.2 : 0.1),
      s: side ? clamp(width / 1700, 0.6, 0.95) : 0.5,
    },
  };
}
