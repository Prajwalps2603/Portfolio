"use client";

import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { SKETCH_KEY } from "@/lib/motion/bootScript";
import { isReducedMotion } from "@/lib/motion/preferences";
import type { SketchOrigin } from "@/lib/motion/sketchWipe";

/**
 * SKETCH MODE (contract 5): one switch that turns the whole site back into the sketch it
 * started as.
 *
 *   const { on, toggle, set } = useSketchMode();   // React
 *   getSketchMode() / subscribeSketchMode(fn)      // anything else
 *   onSketchModeChange(fn)                         // each switch, with its origin and its end
 *
 * While it is on, <html> carries `data-sketch`: the CSS in globals.css ("SKETCH MODE") redraws
 * every shared surface by hand (Caveat headings, labels and buttons, graphite text, pencil
 * outlines instead of fills and shadows, scribbled highlights, ink slabs turned to paper, the
 * notebook grid), and every component with a sketch/ship pair (MiniUI, the diagrams, the hero
 * stage, the idea ticket) shows its SKETCH state. In CSS use the `sketch:` variant; opt a subtree
 * out of the generic restyle with `data-sketch-skip` (mini-UIs are skipped automatically).
 *
 * `origin` is the viewport point the wipe starts from (e.g. the toggle's centre); without one it
 * starts at the header's pencil toggle. Switching plays the lens wipe (src/lib/motion/sketchWipe.ts;
 * instant with reduced motion or without View Transitions). One wipe runs at a time: a request
 * mid-wipe fast-forwards it and the store then catches up with the latest request, so any number
 * of quick clicks lands on the right state. Persisted for the tab session only (sessionStorage,
 * applied before first paint by the boot script); never on by default.
 *
 * First load: this store is the tiny always-loaded shim. The wipe is its own chunk, fetched on the
 * first switch (or earlier, on intent: the header toggle calls warmSketchWipe() on hover, focus
 * and press). If that chunk cannot load (offline), the switch still happens, instantly.
 */
export type { SketchOrigin };

export type SketchChange = {
  /** The state being entered. */
  on: boolean;
  /** Where the wipe starts (viewport px). */
  origin: SketchOrigin;
  /** False when the swap is instant (reduced motion). */
  animated: boolean;
  /** Resolves when the wipe has finished. */
  finished: Promise<void>;
};

/** Applied state (what the DOM shows). The boot script may have switched it on before React. */
let on = typeof document !== "undefined" && document.documentElement.hasAttribute("data-sketch");
/** Requested state: toggles count against this, so two quick clicks never cancel into a no-op. */
let wanted = on;
const listeners = new Set<() => void>();
const changeListeners = new Set<(change: SketchChange) => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function persist(next: boolean) {
  try {
    if (next) sessionStorage.setItem(SKETCH_KEY, "1");
    else sessionStorage.removeItem(SKETCH_KEY);
  } catch {
    // storage unavailable (privacy mode): the choice lasts for this page only
  }
}

/** The header's pencil toggle, when it is on screen; else the middle of the viewport. */
function defaultOrigin(): SketchOrigin {
  const r = document.querySelector<HTMLElement>('[data-qa="sketch-toggle"]')?.getBoundingClientRect();
  if (r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

export function getSketchMode(): boolean {
  return on;
}

/** Put the state on the document and tell React (synchronously inside a view transition, so
 *  every sketch/ship pair has switched before the new state is captured). */
function apply(next: boolean, sync: boolean) {
  on = next;
  document.documentElement.toggleAttribute("data-sketch", next);
  persist(next);
  if (sync) flushSync(emit);
  else emit();
}

// ---- the wipe, loaded on first use -----------------------------------------------------------
type Wipe = typeof import("@/lib/motion/sketchWipe");
let wipe: Wipe | null = null;
let wipeLoad: Promise<Wipe> | null = null;

/** Fetch the wipe's chunk ahead of the first switch (hover / focus / press on a toggle). Idempotent. */
export function warmSketchWipe(): Promise<Wipe> {
  if (!wipeLoad) {
    wipeLoad = import("@/lib/motion/sketchWipe").then((mod) => (wipe = mod));
    // a failed fetch may be retried by the next switch
    wipeLoad.catch(() => {
      wipeLoad = null;
    });
  }
  return wipeLoad;
}

/** Without the wipe's chunk: the same switch, instant (no lens, no reading-position anchor). */
const instantWipe: Wipe["playSketchWipe"] = ({ update }) => {
  update(false);
  return Promise.resolve();
};

/** One wipe at a time: a request during a wipe fast-forwards it, and its end catches up. */
let busy = false;

function run(origin: SketchOrigin) {
  if (busy || wanted === on) return;
  busy = true;
  const start = (play: Wipe["playSketchWipe"]) => {
    // the visitor changed their mind while the chunk was loading
    if (wanted === on) {
      busy = false;
      return;
    }
    const next = wanted;
    const animated = !isReducedMotion();
    const finished = play({ on: next, origin, animated, update: (sync) => apply(next, sync) });
    const change: SketchChange = { on: next, origin, animated, finished };
    changeListeners.forEach((fn) => fn(change));
    void finished.then(() => {
      busy = false;
      // the update never ran (an error inside the transition): apply the latest request plainly
      if (on !== next) apply(wanted, false);
      // the visitor changed their mind mid-wipe: go to the latest request (from where it started)
      else if (wanted !== on) run(origin);
    });
  };
  if (wipe) start(wipe.playSketchWipe);
  else
    warmSketchWipe().then(
      (mod) => start(mod.playSketchWipe),
      () => start(instantWipe),
    );
}

export function setSketchMode(next: boolean, origin?: SketchOrigin): void {
  if (typeof document === "undefined" || next === wanted) return;
  wanted = next;
  if (busy) {
    // mid-wipe: fast-forward it (while its chunk is still loading, `start` picks up `wanted`)
    wipe?.skipSketchWipe();
    return;
  }
  run(origin ?? defaultOrigin());
}

export function toggleSketchMode(origin?: SketchOrigin): void {
  setSketchMode(!wanted, origin);
}

export function subscribeSketchMode(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Every switch, as it starts (with its origin and a promise for its end). The toggle stamps on it. */
export function onSketchModeChange(fn: (change: SketchChange) => void): () => void {
  changeListeners.add(fn);
  return () => {
    changeListeners.delete(fn);
  };
}

const getServerSnapshot = () => false;

export function useSketchMode(): { on: boolean; toggle: (origin?: SketchOrigin) => void; set: (on: boolean, origin?: SketchOrigin) => void } {
  const value = useSyncExternalStore(subscribeSketchMode, getSketchMode, getServerSnapshot);
  return { on: value, toggle: toggleSketchMode, set: setSketchMode };
}
