"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useReducedMotion } from "@/lib/motion/media";
import {
  onSketchModeChange,
  useSketchMode,
  warmSketchWipe,
} from "@/lib/stores/sketchMode";
import { useStage } from "@/lib/stores/stage";

/** How long the tap feedback ("sketch mode on") stays up on touch screens. */
const FLASH_MS = 1600;
/** sessionStorage: the pencil already did its one "I'm here" scribble this session. */
const HINT_KEY = "pmp:sketch-hint";
/** The scribble: this long after the opening, for this long (two 620ms wiggles). */
const HINT_DELAY_MS = 1400;
const HINT_MS = 1300;

/**
 * The authored pencil (24 grid, 1.5px round strokes): drawn level, then turned -45deg so the tip
 * writes down-left. The squiggle under the tip draws itself on hover / focus and stays drawn
 * while sketch mode is on.
 */
function PencilMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="sk-toggle-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="sk-toggle-pencil">
        <g transform="rotate(-45 12 12)">
          <path d="M8.2 9.3H18.4M8.2 14.7H18.4M8.2 9.3V14.7M8.2 9.3 3.1 12l5.1 2.7" />
          <path d="M18.4 9.3h1.4a2.7 2.7 0 0 1 0 5.4h-1.4zM18.4 9.3v5.4" />
          <path d="M3.1 12 5 11v2z" fill="currentColor" />
        </g>
      </g>
      <path
        className="sk-toggle-squiggle"
        pathLength={1}
        d="M4 21.1c1.4-1.1 2.5.5 3.8-.4 1.3-.8 2.4-1 3.6.1 1 .8 1.9.5 2.8-.2"
      />
    </svg>
  );
}

/**
 * SKETCH MODE toggle (header, every page, phones included): one switch that turns the whole site
 * back into its sketch. 44px, aria-pressed, accessible name "Sketch mode". A short Caveat tip
 * names it on hover / keyboard focus (and confirms a tap on touch screens). The wipe starts here.
 * (No SHIPPED stamp lands under it any more when the site ships back: since 2026-11-10 the stamp
 * lives on the port's ship only, his ask.)
 */
export function SketchToggle({ className }: { className?: string }) {
  const { on, toggle } = useSketchMode();
  const btnRef = useRef<HTMLButtonElement>(null);
  const lastPointer = useRef<string>("mouse");
  const [flash, setFlash] = useState(false);
  const [said, setSaid] = useState("");
  const [hint, setHint] = useState(false);
  // The tip has done its job once the switch happens: it stays down (even under a resting pointer
  // or a kept keyboard focus) until the next hover or focus. The touch confirmation still shows.
  const [tipMuted, setTipMuted] = useState(false);
  const intro = useStage((s) => s.intro);
  const reduced = useReducedMotion();

  // Once per session, after the opening: the pencil scribbles twice, so the feature gets found.
  // (The flag is written when it actually plays, so StrictMode's double effect cannot eat it.)
  useEffect(() => {
    if (intro !== "done" || reduced || on) return;
    try {
      if (sessionStorage.getItem(HINT_KEY) === "1") return;
    } catch {
      return;
    }
    const start = window.setTimeout(() => {
      try {
        sessionStorage.setItem(HINT_KEY, "1");
      } catch {
        // storage unavailable: the hint may play again on the next load, harmless
      }
      setHint(true);
    }, HINT_DELAY_MS);
    return () => window.clearTimeout(start);
  }, [intro, reduced, on]);
  useEffect(() => {
    if (!hint) return;
    const stop = window.setTimeout(() => setHint(false), HINT_MS);
    return () => window.clearTimeout(stop);
  }, [hint]);

  useEffect(() => {
    let flashTimer = 0;
    const off = onSketchModeChange(({ on: next }) => {
      setSaid(
        next
          ? "Sketch mode on: the site is shown as its sketch."
          : "Sketch mode off: back to the shipped site.",
      );
      setTipMuted(true);
      if (lastPointer.current === "touch" && next) {
        setFlash(true);
        window.clearTimeout(flashTimer);
        flashTimer = window.setTimeout(() => setFlash(false), FLASH_MS);
      } else setFlash(false);
      lastPointer.current = "mouse";
    });
    return () => {
      off();
      window.clearTimeout(flashTimer);
    };
  }, []);

  // The wipe is its own chunk (src/lib/stores/sketchMode.ts): fetch it on intent, before the click.
  const warm = () => void warmSketchWipe().catch(() => {});
  // A new hover or a new focus brings the tip back (a press focuses first, then switches: muted).
  const onIntent = () => {
    setTipMuted(false);
    warm();
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    lastPointer.current = e.pointerType;
    warm();
  };

  const onClick = () => {
    const r = btnRef.current?.getBoundingClientRect();
    toggle(
      r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined,
    );
  };

  return (
    // JS-only feature: without JS (no html.js) there is no dead control.
    <span
      data-qa="sketch-toggle-wrap"
      className={`sk-toggle-wrap relative inline-flex shrink-0 [html:not(.js)_&]:hidden${className ? ` ${className}` : ""}`}
      data-flash={flash || undefined}
      data-tip-muted={tipMuted || undefined}
    >
      <button
        ref={btnRef}
        type="button"
        data-qa="sketch-toggle"
        data-hint={hint || undefined}
        aria-pressed={on}
        aria-label="Sketch mode"
        onPointerEnter={onIntent}
        onFocus={onIntent}
        onPointerDown={onPointerDown}
        onClick={onClick}
        className="sk-toggle"
      >
        <PencilMark />
      </button>
      <span aria-hidden="true" data-qa="sketch-toggle-tip" className="sk-tip">
        {on ? (flash ? "sketch mode on" : "back to ship") : "sketch mode"}
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {said}
      </span>
    </span>
  );
}
