"use client";

import { useEffect, useState } from "react";

/**
 * "Load it later" helpers, for code that must not ride on the first load (docs/DESIGN.md §13).
 *
 *   onIdle(() => void import("./Heavy"));          // when the main thread is free (cancellable)
 *   const ready = useIdle(enabled);                // React: true once idle (and enabled)
 *
 * For "near the viewport" use useInView(ref, { rootMargin: "800px 0px", once: true }) from
 * @/lib/hooks/useInView; for "on first use" call the import() in the handler (and warm it on
 * pointerenter / focus / pointerdown so the chunk is there before the click lands).
 */

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Run `fn` when the browser is idle (at the latest after `timeout` ms). Returns a cancel function. */
export function onIdle(fn: () => void, timeout = 2500): () => void {
  if (typeof window === "undefined") return () => {};
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(fn, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  // Safari: no requestIdleCallback; after load + a beat is a fair stand-in.
  const id = window.setTimeout(fn, Math.min(timeout, 1200));
  return () => window.clearTimeout(id);
}

/** True once the browser has been idle after mount (never on the server). Stays true. */
export function useIdle(enabled = true, timeout = 2500): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!enabled || idle) return;
    return onIdle(() => setIdle(true), timeout);
  }, [enabled, idle, timeout]);
  return idle;
}
