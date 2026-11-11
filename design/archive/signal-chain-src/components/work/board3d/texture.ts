import { BOARD_W, CHIP_D, CHIP_W, COLS, HEAD, LEGEND, MARGIN_Z, TILT, colX, type Frame } from "./frame";
import type { Routed } from "./layout";
import { PALETTE } from "@/lib/channels";

/**
 * The board's silkscreen and the chip tops, painted into ONE canvas per system and uploaded as
 * one texture. Redrawn when the system, a what-if label, the canvas scale or the fonts change;
 * never per frame.
 *
 * Layout of the canvas: the board's top face (graphite FR4, graticule dots, silkscreen) on top,
 * then an atlas of chip tops below it. Under every chip the board shows its empty footprint
 * (outline, leads, refdes), so a chip seating onto the board covers a real footprint.
 *
 * Text is painted at screen pixels (1 canvas px = 1 device px across the board) and stretched
 * along z by 1 / cos(tilt), so the 35° camera foreshortening gives it back its true proportions.
 * Sizes never go below 11 CSS px.
 */

export type PaintChip = { id: string; label: string; refdes: string; hex: string };
export type PaintColumn = { label: string; mark: string; hex: string; fitted: boolean };
export type PaintInput = {
  frame: Frame;
  routed: Routed;
  /** Aligned with routed.chips. */
  chips: PaintChip[];
  columns: PaintColumn[];
  /** Wire ends get a pad. */
  legend: { left: string; right: string };
  /** CSS px per board unit, and the device pixel ratio. */
  cssPerUnit: number;
  dpr: number;
  fonts: { display: string; mono: string };
};

/**
 * Where things live in the texture, in board units (so geometry UVs never depend on the
 * resolution it is painted at): the board area on top, then a row-major atlas of chip tops.
 */
export type AtlasLayout = { unitsW: number; unitsH: number; cells: { x: number; z: number }[] };

const GAP = 0.04;

export function atlasLayout(frame: Frame, count: number): AtlasLayout {
  const perRow = Math.max(1, Math.floor((BOARD_W - GAP) / (CHIP_W + GAP)));
  const rows = Math.max(1, Math.ceil(count / perRow));
  const cells = Array.from({ length: count }, (_, i) => ({
    x: GAP + (i % perRow) * (CHIP_W + GAP),
    z: frame.depth + GAP + Math.floor(i / perRow) * (CHIP_D + GAP),
  }));
  return { unitsW: BOARD_W, unitsH: frame.depth + GAP + rows * (CHIP_D + GAP), cells };
}

const STRETCH = 1 / Math.cos(TILT);
const LABEL_STRETCHES = ["semi-condensed", "condensed"] as const;

type Ctx = CanvasRenderingContext2D;

/** Read the self-hosted font stacks (next/font variables) so the canvas uses the page's faces. */
export function pageFonts(): PaintInput["fonts"] {
  const cs = getComputedStyle(document.documentElement);
  return {
    display: cs.getPropertyValue("--font-archivo").trim() || "Archivo, Arial, sans-serif",
    mono: cs.getPropertyValue("--font-martian").trim() || "ui-monospace, Consolas, monospace",
  };
}

/** Resolve once the faces the texture uses are loaded (or after a short timeout). */
export function loadFonts(fonts: PaintInput["fonts"]): Promise<void> {
  if (!document.fonts?.load) return Promise.resolve();
  const wanted = [`600 24px ${fonts.display}`, `500 22px ${fonts.mono}`, `700 22px ${fonts.mono}`];
  const all = Promise.all(wanted.map((f) => document.fonts.load(f).catch(() => []))).then(() => undefined);
  return Promise.race([all, new Promise<void>((r) => setTimeout(r, 1500))]);
}

function setFont(ctx: Ctx, weight: number, px: number, family: string, stretch: CanvasFontStretch = "normal") {
  ctx.font = `${weight} ${px}px ${family}`;
  if ("fontStretch" in ctx) ctx.fontStretch = stretch;
}

function setTracking(ctx: Ctx, px: number) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

/** fillText with the z-stretch that undoes the camera foreshortening. */
function text(ctx: Ctx, s: string, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, STRETCH);
  ctx.fillText(s, 0, 0);
  ctx.restore();
}

function wrap(ctx: Ctx, s: string, maxW: number): string[] {
  const words = s.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  const push = (w: string) => {
    // A word wider than the line is broken by characters.
    if (ctx.measureText(w).width <= maxW) return [w];
    const parts: string[] = [];
    let cur = "";
    for (const ch of w) {
      if (cur && ctx.measureText(cur + ch).width > maxW) {
        parts.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) parts.push(cur);
    return parts;
  };
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= maxW) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    const parts = push(w);
    lines.push(...parts.slice(0, -1));
    line = parts[parts.length - 1];
  }
  if (line) lines.push(line);
  return lines;
}

function ellipsize(ctx: Ctx, s: string, maxW: number): string {
  if (ctx.measureText(s).width <= maxW) return s;
  let t = s;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/** Fit a chip name in at most two lines: 12px, then 11px, semi-condensed then condensed. */
function fitLabel(ctx: Ctx, s: string, maxW: number, dpr: number, family: string) {
  for (const stretch of LABEL_STRETCHES)
    for (const css of [12, 11]) {
      setFont(ctx, 600, css * dpr, family, stretch);
      const lines = wrap(ctx, s, maxW);
      if (lines.length <= 2) return { lines, px: css * dpr, stretch };
    }
  const px = 11 * dpr;
  setFont(ctx, 600, px, family, "condensed");
  const lines = wrap(ctx, s, maxW);
  return { lines: [lines[0], ellipsize(ctx, lines.slice(1).join(" "), maxW)], px, stretch: "condensed" as CanvasFontStretch };
}

export function paintBoard(canvas: HTMLCanvasElement, input: PaintInput, layout: AtlasLayout): void {
  const { frame, routed, chips, columns, legend, cssPerUnit, dpr, fonts } = input;
  const S = cssPerUnit * dpr;
  const W = Math.max(64, Math.round(layout.unitsW * S));
  const H = Math.max(64, Math.round(layout.unitsH * S));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  const sx = W / layout.unitsW;
  const sz = H / layout.unitsH;
  const boardH = frame.depth * sz;

  const px = (css: number) => css * dpr;
  const X = (x: number) => (x + BOARD_W / 2) * sx;
  const Z = (z: number) => (z + frame.depth / 2) * sz;
  const u = (units: number) => units * sx;
  const v = (units: number) => units * sz;

  // ------------------------------------------------------------- FR4
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = PALETTE.graphite;
  ctx.fillRect(0, 0, W, boardH);
  // Graticule dots, on the board's 0.25-unit grid.
  ctx.fillStyle = PALETTE.graticule;
  const dot = Math.max(1, Math.round(px(1.25)));
  for (let x = 0.25; x < BOARD_W - 0.1; x += 0.25)
    for (let z = 0.25; z < frame.depth - 0.1; z += 0.25) ctx.fillRect(Math.round(u(x) - dot / 2), Math.round(v(z) - dot / 2), dot, dot);
  // Silkscreen outline, inset from the edge.
  ctx.strokeStyle = PALETTE.graticuleStrong;
  ctx.lineWidth = px(1);
  ctx.strokeRect(u(0.12), v(0.12), W - u(0.24), boardH - v(0.24));
  // Plated mounting holes: a ring and the bench showing through.
  for (const [hx, hz] of [
    [0.24, 0.24],
    [BOARD_W - 0.24, 0.24],
    [0.24, frame.depth - 0.24],
    [BOARD_W - 0.24, frame.depth - 0.24],
  ]) {
    ctx.beginPath();
    ctx.ellipse(u(hx), v(hz), u(0.075), v(0.075), 0, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.bezel;
    ctx.fill();
    ctx.lineWidth = px(1.5);
    ctx.strokeStyle = PALETTE.graticuleStrong;
    ctx.stroke();
  }

  // ------------------------------------------------------------- column headers
  const headZ = -frame.depth / 2 + MARGIN_Z + HEAD / 2;
  const mark = px(15);
  ctx.textBaseline = "middle";
  columns.forEach((col, c) => {
    const x0 = X(colX(c) - CHIP_W / 2);
    const zc = Z(headZ);
    const mh = mark * STRETCH;
    ctx.fillStyle = col.hex;
    ctx.fillRect(x0, zc - mh / 2, mark, mh);
    setFont(ctx, 700, px(11), fonts.mono, "semi-condensed");
    setTracking(ctx, 0);
    ctx.fillStyle = PALETTE.graphite;
    ctx.textAlign = "center";
    text(ctx, col.mark, x0 + mark / 2, zc + px(0.5));
    setFont(ctx, 500, px(11), fonts.mono, "semi-condensed");
    setTracking(ctx, px(11 * 0.07));
    ctx.fillStyle = PALETTE.muted;
    ctx.textAlign = "left";
    text(ctx, col.label.toUpperCase(), x0 + mark + px(7), zc + px(0.5));
    setTracking(ctx, 0);
    if (!col.fitted) {
      // An empty footprint: this system has no part on this layer.
      const z0 = Z(routed.rowZ[0] - CHIP_D / 2);
      ctx.setLineDash([px(4), px(3)]);
      ctx.strokeStyle = PALETTE.graticuleStrong;
      ctx.lineWidth = px(1);
      ctx.strokeRect(x0, z0, u(CHIP_W), v(CHIP_D));
      ctx.setLineDash([]);
      setFont(ctx, 500, px(11), fonts.mono, "semi-condensed");
      setTracking(ctx, px(11 * 0.07));
      ctx.fillStyle = PALETTE.dim;
      ctx.textAlign = "center";
      text(ctx, "NOT FITTED", x0 + u(CHIP_W) / 2, z0 + v(CHIP_D) / 2);
      setTracking(ctx, 0);
    }
  });

  // ------------------------------------------------------------- footprints, refdes, pads
  const leads = 6;
  routed.chips.forEach((c, i) => {
    const x0 = X(c.x - CHIP_W / 2);
    const z0 = Z(c.z - CHIP_D / 2);
    const w = u(CHIP_W);
    const h = v(CHIP_D);
    // leads along the long edges, showing past the package
    ctx.fillStyle = PALETTE.graticuleStrong;
    const lw = u(0.07);
    const lh = v(0.09);
    for (let k = 0; k < leads; k++) {
      const lx = x0 + w * 0.12 + (k * (w * 0.76)) / (leads - 1) - lw / 2;
      ctx.fillRect(lx, z0 - lh, lw, lh + v(0.04));
      ctx.fillRect(lx, z0 + h - v(0.04), lw, lh + v(0.04));
    }
    // silkscreen outline of the footprint
    ctx.strokeStyle = PALETTE.graticuleStrong;
    ctx.lineWidth = px(1);
    ctx.strokeRect(x0 - u(0.03), z0 - v(0.03), w + u(0.06), h + v(0.06));
    // refdes in the band above the part (the router keeps copper out of it)
    setFont(ctx, 500, px(11), fonts.mono, "semi-condensed");
    setTracking(ctx, px(11 * 0.02));
    ctx.fillStyle = PALETTE.dim;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    text(ctx, chips[i]?.refdes ?? "", x0, z0 - lh - px(4));
    setTracking(ctx, 0);
  });
  ctx.fillStyle = PALETTE.graticuleStrong;
  const pad = u(0.085);
  const padZ = v(0.085);
  for (const w of routed.wires) {
    for (const p of [w.poly.pts[0], w.poly.pts[w.poly.pts.length - 1]]) ctx.fillRect(X(p[0]) - pad / 2, Z(p[1]) - padZ / 2, pad, padZ);
  }

  // ------------------------------------------------------------- legend
  const legZ = Z(frame.depth / 2 - MARGIN_Z - LEGEND / 2);
  setFont(ctx, 500, px(11), fonts.mono, "semi-condensed");
  setTracking(ctx, px(11 * 0.02));
  ctx.fillStyle = PALETTE.dim;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  text(ctx, legend.left, X(colX(0) - CHIP_W / 2), legZ);
  ctx.textAlign = "right";
  text(ctx, legend.right, X(colX(COLS - 1) + CHIP_W / 2), legZ);
  setTracking(ctx, 0);

  // ------------------------------------------------------------- chip tops (atlas)
  ctx.fillStyle = PALETTE.bezel;
  ctx.fillRect(0, boardH, W, H - boardH);
  const cw = u(CHIP_W);
  const ch = v(CHIP_D);
  routed.chips.forEach((c, i) => {
    const cell = layout.cells[i];
    if (!cell) return;
    const cx = cell.x * sx;
    const cy = cell.z * sz;
    const info = chips[i];
    const hex = info?.hex ?? PALETTE.bone;
    // channel outline, inset
    const inset = u(0.055);
    ctx.strokeStyle = hex;
    ctx.lineWidth = px(1.25);
    ctx.strokeRect(cx + inset, cy + v(0.055), cw - 2 * inset, ch - 2 * v(0.055));
    // pin-1 mark
    ctx.beginPath();
    ctx.ellipse(cx + u(0.13), cy + v(0.13), px(1.9), px(1.9) * (sz / sx), 0, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();
    // name: up to two lines, centred
    const maxW = cw - 2 * u(0.2);
    const fit = fitLabel(ctx, info?.label ?? c.id, maxW, dpr, fonts.display);
    setFont(ctx, 600, fit.px, fonts.display, fit.stretch);
    ctx.fillStyle = PALETTE.bone;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lh = fit.px * 1.12 * STRETCH;
    const top = cy + ch / 2 - ((fit.lines.length - 1) * lh) / 2;
    fit.lines.forEach((line, k) => text(ctx, line, cx + cw / 2, top + k * lh + px(0.5)));
  });
}
