"use client";

import { useSyncExternalStore } from "react";

/**
 * User motion controls (the footer's "Motion: full | reduced" and "Signals: on | paused").
 *
 * - Motion: an explicit user choice overrides the OS `prefers-reduced-motion` setting and is
 *   persisted in localStorage. `isReducedMotion()` / `useReducedMotion()` are the ONLY sources
 *   of truth for "should this move?" anywhere in the app.
 * - Signals: pauses every looping signal (scroll-cue sweep, bench pulses, datasheet dashes)
 *   to meet WCAG 2.2.2. Persisted. Reduced motion implies no loops regardless.
 *
 * Both mirror themselves onto <html> as classes (`rm`, `signals-off`) so CSS can react through
 * the `reduced:` and `signals-off:` variants. The inline boot script sets the same classes
 * before first paint, using the same storage keys.
 */

export const MOTION_KEY = "pmp:motion";
export const SIGNALS_KEY = "pmp:signals";
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
let signalsOn = true;
let initialised = false;

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  const m = read(MOTION_KEY);
  motionOverride = m === "full" || m === "reduced" ? m : null;
  signalsOn = read(SIGNALS_KEY) !== "paused";
  window.matchMedia(RM_QUERY).addEventListener("change", () => {
    applyClasses();
    emit();
  });
  window.addEventListener("storage", (e) => {
    if (e.key !== MOTION_KEY && e.key !== SIGNALS_KEY) return;
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
  const html = document.documentElement;
  html.classList.toggle("rm", isReducedMotion());
  html.classList.toggle("signals-off", !signalsOn);
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

/** Effective reduced motion: the user's footer choice if any, else the OS setting. */
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

/** True while looping signals may run (Signals: on AND full motion). */
export function areSignalsOn(): boolean {
  if (typeof window === "undefined") return true;
  init();
  return signalsOn;
}

export function setSignals(on: boolean) {
  init();
  signalsOn = on;
  write(SIGNALS_KEY, on ? "on" : "paused");
  applyClasses();
  emit();
}

/** React: effective reduced-motion flag. Server/first render assume full motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, isReducedMotion, () => false);
}

/** React: the footer's Signals toggle. */
export function useSignals(): boolean {
  return useSyncExternalStore(subscribe, areSignalsOn, () => true);
}

/** React: whether looping signals should run right now (signals on and motion not reduced). */
export function useLoopsAllowed(): boolean {
  const reduced = useReducedMotion();
  const signals = useSignals();
  return signals && !reduced;
}

/** React: details for the footer toggle ("Motion: full | reduced"). */
export function useMotionPreference(): { reduced: boolean; source: "user" | "os" } {
  const reduced = useReducedMotion();
  const source = useSyncExternalStore(subscribe, motionSource, () => "os" as const);
  return { reduced, source };
}

function motionSource(): "user" | "os" {
  init();
  return motionOverride ? "user" : "os";
}
