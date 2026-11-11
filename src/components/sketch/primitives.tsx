"use client";

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import {
  arrowGeometry,
  arrowHeads,
  roughArrow,
  roughCheck,
  roughEllipse,
  roughLine,
  roughRect,
  roughUnderline,
  scribble,
  type Point,
  type Seed,
} from "./rough";
import { useDrawOn } from "./draw";

/**
 * SKETCH PRIMITIVES: the "idea" layer. Pencil-rough strokes from the one seeded generator.
 *
 * Two sizing modes for every primitive:
 * - FIT (default): the SVG absolutely covers its nearest positioned ancestor (give the parent
 *   `relative`), measures itself and draws at true pixel size. `inset` grows (negative) or
 *   shrinks (positive) the drawing box: <SketchCircle inset={-8}> circles OUTSIDE the content.
 *   Strokes appear after hydration (or draw on).
 * - FIXED: pass `width` and `height` and it renders an inline SVG of exactly that size, identical
 *   on server and client. Place it with className.
 *
 * Tones (stroke colour): ink (ink at 80%, the default), pencil, graphite, paper (on ink
 * sections), lime, blue, tangerine. Strokes are 1.6px, round caps, non-scaling.
 * Draw-on: draw="view" | "mount" | "manual" (+ play). Default static. Reduced motion = static.
 * All sketch SVGs are aria-hidden: the sketch layer is decoration; meaning lives in real text.
 */

export type SketchTone = "ink" | "pencil" | "graphite" | "paper" | "lime" | "blue" | "tangerine";

const TONE_CLASS: Record<SketchTone, string> = {
  ink: "text-ink/80",
  pencil: "text-pencil",
  graphite: "text-graphite",
  paper: "text-paper/85",
  lime: "text-lime",
  blue: "text-blue",
  tangerine: "text-tangerine",
};

export type SketchCommon = {
  /** Stable seed (string or number). Required: choose a meaningful, unique one per element. */
  seed: Seed;
  tone?: SketchTone;
  /** Stroke width in px. Default 1.6. */
  strokeWidth?: number;
  /** 0 (ruler) .. 3 (scrawl). Default 1. */
  roughness?: number;
  className?: string;
  style?: CSSProperties;
  /** Fixed mode: exact SVG size in px. Omit both for fit mode. */
  width?: number;
  height?: number;
  /** Fit mode: shrink (+) or grow (-) the drawing box relative to the parent, in px. */
  inset?: number;
  /** Draw-on trigger. Default false (static). */
  draw?: false | "view" | "mount" | "manual";
  play?: boolean;
  drawDelay?: number;
  /** Total draw seconds (default 0.9). */
  drawDuration?: number;
};

type Box = { w: number; h: number } | null;

/** Measure an absolutely positioned SVG (fit mode). Integer px so paths are stable. */
function useBox(ref: RefObject<SVGSVGElement | null>, fixed: Box): Box {
  const [box, setBox] = useState<Box>(fixed);
  useLayoutEffect(() => {
    if (fixed) return;
    const el = ref.current;
    if (!el) return;
    const apply = (w: number, h: number) => {
      const next = { w: Math.round(w), h: Math.round(h) };
      setBox((prev) => (prev && prev.w === next.w && prev.h === next.h ? prev : next));
    };
    const r = el.getBoundingClientRect();
    apply(r.width, r.height);
    const ro = new ResizeObserver(([entry]) => {
      if (entry) apply(entry.contentRect.width, entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fixed]);
  return fixed ?? box;
}

type SvgShellProps = SketchCommon & {
  render: (w: number, h: number) => ReactNode;
};

/** Shared SVG shell: sizing mode, tone, draw-on. */
function SketchShell({ render, tone = "ink", className, style, width, height, inset = 0, draw = false, play, drawDelay = 0, drawDuration }: SvgShellProps) {
  const ref = useRef<SVGSVGElement>(null);
  const fixed: Box = width !== undefined && height !== undefined ? { w: width, h: height } : null;
  const box = useBox(ref, fixed);
  useDrawOn(ref, { trigger: draw, play, delay: drawDelay, duration: drawDuration, ready: box ? `${box.w}x${box.h}` : false });
  const fitStyle: CSSProperties | undefined = fixed ? style : { position: "absolute", inset: `${inset}px`, width: `calc(100% - ${2 * inset}px)`, height: `calc(100% - ${2 * inset}px)`, ...style };
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      data-sketch=""
      width={fixed ? fixed.w : undefined}
      height={fixed ? fixed.h : undefined}
      viewBox={box ? `0 0 ${box.w} ${box.h}` : undefined}
      className={`pointer-events-none overflow-visible ${TONE_CLASS[tone]}${className ? ` ${className}` : ""}`}
      style={fitStyle}
    >
      {box && box.w > 0 && box.h > 0 ? render(box.w, box.h) : null}
    </svg>
  );
}

type SketchSvgProps = {
  /** Your drawing's coordinate system, e.g. "0 0 420 300". The SVG scales to its container width. */
  viewBox: string;
  children: ReactNode;
  tone?: SketchTone;
  className?: string;
  style?: CSSProperties;
  /** Draw every <Stroke> / [data-stroke] inside: "view" | "mount" | "manual" (+ play). Default false. */
  draw?: false | "view" | "mount" | "manual";
  play?: boolean;
  drawDelay?: number;
  drawDuration?: number;
  /** Accessible description when the drawing carries meaning (otherwise aria-hidden). */
  title?: string;
};

/**
 * A responsive hand-drawn illustration / diagram: a fixed viewBox you draw into with <Stroke> and
 * the generator functions, scaled to the container width (strokes stay 1.6px). Server-safe paths.
 *
 *   <SketchSvg viewBox="0 0 420 300" draw="view" className="w-full">
 *     <Stroke d={roughRect(10, 10, 400, 280, { seed: "box", radius: 20 })} />
 *   </SketchSvg>
 */
export function SketchSvg({ viewBox, children, tone = "ink", className, style, draw = false, play, drawDelay = 0, drawDuration, title }: SketchSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useDrawOn(ref, { trigger: draw, play, delay: drawDelay, duration: drawDuration });
  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-sketch=""
      className={`overflow-visible ${TONE_CLASS[tone]}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </svg>
  );
}

/** A stroke path with the sketch defaults. Use inside your own <svg> (or <SketchSvg>). */
export function Stroke({ d, strokeWidth = 1.6, dash, className }: { d: string; strokeWidth?: number; dash?: string; className?: string }) {
  return (
    <path
      data-stroke=""
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
      vectorEffect="non-scaling-stroke"
      className={className}
      suppressHydrationWarning
    />
  );
}

// -------------------------------------------------------------------------------------------

/** A hand-drawn box. `radius` > 0 draws one continuous rounded stroke. Default fit mode. */
export function SketchRect({ radius = 0, passes, ...p }: SketchCommon & { radius?: number; passes?: 1 | 2 }) {
  const sw = p.strokeWidth ?? 1.6;
  const pad = sw;
  return (
    <SketchShell
      {...p}
      render={(w, h) => <Stroke strokeWidth={sw} d={roughRect(pad, pad, w - pad * 2, h - pad * 2, { seed: p.seed, roughness: p.roughness, radius, passes })} />}
    />
  );
}

/**
 * A hand-drawn line. Fixed mode: from/to in px inside width x height. Fit mode: across the box
 * through its middle (orientation horizontal | vertical).
 */
export function SketchLine({ from, to, orientation = "horizontal", passes = 1, ...p }: SketchCommon & { from?: Point; to?: Point; orientation?: "horizontal" | "vertical"; passes?: 1 | 2 }) {
  const sw = p.strokeWidth ?? 1.6;
  return (
    <SketchShell
      {...p}
      render={(w, h) => {
        const a: Point = from ?? (orientation === "horizontal" ? [0, h / 2] : [w / 2, 0]);
        const b: Point = to ?? (orientation === "horizontal" ? [w, h / 2] : [w / 2, h]);
        return <Stroke strokeWidth={sw} d={roughLine(a, b, { seed: p.seed, roughness: p.roughness, passes })} />;
      }}
    />
  );
}

export type SketchArrowProps = SketchCommon & {
  /** Start and end points. In px (fixed mode, or fit mode with units="px") or 0..1 fractions of the box (units="fraction"). */
  from: Point;
  to: Point;
  units?: "px" | "fraction";
  /** Curvature (-0.5..0.5). Default 0.18. */
  bend?: number;
  head?: number;
  heads?: "end" | "start" | "both" | "none";
  /** Dashed shaft (the hero connector), solid heads. Draw-on still works (masked). */
  dashed?: boolean;
};

/** A doodled arrow / connector. */
export function SketchArrow({ from, to, units = "px", bend = 0.18, head = 11, heads = "end", dashed = false, ...p }: SketchArrowProps) {
  const sw = p.strokeWidth ?? 1.6;
  return (
    <SketchShell
      {...p}
      render={(w, h) => {
        const a: Point = units === "fraction" ? [from[0] * w, from[1] * h] : from;
        const b: Point = units === "fraction" ? [to[0] * w, to[1] * h] : to;
        const o = { seed: p.seed, roughness: p.roughness, bend, head, heads };
        if (!dashed) return <Stroke strokeWidth={sw} d={roughArrow(a, b, o)} />;
        return <DashedArrow shaft={arrowGeometry(a, b, o).shaft} heads={arrowHeads(a, b, o)} strokeWidth={sw} />;
      }}
    />
  );
}

/** Dashed shaft drawn on through a solid mask stroke (dash patterns cannot be dash-animated). */
function DashedArrow({ shaft, heads, strokeWidth }: { shaft: string; heads: string; strokeWidth: number }) {
  const id = `sk-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
          <path data-stroke="" d={shaft} fill="none" stroke="#fff" strokeWidth={strokeWidth + 6} strokeLinecap="round" suppressHydrationWarning />
        </mask>
      </defs>
      <path
        d={shaft}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="1 7"
        mask={`url(#${id})`}
        vectorEffect="non-scaling-stroke"
        suppressHydrationWarning
      />
      {heads ? <Stroke d={heads} strokeWidth={strokeWidth} /> : null}
    </>
  );
}

/** A hand-drawn loop around content (fit mode; default inset -6 so it circles outside). */
export function SketchCircle({ inset = -6, passes, ...p }: SketchCommon & { passes?: 1 | 2 }) {
  const sw = p.strokeWidth ?? 1.6;
  return (
    <SketchShell
      {...p}
      inset={inset}
      render={(w, h) => <Stroke strokeWidth={sw} d={roughEllipse(w / 2, h / 2, w / 2 - sw, h / 2 - sw, { seed: p.seed, roughness: p.roughness, passes })} />}
    />
  );
}

/**
 * A hand underline along the bottom of the box (fit mode). Give the parent `relative`; the line
 * sits `offset` px below the box bottom. style: single | double | swash.
 */
export function SketchUnderline({ offset = 4, style: lineStyle = "single", ...p }: SketchCommon & { offset?: number; style?: "single" | "double" | "swash" }) {
  const sw = p.strokeWidth ?? 2;
  return (
    <SketchShell
      {...p}
      render={(w, h) => <Stroke strokeWidth={sw} d={roughUnderline(0, h + offset, w, { seed: p.seed, roughness: p.roughness, style: lineStyle })} />}
    />
  );
}

/** A loose zig-zag scribble filling the box (where text will be; a crossed-out idea). */
export function Scribble({ density = 1, slant = -12, ...p }: SketchCommon & { density?: number; slant?: number }) {
  const sw = p.strokeWidth ?? 1.6;
  return (
    <SketchShell
      {...p}
      render={(w, h) => <Stroke strokeWidth={sw} d={scribble(sw, sw, w - sw * 2, h - sw * 2, { seed: p.seed, roughness: p.roughness, density, slant })} />}
    />
  );
}

/** A hand-drawn check mark (fixed mode, `size` px square). */
export function SketchCheck({ size = 16, ...p }: Omit<SketchCommon, "width" | "height"> & { size?: number }) {
  const sw = p.strokeWidth ?? 1.8;
  return <SketchShell {...p} width={size} height={size} render={(w) => <Stroke strokeWidth={sw} d={roughCheck(1, 1, w - 2, { seed: p.seed, roughness: p.roughness })} />} />;
}
