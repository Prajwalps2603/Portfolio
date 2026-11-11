"use client";

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type Ref, type RefObject } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { drawOn, hideStrokes, showStrokes } from "@/components/sketch/draw";
import {
  roughArrow,
  roughCheck,
  roughCross,
  roughEllipse,
  roughLine,
  roughRect,
  roughUnderline,
  scribble,
  tight,
  type Point,
} from "@/components/sketch/rough";
import type { SkAt, SkHandTone, SkHl, SkShape, SkTone } from "./kit";

/**
 * THE SKETCH LAYER of a mini-UI: one SVG (+ Caveat labels) over the window.
 *
 * It measures the crisp window (the single source of layout) and draws each `[data-sk]` element's
 * twin at the same box with the one seeded generator, so a sketch sits exactly where its UI will
 * be. Boxes are measured with offsets (layout coordinates), not getBoundingClientRect, so a tilted
 * or scaled ancestor (the work stage, the hero) never skews the drawing.
 *
 * Every stroke also carries its "tight" twin (`data-tight`): the same path with roughness 0. Same
 * seed, same commands, so the compile can tween `d` and the wobbly pencil line straightens onto
 * the crisp border before it fades.
 *
 * mode: "hidden" (strokes and labels hidden, waiting), "draw" (draws itself once, pen order),
 * "static" (fully drawn). aria-hidden: the sketch is decoration.
 */

export type LayerMode = "hidden" | "draw" | "static";

type Box = { x: number; y: number; w: number; h: number };

type PathSpec = { d: string; tight: string; sw: number; cls?: string; swipe?: boolean };

type Label = { key: string; unit: number | "title"; text: string; style: CSSProperties; cls: string };

type Shapes = {
  key: string;
  W: number;
  H: number;
  /** The window panel: element sketches are clipped to it, like the crisp UI (overflow hidden). */
  clip: Box | null;
  frame: PathSpec[];
  units: { i: number; id: string; cls: string; paths: PathSpec[] }[];
  labels: Label[];
};

const TONE: Record<SkTone, string> = { ink: "text-ink/80", pencil: "text-pencil", graphite: "text-graphite" };
const SWIPE: Record<SkHl, string> = { lime: "text-lime", blue: "text-blue-soft", tangerine: "text-tangerine-soft" };
const HAND: Record<SkHandTone, string> = {
  ink: "text-ink",
  graphite: "text-graphite",
  blue: "text-blue-deep",
  tangerine: "text-tangerine-deep",
  lime: "text-lime-deep",
};

/** Labels write themselves left to right (a generous clip so Caveat's swashes are never cut). */
const CLIP_HIDDEN = "inset(-40% 100% -40% -8%)";
const CLIP_SHOWN = "inset(-40% 0% -40% -8%)";

// ---------------------------------------------------------------------------------------------
// Measuring
// ---------------------------------------------------------------------------------------------

/** Layout box of `el` relative to `root` (offset chain: transforms are ignored on purpose). */
function boxIn(el: HTMLElement, root: HTMLElement): Box | null {
  if (!el.offsetParent) return null; // display: none
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    const p = n.offsetParent as HTMLElement | null;
    if (!p) return null;
    if (p !== root) {
      x += p.clientLeft;
      y += p.clientTop;
    }
    n = p;
  }
  if (n !== root) return null;
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

const num = (v: string | undefined, d: number) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? d : Number(v));
const pair = (v: string | undefined, d: Point): Point => {
  if (!v) return d;
  const [a, b] = v.split(",").map(Number);
  return [Number.isFinite(a) ? a : d[0], Number.isFinite(b) ? b : d[1]];
};

/** Rough + tight twin for a rect-like box. Small boxes get one lighter pass. */
function rect(seed: string, b: Box, radius: number, sw: number): PathSpec {
  const small = Math.min(b.w, b.h) < 30;
  const o = { seed, radius: Math.max(0, Math.min(radius, b.w / 2, b.h / 2)), passes: (small ? 1 : 2) as 1 | 2 };
  const inset = sw / 2;
  const x = b.x + inset;
  const y = b.y + inset;
  const w = Math.max(1, b.w - sw);
  const h = Math.max(1, b.h - sw);
  return {
    d: roughRect(x, y, w, h, { ...o, roughness: small ? 0.6 : 1 }),
    tight: roughRect(x, y, w, h, tight(o)),
    sw,
  };
}

function pathsFor(shape: SkShape, b: Box, el: HTMLElement, seed: string): PathSpec[] {
  const ds = el.dataset;
  const out: PathSpec[] = [];
  const hl = ds.skHl as SkHl | undefined;
  // highlighter band first (it sits under the pencil)
  if (hl && (shape === "swipe" || shape === "rect" || shape === "pill" || shape === "label" || shape === "bar")) {
    const band = Math.max(7, Math.min(b.h * (shape === "swipe" || shape === "bar" ? 1.15 : 0.62), 22));
    const cy = b.y + b.h / 2 + (shape === "label" ? b.h * 0.08 : 0);
    const x1 = b.x + band * 0.3;
    const x2 = b.x + b.w - band * 0.3;
    if (x2 > x1) {
      out.push({
        d: roughLine([x1, cy], [x2, cy - b.w * 0.01], { seed: `${seed}-hl`, passes: 1, roughness: 0.8 }),
        tight: roughLine([x1, cy], [x2, cy - b.w * 0.01], { seed: `${seed}-hl`, passes: 1, roughness: 0, bowing: 0 }),
        sw: band,
        cls: SWIPE[hl],
        swipe: true,
      });
    }
  }
  switch (shape) {
    case "rect":
      out.push(rect(seed, b, num(ds.skR, 12), 1.5));
      break;
    case "pill":
      out.push(rect(seed, b, b.h / 2, 1.4));
      break;
    case "bar": {
      const y = b.y + b.h / 2;
      out.push({
        d: roughLine([b.x + 1, y], [b.x + b.w - 1, y], { seed, passes: 1, roughness: 0.7 }),
        tight: roughLine([b.x + 1, y], [b.x + b.w - 1, y], { seed, passes: 1, roughness: 0, bowing: 0 }),
        sw: 1.5,
      });
      break;
    }
    case "dash": {
      const len = Math.max(4, Math.min(b.w * 0.42, 14));
      const x = b.x + (b.w - len) / 2;
      const y = b.y + b.h / 2;
      out.push({
        d: roughLine([x, y], [x + len, y - 0.6], { seed, passes: 1, roughness: 0.5 }),
        tight: roughLine([x, y], [x + len, y - 0.6], { seed, passes: 1, roughness: 0, bowing: 0 }),
        sw: 1.4,
      });
      break;
    }
    case "scribble": {
      const pad = Math.min(3, b.h * 0.15);
      out.push({
        d: scribble(b.x, b.y + pad, b.w, Math.max(2, b.h - pad * 2), { seed, density: 0.85 }),
        tight: scribble(b.x, b.y + b.h / 2, b.w, 0, { seed, density: 0.85, roughness: 0 }),
        sw: 1.3,
      });
      break;
    }
    case "circle": {
      const rx = Math.max(2, b.w / 2 - 0.8);
      const ry = Math.max(2, b.h / 2 - 0.8);
      const small = Math.min(b.w, b.h) < 16;
      out.push({
        d: roughEllipse(b.x + b.w / 2, b.y + b.h / 2, rx, ry, { seed, passes: small ? 1 : 2, roughness: small ? 0.4 : 1 }),
        tight: roughEllipse(b.x + b.w / 2, b.y + b.h / 2, rx, ry, { seed, passes: small ? 1 : 2, roughness: 0 }),
        sw: small ? 1.2 : 1.5,
      });
      break;
    }
    case "arrow": {
      const f = pair(ds.skFrom, [0, 0.5]);
      const t = pair(ds.skTo, [1, 0.5]);
      const a: Point = [b.x + f[0] * b.w, b.y + f[1] * b.h];
      const z: Point = [b.x + t[0] * b.w, b.y + t[1] * b.h];
      const d = roughArrow(a, z, { seed, bend: num(ds.skBend, 0.2), head: 9 });
      out.push({ d, tight: d, sw: 1.6 });
      break;
    }
    case "check": {
      const s = Math.min(b.w, b.h) * 0.9;
      const x = b.x + (b.w - s) / 2;
      const y = b.y + (b.h - s) / 2;
      out.push({ d: roughCheck(x, y, s, { seed }), tight: roughCheck(x, y, s, { seed, roughness: 0 }), sw: 1.7 });
      break;
    }
    case "cross": {
      const s = Math.min(b.w, b.h) * 0.62;
      const x = b.x + (b.w - s) / 2;
      const y = b.y + (b.h - s) / 2;
      out.push({ d: roughCross(x, y, s, { seed }), tight: roughCross(x, y, s, { seed, roughness: 0, bowing: 0 }), sw: 1.4 });
      break;
    }
    case "underline":
      out.push({
        d: roughUnderline(b.x, b.y + b.h + 2, b.w, { seed }),
        tight: roughUnderline(b.x, b.y + b.h + 2, b.w, { seed, roughness: 0, bowing: 0 }),
        sw: 1.8,
      });
      break;
    default:
      break;
  }
  return out;
}

function labelStyle(at: SkAt, b: Box): CSSProperties {
  switch (at) {
    case "tl":
      return { left: b.x + 9, top: b.y + 3 };
    case "c":
      return { left: b.x + b.w / 2, top: b.y + b.h / 2, transform: "translate(-50%, -52%)" };
    case "r":
      return { left: b.x + b.w, top: b.y + b.h / 2, transform: "translate(-100%, -52%)" };
    case "t":
      return { left: b.x, top: b.y, transform: "translateY(-92%)" };
    case "b":
      return { left: b.x, top: b.y + b.h - 2 };
    case "l":
    default:
      return { left: b.x, top: b.y + b.h / 2, transform: "translateY(-52%)" };
  }
}

function measure(root: HTMLElement, win: HTMLElement, seed: string, title: string | undefined): Shapes {
  const W = root.offsetWidth;
  const H = root.offsetHeight;
  const frame: PathSpec[] = [];
  const keyParts: string[] = [`${W}x${H}`];

  // the window frame (outer frame, inner panel, bar line, the three dots)
  const frameBox = boxIn(win, root);
  if (frameBox) {
    const f = rect(`${seed}-frame`, frameBox, 26, 1.6);
    frame.push({ ...f, cls: TONE.pencil });
    keyParts.push(`f${frameBox.x},${frameBox.y},${frameBox.w},${frameBox.h}`);
  }
  const panelEl = win.querySelector<HTMLElement>(".aw-panel");
  const panel = panelEl ? boxIn(panelEl, root) : null;
  if (panel) {
    frame.push({ ...rect(`${seed}-panel`, panel, 17, 1.6), cls: TONE.ink });
    keyParts.push(`p${panel.x},${panel.y},${panel.w},${panel.h}`);
  }
  const barEl = win.querySelector<HTMLElement>(".aw-bar");
  const bar = barEl ? boxIn(barEl, root) : null;
  if (bar) {
    const y = bar.y + bar.h;
    frame.push({
      d: roughLine([bar.x + 6, y], [bar.x + bar.w - 6, y], { seed: `${seed}-bar`, passes: 1 }),
      tight: roughLine([bar.x + 6, y], [bar.x + bar.w - 6, y], { seed: `${seed}-bar`, passes: 1, roughness: 0, bowing: 0 }),
      sw: 1.4,
      cls: TONE.pencil,
    });
  }
  win.querySelectorAll<HTMLElement>(".aw-dot").forEach((dot, i) => {
    const b = boxIn(dot, root);
    if (!b) return;
    const r = b.w / 2 + 0.4;
    frame.push({
      d: roughEllipse(b.x + b.w / 2, b.y + b.h / 2, r, r, { seed: `${seed}-dot-${i}`, passes: 1, roughness: 0.4 }),
      tight: roughEllipse(b.x + b.w / 2, b.y + b.h / 2, r, r, { seed: `${seed}-dot-${i}`, passes: 1, roughness: 0 }),
      sw: 1.2,
      cls: TONE.pencil,
    });
  });

  const labels: Label[] = [];
  const titleEl = win.querySelector<HTMLElement>(".aw-title");
  const tb = titleEl ? boxIn(titleEl, root) : null;
  if (tb && title) {
    labels.push({ key: "title", unit: "title", text: title, style: { left: tb.x, top: tb.y + tb.h / 2, transform: "translateY(-50%)" }, cls: `type-hand-sm ${HAND.graphite}` });
  }

  // an element the crisp UI clips away (inside an overflow-hidden box) gets no sketch twin
  const clipCache = new Map<HTMLElement, Box | null>();
  const shown = (b: Box, cb: Box) => {
    const ix = Math.max(0, Math.min(b.x + b.w, cb.x + cb.w) - Math.max(b.x, cb.x));
    const iy = Math.max(0, Math.min(b.y + b.h, cb.y + cb.h) - Math.max(b.y, cb.y));
    return ix * iy >= 0.6 * b.w * b.h;
  };
  const visibleEnough = (el: HTMLElement, b: Box) => {
    // big boxes may run past the window on purpose (the cropped phone): the clip path trims them
    if (panel && b.h < panel.h * 0.6 && !shown(b, panel)) return false;
    const c = el.parentElement?.closest<HTMLElement>(".overflow-hidden") ?? null;
    if (!c || !win.contains(c)) return true;
    let cb = clipCache.get(c);
    if (cb === undefined) {
      cb = boxIn(c, root);
      clipCache.set(c, cb);
    }
    return cb ? shown(b, cb) : true;
  };

  const units: Shapes["units"] = [];
  win.querySelectorAll<HTMLElement>("[data-sk]").forEach((el, i) => {
    const b = boxIn(el, root);
    if (!b || b.w < 1 || b.h < 1 || !visibleEnough(el, b)) return;
    const shape = (el.dataset.sk ?? "none") as SkShape;
    const id = el.dataset.skId ?? String(i);
    const s = `${seed}-${id}`;
    keyParts.push(`${i}:${b.x},${b.y},${b.w},${b.h}`);
    const paths = shape === "none" || shape === "label" ? (el.dataset.skHl ? pathsFor(shape, b, el, s) : []) : pathsFor(shape, b, el, s);
    const tone = (el.dataset.skTone as SkTone | undefined) ?? "ink";
    units.push({ i, id, cls: TONE[tone] ?? TONE.ink, paths });
    const hand = el.dataset.skHand;
    if (hand) {
      const at = (el.dataset.skAt as SkAt | undefined) ?? (shape === "label" ? "l" : "tl");
      const ht = (el.dataset.skHandTone as SkHandTone | undefined) ?? (shape === "label" ? "ink" : "graphite");
      labels.push({
        key: `u${i}`,
        unit: i,
        text: hand,
        style: labelStyle(at, b),
        cls: `${el.dataset.skBig !== undefined ? "type-hand" : "type-hand-sm"} ${HAND[ht] ?? HAND.graphite}`,
      });
    }
  });

  return { key: `${seed}|${keyParts.join(";")}`, W, H, clip: panel, frame, units, labels };
}

// ---------------------------------------------------------------------------------------------

function StrokePath({ p }: { p: PathSpec }) {
  return (
    <path
      data-stroke=""
      data-swipe={p.swipe ? "" : undefined}
      data-tight={p.tight}
      d={p.d}
      fill="none"
      stroke="currentColor"
      strokeWidth={p.sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={p.swipe ? `${p.cls ?? ""} mix-blend-multiply` : p.cls}
    />
  );
}

type SketchLayerProps = {
  rootRef: RefObject<HTMLElement | null>;
  winRef: RefObject<HTMLElement | null>;
  /** Seed prefix (the project id). */
  seed: string;
  /** Window title, handwritten in the bar. */
  title?: string;
  mode: LayerMode;
  /** Called once when the draw-on finishes (mode "draw"). */
  onDrawn?: () => void;
  ref?: Ref<HTMLDivElement>;
};

export function SketchLayer({ rootRef, winRef, seed, title, mode, onDrawn, ref }: SketchLayerProps) {
  const clipId = `mui-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [shapes, setShapes] = useState<Shapes | null>(null);
  const drawn = useRef(false);
  const onDrawnRef = useRef(onDrawn);
  useLayoutEffect(() => {
    onDrawnRef.current = onDrawn;
  }, [onDrawn]);

  const setRefs = (el: HTMLDivElement | null) => {
    layerRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = el;
  };

  // measure the crisp window now, on resize (window or any element) and when fonts settle.
  // The layer finds its root from its own node: a parent's ref is attached only after its
  // children's layout effects have run, so rootRef can still be null here on mount.
  useLayoutEffect(() => {
    const root = rootRef.current ?? (layerRef.current?.parentElement as HTMLElement | null);
    const win = winRef.current ?? root?.querySelector<HTMLElement>(":scope > .aw") ?? null;
    if (!root || !win) return;
    let raf = 0;
    let alive = true;
    const run = () => {
      raf = 0;
      if (!alive) return;
      const next = measure(root, win, seed, title);
      setShapes((prev) => (prev && prev.key === next.key ? prev : next));
    };
    const soon = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    const ro = new ResizeObserver(soon);
    ro.observe(root);
    win.querySelectorAll("[data-sk]").forEach((el) => ro.observe(el));
    if (typeof document !== "undefined" && document.fonts) document.fonts.ready.then(soon).catch(() => {});
    return () => {
      alive = false;
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef, winRef, seed, title]);

  // draw-on / hidden / static. A draw in flight survives re-measures (fonts settling shift boxes
  // by a pixel or two): it is only cancelled when the mode changes or the layer unmounts.
  const key = shapes?.key;
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  useLayoutEffect(() => {
    const el = layerRef.current;
    if (!el || !key) return;
    const svg = el.querySelector("svg");
    const labels = Array.from(el.querySelectorAll<HTMLElement>("[data-label]"));
    if (mode === "hidden") {
      hideStrokes(svg);
      if (labels.length) gsap.set(labels, { clipPath: CLIP_HIDDEN });
      return;
    }
    if (mode === "static" || drawn.current) {
      showStrokes(svg);
      if (labels.length) gsap.set(labels, { clearProps: "clipPath" });
      return;
    }
    if (tlRef.current) return;
    const tl = gsap.timeline({
      onComplete: () => {
        tlRef.current = null;
        drawn.current = true;
        const layer = layerRef.current;
        showStrokes(layer?.querySelector("svg"));
        const ls = layer ? Array.from(layer.querySelectorAll<HTMLElement>("[data-label]")) : [];
        if (ls.length) gsap.set(ls, { clearProps: "clipPath" });
        onDrawnRef.current?.();
      },
    });
    tl.add(drawOn(svg, { duration: DUR.draw }), 0);
    if (labels.length) {
      const each = 0.32;
      tl.fromTo(labels, { clipPath: CLIP_HIDDEN }, { clipPath: CLIP_SHOWN, duration: each, ease: EASE.pen, stagger: { amount: Math.max(0, DUR.draw - each - 0.04) } }, 0.04);
    }
    tlRef.current = tl;
  }, [mode, key]);
  // cancel an unfinished draw when the mode changes (e.g. the compile starts) or on unmount
  useLayoutEffect(
    () => () => {
      const tl = tlRef.current;
      if (!tl) return;
      tl.kill();
      tlRef.current = null;
      const layer = layerRef.current;
      showStrokes(layer?.querySelector("svg"));
      const ls = layer ? Array.from(layer.querySelectorAll<HTMLElement>("[data-label]")) : [];
      if (ls.length) gsap.set(ls, { clearProps: "clipPath" });
    },
    [mode],
  );

  return (
    <div ref={setRefs} aria-hidden="true" data-mui-layer="" className="pointer-events-none absolute inset-0 select-none">
      {shapes ? (
        <svg className="absolute top-0 left-0 overflow-visible" width={shapes.W} height={shapes.H} viewBox={`0 0 ${shapes.W} ${shapes.H}`} focusable="false">
          <g data-frame="">
            {shapes.frame.map((p, i) => (
              <StrokePath key={i} p={p} />
            ))}
          </g>
          {shapes.clip ? (
            <defs>
              <clipPath id={clipId}>
                <rect x={shapes.clip.x} y={shapes.clip.y} width={shapes.clip.w} height={shapes.clip.h} rx={17} />
              </clipPath>
            </defs>
          ) : null}
          <g clipPath={shapes.clip ? `url(#${clipId})` : undefined}>
            {shapes.units.map((u) =>
              u.paths.length ? (
                <g key={u.id} data-unit={u.i} className={u.cls}>
                  {u.paths.map((p, j) => (
                    <StrokePath key={j} p={p} />
                  ))}
                </g>
              ) : null,
            )}
          </g>
        </svg>
      ) : null}
      {shapes
        ? shapes.labels.map((l) => (
            <span key={l.key} data-label={l.unit} className={`absolute leading-none whitespace-nowrap ${l.cls}`} style={l.style}>
              {l.text}
            </span>
          ))
        : null}
    </div>
  );
}
