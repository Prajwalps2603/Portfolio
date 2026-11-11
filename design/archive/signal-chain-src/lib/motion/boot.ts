"use client";

import { stage } from "@/lib/stores/stage";

/**
 * Boot: the opening plays OVER the real hero DOM (an intro, not a loader).
 *
 * The inline script from bootScript() runs in <head> before first paint and decides:
 *   window.__pmpBoot = "full"  first home load of the browser session
 *                      "short" repeat home load in the same session (timeline at timeScale 2.6)
 *                      "none"  reduced motion, any non-home page, a deep link with a #hash,
 *                              or a hard return from a datasheet
 * For "full" / "short" it adds html.booting, which hides [data-boot] chrome and masks
 * [data-boot-sample] / [data-boot-wipe] text, and arms a 5.2s failsafe that removes it.
 * Without JS the class never exists, so everything is visible.
 *
 * The intro calls finishBoot() when its timeline completes (or is skipped). Everything else
 * waits for stage.intro === "done".
 */

export type BootMode = "full" | "short" | "none";

declare global {
  interface Window {
    __pmpBoot?: BootMode;
  }
}

export { BOOT_FAILSAFE_MS, INTRO_SEEN_KEY, FROM_SHEET_KEY } from "./bootScript";

/** How the opening should play on this document. Safe to call repeatedly (pure read). */
export function bootMode(): BootMode {
  if (typeof window === "undefined") return "none";
  const root = document.documentElement;
  if (!root.classList.contains("booting")) return "none";
  return window.__pmpBoot ?? "none";
}

/** End the boot state: reveal chrome, mark the intro done. Idempotent. */
export function finishBoot() {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("booting");
  root.classList.add("booted");
  window.__pmpBoot = "none";
  stage.set({ intro: "done" });
}

/** Mark the opening as running (the intro calls this when its timeline starts). */
export function startBoot() {
  stage.set({ intro: "playing" });
}
