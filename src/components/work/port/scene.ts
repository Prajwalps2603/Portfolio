/**
 * THE PORT (pure geometry: no React, no DOM). A side view of a container terminal drawn for the
 * box it is given (CSS px, 1 unit = 1px).
 *
 * - The quay: a concrete apron with its capping beam, crane rails, bollards, rubber fenders and a
 *   ladder down the wall; the yard (three stacks of three) with other containers outlined behind,
 *   and a faint skyline (sheds, two distant cranes) on the horizon.
 * - A ship-to-shore gantry crane, painted lime: tapered box legs on wheeled bogies and rails, a
 *   sill beam and cross bracing, a zig-zag stairway up the landside leg, a box-girder boom with its
 *   walkway rail from over the yard to over the ship, the A-frame with an aviation light and double
 *   stays, the machinery house on the backreach, festoon cable loops and floodlights under the
 *   boom. The moving parts: a trolley with the operator's cab (and the operator), hoist ropes, a
 *   headblock and the spreader.
 * - The MV SHIPPED at the quay: a dark hull with a raked bow and a raised forecastle (foremast,
 *   rail, anchor), a white sheer line, a tangerine boot-top, a Plimsoll mark and draft marks, hatch
 *   covers under three bays of three, and aft the accommodation block (decks of windows, the
 *   bridge with its window band and wings, a radar mast), the funnel and a tangerine free-fall
 *   lifeboat on its ramp. The water is blue.
 *
 * `stateAt(layout, p)` is the crane's work as a pure function of p (0..1): container i is picked
 * from the top of the yard and set on the ship in turn, bottom tier first (so the next container
 * is always on top in the yard and always has a floor on the ship). p = 0 is the full yard, p = 1
 * the loaded ship. PortScene runs p on a clock.
 */
import type { Point } from "@/components/sketch/rough";

export const COUNT = 9;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (x: number, y: number) => `${r1(x)} ${r1(y)}`;
const rect = (x: number, y: number, w: number, h: number) =>
  `M${pt(x, y)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;
const seg = (x1: number, y1: number, x2: number, y2: number) =>
  `M${pt(x1, y1)}L${pt(x2, y2)}`;
const circle = (cx: number, cy: number, r: number) =>
  `M${pt(cx - r, cy)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
/** A straight member of width w from a to b (a steel strip). */
const strip = (ax: number, ay: number, bx: number, by: number, w: number) => {
  const len = Math.hypot(bx - ax, by - ay) || 1;
  const nx = (-(by - ay) / len) * (w / 2);
  const ny = ((bx - ax) / len) * (w / 2);
  return `M${pt(ax + nx, ay + ny)}L${pt(bx + nx, by + ny)}L${pt(bx - nx, by - ny)}L${pt(ax - nx, ay - ny)}Z`;
};
const smooth = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};

type Paths = Record<
  | "skyline"
  | "clouds"
  | "gulls"
  | "backStacks"
  | "backRidges"
  | "quay"
  | "quayEdge"
  | "capping"
  | "ladder"
  | "rails"
  | "bollards"
  | "fenders"
  | "moorings"
  | "legs"
  | "legPanels"
  | "sill"
  | "braces"
  | "stairs"
  | "bogies"
  | "wheels"
  | "boom"
  | "boomPanels"
  | "boomRail"
  | "aframe"
  | "apexCap"
  | "apexLight"
  | "stays"
  | "house"
  | "houseRoof"
  | "houseBand"
  | "houseLouvers"
  | "festoon"
  | "floods"
  | "hull"
  | "bootTop"
  | "sheer"
  | "fcRail"
  | "foremast"
  | "anchor"
  | "plimsoll"
  | "drafts"
  | "hatch"
  | "hatchRibs"
  | "block"
  | "blockDecks"
  | "blockWindows"
  | "bridge"
  | "bridgeBand"
  | "bridgeMullions"
  | "wings"
  | "mast"
  | "funnel"
  | "funnelBand"
  | "funnelDisc"
  | "lifeboat"
  | "ramp",
  string
>;

export type PortLayout = {
  W: number;
  H: number;
  narrow: boolean;
  /** A container: width, height, gap between neighbours. */
  cw: number;
  ch: number;
  gap: number;
  /** Stencil the names on the containers (wide enough to read); else just the numbers. */
  names: boolean;
  numbers: boolean;
  groundY: number;
  deckY: number;
  seaY: number;
  /** The carried container's top while travelling. */
  travelY: number;
  spreaderH: number;
  headH: number;
  boomTop: number;
  boomBottom: number;
  trolleyH: number;
  quayX: number;
  idleX: number;
  yard: Point[];
  ship: Point[];
  /** Where the SHIPPED stamp lands (the hull, under the bays). */
  stampAt: Point;
  /** The hull's name, painted near the bow (when there is room). */
  hullName: { x: number; y: number; size: number } | null;
  /** The funnel's puff (the stamp's moment). */
  funnelTop: Point;
  /** The hull at the waterline (x0 bow, x1 stern) and the point it pitches about (px, py). */
  float: { x0: number; x1: number; px: number; py: number };
  /** The two mooring lines: quay bollard (fx, fy), sag (cx, cy), the ship's fairlead (tx, ty). */
  ropes: [number, number, number, number, number, number][];
  paths: Paths;
};

export function layoutPort(W: number, H: number): PortLayout {
  const narrow = W < 700;
  const pad = narrow ? 8 : clamp(W * 0.022, 12, 28);
  const ratio = narrow ? 0.46 : 0.42;
  const byW = (W - 2 * pad) / (narrow ? 10.4 : 11.6);
  const byH = (H - 24) / 8.9 / ratio;
  const cw = clamp(Math.min(byW, byH), 26, 112);
  const ch = cw * ratio;
  const gap = Math.max(2, cw * 0.05);
  const stackW = 3 * cw + 2 * gap;

  // ---- vertical: from the bottom up -------------------------------------------------------------
  const groundY = H - 1.25 * ch;
  const seaY = groundY + 0.42 * ch;
  const deckY = groundY - 0.32 * ch;
  const travelY = Math.min(deckY, groundY) - 4 * ch - Math.max(8, ch * 0.3);
  const spreaderH = Math.max(4, 0.15 * ch);
  const headH = Math.max(4, 0.16 * ch);
  const trolleyH = Math.max(6, 0.34 * ch);
  const boomBottom =
    travelY - spreaderH - headH - trolleyH - Math.max(10, 0.4 * ch);
  const boomH = Math.max(7, 0.36 * ch);
  const boomTop = boomBottom - boomH;
  const apexY = Math.max(7, boomTop - 1.45 * ch);

  // ---- horizontal: yard | crane | ship (a narrow box crops the stern) ---------------------------
  const used = 2 * stackW + 5.15 * cw;
  const x0 = pad + Math.max(0, (W - 2 * pad - used) / 2);
  const yardX0 = x0;
  const legL = yardX0 + stackW + 0.55 * cw;
  const legR = legL + 1.3 * cw;
  const quayX = legR + 0.5 * cw;
  const stemX = quayX + 0.16 * cw;
  const bowX = stemX + 0.34 * cw;
  const fcY = deckY - 0.48 * ch;
  const fcX1 = stemX + 0.72 * cw;
  const deckX0 = fcX1 + 0.12 * cw;
  const deckX1 = deckX0 + stackW;
  const houseX0 = deckX1 + 0.2 * cw;
  const houseW = 1.0 * cw;
  const houseX1 = houseX0 + houseW;
  const hullX1 = houseX1 + 0.55 * cw;
  const boomX0 = Math.max(2, yardX0 - 0.15 * cw);
  const boomX1 = deckX1 + 0.14 * cw;
  const apexX = (legL + legR) / 2;

  const yard: Point[] = [];
  const ship: Point[] = [];
  for (let i = 0; i < COUNT; i++) {
    const s = Math.floor(i / 3);
    const t = 2 - (i % 3);
    yard.push([r1(yardX0 + s * (cw + gap)), r1(groundY - (t + 1) * ch)]);
    const b = i % 3;
    const u = Math.floor(i / 3);
    ship.push([r1(deckX0 + b * (cw + gap)), r1(deckY - (u + 1) * ch)]);
  }

  // ---- the sky and the horizon ------------------------------------------------------------------
  const hz = groundY - 0.04 * ch;
  let skyline = "";
  const sheds: [number, number, number][] = [
    [0.02, 1.1, 0.9],
    [0.5, 0.7, 1.5],
    [1.35, 1.6, 0.6],
    [2.05, 0.9, 1.1],
  ];
  for (const [fx, w, h] of sheds) {
    const sx = yardX0 + fx * cw;
    if (sx + w * cw > legL - 0.4 * cw) continue;
    skyline += `M${pt(sx, hz)}V${r1(hz - h * ch)}L${pt(sx + (w * cw) / 2, hz - h * ch - 0.25 * ch)}L${pt(sx + w * cw, hz - h * ch)}V${r1(hz)}`;
  }
  // two distant cranes, small, on the horizon
  const farCrane = (cx: number, s: number) => {
    const h = 2.3 * ch * s;
    const w = 0.5 * cw * s;
    return (
      `M${pt(cx - w / 2, hz)}V${r1(hz - h)}M${pt(cx + w / 2, hz)}V${r1(hz - h)}` +
      `M${pt(cx - w * 2.4, hz - h)}H${r1(cx + w * 3.2)}` +
      `M${pt(cx - w / 2, hz - h)}L${pt(cx, hz - h - 0.5 * ch * s)}L${pt(cx + w / 2, hz - h)}`
    );
  };
  if (!narrow)
    skyline +=
      farCrane(yardX0 + 1.0 * cw, 0.55) + farCrane(yardX0 + 2.55 * cw, 0.42);
  const cloud = (cx: number, cy: number, s: number) =>
    `M${pt(cx - 0.9 * s, cy)}Q${pt(cx - 0.9 * s, cy - 0.45 * s)} ${pt(cx - 0.45 * s, cy - 0.42 * s)}Q${pt(cx - 0.2 * s, cy - 0.85 * s)} ${pt(cx + 0.2 * s, cy - 0.55 * s)}Q${pt(cx + 0.7 * s, cy - 0.7 * s)} ${pt(cx + 0.75 * s, cy - 0.2 * s)}Q${pt(cx + 1.05 * s, cy)} ${pt(cx + 0.8 * s, cy)}Z`;
  const clouds = narrow
    ? ""
    : cloud(legR + 2.6 * cw, apexY + 0.6 * ch, 0.55 * cw) +
      cloud(yardX0 + 1.9 * cw, apexY + 0.35 * ch, 0.42 * cw);
  const gull = (x: number, y: number, s: number) =>
    `M${pt(x - s, y)}Q${pt(x - s / 2, y - s * 0.55)} ${pt(x, y)}Q${pt(x + s / 2, y - s * 0.55)} ${pt(x + s, y)}`;
  const gs = Math.max(4, 0.07 * cw);
  const gulls =
    gull(houseX1 - 0.2 * cw, apexY + 0.5 * ch, gs) +
    gull(houseX1 + 0.35 * cw, apexY + 0.85 * ch, gs * 0.8) +
    gull(legR + 1.2 * cw, apexY + 0.15 * ch, gs * 0.7);

  // other containers at the back of the yard: outlines only, so the yard never looks empty
  let backStacks = "";
  let backRidges = "";
  const bw2 = cw * 0.86;
  const bh2 = ch * 0.86;
  [2, 3, 1, 2].forEach((tiers, k) => {
    const bx0 = yardX0 + k * (bw2 + gap) - 0.25 * cw;
    if (bx0 + bw2 > legL - 0.3 * cw || bx0 < 0) return;
    for (let t = 0; t < tiers; t++) {
      const by = groundY - 0.32 * ch - (t + 1) * bh2;
      backStacks += rect(bx0, by, bw2, bh2);
      for (let r = 1; r < 6; r++)
        backRidges += seg(
          bx0 + (r * bw2) / 6,
          by + bh2 * 0.2,
          bx0 + (r * bw2) / 6,
          by + bh2 * 0.8,
        );
    }
  });

  // ---- the quay ---------------------------------------------------------------------------------
  const quay = rect(-2, groundY, quayX + 2, H - groundY + 2);
  const quayEdge = `M${pt(-2, groundY)}H${r1(quayX)}V${r1(H + 2)}`;
  const capping = seg(0, groundY + 0.2 * ch, quayX, groundY + 0.2 * ch);
  let ladder =
    seg(quayX - 0.1 * cw, groundY, quayX - 0.1 * cw, H) +
    seg(quayX - 0.02 * cw, groundY, quayX - 0.02 * cw, H);
  for (let y = groundY + 0.18 * ch; y < H; y += Math.max(4, 0.16 * ch))
    ladder += seg(quayX - 0.1 * cw, y, quayX - 0.02 * cw, y);
  const bogieH = Math.max(5, 0.22 * ch);
  const railW = Math.max(10, 0.6 * cw);
  const rails =
    rect(legL - railW / 2, groundY - 1.4, railW, 2.8) +
    rect(legR - railW / 2, groundY - 1.4, railW, 2.8);
  const bollard = (x: number) => {
    const bw = Math.max(3, 0.07 * cw);
    const bh = Math.max(4, 0.2 * ch);
    return (
      rect(x - bw / 2, groundY - bh, bw, bh) +
      rect(
        x - bw,
        groundY - bh - Math.max(1.5, 0.05 * ch),
        bw * 2,
        Math.max(2, 0.07 * ch),
      )
    );
  };
  const b1 = quayX - 0.25 * cw;
  const b2 = quayX - 0.95 * cw;
  const bollards = bollard(b1) + bollard(b2);
  const fw = Math.max(4, 0.09 * cw);
  const fenders =
    rect(quayX - fw * 0.3, seaY - 0.45 * ch, fw, 0.7 * ch) +
    (narrow ? "" : rect(quayX - fw * 0.3, seaY - 0.45 * ch, fw, 0.7 * ch));

  // ---- the crane --------------------------------------------------------------------------------
  const legWb = Math.max(5, 0.15 * cw);
  const legWt = Math.max(4, 0.1 * cw);
  const legBot = groundY - bogieH;
  const leg = (x: number) =>
    `M${pt(x - legWb / 2, legBot)}L${pt(x - legWt / 2, boomBottom)}H${r1(x + legWt / 2)}L${pt(x + legWb / 2, legBot)}Z`;
  const legs = leg(legL) + leg(legR);
  let legPanels = "";
  const panelStep = Math.max(8, 0.55 * ch);
  for (const x of [legL, legR]) {
    for (let y = boomBottom + panelStep; y < legBot - 4; y += panelStep) {
      const k = (y - boomBottom) / (legBot - boomBottom);
      const half = (legWt + (legWb - legWt) * k) / 2;
      legPanels += seg(x - half, y, x + half, y);
    }
  }
  const sillY = groundY - 1.05 * ch;
  const sillH = Math.max(3, 0.13 * ch);
  const sill = rect(legL, sillY, legR - legL, sillH);
  const bw = Math.max(2.5, 0.045 * cw);
  const braces =
    strip(legL, sillY, legR, boomBottom + 0.12 * ch, bw) +
    strip(legR, sillY, legL, boomBottom + 0.12 * ch, bw);
  // the stairway up the landside leg: flights zig-zag between the leg and an outer stringer
  let stairs = "";
  const sx0 = legL - legWb / 2 - 1;
  const sx1 = sx0 - Math.max(8, 0.26 * cw);
  const flight = Math.max(10, 0.62 * ch);
  let up = true;
  for (let y = legBot; y - flight > boomBottom + 4; y -= flight) {
    const a = up ? sx0 : sx1;
    const b = up ? sx1 : sx0;
    stairs += seg(a, y, b, y - flight);
    for (let k = 1; k < 4; k++) {
      const tx = a + ((b - a) * k) / 4;
      const ty = y - (flight * k) / 4;
      stairs += seg(tx, ty, tx + (b > a ? 1 : -1) * 2.2, ty);
    }
    stairs += seg(sx1, y - flight, sx0, y - flight);
    up = !up;
  }
  stairs += seg(sx1, legBot, sx1, boomBottom + 6);
  const bogieW = Math.max(12, 0.48 * cw);
  const bogies =
    rect(legL - bogieW / 2, legBot, bogieW, bogieH * 0.56) +
    rect(legR - bogieW / 2, legBot, bogieW, bogieH * 0.56);
  let wheels = "";
  const wr = Math.max(1.6, bogieH * 0.22);
  for (const lx of [legL, legR])
    for (const k of [-0.36, -0.12, 0.12, 0.36])
      wheels += circle(lx + k * bogieW, groundY - wr, wr);

  // the boom: a box girder, tapered at both ends, with stiffeners and a walkway rail on top
  const tip = 0.35 * cw;
  const boom =
    `M${pt(boomX0, boomTop + boomH * 0.22)}L${pt(boomX0 + tip * 0.6, boomTop)}H${r1(boomX1 - tip)}` +
    `L${pt(boomX1, boomTop + boomH * 0.35)}V${r1(boomBottom)}H${r1(boomX0)}Z`;
  let boomPanels = "";
  const bp = Math.max(10, 0.46 * cw);
  for (let x = boomX0 + bp; x < boomX1 - bp * 0.5; x += bp)
    boomPanels += seg(x, boomTop + 1.5, x, boomBottom - 1.5);
  const railH = Math.max(3.5, 0.13 * ch);
  let boomRail = seg(
    boomX0 + tip * 0.6,
    boomTop - railH,
    boomX1 - tip,
    boomTop - railH,
  );
  for (let x = boomX0 + tip; x < boomX1 - tip; x += Math.max(7, 0.22 * cw))
    boomRail += seg(x, boomTop, x, boomTop - railH);
  // the A-frame, a tie across it, its cap and the aviation light
  const aw = Math.max(3, 0.075 * cw);
  const aframe =
    strip(legL, boomTop, apexX, apexY, aw) +
    strip(legR, boomTop, apexX, apexY, aw) +
    strip(
      legL + 0.28 * (apexX - legL),
      boomTop - 0.28 * (boomTop - apexY),
      legR - 0.28 * (legR - apexX),
      boomTop - 0.28 * (boomTop - apexY),
      aw * 0.7,
    );
  const apexCap = rect(
    apexX - 0.09 * cw,
    apexY - 0.06 * ch,
    0.18 * cw,
    Math.max(3, 0.12 * ch),
  );
  const apexLight = circle(apexX, apexY - 0.13 * ch, Math.max(1.8, 0.035 * cw));
  const dbl = (x1: number, y1: number, x2: number, y2: number) =>
    seg(x1 - 1.2, y1, x2 - 1.2, y2) + seg(x1 + 1.2, y1, x2 + 1.2, y2);
  const stays =
    dbl(apexX, apexY, boomX1 - tip * 1.1, boomTop) +
    dbl(apexX, apexY, boomX0 + 0.55 * cw, boomTop) +
    seg(apexX, apexY, legR + 0.48 * (boomX1 - legR), boomTop);
  // the machinery house on the backreach
  const hx = boomX0 + 0.2 * cw;
  const hw = Math.min(1.3 * cw, legL - hx - 0.9 * cw);
  const hh = Math.max(8, 0.78 * ch);
  const house = rect(hx, boomTop - railH * 0.2 - hh, hw, hh);
  const houseRoof = rect(
    hx - 2,
    boomTop - railH * 0.2 - hh - Math.max(2.5, 0.08 * ch),
    hw + 4,
    Math.max(2.5, 0.08 * ch),
  );
  const houseBand = rect(
    hx,
    boomTop - railH * 0.2 - hh * 0.36,
    hw,
    Math.max(2, hh * 0.13),
  );
  let houseLouvers = "";
  for (let k = 0; k < 3; k++)
    houseLouvers += seg(
      hx + hw * 0.62,
      boomTop - hh * (0.86 - k * 0.14),
      hx + hw * 0.9,
      boomTop - hh * (0.86 - k * 0.14),
    );
  houseLouvers += rect(
    hx + hw * 0.14,
    boomTop - railH * 0.2 - hh * 0.8,
    hw * 0.16,
    hh * 0.38,
  );
  // festoon cable loops and floodlights under the boom
  let festoon = "";
  const loopW = Math.max(6, 0.24 * cw);
  for (let x = boomX0 + 0.3 * cw; x + loopW < legL - 0.2 * cw; x += loopW) {
    festoon += `M${pt(x, boomBottom)}Q${pt(x + loopW / 2, boomBottom + Math.max(6, 0.42 * ch))} ${pt(x + loopW, boomBottom)}`;
  }
  let floods = "";
  for (const fx of [yardX0 + 0.8 * cw, (legL + legR) / 2, deckX0 + 1.6 * cw]) {
    const fw2 = Math.max(4, 0.12 * cw);
    floods += `M${pt(fx - fw2 / 2, boomBottom)}h${r1(fw2)}l${r1(-fw2 * 0.2)} ${r1(Math.max(3, 0.12 * ch))}h${r1(-fw2 * 0.6)}Z`;
  }

  // ---- the ship ---------------------------------------------------------------------------------
  const keel = H + 6;
  const top = deckY + 0.02 * ch;
  const hull =
    `M${pt(stemX, fcY)}H${r1(fcX1)}L${pt(fcX1 + 0.08 * cw, top)}H${r1(hullX1)}` +
    `L${pt(hullX1 - 0.1 * cw, seaY - 0.08 * ch)}L${pt(hullX1 - 0.24 * cw, keel)}H${r1(bowX + 0.1 * cw)}` +
    `C${pt(bowX - 0.02 * cw, H - 0.2 * ch)} ${pt(bowX - 0.02 * cw, seaY)} ${pt(bowX, seaY - 0.02 * ch)}` +
    `C${pt(stemX + 0.16 * cw, seaY - 0.4 * ch)} ${pt(stemX + 0.02 * cw, fcY + 0.4 * ch)} ${pt(stemX, fcY)}Z`;
  const bt = Math.max(3, 0.2 * ch);
  const bootTop = rect(stemX - cw, seaY - bt, hullX1 - stemX + 2 * cw, bt + ch);
  const sheerY = top + Math.max(2, 0.07 * ch);
  const sheer = `M${pt(stemX + 0.05 * cw, fcY + Math.max(2, 0.07 * ch))}H${r1(fcX1 - 0.02 * cw)}L${pt(fcX1 + 0.06 * cw, sheerY)}H${r1(hullX1 - 0.03 * cw)}`;
  let fcRail = seg(
    stemX + 0.06 * cw,
    fcY - railH,
    fcX1 - 0.04 * cw,
    fcY - railH,
  );
  for (let x = stemX + 0.08 * cw; x < fcX1; x += Math.max(6, 0.17 * cw))
    fcRail += seg(x, fcY, x, fcY - railH);
  const fmX = stemX + 0.36 * cw;
  const foremast =
    seg(fmX, fcY, fmX, fcY - 1.05 * ch) +
    seg(fmX - 0.1 * cw, fcY - 0.78 * ch, fmX + 0.1 * cw, fcY - 0.78 * ch) +
    circle(fmX, fcY - 1.1 * ch, Math.max(1.4, 0.03 * cw));
  const ax = stemX + 0.24 * cw;
  const ay = fcY + 0.36 * ch;
  const as = Math.max(3, 0.13 * ch);
  const anchor =
    circle(ax, ay - as * 0.6, as * 0.32) +
    seg(ax, ay - as * 0.3, ax, ay + as) +
    `M${pt(ax - as * 0.55, ay + as * 0.55)}Q${pt(ax, ay + as * 1.25)} ${pt(ax + as * 0.55, ay + as * 0.55)}` +
    seg(ax - as * 0.35, ay, ax + as * 0.35, ay);
  const pmX = deckX0 + stackW * 0.82;
  const pmY = seaY - bt - Math.max(5, 0.22 * ch);
  const pr = Math.max(2.5, 0.12 * ch);
  const plimsoll =
    circle(pmX, pmY, pr) +
    seg(pmX - pr * 1.6, pmY, pmX + pr * 1.6, pmY) +
    seg(pmX + pr * 2.2, pmY - pr, pmX + pr * 2.2, pmY + pr * 0.4) +
    seg(pmX + pr * 2.2, pmY - pr, pmX + pr * 3.1, pmY - pr);
  let drafts = "";
  for (const dx of [bowX + 0.2 * cw, hullX1 - 0.32 * cw]) {
    for (let k = 0; k < 3; k++)
      drafts += seg(
        dx,
        seaY - bt - (k + 1) * Math.max(3, 0.12 * ch),
        dx + Math.max(3, 0.08 * cw),
        seaY - bt - (k + 1) * Math.max(3, 0.12 * ch),
      );
  }
  const hatchH = Math.max(2.5, 0.12 * ch);
  const hatch = rect(deckX0 - 0.04 * cw, deckY, stackW + 0.08 * cw, hatchH);
  let hatchRibs = "";
  for (let x = deckX0; x < deckX1; x += Math.max(6, 0.2 * cw))
    hatchRibs += seg(x, deckY, x, deckY + hatchH);
  // aft: the accommodation block, the bridge and its wings, the radar mast, the funnel, the lifeboat
  const deckH = 0.62 * ch;
  const blockTop = deckY - 3.45 * ch;
  const block = rect(houseX0, blockTop, houseW, top - blockTop);
  let blockDecks = "";
  let blockWindows = "";
  for (let k = 1; k <= 4; k++) {
    const y = blockTop + k * deckH;
    if (y < top - 2) blockDecks += seg(houseX0, y, houseX1, y);
    const wy = blockTop + (k - 1) * deckH + deckH * 0.32;
    if (wy + deckH * 0.3 > top) continue;
    for (let j = 0; j < 4; j++)
      blockWindows += rect(
        houseX0 + houseW * (0.12 + j * 0.21),
        wy,
        houseW * 0.12,
        deckH * 0.3,
      );
  }
  const bridgeH = Math.max(6, 0.5 * ch);
  const bridgeTop = blockTop - bridgeH;
  const bridge = rect(
    houseX0 - 0.06 * cw,
    bridgeTop,
    houseW + 0.12 * cw,
    bridgeH,
  );
  const bridgeBand = rect(
    houseX0 - 0.02 * cw,
    bridgeTop + bridgeH * 0.22,
    houseW + 0.04 * cw,
    bridgeH * 0.42,
  );
  let bridgeMullions = "";
  for (let k = 1; k < 7; k++) {
    const x = houseX0 - 0.02 * cw + ((houseW + 0.04 * cw) * k) / 7;
    bridgeMullions += seg(
      x,
      bridgeTop + bridgeH * 0.22,
      x,
      bridgeTop + bridgeH * 0.64,
    );
  }
  const wingH = Math.max(2.5, 0.09 * ch);
  const wings =
    rect(
      houseX0 - 0.34 * cw,
      bridgeTop + bridgeH - wingH,
      houseW + 0.56 * cw,
      wingH,
    ) +
    seg(
      houseX0 - 0.3 * cw,
      bridgeTop + bridgeH,
      houseX0 - 0.02 * cw,
      bridgeTop + bridgeH + 0.4 * ch,
    );
  const mx = houseX0 + houseW * 0.38;
  const mastTop = bridgeTop - 0.85 * ch;
  const mast =
    seg(mx, bridgeTop, mx, mastTop) +
    seg(mx - 0.2 * cw, mastTop + 0.2 * ch, mx + 0.2 * cw, mastTop + 0.2 * ch) +
    rect(
      mx - 0.12 * cw,
      mastTop + 0.38 * ch,
      0.24 * cw,
      Math.max(2, 0.06 * ch),
    ) +
    circle(mx, mastTop - 0.05 * ch, Math.max(1.4, 0.03 * cw));
  const fx0 = houseX1 - 0.3 * cw;
  const fTop = bridgeTop - 1.0 * ch;
  const funnel = `M${pt(fx0, bridgeTop)}L${pt(fx0 + 0.08 * cw, fTop)}H${r1(fx0 + 0.44 * cw)}L${pt(fx0 + 0.4 * cw, bridgeTop)}Z`;
  const funnelBand = `M${pt(fx0 + 0.07 * cw, fTop + 0.18 * ch)}H${r1(fx0 + 0.435 * cw)}L${pt(fx0 + 0.43 * cw, fTop + 0.42 * ch)}H${r1(fx0 + 0.055 * cw)}Z`;
  const funnelDisc = circle(
    fx0 + 0.25 * cw,
    fTop + 0.66 * ch,
    Math.max(2, 0.08 * cw),
  );
  // a free-fall lifeboat on its ramp at the stern
  const rampX0 = houseX1 + 0.04 * cw;
  const rampY0 = blockTop + 1.15 * ch;
  const rampX1 = hullX1 - 0.06 * cw;
  const rampY1 = rampY0 + 0.62 * ch;
  const ramp =
    seg(rampX0, rampY0 + 0.24 * ch, rampX1, rampY1 + 0.24 * ch) +
    seg(rampX1 - 0.05 * cw, rampY1 + 0.24 * ch, rampX1 - 0.05 * cw, top) +
    seg(rampX0 + 0.08 * cw, rampY0 + 0.3 * ch, rampX0 + 0.08 * cw, top);
  const lbLen = Math.hypot(rampX1 - rampX0, rampY1 - rampY0) * 0.86;
  const lbH = Math.max(4, 0.3 * ch);
  const ang = Math.atan2(rampY1 - rampY0, rampX1 - rampX0);
  const cx = (rampX0 + rampX1) / 2;
  const cy = (rampY0 + rampY1) / 2 + 0.06 * ch;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const P = (u: number, v: number) =>
    pt(cx + u * ca - v * sa, cy + u * sa + v * ca);
  const L2 = lbLen / 2;
  const lifeboat = `M${P(-L2, -lbH / 2)}L${P(L2 * 0.72, -lbH / 2)}Q${P(L2, -lbH / 2)} ${P(L2, 0)}Q${P(L2, lbH / 2)} ${P(L2 * 0.72, lbH / 2)}L${P(-L2, lbH / 2)}Z`;

  const mooring = (fromX: number, toX: number, toY: number) =>
    `M${pt(fromX, groundY - Math.max(4, 0.2 * ch))}Q${pt((fromX + toX) / 2, groundY + 0.22 * ch)} ${pt(toX, toY)}`;
  const moorings =
    mooring(b1, stemX + 0.2 * cw, fcY + 0.12 * ch) +
    mooring(b2, fcX1 - 0.05 * cw, fcY + 0.22 * ch);

  const nameSize = clamp(ch * 0.3, 8, 11);
  return {
    W,
    H,
    narrow,
    cw: r1(cw),
    ch: r1(ch),
    gap: r1(gap),
    names: cw >= 85,
    numbers: cw >= 30,
    groundY: r1(groundY),
    deckY: r1(deckY),
    seaY: r1(seaY),
    travelY: r1(travelY),
    spreaderH: r1(spreaderH),
    headH: r1(headH),
    boomTop: r1(boomTop),
    boomBottom: r1(boomBottom),
    trolleyH: r1(trolleyH),
    quayX: r1(quayX),
    idleX: r1(apexX),
    yard,
    ship,
    stampAt: [r1(deckX0 + stackW * 0.7), r1(top + (seaY - bt - top) * 0.5)],
    hullName:
      cw >= 60
        ? {
            x: r1(fcX1 + 0.16 * cw),
            y: r1(top + (seaY - bt - top) * 0.62),
            size: nameSize,
          }
        : null,
    funnelTop: [r1(fx0 + 0.26 * cw), r1(fTop)],
    float: {
      x0: r1(bowX),
      x1: r1(hullX1 - 0.1 * cw),
      px: r1((bowX + hullX1 - 0.1 * cw) / 2),
      py: r1(seaY),
    },
    ropes: [
      [b1, stemX + 0.2 * cw, fcY + 0.12 * ch],
      [b2, fcX1 - 0.05 * cw, fcY + 0.22 * ch],
    ].map(
      ([fx, tx, ty]) =>
        [
          r1(fx),
          r1(groundY - Math.max(4, 0.2 * ch)),
          r1((fx + tx) / 2),
          r1(groundY + 0.22 * ch),
          r1(tx),
          r1(ty),
        ] as [number, number, number, number, number, number],
    ),
    paths: {
      skyline,
      clouds,
      gulls,
      backStacks,
      backRidges,
      quay,
      quayEdge,
      capping,
      ladder,
      rails,
      bollards,
      fenders,
      moorings,
      legs,
      legPanels,
      sill,
      braces,
      stairs,
      bogies,
      wheels,
      boom,
      boomPanels,
      boomRail,
      aframe,
      apexCap,
      apexLight,
      stays,
      house,
      houseRoof,
      houseBand,
      houseLouvers,
      festoon,
      floods,
      hull,
      bootTop,
      sheer,
      fcRail,
      foremast,
      anchor,
      plimsoll,
      drafts,
      hatch,
      hatchRibs,
      block,
      blockDecks,
      blockWindows,
      bridge,
      bridgeBand,
      bridgeMullions,
      wings,
      mast,
      funnel,
      funnelBand,
      funnelDisc,
      lifeboat,
      ramp,
    },
  };
}

export type PortState = {
  trolleyX: number;
  /** The spreader's bottom edge (the carried container's top). */
  spreaderY: number;
  /** Top-left of every container. */
  boxes: Point[];
  /** The container on the hook, or -1. */
  carrying: number;
  /** The container being worked (0..COUNT-1) and how far through its move (0..1; set down at 0.86). */
  i: number;
  q: number;
};

/**
 * The crane at p (0..1). Each container's turn is one ninth of p: travel over it, lower, lock,
 * hoist, travel to its slot on the ship, lower, unlock, hoist back up. Phases ease in and out
 * (smoothstep), so steady time reads as a crane at work, and running p backwards unloads the ship.
 */
export function stateAt(L: PortLayout, p: number): PortState {
  const P = clamp(p, 0, 1) * COUNT;
  let i = Math.floor(P);
  let q = P - i;
  if (i >= COUNT) {
    i = COUNT - 1;
    q = 1;
  }
  const boxes: Point[] = [];
  for (let j = 0; j < COUNT; j++) boxes.push(j < i ? L.ship[j] : L.yard[j]);
  const A = L.yard[i];
  const B = L.ship[i];
  const ax = A[0] + L.cw / 2;
  const bx = B[0] + L.cw / 2;
  const from = i === 0 ? L.idleX : L.ship[i - 1][0] + L.cw / 2;
  const seg2 = (a: number, b: number) => smooth((q - a) / (b - a));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  let x = from;
  let y = L.travelY;
  let carrying = -1;
  if (q < 0.16) {
    x = lerp(from, ax, seg2(0, 0.16));
  } else if (q < 0.3) {
    x = ax;
    y = lerp(L.travelY, A[1], seg2(0.16, 0.3));
  } else if (q < 0.36) {
    x = ax;
    y = A[1];
    carrying = i;
  } else if (q < 0.5) {
    x = ax;
    y = lerp(A[1], L.travelY, seg2(0.36, 0.5));
    carrying = i;
  } else if (q < 0.72) {
    x = lerp(ax, bx, seg2(0.5, 0.72));
    carrying = i;
  } else if (q < 0.86) {
    x = bx;
    y = lerp(L.travelY, B[1], seg2(0.72, 0.86));
    carrying = i;
  } else if (q < 0.9) {
    x = bx;
    y = B[1];
  } else {
    x = bx;
    y = lerp(B[1], L.travelY, seg2(0.9, 1));
  }
  if (carrying === i) boxes[i] = [x - L.cw / 2, y];
  else if (q >= 0.86) boxes[i] = B;
  return { trolleyX: x, spreaderY: y, boxes, carrying, i, q };
}

/** The sea's surface offset at x and a phase (the same waves seaPath draws). */
export function surfaceAt(L: PortLayout, x: number, phase: number): number {
  const amp = Math.max(1.2, L.ch * 0.07);
  return (
    amp * Math.sin(x * 0.045 + phase) +
    amp * 0.5 * Math.sin(x * 0.11 - phase * 1.7)
  );
}

/** The sea's surface across [quay, W] at a phase (it rolls all the while). */
export function seaPath(
  L: PortLayout,
  phase: number,
  bump?: (x: number) => number,
): string {
  const x0 = L.quayX;
  const amp = Math.max(1.2, L.ch * 0.07);
  let d = `M${pt(x0, L.seaY)}`;
  for (let x = x0; x <= L.W + 8; x += 8) {
    const y =
      L.seaY +
      amp * Math.sin(x * 0.045 + phase) +
      amp * 0.5 * Math.sin(x * 0.11 - phase * 1.7) +
      (bump ? bump(x) : 0);
    d += `L${pt(x, y)}`;
  }
  return `${d}V${r1(L.H + 4)}H${r1(x0)}Z`;
}

/** A thin swell line inside the water, at depth k (0..1). */
export function swellPath(
  L: PortLayout,
  phase: number,
  k: number,
  bump?: (x: number) => number,
): string {
  const x0 = L.quayX + 6;
  const y0 = L.seaY + (L.H - L.seaY) * k;
  const amp = Math.max(0.8, L.ch * 0.05);
  let d = "";
  for (let x = x0; x <= L.W + 8; x += 10) {
    const y =
      y0 +
      amp * Math.sin(x * 0.06 + phase * 1.3 + k * 3) +
      (bump ? bump(x) * (1 - k) * 0.6 : 0);
    d += `${x === x0 ? "M" : "L"}${pt(x, y)}`;
  }
  return d;
}
