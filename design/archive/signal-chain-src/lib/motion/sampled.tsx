"use client";

import { createElement, useRef, type HTMLAttributes, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsap";
import { DUR, EASE, SAMPLE_STEPS } from "./eases";
import { useReducedMotion } from "./media";

/**
 * SAMPLE-AND-HOLD: the signature type treatment. Real DOM text shows through a CSS mask of
 * vertical slices whose spacing steps 24 -> 12 -> 6 -> 3px -> solid. Hard steps, never tweens
 * (sampling is discrete), no dots, no particles. The text is in the DOM from frame 0 (LCP-safe).
 *
 * CSS lives in globals.css ([data-sampling] + --sw slice width + --sp slice pitch).
 */

type SampleOptions = {
  /** Slice pitches in px, coarse to fine. */
  steps?: readonly number[];
  /** Seconds per step: 0.17 for the hero name (5 steps incl. solid), 0.11 for datasheet titles. */
  stepDuration?: number;
  /** Lit slice width in px. */
  slice?: number;
};

/**
 * Build a paused-able timeline that samples `el` in. Nest it in a master timeline
 * (the hero intro adds it at 0.62s) or play it alone. The element is hidden (mask with zero
 * slice width) from the moment the timeline is created until its first step.
 * Reverting the timeline's gsap.context restores the element.
 */
export function sampleTimeline(el: HTMLElement, { steps = SAMPLE_STEPS, stepDuration = DUR.sheetStep, slice = 2 }: SampleOptions = {}) {
  const tl = gsap.timeline();
  el.setAttribute("data-sampling", "");
  el.style.setProperty("--sw", "0px");
  el.style.setProperty("--sp", `${steps[0] ?? 24}px`);
  steps.forEach((pitch, k) => {
    tl.call(
      () => {
        el.style.setProperty("--sp", `${pitch}px`);
        el.style.setProperty("--sw", `${slice}px`);
      },
      undefined,
      k * stepDuration,
    );
  });
  tl.call(
    () => {
      el.removeAttribute("data-sampling");
      el.style.removeProperty("--sw");
      el.style.removeProperty("--sp");
    },
    undefined,
    steps.length * stepDuration,
  );
  return tl;
}

/** Remove any sampling mask immediately (skip / reduced motion / cleanup). */
export function clearSampling(el: HTMLElement) {
  el.removeAttribute("data-sampling");
  el.style.removeProperty("--sw");
  el.style.removeProperty("--sp");
}

type Tag = "h1" | "h2" | "h3" | "p" | "span" | "div";
type SampledTextProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  as?: Tag;
  children: ReactNode;
  /** Play when true (e.g. on a curtain arrival). False = render solid, no mask. */
  play: boolean;
  delay?: number;
} & SampleOptions;

/**
 * The datasheet title treatment (4 steps x 110ms). Renders solid unless `play` is true and
 * motion is allowed, so a direct load or reduced motion never hides it.
 *
 *   const { arrival, ready } = usePageArrival();
 *   <SampledText as="h1" play={ready && arrival === "curtain"} className="type-display">…</SampledText>
 */
export function SampledText({ as = "span", children, play, delay = 0, steps, stepDuration, slice, ...rest }: SampledTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !play || reduced) return;
      const tl = sampleTimeline(el, { steps, stepDuration, slice });
      tl.delay(delay);
      return () => clearSampling(el);
    },
    { dependencies: [play, reduced], revertOnUpdate: true },
  );

  return createElement(as, { ref, ...rest }, children);
}

/**
 * Beam wipe for a single line: add className="beam-wipe" to the element, then tween --rp 0 -> 1.
 * A 1.5px bone beam rides the clip edge. Hidden state: set here (or data-boot-wipe while booting).
 */
export function beamWipe(el: HTMLElement, { duration = DUR.beamWipe, ease = EASE.beam } = {}) {
  return gsap.fromTo(el, { "--rp": 0 }, { "--rp": 1, duration, ease });
}
