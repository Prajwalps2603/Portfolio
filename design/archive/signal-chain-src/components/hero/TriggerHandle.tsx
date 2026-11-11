"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useLoopsAllowed } from "@/lib/motion/preferences";
import { scope, stage, wakeScope } from "@/lib/stores/stage";

/** |level| beyond this (in trace amplitudes off the Σ line) and the stack loses lock. */
const LOCK_LIMIT = 0.85;
const RELOCK_MS = 1200;
/** The one-time "this moves" nudge: 1.2s after the lock, a 6px slide off the signal, once per session. */
const NUDGE_DELAY_MS = 1200;
const NUDGE_PX = 6;
const NUDGE_KEY = "pmp:trig-nudged";
const HINT_ID = "trigger-hint";

export type TriggerHandleApi = {
  /** Re-place the handle after a layout change (called by useScopeLayout). */
  place: () => void;
};

/**
 * THE TRIGGER. A bone "T" handle on the Σ lane. Drag it (or use the arrow keys) off the signal
 * and the whole stack loses lock: the top bar flips to AUTO, the four channels roll at their own
 * speeds and noise comes back. Release, and 1.2s later it walks back to the signal and re-locks
 * with the lock ease. A real ARIA slider: Home re-locks at once.
 *
 * Discoverability: at rest a faint dashed level line runs across the Σ lane at the handle's
 * height (it follows the handle), and once per session, 1.2s after the lock, the handle slides
 * 6px off the signal and re-seats with the lock ease while the top bar reads AUTO for 300ms.
 * No nudge with reduced motion or paused Signals.
 */
export const TriggerHandle = forwardRef<TriggerHandleApi, { enabled: boolean }>(function TriggerHandle({ enabled }, ref) {
  const rail = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const relockTimer = useRef(0);
  const nudge = useRef<gsap.core.Timeline | null>(null);
  const loops = useLoopsAllowed();

  const place = useCallback(() => {
    const L = scope.layout;
    const y = L.lanes[4] - scope.signal.trigLvl * L.laneSpacing * 0.3;
    for (const node of [rail.current, line.current]) {
      if (!node) continue;
      node.style.top = "0px";
      node.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    }
  }, []);

  useImperativeHandle(ref, () => ({ place }), [place]);

  /** Stop the nudge where it is and hand the level back (the status follows the real lock). */
  const stopNudge = useCallback(() => {
    if (!nudge.current) return;
    nudge.current.kill();
    nudge.current = null;
    stage.set({ trigger: scope.signal.locked ? "locked" : "auto" });
  }, []);

  const setLevel = useCallback(
    (lvl: number) => {
      const s = scope.signal;
      s.trigLvl = Math.min(5, Math.max(-5, lvl));
      place();
      const node = el.current;
      node?.setAttribute("aria-valuenow", String(Math.round(s.trigLvl * 20)));
      const locked = Math.abs(s.trigLvl) < LOCK_LIMIT;
      wakeScope();
      if (locked === s.locked) return;
      s.locked = locked;
      node?.setAttribute("aria-valuetext", locked ? "Locked" : "Untriggered");
      stage.set({ trigger: locked ? "locked" : "auto" });
      if (!locked) {
        // Each layer free-runs at its own speed: the stack visibly comes apart.
        gsap.to(s.speed, { 0: 0.23, 1: -0.37, 2: 0.19, 3: 0.43, duration: 0.35, ease: EASE.exit, overwrite: true, onUpdate: wakeScope });
        gsap.to(s, { noise: 0.04, duration: 0.3, ease: EASE.probe, overwrite: "auto", onUpdate: wakeScope });
      } else {
        gsap.to(s.speed, { 0: 0, 1: 0, 2: 0, 3: 0, duration: 0.25, ease: EASE.probe, overwrite: true, onUpdate: wakeScope });
        gsap.to(s.roll, {
          0: Math.round(s.roll[0] * 3) / 3,
          1: Math.round(s.roll[1] * 6) / 6,
          2: Math.round(s.roll[2] * 3) / 3,
          3: Math.round(s.roll[3] * 26) / 26,
          duration: 0.55,
          ease: EASE.lock,
          overwrite: true,
          onUpdate: wakeScope,
        });
        gsap.to(s, { noise: 0.006, duration: 0.45, ease: EASE.lock, overwrite: "auto", onUpdate: wakeScope });
      }
    },
    [place],
  );

  const relockLater = useCallback(() => {
    window.clearTimeout(relockTimer.current);
    relockTimer.current = window.setTimeout(() => {
      const o = { v: scope.signal.trigLvl };
      gsap.to(o, { v: 0, duration: 0.6, ease: EASE.lock, onUpdate: () => setLevel(o.v) });
      gsap.to(scope.signal, { trigVis: 0, duration: 0.4, delay: 0.4, ease: EASE.exit, onUpdate: wakeScope });
    }, RELOCK_MS);
  }, [setLevel]);

  useEffect(
    () => () => {
      window.clearTimeout(relockTimer.current);
    },
    [],
  );

  // The one-time nudge. StrictMode-safe: the session flag is written only when it actually plays.
  useEffect(() => {
    if (!enabled || !loops) return;
    try {
      if (sessionStorage.getItem(NUDGE_KEY) === "1") return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => {
      const s = scope.signal;
      const node = rail.current;
      if (!node || dragging.current || s.trigLvl !== 0 || !s.locked || document.hidden) return;
      const b = node.getBoundingClientRect();
      if (b.bottom < 0 || b.top > window.innerHeight) return; // scrolled away: nobody would see it
      try {
        sessionStorage.setItem(NUDGE_KEY, "1");
      } catch {
        /* storage blocked: it may play again next load, which is harmless */
      }
      const off = NUDGE_PX / Math.max(1, scope.layout.laneSpacing * 0.3);
      const o = { v: 0 };
      const apply = () => {
        s.trigLvl = o.v;
        place();
      };
      nudge.current = gsap
        .timeline({
          onComplete: () => {
            nudge.current = null;
          },
        })
        .call(() => stage.set({ trigger: "auto" }), undefined, 0)
        .to(o, { v: off, duration: 0.16, ease: EASE.out, onUpdate: apply }, 0)
        .call(() => stage.set({ trigger: "locked" }), undefined, 0.3)
        .to(o, { v: 0, duration: 0.55, ease: EASE.lock, onUpdate: apply }, 0.3);
    }, NUDGE_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      if (nudge.current) {
        stopNudge();
        scope.signal.trigLvl = 0;
        place();
      }
    };
  }, [enabled, loops, place, stopNudge]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    stopNudge();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    window.clearTimeout(relockTimer.current);
    gsap.to(scope.signal, { trigVis: 1, duration: DUR.hover, ease: EASE.probe, onUpdate: wakeScope });
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const hero = rail.current?.offsetParent as HTMLElement | null;
    if (!hero) return;
    const top = hero.getBoundingClientRect().top;
    const L = scope.layout;
    setLevel((L.lanes[4] - (e.clientY - top)) / (L.laneSpacing * 0.3));
  };
  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    relockLater();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const step = ({ ArrowUp: 0.35, ArrowRight: 0.35, ArrowDown: -0.35, ArrowLeft: -0.35 } as Record<string, number>)[e.key];
    if (step !== undefined) {
      e.preventDefault();
      stopNudge();
      scope.signal.trigVis = 1;
      setLevel(scope.signal.trigLvl + step);
      relockLater();
    } else if (e.key === "Home") {
      e.preventDefault();
      stopNudge();
      window.clearTimeout(relockTimer.current);
      setLevel(0);
      gsap.to(scope.signal, { trigVis: 0, duration: 0.3, ease: EASE.exit, onUpdate: wakeScope });
    }
  };

  return (
    <>
      {/* The level line: a faint dashed rule across the Σ lane at the handle's height, so the
          handle reads as the end of something that moves. Placed with the handle by place().
          It sits under the lane chips (earlier in the DOM, same layer) and never takes input. */}
      <div
        ref={line}
        aria-hidden="true"
        className="pointer-events-none absolute right-[calc(max(2px,calc(var(--margin)-34px))+44px)] left-(--margin) z-(--z-content) h-px"
        style={{ top: "85%" }}
      >
        <span data-boot="" className="block h-px">
          <span className="block h-px bg-[repeating-linear-gradient(90deg,var(--color-bone)_0_6px,transparent_6px_12px)] opacity-20" />
        </span>
      </div>
      {/* The rail is placed on the Σ lane (transform); the handle inside it is what the opening
          fades in, so the two transforms never fight. */}
      <div
        ref={rail}
        className="absolute right-[max(2px,calc(var(--margin)-34px))] z-(--z-raised) -mt-[22px] size-11"
        style={{ top: "85%" }}
      >
        <span id={HINT_ID} className="sr-only">
          Drag or use arrow keys
        </span>
        <div
          ref={el}
          data-boot=""
          role="slider"
          tabIndex={0}
          aria-label="Trigger level. Move it off the signal and the stack loses lock."
          aria-describedby={HINT_ID}
          aria-orientation="vertical"
          aria-valuemin={-100}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-valuetext="Locked"
          data-cursor-label="Drag: trigger level"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className="relative grid size-11 cursor-ns-resize touch-none place-items-center text-bone transition-colors duration-(--dur-hover) ease-panel select-none hover:bg-bezel active:bg-graticule coarse:shadow-[inset_0_0_0_1px_var(--color-graticule-strong)]"
        >
          {/* Engraved TRIG label sitting on the level line; hidden when the trace cannot react
              (reduced motion, Signals paused). It never widens the hit area. */}
          <span
            aria-hidden="true"
            className="type-label pointer-events-none absolute right-full bottom-1/2 mr-1 mb-1 bg-graphite px-1 py-0.5 leading-none text-dim reduced:hidden signals-off:hidden"
          >
            Trig
          </span>
          <svg aria-hidden="true" width="26" height="14" viewBox="0 0 26 14" className="overflow-visible">
            <path d="M0 7 L8 1 L8 13 Z" fill="currentColor" />
            <path d="M12 2.75 H22 M17 2.75 V12" stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none" />
          </svg>
        </div>
      </div>
    </>
  );
});
