"use client";

import { roughCircle } from "@/components/sketch/rough";
import { CSS_EASE } from "./eases";

/**
 * THE SKETCH-MODE WIPE (used only by src/lib/stores/sketchMode.ts).
 *
 * The hero's x-ray lens, grown to the whole screen. With the View Transitions API:
 *   ship -> sketch  the sketch is revealed inside a circle that grows out of the origin (the
 *                   pencil toggle), its rim drawn as a hand-circled pencil line (pen, 0.78s)
 *   sketch -> ship  the sketch collapses back into the origin, uncovering the shipped site
 *                   (pen, 0.62s: exits are faster); the toggle then lands a SHIPPED stamp
 * The old page is a still snapshot, the new one is live, so mini-UIs draw (or compile) inside
 * the lens while it moves. The reading position is kept: whatever sat at ~38% of the viewport is
 * still there afterwards, even though Caveat reflows every heading.
 *
 * No View Transitions, reduced motion or a hidden tab: an instant swap (same anchoring).
 * Everything here is transient: classes on <html> and one rim element exist only while it runs.
 */

export type SketchOrigin = { x: number; y: number };

type ViewTransitionLike = {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
};
type DocumentWithVT = Document & { startViewTransition?: (update: () => void | Promise<void>) => ViewTransitionLike };

/** The lens rim, drawn once around (0, 0) at radius RIM_R and scaled with the clip. */
const RIM_R = 100;
// One confident loop that overshoots its start (two passes drift ~5% apart: two circles at full screen).
const RIM_PATH = roughCircle(0, 0, RIM_R, { seed: "sketch-mode-lens", roughness: 0.8, passes: 1 });
/** At full size the rim sits this far (px) inside the clip edge, so its wobble is never cut off. */
const RIM_GAP = 52;
/** The clip ends this far (px) past the farthest corner, so the rim leaves the screen entirely. */
const OVERSHOOT = 110;
/** Durations (ms): a deliberate pen sweep in, a faster exit back into the pencil. */
const DUR_IN = 780;
const DUR_OUT = 620;

const VT_CLASSES = ["sk-vt", "sk-vt-in", "sk-vt-out"];

let active: ViewTransitionLike | null = null;

/** Remember what the visitor is reading, so the swap (which reflows every heading) never moves it. */
function holdScrollAnchor(): () => void {
  if (window.scrollY < 2) return () => {};
  const y = Math.round(window.innerHeight * 0.38);
  let el = document.elementFromPoint(Math.round(window.innerWidth / 2), y) as HTMLElement | null;
  // climb to a block of a sensible size (not a word or an icon)
  while (el && el !== document.body) {
    const r = el.getBoundingClientRect();
    if (r.height >= 24 && r.width >= 120 && getComputedStyle(el).position !== "fixed") break;
    el = el.parentElement;
  }
  if (!el || el === document.body || el === document.documentElement) return () => {};
  const anchor = el;
  const top = anchor.getBoundingClientRect().top;
  return () => {
    if (!anchor.isConnected) return;
    const d = anchor.getBoundingClientRect().top - top;
    if (Math.abs(d) >= 1) window.scrollTo(0, window.scrollY + d);
  };
}

const SVG_NS = "http://www.w3.org/2000/svg";

function mountRim(): { el: HTMLElement; g: SVGGElement } {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.className = "sk-rim";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  const g = document.createElementNS(SVG_NS, "g");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", RIM_PATH);
  g.appendChild(path);
  svg.appendChild(g);
  el.appendChild(svg);
  document.body.appendChild(el);
  return { el, g };
}

type WipeOptions = {
  /** The state being entered. */
  on: boolean;
  /** Viewport point the lens grows from / collapses into. */
  origin: SketchOrigin;
  /** False with reduced motion: instant swap. */
  animated: boolean;
  /** Applies the state to the DOM. `sync` = flush React synchronously (inside a view transition). */
  update: (sync: boolean) => void;
};

/** Fast-forward the running wipe (its update still applies; `finished` resolves right after). */
export function skipSketchWipe(): void {
  active?.skipTransition();
}

/** Swap the site between ship and sketch. Resolves when the wipe has finished (at once if instant).
 *  The store runs one at a time (a second request skips this one, then catches up). */
export function playSketchWipe({ on, origin, animated, update }: WipeOptions): Promise<void> {
  const doc = document as DocumentWithVT;
  const restore = holdScrollAnchor();
  const instant = () => {
    update(false);
    // React commits the store change before the next frame; re-anchor after it, before paint.
    requestAnimationFrame(restore);
    return Promise.resolve();
  };
  if (!animated || typeof doc.startViewTransition !== "function" || document.visibilityState !== "visible") return instant();

  const root = document.documentElement;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const x = Math.min(W, Math.max(0, origin.x));
  const y = Math.min(H, Math.max(0, origin.y));
  const R = Math.ceil(Math.hypot(Math.max(x, W - x), Math.max(y, H - y))) + OVERSHOOT;
  const inset = (R - RIM_GAP) / R;
  let rim: { el: HTMLElement; g: SVGGElement } | null = null;

  root.classList.remove(...VT_CLASSES);
  root.classList.add("sk-vt", on ? "sk-vt-in" : "sk-vt-out");
  let vt: ViewTransitionLike;
  try {
    vt = doc.startViewTransition(() => {
      update(true);
      restore();
      rim = mountRim();
    });
  } catch {
    root.classList.remove(...VT_CLASSES);
    return instant();
  }
  active = vt;

  vt.ready
    .then(() => {
      const duration = on ? DUR_IN : DUR_OUT;
      const easing = CSS_EASE.pen;
      const circle = (r: number) => `circle(${r}px at ${x}px ${y}px)`;
      root.animate(
        { clipPath: on ? [circle(0), circle(R)] : [circle(R), circle(0)] },
        { duration, easing, fill: "both", pseudoElement: on ? "::view-transition-new(root)" : "::view-transition-old(root)" },
      );
      const at = (r: number) => `translate(${x}px, ${y}px) scale(${((r * inset) / RIM_R).toFixed(4)})`;
      rim?.g.animate({ transform: on ? [at(0), at(R)] : [at(R), at(0)] }, { duration, easing, fill: "both" });
      // the pencil line lifts off at the very end (off screen going in, a dot at the toggle going out)
      rim?.el.animate({ opacity: [1, 1, 0], offset: [0, 0.86, 1] }, { duration, fill: "both" });
    })
    .catch(() => {});

  return vt.finished
    .catch(() => {})
    .then(() => {
      (rim as { el: HTMLElement } | null)?.el.remove();
      if (active === vt) {
        active = null;
        root.classList.remove(...VT_CLASSES);
      }
    });
}
