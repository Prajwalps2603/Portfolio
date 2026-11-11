"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { routes } from "@/lib/routes";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useFinePointer, usePhone, useReducedMotion } from "@/lib/motion/media";
import { useInView } from "@/lib/hooks/useInView";
import { TransitionLink } from "@/components/transition";
import { Highlight, IconButton } from "@/components/ui";
import { ArrowUpRight, Pause, Play } from "@/components/icons";
import { SketchArrow, StickyNote, roughCircle } from "@/components/sketch";
import { MiniUI, type MiniUIState } from "@/components/miniui";
import { useOpeningPhase } from "@/components/intro/opening";
import { CYCLE, NOTE_LINES, SHIPPED_STEP } from "./data";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { DraggableNote, WIRE } from "./DraggableNote";
import { StageChips } from "./StageChips";
import { XrayToggle } from "./XrayToggle";

/**
 * THE STAGE (01 Hero, right column): an app window that plays his real projects, each going from
 * its sketch to its UI (draw ~0.9s, compile ~0.6s, SHIPPED stamp, hold), wired to the "Things I
 * build" sticky note by a dashed, hand-drawn connector. Below it, the build stages as chips and
 * two controls: the x-ray (the eye: the keyboard / touch twin of the lens) and pause.
 *
 * - Hover (fine pointer, full motion): a hand-circled lens shows the SKETCH under the shipped UI
 *   (a sketch MiniUI clipped to a circle that follows the pointer).
 * - Click / Enter: the project's case study (page sheet).
 * - The cycle waits for the opening, and pauses on hover, on focus, offscreen, in a hidden tab,
 *   with the pause control and with Motion off (then it is a static, shipped ResumAI).
 */

/** Hold after the stamp lands. Build (~2.1s) + hold = the ~6s cycle. */
const HOLD_MS = 4000;
/** After a pause, never advance sooner than this. */
const RESUME_MS = 1600;
/** When the drawn sketch compiles (s after the new project appears; MiniUI draws in 0.9s). */
const SHIP_AT = 1.05;
/** Chips walk ui -> api -> data -> deploy while it compiles. */
const STEP_GAP = 0.15;
/** If MiniUI never reports onShipped, finish the chips anyway. */
const SHIPPED_FALLBACK = 2.4;
/** Lens radius (px): the ~140px circle. */
const LENS_R = 70;
const RIM_PAD = 6;
const RIM_SIZE = (LENS_R + RIM_PAD) * 2;
const RIM_PATH = roughCircle(LENS_R + RIM_PAD, LENS_R + RIM_PAD, LENS_R, { seed: "hero-lens", roughness: 0.8 });

type StageState = {
  /** CYCLE index on show. */
  index: number;
  /** What the window shows. */
  view: MiniUIState;
  /** Build stage, 0 (idea) .. SHIPPED_STEP. */
  step: number;
  /** The previous, shipped window while it wipes away (null when settled). */
  outgoing: number | null;
  /** The sketch toggle ("x-ray"): the window shows the idea until it is shipped again. */
  xray: boolean;
  /** Bumps whenever a sketch must draw itself on: a new project, or the sketch toggle. */
  draw: number;
  /** Bumps on every sketch -> ship. */
  compile: number;
  /** Bumps on every completed ship (the stamp landed). */
  shipped: number;
};

type Action =
  | { type: "opening-shipping" }
  | { type: "ship" }
  | { type: "shipped" }
  | { type: "step"; step: number }
  | { type: "advance" }
  | { type: "settled" }
  | { type: "xray"; on: boolean };

const INITIAL: StageState = { index: 0, view: "ship", step: SHIPPED_STEP, outgoing: null, xray: false, draw: 0, compile: 0, shipped: 0 };

function reducer(s: StageState, a: Action): StageState {
  switch (a.type) {
    case "opening-shipping":
      // The opening showed this window as a sketch (an override, see HeroStage) and now ships it.
      return { ...s, view: "ship", step: 2, compile: s.compile + 1 };
    case "ship":
      if (s.view === "ship" || s.xray) return s;
      return { ...s, view: "ship", step: Math.max(s.step, 2), compile: s.compile + 1 };
    case "shipped":
      if (s.view !== "ship" || s.step === SHIPPED_STEP) return s;
      return { ...s, step: SHIPPED_STEP, shipped: s.shipped + 1 };
    case "step":
      if (a.step <= s.step || s.step === SHIPPED_STEP) return s;
      return { ...s, step: a.step };
    case "advance":
      if (s.xray || s.view !== "ship" || CYCLE.length < 2) return s;
      return { ...s, index: (s.index + 1) % CYCLE.length, view: "sketch", step: 0, outgoing: s.index, draw: s.draw + 1 };
    case "settled":
      return s.outgoing === null ? s : { ...s, outgoing: null };
    case "xray":
      if (a.on === s.xray) return s;
      if (a.on) return { ...s, xray: true, view: "sketch", step: 1, draw: s.draw + 1 };
      return { ...s, xray: false, view: "ship", step: 2, compile: s.compile + 1 };
  }
}

type LensApi = { jump: (x: number, y: number) => void; move: (x: number, y: number) => void; open: (on: boolean) => void };

export function HeroStage() {
  const phase = useOpeningPhase();
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const phone = usePhone();
  const [s, dispatch] = useReducer(reducer, INITIAL);
  const { on: sketchSite } = useSketchMode();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const windowRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<SVGSVGElement>(null);
  const lensApi = useRef<LensApi | null>(null);
  /** Last pointer position over the window (local px), so a lens that turns on under a resting pointer opens there. */
  const lastPointer = useRef<[number, number] | null>(null);
  const reducedRef = useRef(reduced);
  const inView = useInView(windowRef, { threshold: 0.25 });

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  // The opening shows the first window as its sketch (derived, so it renders in the same commit
  // as the phase change and draws in step with the opening), then ships it: walk the chips.
  const openingSketch = phase === "sketch";
  const prevPhase = useRef(phase);
  useEffect(() => {
    if (prevPhase.current === "sketch" && phase !== "sketch") dispatch({ type: "opening-shipping" });
    prevPhase.current = phase;
  }, [phase]);

  // Sketch mode (the whole site as its sketch) shows the window as the idea, like the x-ray; turning
  // it off compiles it again with the stamp. The reducer ignores no-ops, so mount is harmless.
  useEffect(() => {
    dispatch({ type: "xray", on: sketchSite });
  }, [sketchSite]);

  useEffect(() => {
    const sync = () => setTabHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // A new sketch (new project, or the sketch toggle): MiniUI draws it itself (0.9s, pen order)
  // while the previous shipped window wipes away to the right on top of it. Then it compiles
  // (the reducer ignores the ship while the sketch toggle is on).
  useEffect(() => {
    if (s.draw === 0) return;
    const out = outRef.current;
    if (reducedRef.current) {
      if (out) dispatch({ type: "settled" });
      return;
    }
    const anims: gsap.core.Animation[] = [];
    if (out) {
      const w = out.offsetWidth;
      anims.push(
        gsap.fromTo(
          out,
          { clipPath: "inset(-40px -40px -72px 0px)" },
          { clipPath: `inset(-40px -40px -72px ${w + 40}px)`, duration: DUR.swipe, ease: EASE.pen, onComplete: () => dispatch({ type: "settled" }) },
        ),
      );
    }
    const tl = gsap.timeline();
    tl.call(() => dispatch({ type: "step", step: 1 }), [], 0.22);
    tl.call(() => dispatch({ type: "ship" }), [], SHIP_AT);
    anims.push(tl);
    return () => {
      anims.forEach((a) => a.kill());
      if (out) gsap.set(out, { clearProps: "clipPath" });
    };
  }, [s.draw]);

  // While it compiles, the chips walk ui -> api -> data -> deploy; "shipped" comes with the stamp.
  useEffect(() => {
    if (s.compile === 0) return;
    const tl = gsap.timeline();
    [3, 4, 5].forEach((step, i) => tl.call(() => dispatch({ type: "step", step }), [], STEP_GAP * (i + 1)));
    tl.call(() => dispatch({ type: "shipped" }), [], SHIPPED_FALLBACK);
    return () => {
      tl.kill();
    };
  }, [s.compile]);

  // The hold: advance after HOLD_MS of shipped, counting only the time the cycle may run.
  const cycling = !reduced && phase === "done" && CYCLE.length > 1;
  const canAdvance = cycling && inView && !tabHidden && !hovered && !focused && !paused && !s.xray;
  const hold = useRef({ shipped: -1, left: HOLD_MS });
  useEffect(() => {
    if (!canAdvance || s.view !== "ship" || s.step !== SHIPPED_STEP) return;
    if (hold.current.shipped !== s.shipped) hold.current = { shipped: s.shipped, left: HOLD_MS };
    const started = performance.now();
    const t = window.setTimeout(() => dispatch({ type: "advance" }), hold.current.left);
    return () => {
      window.clearTimeout(t);
      hold.current.left = Math.max(RESUME_MS, hold.current.left - (performance.now() - started));
    };
  }, [canAdvance, s.view, s.step, s.shipped]);

  // ---- the lens ------------------------------------------------------------------------------
  const lensEnabled = fine && !reduced && !phone && phase === "done";
  const lensActive = lensEnabled && hovered && s.view === "ship" && s.outgoing === null && !s.xray;

  useEffect(() => {
    if (!lensEnabled) return;
    const lens = lensRef.current;
    const rim = rimRef.current;
    if (!lens || !rim) return;
    const [x0, y0] = lastPointer.current ?? [lens.offsetWidth / 2, lens.offsetHeight / 2];
    const p = { x: x0, y: y0, r: 0 };
    const render = () => {
      lens.style.clipPath = `circle(${p.r.toFixed(1)}px at ${p.x.toFixed(1)}px ${p.y.toFixed(1)}px)`;
      rim.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${(p.r / LENS_R).toFixed(3)})`;
      rim.style.opacity = p.r > 1 ? "1" : "0";
    };
    const xTo = gsap.quickTo(p, "x", { duration: 0.5, ease: EASE.arrive, onUpdate: render });
    const yTo = gsap.quickTo(p, "y", { duration: 0.5, ease: EASE.arrive, onUpdate: render });
    xTo(x0, x0);
    yTo(y0, y0);
    let radius: gsap.core.Tween | null = null;
    lensApi.current = {
      jump(x, y) {
        p.x = x;
        p.y = y;
        xTo(x, x);
        yTo(y, y);
        render();
      },
      move(x, y) {
        xTo(x);
        yTo(y);
      },
      open(on) {
        radius?.kill();
        radius = gsap.to(p, { r: on ? LENS_R : 0, duration: on ? DUR.ui : DUR.exit, ease: on ? EASE.arrive : EASE.exit, onUpdate: render });
      },
    };
    render();
    return () => {
      radius?.kill();
      gsap.killTweensOf(p);
      lensApi.current = null;
    };
  }, [lensEnabled]);

  useEffect(() => {
    lensApi.current?.open(lensActive);
  }, [lensActive, lensEnabled]);

  const local = (e: ReactPointerEvent<HTMLElement>) => {
    const r = windowRef.current?.getBoundingClientRect();
    return r ? ([e.clientX - r.left, e.clientY - r.top] as const) : ([0, 0] as const);
  };
  const onPointerEnter = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    const at = local(e);
    lastPointer.current = [at[0], at[1]];
    lensApi.current?.jump(...at);
    setHovered(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    const at = local(e);
    lastPointer.current = [at[0], at[1]];
    if (!hovered) setHovered(true);
    lensApi.current?.move(...at);
  };
  const onPointerLeave = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    setHovered(false);
  };

  const onShipped = useCallback(() => dispatch({ type: "shipped" }), []);
  const project = CYCLE[s.index];
  if (!project) return null;
  const view: MiniUIState = openingSketch ? "sketch" : s.view;
  const step = openingSketch ? 1 : s.step;
  const size = phone ? "sm" : "md";
  const layers = s.outgoing !== null ? [s.index, s.outgoing] : [s.index];

  return (
    <div
      className="relative grid gap-y-5 [--note-w:13.5rem] [--note-x:-2.25rem] [--win-top:11.5rem] sm:grid-cols-[12.5rem_minmax(0,1fr)] sm:items-center sm:gap-x-16 md:block md:pt-(--win-top) lg:[--note-w:14.25rem] lg:[--win-top:12rem]"
      data-hero="stage"
      data-cycle={canAdvance ? "running" : "held"}
    >
      {/* The idea: what he builds, on a sticky note, wired into the software (no wire on phones).
          The cell only positions; the note and the wire are revealed separately by the opening. */}
      <DraggableNote
        enabled={phase === "done"}
        anchor={windowRef}
        className="relative z-(--z-raised) w-[min(14.5rem,80%)] justify-self-start sm:w-full md:absolute md:top-0 md:left-(--note-x) md:w-(--note-w)"
        wire={
          <div
            data-hero="connector"
            data-boot=""
            aria-hidden="true"
            className="pointer-events-none absolute hidden sm:block sm:top-[calc(50%-2.5rem)] sm:left-[calc(100%-1.5rem)] sm:h-16 sm:w-[5.75rem] md:top-[2.75rem] md:left-[calc(100%-1.25rem)] md:h-[calc(var(--win-top)-2.75rem+0.4rem)] md:w-[clamp(6.5rem,11vw,9.5rem)]"
          >
            <SketchArrow seed={WIRE.seed} from={WIRE.from} to={WIRE.to} units="fraction" bend={WIRE.bend} dashed tone="ink" head={WIRE.head} strokeWidth={1.8} />
          </div>
        }
      >
        <div data-hero="note" data-boot="">
          <StickyNote color="paper" tilt={-3} pin="lime" className="px-5 pt-4 pb-5">
            <p className="type-hand text-ink">Things I build:</p>
            <ul className="mt-1.5 space-y-1">
              {NOTE_LINES.map((l) => (
                <li key={l.capability} className="type-hand leading-[1.12] text-ink">
                  <Highlight color={l.color} trigger="static" className="block [--hl-h:1.04em] [--hl-y:56%]">
                    <span aria-hidden="true">· </span>
                    {l.text}
                  </Highlight>
                </li>
              ))}
            </ul>
          </StickyNote>
        </div>
      </DraggableNote>

      <figure className="relative min-w-0">
        <div
          ref={windowRef}
          data-hero="window"
          data-boot=""
          className="relative isolate"
          onPointerEnter={onPointerEnter}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <div aria-hidden="true" inert>
            {layers.map((i) => {
              const p = CYCLE[i];
              const out = i === s.outgoing;
              return (
                <div key={p.id} ref={out ? outRef : undefined} className={out ? "absolute inset-0 isolate" : "relative isolate"}>
                  <MiniUI projectId={p.id} state={out ? "ship" : view} onShipped={out ? undefined : onShipped} size={size} />
                </div>
              );
            })}
            {lensEnabled ? (
              <>
                <div ref={lensRef} className="absolute inset-0 isolate rounded-card bg-paper paper-dots" style={{ clipPath: "circle(0px at 50% 50%)" }}>
                  <MiniUI projectId={project.id} state="sketch" stamp={false} size={size} />
                </div>
                <svg
                  ref={rimRef}
                  width={RIM_SIZE}
                  height={RIM_SIZE}
                  viewBox={`0 0 ${RIM_SIZE} ${RIM_SIZE}`}
                  className="pointer-events-none absolute overflow-visible text-ink/80 opacity-0"
                  style={{ left: -RIM_SIZE / 2, top: -RIM_SIZE / 2 }}
                >
                  <path d={RIM_PATH} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            ) : null}
          </div>
          <TransitionLink
            href={routes.work(project.id)}
            label={project.shortTitle}
            aria-label={`Open the ${project.shortTitle} case study`}
            data-cursor={lensEnabled ? "native" : undefined}
            className="group absolute inset-0 rounded-card"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            <span
              aria-hidden="true"
              className="absolute top-[18px] right-[26px] grid size-7 place-items-center rounded-full border border-line-strong bg-card text-ink transition-colors duration-(--dur-feedback) ease-arrive group-hover:border-ink group-hover:bg-ink group-hover:text-paper group-focus-visible:border-ink group-focus-visible:bg-ink group-focus-visible:text-paper"
            >
              <ArrowUpRight className="size-3.5" />
            </span>
          </TransitionLink>
        </div>

        <figcaption className="sr-only">
          Previews of projects I built, each drawn as a sketch and then shipped: {CYCLE.map((p) => p.shortTitle).join(", ")}.
        </figcaption>
      </figure>

      <div className="@container flex items-center gap-3 sm:col-span-2 md:mt-4">
        <StageChips step={step} />
        {/* JS-only features: without JS (no html.js) there are no dead controls. */}
        <div data-hero="controls" data-boot="" className="hidden shrink-0 items-center gap-2 [.js_&]:flex">
          <XrayToggle pressed={s.xray} disabled={sketchSite} onToggle={() => dispatch({ type: "xray", on: !s.xray })} />
          <IconButton
            size="sm"
            label="Pause the project previews"
            aria-pressed={paused}
            icon={paused ? <Play /> : <Pause />}
            onClick={() => setPaused((v) => !v)}
            className="reduced:hidden"
          />
        </div>
      </div>
    </div>
  );
}
