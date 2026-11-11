"use client";

import { stage } from "@/lib/stores/stage";

/**
 * Boot: the opening plays OVER the real hero DOM (an intro, not a loader).
 *
 * The inline script from bootScript() runs in <head> before first paint and decides:
 *   window.__pmpBoot = "full"  first home load of the tab session
 *                      "short" repeat home load in the same session (same timeline, faster)
 *                      "none"  reduced motion, any non-home page, a deep link with a #hash,
 *                              or a hard return from a case study
 * For "full" / "short" it adds html.booting, which hides every [data-boot] element (CSS in
 * globals.css), and arms a 4.2s failsafe that removes it. Without JS the class never exists,
 * so everything is visible.
 *
 * The Intro calls startBoot() when its timeline starts and finishBoot() when it completes or is
 * skipped. Everything else waits for stage.intro === "done" (useStage((s) => s.intro)).
 */

export type BootMode = "full" | "short" | "none";

declare global {
  interface Window {
    __pmpBoot?: BootMode;
    /** The boot failsafe timer (armed by the inline script, re-armed by startBoot). */
    __pmpBootT?: number;
  }
}

import { BOOT_FAILSAFE_MS } from "./bootScript";

export { BOOT_FAILSAFE_MS, INTRO_SEEN_KEY, FROM_CASE_KEY } from "./bootScript";

/** How the opening should play on this document. Safe to call repeatedly (pure read). */
export function bootMode(): BootMode {
  if (typeof window === "undefined") return "none";
  if (!document.documentElement.classList.contains("booting")) return "none";
  return window.__pmpBoot ?? "none";
}

/** End the boot state: reveal [data-boot] elements, mark the intro done. Idempotent. */
export function finishBoot() {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("booting");
  root.classList.add("booted");
  window.__pmpBoot = "none";
  stage.set({ intro: "done" });
}

/**
 * Mark the opening as running (the Intro calls this when its timeline starts). JavaScript is
 * clearly alive now, so the head script's failsafe (counted from the first byte) is re-armed from
 * here: on a slow device hydration can eat most of it, and it would otherwise reveal the hero
 * halfway through its own opening. It still fires if the opening never finishes.
 */
export function startBoot() {
  stage.set({ intro: "playing" });
  if (typeof window === "undefined") return;
  if (window.__pmpBootT) window.clearTimeout(window.__pmpBootT);
  window.__pmpBootT = window.setTimeout(() => {
    if (document.documentElement.classList.contains("booting")) finishBoot();
  }, BOOT_FAILSAFE_MS);
}
