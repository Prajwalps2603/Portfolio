"use client";

import { useRef, type RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { safeStart } from "@/lib/motion/splitArrive";

/**
 * DRAW-ON: sketch strokes trace themselves with stroke-dashoffset and the pen ease.
 * Every sketch primitive marks its paths with data-stroke; anything else you draw by hand can
 * opt in with <path data-stroke ... />.
 *
 *   const tl = drawOn(svgEl);                    // all [data-stroke] inside, total 0.9s, pen ease
 *   master.add(drawOn(sketchLayer, { duration: 0.8 }), 0);
 *   hideStrokes(svgEl) / showStrokes(svgEl)      // set states yourself (skip, reduced motion)
 *
 * Hidden states are only ever set from JS, so strokes are visible without JS.
 */

type Target = Element | Element[] | null | undefined;

/** All drawable strokes in (or equal to) the target(s), in document (pen) order. */
export function strokesIn(target: Target): SVGGeometryElement[] {
  if (!target) return [];
  const list = Array.isArray(target) ? target : [target];
  const out: SVGGeometryElement[] = [];
  for (const el of list) {
    if (el.matches("[data-stroke]")) out.push(el as SVGGeometryElement);
    el.querySelectorAll<SVGGeometryElement>("[data-stroke]").forEach((p) => out.push(p));
  }
  return out;
}

function lengthOf(p: SVGGeometryElement): number {
  try {
    return Math.max(1, Math.ceil(p.getTotalLength()) + 2);
  } catch {
    return 1;
  }
}

/** Hide strokes (dash = full length). Call before a timeline that draws them later. */
export function hideStrokes(target: Target) {
  for (const p of strokesIn(target)) {
    const len = lengthOf(p);
    p.style.strokeDasharray = `${len} ${len}`;
    p.style.strokeDashoffset = `${len}`;
  }
}

/** Show strokes fully and drop the dash styles (skip / reduced motion / done). */
export function showStrokes(target: Target) {
  for (const p of strokesIn(target)) {
    p.style.strokeDasharray = "";
    p.style.strokeDashoffset = "";
  }
}

type DrawOptions = {
  /** TOTAL seconds for all strokes (sketch draw <= 0.9s). */
  duration?: number;
  ease?: string;
  delay?: number;
};

/**
 * A timeline that draws every [data-stroke] in the target, one after another with overlap, in
 * `duration` seconds total. Strokes are hidden at once (when the timeline is created).
 */
export function drawOn(target: Target, { duration = DUR.draw, ease = EASE.pen, delay = 0 }: DrawOptions = {}): gsap.core.Timeline {
  const paths = strokesIn(target);
  const tl = gsap.timeline({ delay, onComplete: () => showStrokes(paths) });
  if (!paths.length) return tl;
  const lens = paths.map(lengthOf);
  paths.forEach((p, i) => {
    p.style.strokeDasharray = `${lens[i]} ${lens[i]}`;
    p.style.strokeDashoffset = `${lens[i]}`;
  });
  const n = paths.length;
  const each = n > 1 ? duration * 0.55 : duration;
  const gap = n > 1 ? (duration - each) / (n - 1) : 0;
  paths.forEach((p, i) => {
    tl.to(p, { strokeDashoffset: 0, duration: each, ease }, i * gap);
  });
  return tl;
}

type UseDrawOnOptions = DrawOptions & {
  /** "view": once when the top reaches 80% of the viewport. "mount": on mount. "manual": when `play` turns true. false: static. */
  trigger?: false | "view" | "mount" | "manual";
  play?: boolean;
  /** Re-run when this changes (e.g. the measured size of a fit-mode sketch). */
  ready?: boolean | string | number;
};

/**
 * React: draw the strokes inside `ref` once. Reduced motion: strokes are simply shown.
 * Used by every sketch primitive's `draw` prop; use it directly for your own SVGs.
 */
export function useDrawOn(ref: RefObject<Element | null>, { trigger = "view", play = false, ready = true, duration = DUR.draw, ease = EASE.pen, delay = 0 }: UseDrawOnOptions = {}) {
  const reduced = useReducedMotion();
  const done = useRef(false);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !trigger || !ready) return;
      if (reduced || done.current) {
        showStrokes(el);
        return;
      }
      if (trigger === "manual" && !play) {
        hideStrokes(el);
        return;
      }
      const tl = drawOn(el, { duration, ease, delay });
      tl.eventCallback("onComplete", () => {
        done.current = true;
        showStrokes(el);
      });
      if (trigger === "view") {
        tl.pause();
        ScrollTrigger.create({ trigger: el, start: () => safeStart(el, "top 80%"), once: true, onEnter: () => tl.play() });
      }
      return () => {
        if (!done.current) showStrokes(el);
      };
    },
    { dependencies: [reduced, trigger, play, ready], revertOnUpdate: true },
  );
}
