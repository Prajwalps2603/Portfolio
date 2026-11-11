"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "./gsap";
import { EASE, DUR, STAGGER } from "./eases";
import { useReducedMotion } from "./media";
import { safeStart } from "./splitArrive";

type ScrollRevealOptions = {
  /** Selector for the parts that appear, relative to the scope (default "[data-reveal]"). */
  targets?: string;
  /** Element (selector inside scope) that triggers the reveal; default: the scope itself. */
  trigger?: string;
  /** Rise distance in px. Default 0: a plain fade ("everything else just fades in once"). */
  y?: number;
  stagger?: number;
  duration?: number;
  start?: string;
};

/**
 * The quiet default: parts fade in ONCE, in reading order, when the section arrives. This is a
 * secondary motion for supporting content. It is not a section's authored moment, and it must
 * not be applied to every section (most content should simply be there).
 *
 *   const ref = useRef<HTMLElement>(null);
 *   useScrollReveal(ref, { targets: "[data-reveal]", stagger: STAGGER.items });
 *
 * Hidden states are set by GSAP after mount (never in CSS). Reduced motion: no-op, all visible.
 */
export function useScrollReveal(scope: RefObject<HTMLElement | null>, options: ScrollRevealOptions = {}) {
  const reduced = useReducedMotion();
  const { targets = "[data-reveal]", trigger, y = 0, stagger = STAGGER.items, duration = DUR.fade, start = "top 85%" } = options;

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
        ease: EASE.arrive,
        stagger,
        scrollTrigger: { trigger: triggerEl, start: () => safeStart(triggerEl, start), once: true, invalidateOnRefresh: true },
      });
    },
    { scope, dependencies: [reduced, targets, trigger, y, stagger, duration, start], revertOnUpdate: true },
  );
}
