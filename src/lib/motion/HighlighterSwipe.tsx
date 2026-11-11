"use client";

import { createElement, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./gsap";
import { DUR, EASE, STAGGER } from "./eases";
import { useReducedMotion } from "./media";
import { safeStart } from "./splitArrive";

export type HighlightColor = "lime" | "blue" | "tangerine";

type HighlightProps = {
  /** lime = BUILD (#C8F53B), blue = CODE (blue-soft #DDE3FF), tangerine = SHIPPED / NOW (tangerine-soft #FFE1D3). Text inside is always ink. */
  color?: HighlightColor;
  children: ReactNode;
  /**
   * "view"   (default) swipes once when the element's top reaches 70% of the viewport height.
   * "mount"  swipes once on mount.
   * "manual" waits for `play` to become true (timelines, the opening, hover reveals).
   * "static" never animates: the block is simply there.
   */
  trigger?: "view" | "mount" | "manual" | "static";
  play?: boolean;
  /** Seconds before the swipe starts. */
  delay?: number;
  className?: string;
  as?: "span" | "mark";
};

/**
 * HIGHLIGHTER SWIPE: a flat highlighter block behind 1-3 words that swipes in left -> right
 * once (pen ease, 600ms). One accent per heading, rotating through the page (see docs/MOTION.md).
 *
 *   <h2 className="type-display">What I <Highlight color="blue">build</Highlight></h2>
 *
 * - Visible without JS: the block is drawn by CSS (.hl, --hl-p: 1). JS sets --hl-p to 0 only
 *   when it is about to animate. Reduced motion: static block, no swipe.
 * - Wraps across lines (background + box-decoration-break: clone), so it survives any width.
 * - Tune per size with CSS vars on the element: --hl-h (band height, default 0.82em) and
 *   --hl-y (vertical position, default 66%).
 */
export function Highlight({ color = "lime", children, trigger = "view", play = false, delay = 0, className, as = "span" }: HighlightProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced || trigger === "static") return;
      if (trigger === "manual" && !play) {
        gsap.set(el, { "--hl-p": 0 });
        return;
      }
      const vars: gsap.TweenVars = { "--hl-p": 1, duration: DUR.swipe, ease: EASE.pen, delay };
      if (trigger === "view") {
        vars.scrollTrigger = { trigger: el, start: () => safeStart(el, "top 70%"), once: true, invalidateOnRefresh: true };
      }
      gsap.fromTo(el, { "--hl-p": 0 }, vars);
    },
    { dependencies: [reduced, trigger, play, delay], revertOnUpdate: true },
  );

  return createElement(
    as,
    { ref, "data-hl": color, className: `hl hl-${color}${className ? ` ${className}` : ""}` },
    children,
  );
}

/**
 * Imperative swipe for timelines (the opening, a re-compile): returns a tween that swipes every
 * [data-hl] inside `scope` (or the element itself). Pair it with <Highlight trigger="manual">,
 * or with <Highlight trigger="static"> if you set the hidden state yourself.
 *
 *   tl.add(swipeHighlights(heroRef.current!), 1.1);
 */
export function swipeHighlights(scope: Element, { stagger = STAGGER.items * 2, duration = DUR.swipe } = {}) {
  const els = scope.matches("[data-hl]") ? [scope] : Array.from(scope.querySelectorAll("[data-hl]"));
  return gsap.fromTo(els, { "--hl-p": 0 }, { "--hl-p": 1, duration, ease: EASE.pen, stagger });
}

/** Refresh helper for sections that change height after a swipe target mounts. */
export function refreshTriggers() {
  ScrollTrigger.refresh();
}
