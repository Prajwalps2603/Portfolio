"use client";

/**
 * LITE MODE: smoother on older computers. On a weak graphics card (his GeForce GT 610 lagged) the
 * site keeps everything that is content and drops what costs the GPU every frame: the JS smooth
 * scroll (native scrolling runs on the compositor and stays smooth when the page is busy), the
 * custom cursor (redrawn on every mouse move, with a blend), the paper-grid lens canvas.
 * Animations, the vault, the newspaper all stay.
 *
 * Decided before the first paint (the boot script, src/lib/motion/bootScript.ts: the WebGL renderer
 * name against known weak or software GPUs, once, remembered in localStorage "pmp:lite"); a frame
 * watch (watchFrames) turns it on for any other machine that cannot hold ~40 fps while scrolling;
 * the palette can switch it either way. html.lite is the flag.
 */
import { useSyncExternalStore } from "react";

export const LITE_KEY = "pmp:lite";
const listeners = new Set<() => void>();

export const isLite = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("lite");

export function setLite(on: boolean, remember = true) {
  document.documentElement.classList.toggle("lite", on);
  if (remember) {
    try {
      localStorage.setItem(LITE_KEY, on ? "1" : "0");
    } catch {}
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export function useLite(): boolean {
  return useSyncExternalStore(subscribe, isLite, () => false);
}

/**
 * The safety net: while the visitor scrolls (not during the opening), sample the frame times; if
 * the middle frame of ~1.5s of scrolling is slower than 25ms (under 40 fps), switch to lite. Runs
 * once per visit, only when not lite already and not decided by the visitor.
 */
export function watchFrames(): () => void {
  if (isLite()) return () => {};
  let decided: string | null = null;
  try {
    decided = localStorage.getItem(`${LITE_KEY}:by-hand`);
  } catch {}
  if (decided) return () => {};
  const frames: number[] = [];
  let last = 0;
  let raf = 0;
  let scrollingUntil = 0;
  let stopped = false;
  const start = performance.now();
  const tick = (t: number) => {
    if (stopped) return;
    if (last && t < scrollingUntil && t - start > 4000) frames.push(t - last);
    last = t;
    if (frames.length >= 90) {
      const sorted = [...frames].sort((a, b) => a - b);
      const mid = sorted[Math.floor(sorted.length / 2)];
      stop();
      if (mid > 25) setLite(true);
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  const onScroll = () => {
    scrollingUntil = performance.now() + 250;
  };
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("wheel", onScroll);
    window.removeEventListener("scroll", onScroll);
  };
  window.addEventListener("wheel", onScroll, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  raf = requestAnimationFrame(tick);
  // give up after two minutes without enough scrolling
  const giveUp = window.setTimeout(stop, 120_000);
  return () => {
    window.clearTimeout(giveUp);
    stop();
  };
}
