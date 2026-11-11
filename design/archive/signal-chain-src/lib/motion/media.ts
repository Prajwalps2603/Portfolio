"use client";

import { useSyncExternalStore } from "react";
import { isReducedMotion, useReducedMotion as useReducedMotionPref } from "./preferences";

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

/**
 * SSR-safe media query hook. `serverValue` is what the server render (and first client render) assumes.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribeTo(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/**
 * True when motion should be reduced: the footer's "Motion: reduced" choice, or the OS setting
 * when the user has not chosen. Re-exported here so existing imports keep working.
 */
export function useReducedMotion(): boolean {
  return useReducedMotionPref();
}

/** True on devices with a precise pointer that can hover (desktop mouse / trackpad). */
export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)", false);
}

/** True at the portrait / phone layout (<= 860px), matching the `portrait:` CSS variant. */
export function usePortraitLayout(): boolean {
  return useMediaQuery("(max-width: 860px)", false);
}

/** Non-hook check for use inside effects and animation code (respects the footer toggle). */
export function prefersReducedMotion(): boolean {
  return isReducedMotion();
}

/** Non-hook fine-pointer check. */
export function hasFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
