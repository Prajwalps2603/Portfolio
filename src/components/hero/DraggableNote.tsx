"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from "react";
import { arrowGeometry, arrowHeads, type Point } from "@/components/sketch";
import { useReducedMotion } from "@/lib/motion/media";

/**
 * The "Things I build" note, as a physical object. Pick it up (pointer or touch) and it lifts and
 * tilts with your hand; let go and it settles on a soft spring where you dropped it. The dashed
 * connector is re-routed live, and it never runs through the note:
 *
 * - The drawn wire travels with the note, its arrowhead sliding along the window's rounded outline.
 * - If that route would cross the note (or run over the window), the arrowhead re-anchors to the
 *   nearest point of the window's outline that keeps the wire clear of the note.
 * - If the note sits on the window (more than ~30% of it over the window) or no clear route
 *   exists, the wire fades out until the note moves away again.
 *
 * Input:
 * - Mouse: it lifts on press. Touch / pen: `touch-action: pan-y pinch-zoom` plus a sideways-intent
 *   threshold, so a vertical swipe over the note scrolls the page (the browser takes it), and a
 *   sideways start picks the note up (then it follows the finger anywhere).
 * - Arrow keys nudge it (Shift = bigger steps); Escape / Home, a double-click or the "put back"
 *   pill return it. Escape during a drag drops the drag and puts it back.
 * - Stays inside the hero section (clamped), and re-clamps when the layout changes.
 * - Reduced motion: it still follows your hand (that is the input), with no lift, tilt or spring;
 *   put back is instant.
 *
 * Position is written with the individual `translate` / `rotate` / `scale` properties on its own
 * layer, so it never fights the opening's GSAP transforms on [data-hero="note"]. Geometry is read
 * once per gesture (and after layout changes), never inside the per-frame render.
 */

/** The connector, drawn by HeroStage at rest and re-routed here: one definition for both. */
export const WIRE = { seed: "hero-connector", bend: -0.32, head: 10, heads: "end", from: [0.02, 0.1], to: [0.96, 0.98] } as const;

type Spring = { v: number; x: number; t: number; k: number; c: number };
type Rect = { l: number; t: number; r: number; b: number };
type Geo = {
  /** Wire ends at rest (cell px): a = on the note, b = the arrowhead on the window. */
  a0: Point;
  b0: Point;
  /** The note layer's untransformed box (cell px). */
  home: Rect;
  /** The window's outline the arrowhead slides on (cell px), its corner radius and sample points. */
  win: Rect | null;
  radius: number;
  outline: Point[];
};

const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });
const STEP = 12;
/** Touch / pen: how far a finger travels before the gesture is read as a drag or a scroll. */
const INTENT = 8;
/** Hide the wire when this share of the note is over the window (shown again below SHOW_AT). */
const HIDE_AT = 0.3;
const SHOW_AT = 0.26;
/** The window frame's corner radius (rounded-card). */
const CORNER = 28;
/** Keep the arrowhead this far off the note; the wire's first px may start inside the note. */
const MARGIN = 12;
const NEAR_START = 26;
const MIN_LEN = 40;

const inside = (p: Point, r: Rect, pad = 0) => p[0] > r.l - pad && p[0] < r.r + pad && p[1] > r.t - pad && p[1] < r.b + pad;

/** The nearest point on a rounded rectangle's outline (continuous, so a sliding tip glides round the corners). */
function nearestOnOutline(w: Rect, R: number, p: Point): Point {
  const cx = Math.min(Math.max(p[0], w.l + R), w.r - R);
  const cy = Math.min(Math.max(p[1], w.t + R), w.b - R);
  const vx = p[0] - cx;
  const vy = p[1] - cy;
  const d = Math.hypot(vx, vy);
  if (d > 0.01) return [cx + (vx / d) * R, cy + (vy / d) * R];
  // deep inside: the nearest straight edge
  const m = Math.min(p[0] - w.l, w.r - p[0], p[1] - w.t, w.b - p[1]);
  if (m === p[1] - w.t) return [p[0], w.t];
  if (m === w.b - p[1]) return [p[0], w.b];
  return m === p[0] - w.l ? [w.l, p[1]] : [w.r, p[1]];
}

/** Points every ~10px around a rounded rectangle (the re-anchoring candidates). */
function outlinePoints(w: Rect, R: number): Point[] {
  const pts: Point[] = [];
  const run = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 10));
    for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
  };
  run(w.l + R, w.t, w.r - R, w.t);
  run(w.r, w.t + R, w.r, w.b - R);
  run(w.l + R, w.b, w.r - R, w.b);
  run(w.l, w.t + R, w.l, w.b - R);
  const corners: [number, number, number][] = [
    [w.r - R, w.t + R, -Math.PI / 2],
    [w.r - R, w.b - R, 0],
    [w.l + R, w.b - R, Math.PI / 2],
    [w.l + R, w.t + R, Math.PI],
  ];
  for (const [cx, cy, a0] of corners) for (let k = 1; k < 4; k++) pts.push([cx + Math.cos(a0 + (k * Math.PI) / 8) * R, cy + Math.sin(a0 + (k * Math.PI) / 8) * R]);
  return pts;
}

/** Does the wire a -> b leave the note and land on the window without crossing either? (the quadratic the arrow is built on) */
function clearRoute(a: Point, b: Point, note: Rect, win: Rect): boolean {
  if (inside(b, note, MARGIN) || Math.hypot(b[0] - a[0], b[1] - a[1]) < MIN_LEN) return false;
  const qx = (a[0] + b[0]) / 2 - WIRE.bend * (b[1] - a[1]);
  const qy = (a[1] + b[1]) / 2 + WIRE.bend * (b[0] - a[0]);
  for (let i = 1; i < 18; i++) {
    const t = i / 18;
    const u = 1 - t;
    const p: Point = [u * u * a[0] + 2 * u * t * qx + t * t * b[0], u * u * a[1] + 2 * u * t * qy + t * t * b[1]];
    if (Math.hypot(p[0] - a[0], p[1] - a[1]) > NEAR_START && inside(p, note, -2)) return false;
    if (t < 0.92 && inside(p, win, -3)) return false;
  }
  return true;
}

export function DraggableNote({
  className,
  enabled,
  children,
  wire,
  anchor,
}: {
  className: string;
  enabled: boolean;
  children: ReactNode;
  wire: ReactNode;
  /** The element the wire points at (the stage window). */
  anchor: RefObject<HTMLElement | null>;
}) {
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const cellRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const wireBoxRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<SVGSVGElement>(null);
  const shaftRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGPathElement>(null);
  const [moved, setMoved] = useState(false);
  const api = useRef<{ nudge: (dx: number, dy: number) => void; back: () => void } | null>(null);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  useEffect(() => {
    const cell = cellRef.current;
    const layer = layerRef.current;
    const shadow = shadowRef.current;
    const live = liveRef.current;
    const shaft = shaftRef.current;
    const heads = headRef.current;
    const wireBox = wireBoxRef.current?.firstElementChild as HTMLElement | null;
    if (!cell || !layer || !shadow || !live || !shaft || !heads || !enabled) return;

    // position (the target is the dropped place), lift (scale) and tilt (rotate)
    const px = spring(0, 900, 62);
    const py = spring(0, 900, 62);
    const sc = spring(1, 300, 17);
    const rot = spring(0, 190, 13);
    const all = [px, py, sc, rot];
    let lifted = false;
    let raf = 0;
    let last = 0;
    let isMoved = false;
    /** The live wire: off (the drawn connector shows), on, or hidden (the note sits on the window). */
    let wireState: "off" | "on" | "hidden" = "off";
    let geo: Geo | null = null;
    let start: { px: number; py: number; ox: number; oy: number; id: number; engaged: boolean } | null = null;

    const clamp = (x: number, y: number): [number, number] => {
      const sr = (cell.closest("section") ?? document.body).getBoundingClientRect();
      const cr = cell.getBoundingClientRect();
      // the cell never moves (only the layer inside it does): it is the note's home
      const bl = cr.left;
      const bt = cr.top;
      const w = layer.offsetWidth;
      const h = layer.offsetHeight;
      const pad = 8;
      const minX = Math.min(sr.left + pad - bl, 0);
      const maxX = Math.max(sr.right - pad - w - bl, 0);
      const minY = Math.min(sr.top + pad - bt, 0);
      const maxY = Math.max(sr.bottom - pad - h - 44 - bt, 0);
      return [Math.min(Math.max(x, minX), maxX), Math.min(Math.max(y, minY), maxY)];
    };

    // Read once per gesture / layout change (never per frame): the wire's rest ends, the note's
    // home box and the window's outline, all in the cell's coordinates. Null where no wire is drawn
    // (phones: the connector is display: none).
    const measure = (): Geo | null => {
      if (!wireBox || wireBox.offsetParent === null) return null;
      const l = wireBox.offsetLeft;
      const t = wireBox.offsetTop;
      const w = wireBox.offsetWidth;
      const h = wireBox.offsetHeight;
      const b0: Point = [l + WIRE.to[0] * w, t + WIRE.to[1] * h];
      const home = { l: layer.offsetLeft, t: layer.offsetTop, r: layer.offsetLeft + layer.offsetWidth, b: layer.offsetTop + layer.offsetHeight };
      const wr = anchor.current?.getBoundingClientRect();
      let win: Rect | null = null;
      let radius = CORNER;
      if (wr && wr.width > 0) {
        const cr = cell.getBoundingClientRect();
        win = { l: wr.left - cr.left, t: wr.top - cr.top, r: wr.right - cr.left, b: wr.bottom - cr.top };
        // The drawn arrowhead rests a hair off the frame: grow the outline to pass through it, so the
        // live wire takes over without a jump.
        const gap = Math.max(win.l - b0[0], b0[0] - win.r, win.t - b0[1], b0[1] - win.b, 0);
        if (gap > 0 && gap < 6) {
          win = { l: win.l - gap, t: win.t - gap, r: win.r + gap, b: win.b + gap };
          radius += gap;
        }
      }
      return { a0: [l + WIRE.from[0] * w, t + WIRE.from[1] * h], b0, home, win, radius, outline: win ? outlinePoints(win, radius) : [] };
    };

    /** The note's current box (cell px): home + offset, grown with the lift (the tilt is transient and ignored). */
    const noteRect = (g: Geo): Rect => {
      const hw = ((g.home.r - g.home.l) * sc.x) / 2;
      const hh = ((g.home.b - g.home.t) * sc.x) / 2;
      const cx = (g.home.l + g.home.r) / 2 + px.x;
      const cy = (g.home.t + g.home.b) / 2 + py.x;
      return { l: cx - hw, t: cy - hh, r: cx + hw, b: cy + hh };
    };

    /** The wire's two ends right now, or null when it should not be drawn. */
    const route = (g: Geo): [Point, Point] | null => {
      const win = g.win;
      if (!win) return null;
      const note = noteRect(g);
      const ox = Math.max(0, Math.min(note.r, win.r) - Math.max(note.l, win.l));
      const oy = Math.max(0, Math.min(note.b, win.b) - Math.max(note.t, win.t));
      const share = (ox * oy) / Math.max(1, (note.r - note.l) * (note.b - note.t));
      if (share > (wireState === "hidden" ? SHOW_AT : HIDE_AT)) return null;
      const a: Point = [g.a0[0] + px.x, g.a0[1] + py.x];
      // 1. the drawn wire, carried with the note: its arrowhead slides along the window's outline
      const carried: Point = [g.b0[0] + px.x, g.b0[1] + py.x];
      const first = nearestOnOutline(win, g.radius, carried);
      if (clearRoute(a, first, note, win)) return [a, first];
      // 2. else the nearest point of the outline that keeps the wire clear of the note
      const d2 = (p: Point) => (p[0] - carried[0]) ** 2 + (p[1] - carried[1]) ** 2;
      const order = g.outline.slice().sort((p, q) => d2(p) - d2(q));
      for (const b of order) if (clearRoute(a, b, note, win)) return [a, b];
      return null;
    };

    const setWire = (next: typeof wireState) => {
      if (next === wireState) return;
      const was = wireState;
      wireState = next;
      live.dataset.wire = next;
      if (next === "off") {
        live.style.display = "none";
        live.style.opacity = "";
        if (wireBox) wireBox.style.visibility = "";
        return;
      }
      if (was === "off") {
        live.style.display = "block";
        if (wireBox) wireBox.style.visibility = "hidden";
      }
      live.style.opacity = next === "on" ? "1" : "0";
    };

    const render = () => {
      layer.style.translate = `${px.x.toFixed(2)}px ${py.x.toFixed(2)}px`;
      layer.style.rotate = `${rot.x.toFixed(2)}deg`;
      layer.style.scale = sc.x.toFixed(3);
      shadow.style.opacity = Math.min(1, Math.max(0, (sc.x - 1) / 0.05)).toFixed(2);
      if (Math.hypot(px.x, py.x) <= 0.6) return setWire("off");
      geo ??= measure();
      if (!geo) return setWire("off");
      const ends = route(geo);
      if (!ends) {
        // fade out where it was (the last drawn route stays in place while it fades)
        if (wireState === "off") return;
        return setWire("hidden");
      }
      shaft.setAttribute("d", arrowGeometry(ends[0], ends[1], WIRE).shaft);
      heads.setAttribute("d", arrowHeads(ends[0], ends[1], WIRE));
      setWire("on");
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      // the hand tilt follows horizontal speed while it is held
      rot.t = lifted ? Math.max(-9, Math.min(9, px.v * 0.011)) : 0;
      sc.t = lifted ? 1.05 : 1;
      // Fixed sub-steps: the held spring is stiff (k 900, c 62), and one explicit step of a slow
      // frame (c * dt near 2) diverges, flinging the note off the page. 1/240 s keeps it stable
      // at any frame rate.
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        for (const s of all) {
          s.v += (-s.k * (s.x - s.t) - s.c * s.v) * h;
          s.x += s.v * h;
        }
      }
      let rest = true;
      for (const s of all) {
        if (Math.abs(s.x - s.t) > 0.02 || Math.abs(s.v) > 0.05) rest = false;
      }
      if (rest) for (const s of all) [s.x, s.v] = [s.t, 0];
      render();
      raf = rest && !lifted ? 0 : requestAnimationFrame(tick);
    };
    const run = () => {
      if (reducedRef.current) {
        px.x = px.t;
        py.x = py.t;
        sc.x = sc.t = 1;
        rot.x = rot.t = 0;
        render();
      } else if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const setTarget = (x: number, y: number, held: boolean) => {
      [px.t, py.t] = clamp(x, y);
      px.k = py.k = held ? 900 : 170;
      px.c = py.c = held ? 62 : 21;
      const m = Math.hypot(px.t, py.t) > 1;
      if (m !== isMoved) {
        isMoved = m;
        setMoved(m);
      }
      run();
    };

    const lift = (id: number) => {
      lifted = true;
      try {
        layer.setPointerCapture(id);
      } catch {
        // the pointer is already gone (a cancelled touch): the drag simply ends on its own
      }
      layer.dataset.held = "";
      px.k = py.k = 900;
      px.c = py.c = 62;
      run();
    };
    const drop = (id?: number) => {
      start = null;
      lifted = false;
      delete layer.dataset.held;
      if (id !== undefined && layer.hasPointerCapture(id)) layer.releasePointerCapture(id);
      run();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("[data-qa='hero-note-putback']")) return;
      geo = measure();
      // A mouse picks the note up at once; a finger or pen first shows its intent (sideways = drag,
      // vertical = the page scrolls: touch-action pan-y hands that gesture to the browser).
      const mouse = e.pointerType === "mouse";
      start = { px: e.clientX, py: e.clientY, ox: px.t, oy: py.t, id: e.pointerId, engaged: mouse };
      if (mouse) lift(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.px;
      const dy = e.clientY - start.py;
      if (!start.engaged) {
        if (Math.hypot(dx, dy) < INTENT) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          start = null;
          return;
        }
        start.engaged = true;
        lift(e.pointerId);
      }
      setTarget(start.ox + dx, start.oy + dy, true);
    };
    const onUp = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      if (start.engaged) drop(e.pointerId);
      else start = null;
    };
    // Layout changes (resize, fonts, sketch mode's Caveat headings) move the note's home and the
    // window: forget the geometry, re-clamp and redraw.
    const relayout = () => {
      geo = null;
      setTarget(px.t, py.t, false);
    };
    const ro = new ResizeObserver(relayout);
    const section = cell.closest("section");
    if (section) ro.observe(section);
    if (anchor.current) ro.observe(anchor.current);

    layer.addEventListener("pointerdown", onDown);
    layer.addEventListener("pointermove", onMove);
    layer.addEventListener("pointerup", onUp);
    layer.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", relayout);
    api.current = {
      nudge: (dx, dy) => {
        geo = measure();
        setTarget(px.t + dx, py.t + dy, false);
      },
      back: () => {
        if (start?.engaged) drop(start.id);
        start = null;
        setTarget(0, 0, false);
      },
    };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      layer.removeEventListener("pointerdown", onDown);
      layer.removeEventListener("pointermove", onMove);
      layer.removeEventListener("pointerup", onUp);
      layer.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", relayout);
      api.current = null;
      layer.style.translate = layer.style.rotate = layer.style.scale = "";
      live.style.display = "none";
      live.style.opacity = "";
      delete live.dataset.wire;
      if (wireBox) wireBox.style.visibility = "";
      delete layer.dataset.held;
      setMoved(false);
    };
  }, [enabled, anchor]);

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || !api.current) return;
    const s = e.shiftKey ? STEP * 3 : STEP;
    const d: Record<string, [number, number]> = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] };
    const mv = d[e.key];
    if (mv) {
      e.preventDefault();
      api.current.nudge(mv[0], mv[1]);
    } else if (e.key === "Escape" || e.key === "Home") {
      e.preventDefault();
      api.current.back();
    }
  };

  return (
    <div ref={cellRef} className={className} data-qa="hero-note-cell">
      <div
        ref={layerRef}
        data-qa="hero-note"
        data-moved={moved ? "" : undefined}
        tabIndex={enabled ? 0 : undefined}
        role={enabled ? "group" : undefined}
        aria-label={enabled ? "Sticky note, Things I build. Drag it, or use the arrow keys to move it. Escape puts it back." : undefined}
        onKeyDown={enabled ? onKey : undefined}
        onDoubleClick={enabled ? () => api.current?.back() : undefined}
        className={`relative rounded-[6px] outline-offset-6 ${enabled ? "cursor-grab touch-pan-y touch-pinch-zoom select-none [-webkit-touch-callout:none] data-[held]:cursor-grabbing" : ""}`}
      >
        <div
          ref={shadowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[4px_4px_16px_4px] opacity-0 shadow-[0_34px_40px_-18px_rgb(13_13_12/0.42)] [rotate:-3deg]"
        />
        {children}
        {moved ? (
          <button
            type="button"
            data-qa="hero-note-putback"
            onClick={() => api.current?.back()}
            className="type-mono absolute top-[calc(100%+0.5rem)] left-3 z-(--z-raised) grid min-h-11 cursor-pointer place-items-center rounded-pill px-3 text-ink before:absolute before:inset-x-0 before:inset-y-1.5 before:rounded-pill before:bg-card before:shadow-[0_1px_0_var(--color-line-strong)] before:transition-colors before:duration-(--dur-feedback) hocus:before:bg-lime"
          >
            <span className="relative">put back</span>
          </button>
        ) : null}
      </div>
      <div ref={wireBoxRef} className="contents">
        {wire}
      </div>
      <svg
        ref={liveRef}
        aria-hidden="true"
        width="1"
        height="1"
        data-qa="hero-note-wire"
        className="pointer-events-none absolute top-0 left-0 hidden overflow-visible text-ink transition-opacity duration-(--dur-feedback) ease-arrive"
      >
        <path ref={shaftRef} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeDasharray="1 7" vectorEffect="non-scaling-stroke" />
        <path ref={headRef} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
