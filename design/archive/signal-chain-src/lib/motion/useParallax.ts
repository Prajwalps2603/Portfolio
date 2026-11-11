"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "./gsap";
import { EASE } from "./eases";
import { useReducedMotion } from "./media";

type ParallaxOptions = {
  /** Travel as a fraction of the viewport height across the scroll range. Negative = moves up
   *  faster than the page (drifts away). The hero copy uses -0.07. Keep |speed| <= 0.15. */
  speed?: number;
  /** Element whose scroll range drives the effect (default: the target itself). */
  trigger?: RefObject<HTMLElement | null>;
  start?: string;
  end?: string;
  /** Also fade towards this opacity across the range (e.g. the hero scope dims to 0.22). */
  toOpacity?: number;
};

/**
 * Scrubbed parallax, linear in scroll (ease "none": the scroll IS the easing).
 * Disabled with reduced motion (no motion tied to scroll that moves content).
 *
 *   useParallax(copyRef, { speed: -0.07, trigger: heroRef, start: "top top", end: "bottom top" });
 */
export function useParallax(target: RefObject<HTMLElement | null>, options: ParallaxOptions = {}) {
  const reduced = useReducedMotion();
  const { speed = -0.07, trigger, start = "top bottom", end = "bottom top", toOpacity } = options;

  useGSAP(
    () => {
      const el = target.current;
      if (!el || reduced) return;
      const vars: gsap.TweenVars = {
        y: () => speed * window.innerHeight,
        ease: EASE.none,
        scrollTrigger: {
          trigger: trigger?.current ?? el,
          start,
          end,
          scrub: true,
          invalidateOnRefresh: true,
        },
      };
      if (toOpacity !== undefined) vars.opacity = toOpacity;
      gsap.to(el, vars);
    },
    { dependencies: [reduced, speed, start, end, toOpacity], revertOnUpdate: true },
  );
}
