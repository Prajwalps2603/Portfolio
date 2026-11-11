"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "./gsap";
import { EASE, DUR, STAGGER } from "./eases";
import { useReducedMotion } from "./media";
import { safeStart } from "./SplitReveal";

type ScrollRevealOptions = {
  /** Selector for the parts that rise, relative to the scope (default "[data-reveal]"). */
  targets?: string;
  /** Element (selector inside scope) that triggers the reveal; default: the scope itself. */
  trigger?: string;
  /** Rise distance in px. The direction specifies: rows 12, history 14, datasheet sections 18. */
  y?: number;
  stagger?: number;
  duration?: number;
  ease?: string;
  start?: string;
};

/**
 * Record-level arrival: parts rise a few px and fade in once, staggered in reading order.
 * This is a SECONDARY motion for tables and rows (Also built, the BOM, History, datasheets).
 * It is not a section's authored moment, and it must not be applied to every section.
 *
 *   const ref = useRef<HTMLElement>(null);
 *   useScrollReveal(ref, { targets: "tbody tr", y: 12, stagger: STAGGER.rows });
 *
 * Hidden states are set by GSAP after mount (never in CSS). Reduced motion: no-op, all visible.
 * Uses `once`, so ScrollTriggers clean themselves up; the useGSAP scope reverts on unmount.
 */
export function useScrollReveal(scope: RefObject<HTMLElement | null>, options: ScrollRevealOptions = {}) {
  const reduced = useReducedMotion();
  const {
    targets = "[data-reveal]",
    trigger,
    y = 12,
    stagger = STAGGER.rows,
    duration = DUR.rise,
    ease = EASE.panel,
    start = "top 85%",
  } = options;

  useGSAP(
    () => {
      const root = scope.current;
      if (!root || reduced) return;
      const els = gsap.utils.toArray<HTMLElement>(targets, root);
      if (!els.length) return;
      const triggerEl = (trigger ? root.querySelector<HTMLElement>(trigger) : null) ?? root;
      gsap.from(els, {
        y,
        autoAlpha: 0,
        duration,
        ease,
        stagger,
        scrollTrigger: {
          trigger: triggerEl,
          start: () => safeStart(triggerEl, start),
          once: true,
          invalidateOnRefresh: true,
        },
      });
    },
    { scope, dependencies: [reduced, targets, trigger, y, stagger, duration, ease, start], revertOnUpdate: true },
  );
}
