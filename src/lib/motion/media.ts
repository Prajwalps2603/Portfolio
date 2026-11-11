"use client";

import { useSyncExternalStore } from "react";
import { isReducedMotion, useReducedMotion as useReducedMotionPref } from "./preferences";

/**
 * Breakpoints (match the Tailwind theme in globals.css):
 *   phone   < 600px          (no prefix)
 *   tablet  600 - 899px      sm:
 *   laptop  900 - 1199px     md:   (also tablet landscape)
 *   desktop >= 1200px        lg:
 *   wide    >= 1440px        xl:
 */
export const BREAKPOINTS = { sm: 600, md: 900, lg: 1200, xl: 1440 } as const;

const subscribers = new Map<string, (onChange: () => void) => () => void>();

/** One stable subscribe function per query, so useSyncExternalStore never re-subscribes. */
function subscribeTo(query: string) {
  let fn = subscribers.get(query);
  if (!fn) {
    fn = (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    };
    subscribers.set(query, fn);
  }
  return fn;
}

/** SSR-safe media query hook. `serverValue` is what the server render (and first client render) assumes. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribeTo(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** True when motion should be reduced (the Motion toggle, else the OS setting). */
export function useReducedMotion(): boolean {
  return useReducedMotionPref();
}

/** True on devices with a precise pointer that can hover (mouse / trackpad). */
export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)", false);
}

/** True below 600px (phone layout). */
export function usePhone(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 0.02}px)`, false);
}

/** True below 900px (phone + tablet portrait: the header shows the menu button). */
export function useCompact(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 0.02}px)`, false);
}

/** True at >= 1200px (desktop). */
export function useDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`, false);
}

/** Non-hook reduced-motion check for effects and animation code. */
export function prefersReducedMotion(): boolean {
  return isReducedMotion();
}

/** Non-hook fine-pointer check. */
export function hasFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
