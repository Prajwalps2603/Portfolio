"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type RefObject } from "react";

/**
 * PLAY GATE: the one rule for every loop on the site (packet journeys, project cycles, idle
 * breathing, canvas engines). A loop runs only while its element is on screen AND the tab is
 * visible; when either stops being true it PAUSES where it is and later resumes from that same
 * position (pause / resume, never restart). Extra holds (hover, a pinned part, the visible pause
 * control) are the caller's business: AND them with the gate.
 *
 * Dependency-free and tiny (no GSAP, no React needed for the imperative half), so any engine can
 * use it. One `visibilitychange` listener serves the whole page.
 *
 *   // imperative (GSAP timelines, canvases, engines)
 *   const stop = gatePlay(el, (live) => (live ? tl.resume() : tl.pause()), { threshold: 0.2 });
 *   stop(); // on teardown
 *
 *   // React
 *   const live = usePlayGate(ref, { threshold: 0.2 });   // on screen && tab visible
 *   const seen = useSeen(ref, live, { ready, threshold: 0.2 }); // latched: start a one-off moment
 *   const visible = useTabVisible();                      // just the tab
 *
 * `useSeen` is for one-off moments (a sketch drawing itself) rather than loops: it turns true in
 * the first layout where the element is in sight (a synchronous check, so a window turning in
 * starts at once instead of a frame later when the observer reports) or when the gate first
 * opens, and then stays true, so a gate flickering later never interrupts the moment.
 *
 * `threshold` is honoured as a minimum visible ratio (IntersectionObserver's own `isIntersecting`
 * is true from the first visible pixel); an element taller than the viewport counts as on screen
 * once it fills half of it.
 */

export type GateOptions = {
  /** Minimum visible ratio of the element (0 = any pixel). Default 0. */
  threshold?: number;
  /** IntersectionObserver rootMargin. Default "0px". */
  rootMargin?: string;
};

// ---- the tab -----------------------------------------------------------------------------------

const tabListeners = new Set<() => void>();
const onVisibility = () => tabListeners.forEach((fn) => fn());

/** Subscribe to tab visibility changes (one shared document listener). Returns the unsubscribe. */
export function subscribeTab(fn: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  if (!tabListeners.size) document.addEventListener("visibilitychange", onVisibility);
  tabListeners.add(fn);
  return () => {
    tabListeners.delete(fn);
    if (!tabListeners.size) document.removeEventListener("visibilitychange", onVisibility);
  };
}

/** True while the tab is hidden (backgrounded, minimised, another tab in front). */
export function isTabHidden(): boolean {
  return typeof document !== "undefined" && document.hidden;
}

const tabVisible = () => !isTabHidden();
const tabVisibleOnServer = () => true;

/** React: is the tab visible? */
export function useTabVisible(): boolean {
  return useSyncExternalStore(subscribeTab, tabVisible, tabVisibleOnServer);
}

// ---- the element + the tab -----------------------------------------------------------------------

/**
 * Call `onChange(live)` whenever "on screen and the tab is visible" changes (and once when first
 * known). Returns the teardown. Without IntersectionObserver the element counts as on screen.
 */
export function gatePlay(el: Element, onChange: (live: boolean) => void, { threshold = 0, rootMargin = "0px" }: GateOptions = {}): () => void {
  let onScreen = typeof IntersectionObserver === "undefined";
  let last: boolean | null = null;
  const emit = () => {
    const live = onScreen && !isTabHidden();
    if (live === last) return;
    last = live;
    onChange(live);
  };
  let io: IntersectionObserver | null = null;
  if (!onScreen) {
    const min = Math.max(0, Math.min(1, threshold));
    io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        const fills = !!e.rootBounds && e.intersectionRect.height >= e.rootBounds.height * 0.5;
        onScreen = e.isIntersecting && (min === 0 || e.intersectionRatio >= min - 0.001 || fills);
        emit();
      },
      { rootMargin, threshold: min > 0 ? [0, min / 2, min, Math.min(1, min + 0.1)] : 0 },
    );
    io.observe(el);
  } else {
    emit();
  }
  const offTab = subscribeTab(emit);
  return () => {
    io?.disconnect();
    offTab();
  };
}

/** React: true while the element is on screen and the tab is visible. Server / first render: false. */
export function usePlayGate(ref: RefObject<Element | null>, { threshold = 0, rootMargin = "0px" }: GateOptions = {}): boolean {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return gatePlay(el, setLive, { threshold, rootMargin });
  }, [ref, threshold, rootMargin]);
  return live;
}

/**
 * Synchronous: at least `min` of the element's height (or of the viewport, when the element is
 * taller) is in the viewport of a visible tab. Width only has to overlap (a window turning in on
 * its vertical axis is edge-on at first). For decision points that must not wait for an observer.
 */
export function inSight(el: Element, min = 0): boolean {
  if (isTabHidden()) return false;
  const r = el.getBoundingClientRect();
  if (r.right < 0 || r.left > window.innerWidth) return false;
  const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  return visible > 0 && visible >= Math.min(r.height, window.innerHeight) * min;
}

/**
 * React: latched "has been seen" for one-off moments. True from the first layout (once `ready`)
 * in which the element is in sight, or the first time `live` (from usePlayGate) is true; then it
 * stays true for the component's life.
 */
export function useSeen(ref: RefObject<Element | null>, live: boolean, { ready = true, threshold = 0 }: { ready?: boolean; threshold?: number } = {}): boolean {
  const [seen, setSeen] = useState(false);
  useLayoutEffect(() => {
    if (seen || !ready) return;
    const el = ref.current;
    if (live || (el && inSight(el, threshold))) setSeen(true);
  }, [seen, live, ready, ref, threshold]);
  return seen;
}
