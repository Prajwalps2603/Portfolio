"use client";

import { createElement, useRef, type ReactNode, type HTMLAttributes } from "react";
import { gsap, SplitText, ScrollTrigger, useGSAP } from "./gsap";
import { EASE, DUR, STAGGER } from "./eases";
import { useReducedMotion } from "./media";

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span" | "blockquote";

type SplitRevealProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  as?: Tag;
  /** Static text (or simple inline markup). Must not change after mount. */
  children: ReactNode;
  /** "lines" (default): masked lines rise. "words": masked words rise (short headings only). */
  type?: "lines" | "words";
  /** "scroll" (default): plays once when the element reaches `start`. "mount": plays on mount.
   *  "manual": waits for `play` to become true. */
  trigger?: "scroll" | "mount" | "manual";
  play?: boolean;
  start?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
};

/**
 * Masked line reveal: each line rises from behind its own mask (yPercent 110 -> 0, expo.out).
 * The heading-level authored moment for a section that has nothing better. Use sparingly:
 * at most one section in three, and never together with another reveal on the same section.
 *
 * - Text is fully visible in the server HTML; the hidden state is set by GSAP on mount, so
 *   content never depends on JS. With reduced motion nothing is split or hidden.
 * - SplitText re-splits on resize/font load (autoSplit) and adds aria-label to the element, so
 *   screen readers read the sentence, not fragments.
 */
export function SplitReveal({
  as = "div",
  children,
  type = "lines",
  trigger = "scroll",
  play = true,
  start = "top 85%",
  delay = 0,
  stagger = STAGGER.lines,
  duration = DUR.heading,
  ...rest
}: SplitRevealProps) {
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
      SplitText.create(el, {
        type: type === "words" ? "words,lines" : "lines",
        mask: type === "words" ? "words" : "lines",
        autoSplit: true,
        onSplit(self) {
          const targets = type === "words" ? self.words : self.lines;
          return gsap.from(targets, {
            yPercent: 110,
            duration,
            delay,
            ease: EASE.out,
            stagger,
            scrollTrigger:
              trigger === "scroll"
                ? { trigger: el, start: () => safeStart(el, start), once: true, invalidateOnRefresh: true }
                : undefined,
          });
        },
      });
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
