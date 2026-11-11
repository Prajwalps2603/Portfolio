"use client";

import { useEffect, useState } from "react";
import { bootMode } from "./boot";

export type IntroMode = "pending" | "full" | "short" | "none";

/**
 * How the opening sequence plays on this page load (decided once, before first paint, by the
 * inline boot script; see ./boot.ts):
 * - "full"  on the first home visit of a browser session (about 3.0s),
 * - "short" on repeat home visits in the same session (same timeline at timeScale 2.6),
 * - "none"  with reduced motion, deep links, client-side arrivals and returns from a datasheet.
 * "pending" is the server/first-render state: keep the boot styling, do not animate yet.
 *
 * Stable under React StrictMode double-mounting (it only reads; finishBoot() consumes the mode).
 */
export function useIntroMode(): IntroMode {
  const [mode, setMode] = useState<IntroMode>("pending");
  useEffect(() => {
    setMode(bootMode());
  }, []);
  return mode;
}

/** Timeline speed for each mode. */
export const INTRO_TIMESCALE: Record<Exclude<IntroMode, "pending" | "none">, number> = {
  full: 1,
  short: 2.6,
};
