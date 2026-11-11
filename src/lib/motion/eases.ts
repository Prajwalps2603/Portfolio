/**
 * Sketch -> Ship motion vocabulary. Pure data (no GSAP import), safe in any module.
 *
 * Four named eases, nothing else. They are registered with GSAP in ./gsap.ts and mirrored as
 * CSS custom properties in globals.css (--ease-arrive, --ease-pen, --ease-snap, --ease-exit),
 * so a CSS transition and a GSAP tween with the same name feel identical.
 *
 *   gsap.to(el, { x: 0, ease: EASE.arrive, duration: DUR.ui })
 *   className="transition-colors duration-(--dur-ui) ease-(--ease-arrive)"
 *
 * | name   | curve                          | use                                                  |
 * |--------|--------------------------------|------------------------------------------------------|
 * | arrive | expo.out                       | every entrance, every reveal, settles                |
 * | pen    | cubic-bezier(.65,0,.35,1)      | strokes drawing, highlighter swipes, page sheet       |
 * | snap   | back.out(1.4)                  | ONLY the SHIPPED stamp (and its relabelled twins)     |
 * | exit   | power2.in                      | anything leaving; always shorter than its entrance    |
 */

/**
 * The named curves that are not built into GSAP, as cubic-bezier control points (the same numbers
 * as their CSS twins). ./gsap.ts registers each one with `gsap.registerEase(name, cubicBezier(...))`,
 * so GSAP, CSS and the Web Animations API all draw the identical curve. arrive/snap/exit use GSAP's
 * built-in eases.
 */
export const BEZIERS = {
  /** Symmetric draw: a pen starts slowly, commits, then lifts. cubic-bezier(.65,0,.35,1). */
  pen: [0.65, 0, 0.35, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** The same curves as SVG path data (what `CustomEase.create(name, path)` would take). */
export const CURVES = {
  pen: "M0,0 C0.65,0 0.35,1 1,1",
} as const satisfies Record<keyof typeof BEZIERS, string>;

export type CurveName = keyof typeof BEZIERS;

/**
 * A CSS `cubic-bezier(x1, y1, x2, y2)` as an easing function (progress 0..1 -> eased 0..1).
 * Newton-Raphson on x(t) with a bisection fallback (WebKit's UnitBezier): exact to ~1e-6, a few
 * multiplications per call, and about 0.3 KB instead of GSAP's CustomEase + path parser (~3 KB gz
 * on every page's first load).
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (p: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (p: number) => {
    let t = p;
    for (let i = 0; i < 8; i++) {
      const err = x(t) - p;
      if (Math.abs(err) < 1e-6) return t;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = p;
    for (let i = 0; i < 40 && hi - lo > 1e-7; i++) {
      const v = x(t);
      if (Math.abs(v - p) < 1e-6) break;
      if (p > v) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : y(solve(p)));
}

/** Every ease the site uses. If it is not here, you do not need it. */
export const EASE = {
  /** Entrances and reveals (exponential ease-out). The default for gsap.to/from. */
  arrive: "expo.out",
  /** Strokes, highlighter swipes, sketch draw-on, the page sheet. */
  pen: "pen",
  /** The SHIPPED stamp landing (and its relabelled twins). Nowhere else (the only bounce). */
  snap: "back.out(1.4)",
  /** Exits: accelerate away. Always shorter than the matching entrance. */
  exit: "power2.in",
  /** Scroll-linked (scrubbed) motion: the scroll IS the easing. */
  none: "none",
} as const;

export type EaseName = keyof typeof EASE;

/**
 * Durations in SECONDS (GSAP units). CSS mirrors them as --dur-* in milliseconds.
 * From the direction: feedback 120-180ms, UI state 200-320ms, swipes 500-700ms,
 * sketch draw <= 900ms, compile <= 600ms. Exits are always faster than entrances.
 */
export const DUR = {
  /** Press feedback (pill press, key down). */
  tap: 0.12,
  /** Hover / focus colour and fill changes. */
  feedback: 0.16,
  /** UI state changes: menus, panels, expanding rows, cursor morphs. */
  ui: 0.26,
  /** Leaving: menu close, panel out, page sheet off. */
  exit: 0.2,
  /** Highlighter swipe behind a heading word. */
  swipe: 0.6,
  /** A sketch drawing itself (all strokes of one object). */
  draw: 0.9,
  /** Strokes tightening into the shipped UI. */
  compile: 0.6,
  /** The SHIPPED stamp landing (snap ease). */
  stamp: 0.42,
  /** Section-level single fade-in (opacity only). */
  fade: 0.5,
  /** Page sheet: covering the screen. */
  sheetIn: 0.46,
  /** Page sheet: uncovering the new page. */
  sheetOut: 0.56,
} as const;

/** Stagger steps in seconds. */
export const STAGGER = {
  /** Characters typing in (the hero name in the opening). */
  chars: 0.028,
  /** Words / chips / tags in a row. */
  items: 0.05,
  /** Strokes of one sketch drawing in sequence. */
  strokes: 0.07,
  /** Lines of a paragraph. */
  lines: 0.08,
} as const;

/** CSS easing strings, for inline styles and the Web Animations API (keep in sync with globals.css). */
export const CSS_EASE = {
  arrive: "cubic-bezier(0.16, 1, 0.3, 1)",
  pen: "cubic-bezier(0.65, 0, 0.35, 1)",
  exit: "cubic-bezier(0.32, 0, 0.67, 0)",
  snap: "linear(0 0%, 0.173 4.2%, 0.328 8.3%, 0.464 12.5%, 0.583 16.7%, 0.687 20.8%, 0.775 25%, 0.849 29.2%, 0.911 33.3%, 0.961 37.5%, 1 41.7%, 1.029 45.8%, 1.05 50%, 1.063 54.2%, 1.069 58.3%, 1.07 62.5%, 1.067 66.7%, 1.06 70.8%, 1.05 75%, 1.039 79.2%, 1.028 83.3%, 1.017 87.5%, 1.008 91.7%, 1.002 95.8%, 1 100%)",
} as const;
