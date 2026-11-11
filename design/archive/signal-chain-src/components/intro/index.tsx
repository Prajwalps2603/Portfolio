"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { finishBoot, startBoot } from "@/lib/motion/boot";
import { clearSampling } from "@/lib/motion/sampled";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { INTRO_TIMESCALE, useIntroMode } from "@/lib/motion/useIntroMode";
import { lockScope, stage, wakeScope } from "@/lib/stores/stage";
import { buildLockTimeline } from "./timeline";

/** Any of these skips the opening: scroll is released at once and the opening finishes in about 0.3s instead of stopping dead. */
const SKIP_EVENTS = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
const SKIP_TIMESCALE = 9;
/** Phones and portrait tablets: the opening runs at 0.85x its length. */
const PORTRAIT_SPEEDUP = 1 / 0.85;

/**
 * THE LOCK, the opening sequence. It renders nothing: it plays over the real hero DOM.
 *
 * - "full"  first home visit of the session: the ~2.5s timeline (./timeline.ts);
 * - "short" repeat visit: the same timeline at timeScale 2.6 (~1s);
 * - "none"  reduced motion, deep links, returns from a datasheet: one locked frame.
 *
 * While it plays: stage.intro = "playing" (header, scene and sections wait for "done"), scroll
 * is locked through useSmoothScroll().lock and ALWAYS released (complete, skip, unmount).
 * Without JS nothing is hidden (html.booting only exists when the head script ran), and the
 * head script plus the transition provider remove booting after 5.2s whatever happens here.
 */
export function Intro() {
  const mode = useIntroMode();
  const { lock } = useSmoothScroll();
  const lockRef = useRef(lock);
  /** True while this component holds a scroll lock. */
  const holding = useRef(false);
  /** A pending "finish on real unmount" (StrictMode remounts cancel it). */
  const orphan = useRef(0);

  // Lenis is created after the first render, which hands us a new lock(). Re-apply a held lock
  // through it so Lenis stops too (the lock count is shared, so the net count is unchanged).
  useEffect(() => {
    if (lockRef.current === lock) return;
    lockRef.current = lock;
    if (holding.current) {
      lock(true);
      lock(false);
    }
  }, [lock]);

  useEffect(() => {
    window.clearTimeout(orphan.current);
    if (mode === "pending") return;

    if (mode === "none") {
      lockScope();
      stage.set({ trigger: "locked" });
      wakeScope();
      finishBoot();
      return;
    }

    const hero = document.getElementById("source");
    const name = hero?.querySelector<HTMLElement>("[data-boot-sample]");
    if (!hero || !name) {
      lockScope();
      finishBoot();
      return;
    }
    const role = hero.querySelector<HTMLElement>("[data-boot-wipe]");
    const all = Array.from(document.querySelectorAll<HTMLElement>("[data-boot]"));
    const status = all.filter((el) => el.hasAttribute("data-trig-indicator"));
    const chrome = all.filter((el) => !el.hasAttribute("data-trig-indicator"));

    const release = () => {
      if (!holding.current) return;
      holding.current = false;
      lockRef.current(false);
    };
    holding.current = true;
    lockRef.current(true);
    startBoot();

    let done = false;
    let cleanupSkip: () => void = () => {};
    const ctx = gsap.context(() => {
      const tl = buildLockTimeline({ name, role, chrome, status });
      const portrait = window.matchMedia("(max-width: 860px)").matches;
      tl.timeScale(INTRO_TIMESCALE[mode] * (portrait ? PORTRAIT_SPEEDUP : 1));
      tl.eventCallback("onComplete", () => {
        done = true;
        off();
        release();
        lockScope();
        finishBoot();
        // booting is gone: the mask rule no longer applies, so drop the solid hold.
        clearSampling(name);
        wakeScope();
      });

      // The first gesture hands the page back BEFORE the opening speeds up: the lock is
      // released inside this capture-phase listener, so Lenis (bubble phase) and the browser's
      // default action see the same wheel / touch / key and scroll on it. The remaining ~0.3s
      // of the opening finishes over a page that is already moving.
      const skip = () => {
        off();
        release();
        if (tl.progress() < 1) tl.timeScale(SKIP_TIMESCALE);
      };
      const off = () => SKIP_EVENTS.forEach((ev) => window.removeEventListener(ev, skip, { capture: true }));
      SKIP_EVENTS.forEach((ev) => window.addEventListener(ev, skip, { passive: true, capture: true }));
      cleanupSkip = off;
    });

    return () => {
      cleanupSkip();
      ctx.revert();
      clearSampling(name);
      name.style.opacity = ""; // the dimmed coarse sampling steps (timeline.ts)
      release();
      if (!done) {
        // StrictMode re-runs this effect synchronously and cancels the timer; a real unmount
        // mid-opening (navigating away) must not leave the next page booting.
        orphan.current = window.setTimeout(() => {
          lockScope();
          finishBoot();
        }, 0);
      }
    };
  }, [mode]);

  return null;
}
