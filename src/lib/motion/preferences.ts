"use client";

import { useSyncExternalStore } from "react";

/**
 * The user's motion choice (the footer's <MotionToggle>: "Motion: full | reduced").
 *
 * An explicit choice overrides the OS `prefers-reduced-motion` setting and is persisted in
 * localStorage. `isReducedMotion()` / `useReducedMotion()` are the ONLY sources of truth for
 * "should this move?" anywhere in the app. The state is mirrored onto <html> as the class `rm`
 * so CSS can react through the `reduced:` variant; the inline boot script sets the same class
 * before first paint from the same storage key.
 *
 * Reduced motion means: no opening, no cycling, no lens, no tilt, no scrub, no Lenis, the 2D
 * keyboard, a static background. Colour and opacity feedback stay.
 */

export const MOTION_KEY = "pmp:motion";
const RM_QUERY = "(prefers-reduced-motion: reduce)";

type MotionOverride = "full" | "reduced" | null;
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage unavailable (privacy mode): the choice lasts for this page only
  }
}

let motionOverride: MotionOverride = null;
let initialised = false;

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  const m = read(MOTION_KEY);
  motionOverride = m === "full" || m === "reduced" ? m : null;
  window.matchMedia(RM_QUERY).addEventListener("change", () => {
    applyClasses();
    emit();
  });
  window.addEventListener("storage", (e) => {
    if (e.key !== MOTION_KEY) return;
    initialised = false;
    init();
    applyClasses();
    emit();
  });
}

function emit() {
  listeners.forEach((l) => l());
}

function applyClasses() {
  document.documentElement.classList.toggle("rm", isReducedMotion());
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** OS setting only. */
export function osPrefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(RM_QUERY).matches;
}

/** Effective reduced motion: the user's choice if any, else the OS setting. */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  init();
  return motionOverride ? motionOverride === "reduced" : osPrefersReducedMotion();
}

/** "full" | "reduced" forces a mode; null returns control to the OS setting. */
export function setMotionPreference(value: MotionOverride) {
  init();
  motionOverride = value;
  write(MOTION_KEY, value);
  applyClasses();
  emit();
}

/** React: effective reduced-motion flag. Server and first render assume full motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, isReducedMotion, () => false);
}

/**
 * React: may looping / auto-advancing motion run (the hero cycle, idle breathing)?
 * Same as !useReducedMotion(); named for intent. Loops must also pause on hover, focus and
 * when offscreen, and offer a visible pause control when they run longer than 5 seconds.
 */
export function useLoopsAllowed(): boolean {
  return !useReducedMotion();
}

/** React: details for the Motion toggle. */
export function useMotionPreference(): { reduced: boolean; source: "user" | "os" } {
  const reduced = useReducedMotion();
  const source = useSyncExternalStore(subscribe, motionSource, () => "os" as const);
  return { reduced, source };
}

function motionSource(): "user" | "os" {
  init();
  return motionOverride ? "user" : "os";
}
