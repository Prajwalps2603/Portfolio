"use client";

import { useSyncExternalStore } from "react";
import type { SectionId } from "@/lib/sections";

/**
 * THE STAGE: the one shared store every area reads and writes. Three parts:
 *
 * 1. `stage`  - reactive, low-frequency app state (intro phase, trigger lock, active section,
 *               surface under the top bar, menu, page transition). React reads it with
 *               `useStage(selector)`; anything else with `stage.get()` / `stage.subscribe()`.
 * 2. `scroll` - a mutable per-frame scroll sample, written ONLY by <SmoothScroll>. Read it in
 *               rAF / ticker code or subscribe with `onScroll(fn)`. Never put it in React state.
 * 3. `scope`  - the mutable per-frame bus between the hero (writer) and the WebGL scene (reader):
 *               the opening's tween targets and the hero layout cache. Not reactive by design:
 *               the scene reads it inside its render loop. Writers call `wakeScope()` after
 *               changing anything so a stopped (converged) loop renders again.
 *
 * See docs/DESIGN.md "Stage store" for who writes which field.
 */

// ---------------------------------------------------------------------------------------------
// 1. Reactive stage
// ---------------------------------------------------------------------------------------------

export type IntroPhase = "pending" | "playing" | "done";
export type TriggerState = "locked" | "auto";
export type Surface = "screen" | "sheet";
export type TransitionPhase = "idle" | "leaving" | "entering";
/** How the current page was reached. */
export type Arrival = "load" | "curtain" | "history" | "plain";
/** What the hero scene ended up rendering. */
export type SceneStatus = "pending" | "webgl" | "fallback";

export type StageState = {
  /** Opening sequence. "done" once finishBoot() ran (also on pages without an intro). Writer: intro / boot. */
  intro: IntroPhase;
  /** Hero trigger. "auto" shows AUTO (blinking) in the top bar; "locked" shows TRIG'D. Writer: hero. */
  trigger: TriggerState;
  /** Home section currently under the reading line (45% of the viewport). Writer: header. */
  activeSection: SectionId | null;
  /** Material under the top bar. Writer: header. */
  surface: Surface;
  /** Mobile menu open. Writer: header. */
  menuOpen: boolean;
  /** Route curtain phase. Writer: transition provider. */
  transition: TransitionPhase;
  /** How this page was reached. Writer: transition provider. */
  arrival: Arrival;
  /** Normalised path the arrival belongs to (guards against a stale arrival on the next page). */
  arrivalPath: string;
  /** Slug of the datasheet the user just returned from, so the bench re-acquires it. Writer: transition provider; reader clears it via stage.set({ returnFrom: null }). */
  returnFrom: string | null;
  /** Hero scene render path. Writer: scene. */
  scene: SceneStatus;
};

const initialState: StageState = {
  intro: "pending",
  trigger: "locked",
  activeSection: null,
  surface: "screen",
  menuOpen: false,
  transition: "idle",
  arrival: "load",
  arrivalPath: "",
  returnFrom: null,
  scene: "pending",
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
 * when that value changes. Do not return new objects/arrays from the selector.
 *
 *   const trigger = useStage((s) => s.trigger);
 */
export function useStage<T>(selector: (s: StageState) => T): T {
  return useSyncExternalStore(
    stage.subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

// ---------------------------------------------------------------------------------------------
// 2. Scroll bus (per frame, non-reactive)
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

// ---------------------------------------------------------------------------------------------
// 3. Scope bus: hero (writer) -> WebGL scene (reader). Mirrors the sketch's H and L objects.
// ---------------------------------------------------------------------------------------------

/** Animated signal state. The opening tweens these; the trigger and probe nudge them. */
export type ScopeSignal = {
  /** Beam sweep progress 0..1 (opening 150-1050ms). */
  reveal: number;
  /** Graticule materialised 0..1 (follows the beam). */
  grat: number;
  /** Composite -> five lanes 0..1 (opening 1500-2100ms, lock ease). */
  split: number;
  /** Noise amplitude (0.16 untriggered -> 0.006 locked). */
  noise: number;
  /** Beam head brightness 0..1. */
  head: number;
  /** Per-channel phase offsets (CH1..CH4), in screen widths. */
  roll: [number, number, number, number];
  /** Per-channel roll speed (screen widths/s). 0 when locked. */
  speed: [number, number, number, number];
  /** Lane under the probe: 0..3 channels, 4 = Σ, -1 none. */
  hover: number;
  /** Probe ripple energy (decays as e^(-2.6t) in the scene loop). */
  energy: number;
  /** Probe measurement cursor visibility 0..1. */
  probeVis: number;
  /** Probe position in CSS px relative to the hero (-9999 when absent). */
  probeX: number;
  probeY: number;
  /** Trigger level in amplitudes off the Σ trace (-1..1; |lvl| > 0.85 loses lock). */
  trigLvl: number;
  /** Trigger level line visibility 0..1 (while dragging). */
  trigVis: number;
  /** True once triggered. */
  locked: boolean;
  /** Touch idle re-sweep position (-1 off). */
  sweep: number;
  sweepAmt: number;
};

/** Layout cache, measured by the hero from the DOM (never read computed styles per frame). */
export type ScopeLayout = {
  /** Hero box in CSS px. */
  width: number;
  height: number;
  /** Lane centre lines in CSS px from the hero top: CH1..CH4, then Σ. */
  lanes: [number, number, number, number, number];
  /** Distance between lane centres (CSS px). */
  laneSpacing: number;
  /** Graticule rect [x0, y0, x1, y1] in CSS px from the hero top-left (aligned to the name). */
  rect: [number, number, number, number];
  /** Graticule divisions [columns, rows]: 10 x n landscape, 4 x n portrait. */
  divisions: [number, number];
  /** Adaptive quality: 0 full, 1 DPR 1 + half segments, 2 frozen static frame. */
  quality: 0 | 1 | 2;
  /** Incremented by the hero whenever the layout above changes. */
  version: number;
};

/** The locked picture: what a scene renders when no intro runs (reduced motion, repeat, return). */
export const LOCKED_SIGNAL: Readonly<ScopeSignal> = {
  reveal: 1,
  grat: 1,
  split: 1,
  noise: 0.006,
  head: 0,
  roll: [0, 0, 0, 0],
  speed: [0, 0, 0, 0],
  hover: -1,
  energy: 0,
  probeVis: 0,
  probeX: -9999,
  probeY: -9999,
  trigLvl: 0,
  trigVis: 0,
  locked: true,
  sweep: -1,
  sweepAmt: 0,
};

export const scope: { signal: ScopeSignal; layout: ScopeLayout } = {
  signal: { ...LOCKED_SIGNAL, roll: [0, 0, 0, 0], speed: [0, 0, 0, 0] },
  layout: {
    width: 0,
    height: 0,
    lanes: [0, 0, 0, 0, 0],
    laneSpacing: 60,
    rect: [0, 0, 0, 0],
    divisions: [10, 8],
    quality: 0,
    version: 0,
  },
};

/** The untriggered state the opening starts from. */
export function resetScopeToUntriggered() {
  Object.assign(scope.signal, { reveal: 0, grat: 0, split: 0, noise: 0.16, head: 0, probeVis: 0, locked: false });
  scope.signal.speed = [0.32, 0.32, 0.32, 0.32];
}

/** Snap to the locked picture (reduced motion, skipped intro, returning from a datasheet). */
export function lockScope() {
  Object.assign(scope.signal, { ...LOCKED_SIGNAL, roll: [...scope.signal.roll], speed: [0, 0, 0, 0] });
}

const wakeListeners = new Set<() => void>();

/** Writers: call after changing scope.signal / scope.layout so a converged scene renders again. */
export function wakeScope() {
  wakeListeners.forEach((fn) => fn());
}

/** Scene: register the render-loop waker. Returns an unsubscribe function. */
export function onScopeWake(fn: () => void): () => void {
  wakeListeners.add(fn);
  return () => {
    wakeListeners.delete(fn);
  };
}
