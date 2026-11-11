"use client";

import { useEffect, useRef } from "react";
import { featuredProjects } from "@/content";
import { stage, useStage } from "@/lib/stores/stage";

/** Re-align after late layout changes above the section, unless the visitor takes over. */
const SETTLE = [250, 700, 1300];
const TAKEOVER = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * Coming back home from a case study through the page sheet sets `stage.returnFrom` (its slug).
 * Once the sheet has landed the scroll (transition "entering"), and only when the visitor landed
 * on the work section, call `onReturn(index)` so the layout can put that project back in front.
 * It is called again a few times in the next ~1.3s (content above may still settle), until the
 * visitor scrolls, taps or types. The hook that handles it clears returnFrom.
 * `enabled` = this layout is the one on screen.
 */
export function useReturnFrom(enabled: boolean, onReturn: (index: number) => void) {
  const returnFrom = useStage((s) => s.returnFrom);
  const transition = useStage((s) => s.transition);
  const cb = useRef(onReturn);
  const settle = useRef<(() => void) | null>(null);
  useEffect(() => {
    cb.current = onReturn;
  }, [onReturn]);
  useEffect(() => () => settle.current?.(), []);

  useEffect(() => {
    if (!enabled || !returnFrom || transition === "leaving") return;
    stage.set({ returnFrom: null });
    const index = featuredProjects.findIndex((p) => p.id === returnFrom);
    const section = document.getElementById("work");
    if (index < 0 || !section) return;
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.top > vh * 0.6 || r.bottom < vh * 0.4) return;
    cb.current(index);

    settle.current?.();
    const timers = SETTLE.map((ms) => window.setTimeout(() => cb.current(index), ms));
    const off = () => {
      timers.forEach((t) => window.clearTimeout(t));
      TAKEOVER.forEach((e) => window.removeEventListener(e, off));
      if (settle.current === off) settle.current = null;
    };
    TAKEOVER.forEach((e) => window.addEventListener(e, off, { passive: true }));
    timers.push(window.setTimeout(off, SETTLE[SETTLE.length - 1] + 50));
    settle.current = off;
  }, [enabled, returnFrom, transition]);
}
