"use client";

import { useEffect, useState } from "react";
import { bootMode } from "./boot";

export type IntroMode = "pending" | "full" | "short" | "none";

/**
 * How the opening plays on this page load (decided once, before first paint, by the inline boot
 * script; see ./boot.ts):
 * - "full"  first home visit of the tab session (<= 2.6s, sketch -> ship),
 * - "short" repeat home visits in the same session (the same timeline at INTRO_TIMESCALE.short),
 * - "none"  reduced motion, deep links, client-side arrivals and returns from a case study.
 * "pending" is the server / first-render state: keep the boot styling, do not animate yet.
 *
 * StrictMode-safe (it only reads; finishBoot() consumes the mode).
 */
export function useIntroMode(): IntroMode {
  const [mode, setMode] = useState<IntroMode>("pending");
  useEffect(() => {
    setMode(bootMode());
  }, []);
  return mode;
}

/** Timeline speed for each mode (gsap timeline.timeScale). */
export const INTRO_TIMESCALE: Record<Exclude<IntroMode, "pending" | "none">, number> = {
  full: 1,
  short: 2.4,
};
