"use client";

import { createElement, useRef, type HTMLAttributes, type ReactNode } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "./gsap";
import { DUR, EASE, STAGGER } from "./eases";
import { useReducedMotion } from "./media";

type SplitType = "chars" | "words" | "lines";

type SplitArriveOptions = {
  /** chars: the name typing in (fast stagger). words: short headings. lines: paragraphs. */
  type?: SplitType;
  /** Rise distance as a % of each piece's height (masked). 0 = fade only. Default 100 (lines/words), 0 (chars). */
  yPercent?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
};

/**
 * Imperative split-text arrival for timelines. Returns the SplitText instance and its tween (paused
 * if `paused`), so a master timeline can place it: tl.add(splitArrive(nameEl, { type: "chars" }).tween, 0.9)
 *
 * - chars: each character appears (opacity 0 -> 1, a short 0.25em rise) with a fast stagger:
 *   "the name types in". No mask, so descenders never clip.
 * - words / lines: each piece rises from behind its own mask (expo out).
 * SplitText adds an aria-label to the element, so screen readers read the sentence, not pieces.
 * Call split.revert() when done if the text must reflow later (resize re-splits otherwise).
 */
export function splitArrive(el: HTMLElement, { type = "lines", yPercent, stagger, duration, delay = 0 }: SplitArriveOptions = {}, paused = false) {
  const isChars = type === "chars";
  // Registered here, not in ./gsap: SplitText then ships only with the pages that split text.
  gsap.registerPlugin(SplitText);
  const split = SplitText.create(el, {
    type: isChars ? "words,chars" : type === "words" ? "words,lines" : "lines",
    mask: isChars ? undefined : type,
    aria: "auto",
  });
  const targets = isChars ? split.chars : type === "words" ? split.words : split.lines;
  const tween = isChars
    ? gsap.from(targets, {
        autoAlpha: 0,
        y: "0.25em",
        duration: duration ?? 0.32,
        ease: EASE.arrive,
        stagger: stagger ?? STAGGER.chars,
        delay,
        paused,
      })
    : gsap.from(targets, {
        yPercent: yPercent ?? 105,
        duration: duration ?? 0.9,
        ease: EASE.arrive,
        stagger: stagger ?? (type === "words" ? STAGGER.items : STAGGER.lines),
        delay,
        paused,
      });
  return { split, tween };
}

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
type SplitArriveProps = Omit<HTMLAttributes<HTMLElement>, "children"> &
  SplitArriveOptions & {
    as?: Tag;
    /** Static text (or simple inline markup). Must not change after mount. */
    children: ReactNode;
    /** "view" (default): once when the top reaches `start`. "mount": on mount. "manual": when `play` turns true. */
    trigger?: "view" | "mount" | "manual";
    play?: boolean;
    start?: string;
  };

/**
 * Declarative split arrival. Use it for ONE heading or line per section at most (it is not a
 * section's authored moment, and never the same treatment on every section).
 * Text is fully visible in the server HTML; the hidden state is set by GSAP on mount. With
 * reduced motion nothing is split or hidden.
 */
export function SplitArrive({
  as = "div",
  children,
  type = "lines",
  trigger = "view",
  play = true,
  start = "top 85%",
  yPercent,
  stagger,
  duration,
  delay = 0,
  ...rest
}: SplitArriveProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;
      if (trigger === "manual" && !play) {
        gsap.set(el, { autoAlpha: 0 });
        return;
      }
      gsap.set(el, { autoAlpha: 1 });
      const { tween } = splitArrive(el, { type, yPercent, stagger, duration, delay }, trigger === "view");
      if (trigger === "view") {
        ScrollTrigger.create({
          trigger: el,
          start: () => safeStart(el, start),
          once: true,
          invalidateOnRefresh: true,
          onEnter: () => tween.play(),
        });
      }
    },
    { scope: ref, dependencies: [reduced, trigger, play, type], revertOnUpdate: true },
  );

  return createElement(as, { ref, ...rest }, children);
}

/**
 * A ScrollTrigger start that is always reachable: if the element sits so low on the page that
 * `start` can never be crossed (it would stay hidden forever), fall back to "top bottom".
 */
export function safeStart(el: Element, start: string): string {
  const max = ScrollTrigger.maxScroll(window);
  const top = el.getBoundingClientRect().top + window.scrollY;
  const pct = /top\s+(\d+(?:\.\d+)?)%/.exec(start);
  const line = pct ? (parseFloat(pct[1]) / 100) * window.innerHeight : window.innerHeight * 0.85;
  return top - line > max ? "top bottom" : start;
}
