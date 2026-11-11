"use client";

import { useSyncExternalStore } from "react";
import type { SectionId } from "@/lib/sections";

/**
 * THE STAGE: small shared app state, plus a per-frame scroll bus.
 *
 * 1. `stage`  - reactive, low-frequency state (intro phase, active section, menu, page
 *               transition, arrival). React reads it with `useStage(selector)`; anything else
 *               with `stage.get()` / `stage.subscribe()`.
 * 2. `scroll` - a mutable per-frame scroll sample, written ONLY by <SmoothScroll>. Read it in
 *               rAF / ticker code or subscribe with `onScroll(fn)`. Never put it in React state.
 *
 * Writers (one per field): intro -> the Intro (finishBoot), activeSection -> the header,
 * menuOpen -> the header / mobile menu, transition + arrival + returnFrom -> TransitionProvider.
 */

export type IntroPhase = "pending" | "playing" | "done";
export type TransitionPhase = "idle" | "leaving" | "entering";
/** How the current page was reached. */
export type Arrival = "load" | "sheet" | "history" | "plain";

export type StageState = {
  /** The opening. "done" once finishBoot() ran (also on pages without an opening). */
  intro: IntroPhase;
  /** Home section under the reading line (40% of the viewport). Null at the very top / off home. */
  activeSection: SectionId | null;
  /** Mobile menu open. */
  menuOpen: boolean;
  /** Page sheet phase. */
  transition: TransitionPhase;
  /** How this page was reached: "sheet" = through the page transition. */
  arrival: Arrival;
  /** Normalised path the arrival belongs to (guards against a stale arrival on the next page). */
  arrivalPath: string;
  /** Slug of the case study the visitor just came back from (the work section may pre-select it). Reader clears it: stage.set({ returnFrom: null }). */
  returnFrom: string | null;
};

const initialState: StageState = {
  intro: "pending",
  activeSection: null,
  menuOpen: false,
  transition: "idle",
  arrival: "load",
  arrivalPath: "",
  returnFrom: null,
};

let state: StageState = initialState;
const listeners = new Set<() => void>();

export const stage = {
  get(): StageState {
    return state;
  },
  /** Shallow-merge a patch. Listeners fire only if a value actually changed. */
  set(patch: Partial<StageState>) {
    let changed = false;
    for (const key in patch) {
      const k = key as keyof StageState;
      if (!Object.is(state[k], patch[k])) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/**
 * React hook. Select a PRIMITIVE (string, number, boolean, null): the component re-renders only
 * when that value changes. Never return new objects or arrays from the selector.
 *
 *   const menuOpen = useStage((s) => s.menuOpen);
 */
export function useStage<T>(selector: (s: StageState) => T): T {
  return useSyncExternalStore(
    stage.subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

// ---------------------------------------------------------------------------------------------
// Scroll bus (per frame, non-reactive)
// ---------------------------------------------------------------------------------------------

export type ScrollSample = {
  /** Current scroll offset in px. */
  y: number;
  /** Maximum scroll offset in px. */
  max: number;
  /** y / max, 0..1. */
  progress: number;
  /** px per frame (Lenis velocity, or the native delta). */
  velocity: number;
  /** 1 scrolling down, -1 up. */
  direction: 1 | -1;
};

export const scroll: ScrollSample = { y: 0, max: 1, progress: 0, velocity: 0, direction: 1 };
const scrollListeners = new Set<(s: ScrollSample) => void>();

/** Subscribe to scroll samples (fires on every scroll frame). Returns an unsubscribe function. */
export function onScroll(fn: (s: ScrollSample) => void): () => void {
  scrollListeners.add(fn);
  return () => {
    scrollListeners.delete(fn);
  };
}

/** Internal: called by <SmoothScroll> only. */
export function emitScroll(y: number, max: number, velocity: number) {
  scroll.direction = y > scroll.y ? 1 : y < scroll.y ? -1 : scroll.direction;
  scroll.y = y;
  scroll.max = Math.max(1, max);
  scroll.progress = Math.min(1, Math.max(0, y / scroll.max));
  scroll.velocity = velocity;
  scrollListeners.forEach((fn) => fn(scroll));
}
