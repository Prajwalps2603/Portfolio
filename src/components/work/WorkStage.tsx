"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { featuredProjects } from "@/content";
import { routes } from "@/lib/routes";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { useFinePointer, useMediaQuery, useReducedMotion } from "@/lib/motion/media";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { useInView } from "@/lib/hooks/useInView";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { MiniUI, type MiniUIState } from "@/components/miniui";
import { TransitionLink } from "@/components/transition";
import { SketchLine } from "@/components/sketch";
import { FlowNote, PINNED_QUERY, ProjectActions, ProjectFacts, ProjectGlyph, ProjectStack, flowSentence } from "./parts";
import { useReturnFrom } from "./useReturnFrom";
import { ViewSwitch } from "./ViewSwitch";
import { useWorkView, type WorkView } from "./viewStore";

/**
 * 03 SELECTED WORK, the pinned stage (laptop and desktop, see PINNED_QUERY).
 *
 * A tall track with a sticky panel: the left column is the index of the featured projects (a
 * vertical tablist) and the active project's details (its tabpanel); the right column is the
 * stage, the project's mini-UI in a window that tilts toward the pointer. Scrolling through the
 * track walks the index; each change slides a sheet of dotted paper across the stage carrying the
 * next project as a pencil sketch, which then compiles into the shipped UI and is stamped
 * (the section's one authored moment: "stage re-compile").
 *
 * Above the window, "Interface | Architecture" turns the window over (a card flip) to the
 * project's living architecture diagram: it draws, compiles, then a request travels its real flow
 * while the step is handwritten under the window. The choice is remembered across projects; the
 * next project arrives on the same side (wipe + re-compile). The diagram is a lazy chunk.
 *
 * Reduced motion: no tilt, no wipe, no flip, no compile: the stage and details swap instantly.
 */

const PROJECTS = featuredProjects;
const N = PROJECTS.length;
/** Seconds: the paper sheet wipes across the stage (pen). */
const WIPE = 0.5;
/** Seconds the sketch holds after the wipe before it compiles. */
const HOLD = 0.2;
/** Seconds: the window turns away (exit) and the other side turns in (arrive). */
const FLIP_OUT = 0.22;
const FLIP_IN = 0.5;
/** A swap starts once the index has been stable this long (a fast flick skips what it passes). */
const SETTLE_MS = 90;
/** Pointer tilt, degrees. */
const TILT = 6;
/** Fraction of a step the scroll must enter a neighbour before the index follows. */
const HYSTERESIS = 0.04;

type Slide = { key: number; id: string; view: WorkView; state: MiniUIState; enter: "none" | "wipe" | "flip" };

const loadArch = () => import("./ArchitectureWindow");
const ArchitectureWindow = dynamic(() => loadArch().then((m) => m.ArchitectureWindow), { ssr: false });
const Narration = dynamic(() => loadArch().then((m) => m.Narration), { ssr: false });
/** Warm the lazy chunk (hover / focus of the switch, the stage on screen); a failed load just waits for the real one. */
const warmArch = () => {
  loadArch().catch(() => {});
};

type ArchProps = { paused: boolean; onStep: (i: number) => void };

/**
 * The journey's current step, outside React state: the diagram reports a step every second or
 * so, and only the narration line needs to re-render for it (not the whole stage).
 */
function createStepStore() {
  let value: number | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: number | null) => {
      if (next === value) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}
type StepStore = ReturnType<typeof createStepStore>;
const serverStep = () => null;

/** The narration under the window, subscribed to the step store. */
function StageNarration({ store, project, paused, onTogglePause }: { store: StepStore; project: (typeof PROJECTS)[number]; paused: boolean; onTogglePause: () => void }) {
  const step = useSyncExternalStore(store.subscribe, store.get, serverStep);
  return <Narration project={project} step={step} paused={paused} onTogglePause={onTogglePause} />;
}

const keyOf = (w: { index: number; view: WorkView }) => `${PROJECTS[w.index].id}|${w.view}`;

const TRACK_STYLE = {
  "--work-panel": "min(calc(100svh - var(--header-h)), 56rem)",
  "--work-top": "calc(var(--header-h) + (100svh - var(--header-h) - var(--work-panel)) / 2)",
  "--work-step": "44svh",
  height: `calc(var(--work-panel) + ${N} * var(--work-step))`,
} as CSSProperties;

export function WorkStage({ className }: { className?: string }) {
  const pinned = useMediaQuery(PINNED_QUERY);
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const { scrollTo } = useSmoothScroll();
  const { on: sketchMode } = useSketchMode();
  const [view, setView] = useWorkView();
  /** The architecture side's journey: its current step and the visible pause control. */
  const [steps] = useState(createStepStore);
  const [archPaused, setArchPaused] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stRef = useRef<ScrollTrigger | null>(null);
  /**
   * After a click / key selection, ignore scroll-derived indices until the jump lands (or the
   * time runs out). `sticky` keeps ignoring them for the whole window even after landing (the
   * return from a case study, while the page above may still settle).
   */
  const guard = useRef<{ index: number; until: number; sticky: boolean } | null>(null);

  /** The project the index marks (follows the scroll at once). */
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  /** The project the details panel and the stage show (follows `active` through the swap). */
  const [shown, setShown] = useState(0);
  /** The side the stage shows (follows `view` through the flip). */
  const [shownView, setShownView] = useState<WorkView>(view);
  const [slides, setSlides] = useState<Slide[]>(() => [{ key: 0, id: PROJECTS[0].id, view, state: "ship", enter: "none" }]);

  const want = useRef<{ index: number; view: WorkView }>({ index: 0, view });
  const busy = useRef(false);
  const keySeq = useRef(1);
  const stageKey = useRef(`${PROJECTS[0].id}|${view}`);
  const timers = useRef<number[]>([]);
  const reducedRef = useRef(reduced);
  const inViewRef = useRef(false);

  const visualInView = useInView(areaRef, { threshold: 0.35 });
  useEffect(() => {
    inViewRef.current = visualInView;
  }, [visualInView]);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  useEffect(() => {
    const list = timers.current;
    // the visitor takes over: a sticky hold (return from a case study) ends at once
    const release = () => {
      if (guard.current?.sticky) guard.current = null;
    };
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    events.forEach((e) => window.addEventListener(e, release, { passive: true }));
    return () => {
      list.forEach((t) => window.clearTimeout(t));
      events.forEach((e) => window.removeEventListener(e, release));
    };
  }, []);

  // ---- scroll -> index ------------------------------------------------------------------------
  useGSAP(
    () => {
      const track = trackRef.current;
      const panel = panelRef.current;
      if (!pinned || !track || !panel) return;
      const sync = (progress: number) => {
        const x = progress * N;
        let i = Math.min(N - 1, Math.max(0, Math.floor(x)));
        // a little hysteresis: a scroll that settles right on a boundary must not flicker
        const cur = activeRef.current;
        if (i !== cur && Math.abs(i - cur) === 1 && x > 0 && x < N) {
          const into = i > cur ? x - i : i + 1 - x;
          if (into < HYSTERESIS) i = cur;
        }
        const g = guard.current;
        if (g) {
          const live = performance.now() < g.until;
          if (live && (g.sticky || i !== g.index)) {
            if (i !== g.index) return;
          } else {
            guard.current = null;
          }
        }
        setActive(i);
      };
      const st = ScrollTrigger.create({
        trigger: track,
        // the panel sticks when the track's top reaches the panel's sticky offset
        start: () => `top ${parseFloat(getComputedStyle(panel).top) || 0}px`,
        end: () => `+=${Math.max(1, track.offsetHeight - panel.offsetHeight)}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => sync(self.progress),
        onRefresh: (self) => sync(self.progress),
      });
      stRef.current = st;
      sync(st.progress);
      return () => {
        stRef.current = null;
      };
    },
    { dependencies: [pinned], revertOnUpdate: true },
  );

  /**
   * Select a project from the index: move the scroll to its step so scroll and index agree. While
   * the panel is pinned that is an invisible jump; from outside the track a click glides there
   * (forced, so a newer selection always overrides one still in flight); keys always jump.
   */
  const select = useCallback(
    (i: number, instant = false, hold = 0) => {
      setActive(i);
      const track = trackRef.current;
      const panel = panelRef.current;
      if (!stRef.current || !track || !panel) return;
      // measured now (not the trigger's cached values): layout above may have just changed
      const start = track.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(panel).top) || 0);
      const dist = track.offsetHeight - panel.offsetHeight;
      const y = start + (dist / N) * (i + 0.5);
      const now = window.scrollY;
      const jump = instant || reducedRef.current || (now >= start - 2 && now <= start + dist + 2);
      guard.current = { index: i, until: performance.now() + Math.max(hold, jump ? 500 : 2000), sticky: hold > 0 };
      scrollTo(y, { immediate: jump, force: true });
    },
    [scrollTo],
  );

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % N;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + N) % N;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = N - 1;
    if (next < 0) return;
    e.preventDefault();
    select(next, true);
    tabRefs.current[next]?.focus({ preventScroll: true });
  };

  // Back from a case study (page sheet) onto #work: put that project on stage.
  useReturnFrom(pinned, (i) => select(i, true, 1500));

  // ---- index / side -> stage (the swap) -----------------------------------------------------------
  const runSwap = useCallback(() => {
    const { index, view: side } = want.current;
    const id = PROJECTS[index].id;
    const k = `${id}|${side}`;
    if (k === stageKey.current) return;
    const sameProject = stageKey.current.split("|")[0] === id;
    stageKey.current = k;
    setShown(index);
    setShownView(side);
    steps.set(null);
    const key = keySeq.current++;
    if (reducedRef.current || !inViewRef.current) {
      // Nobody is watching (or motion is reduced): swap at once, shipped.
      busy.current = false;
      setSlides([{ key, id, view: side, state: "ship", enter: "none" }]);
      return;
    }
    busy.current = true;
    // Another project: a sheet wipes in. The other side of the same project: the window turns over.
    setSlides((s) => [...s.slice(-1), { key, id, view: side, state: "sketch", enter: sameProject ? "flip" : "wipe" }]);
  }, []);

  const onEntered = useCallback(
    (key: number) => {
      // The new side / project covers the old one: drop it, and compile the sketch.
      setSlides((s) => s.filter((x) => x.key >= key).map((x) => (x.key === key ? { ...x, state: "ship" } : x)));
      busy.current = false;
      if (keyOf(want.current) !== stageKey.current) timers.current.push(window.setTimeout(runSwap, 0));
    },
    [runSwap],
  );

  const lastView = useRef(view);
  useEffect(() => {
    want.current = { index: active, view };
    const flip = lastView.current !== view;
    lastView.current = view;
    if (busy.current) return;
    const t = window.setTimeout(runSwap, reducedRef.current || flip ? 0 : SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [active, view, runSwap]);

  // First view: the opening project waits as a sketch (set from JS, off screen) and compiles
  // when the stage comes into view.
  const primed = useRef(false);
  useEffect(() => {
    if (!pinned || reduced || primed.current) return;
    primed.current = true;
    const area = areaRef.current;
    if (!area) return;
    const r = area.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setSlides((s) => s.map((x, i) => (i === s.length - 1 && x.enter === "none" ? { ...x, state: "sketch" } : x)));
  }, [pinned, reduced]);

  useEffect(() => {
    if (!visualInView && !reduced) return;
    const t = window.setTimeout(
      () => setSlides((s) => (s.some((x) => x.enter === "none" && x.state === "sketch") ? s.map((x) => (x.enter === "none" ? { ...x, state: "ship" } : x)) : s)),
      reduced ? 0 : 220,
    );
    return () => window.clearTimeout(t);
  }, [visualInView, reduced]);

  // the architecture chunk loads in the background once the stage is on screen
  useEffect(() => {
    if (visualInView) warmArch();
  }, [visualInView]);

  // ---- details: the outgoing panel leaves fast, the incoming one arrives in reading order ------
  const prevShown = useRef(0);
  const shownViewRef = useRef(shownView);
  useLayoutEffect(() => {
    shownViewRef.current = shownView;
  }, [shownView]);
  useGSAP(
    () => {
      const from = prevShown.current;
      prevShown.current = shown;
      const root = detailsRef.current;
      const flow = flowRef.current;
      if (!root || !flow || from === shown || reduced) return;
      // the static flow line only exists on the interface side (the narration replaces it)
      const flowSide = shownViewRef.current === "interface";
      const leave = { autoAlpha: 0, duration: DUR.exit, ease: EASE.exit, clearProps: "opacity,visibility" };
      const out = [root.children[from], flowSide ? flow.children[from] : null].filter(Boolean);
      if (out.length) gsap.fromTo(out, { autoAlpha: 1 }, leave);
      const inn = root.children[shown];
      if (inn) {
        gsap.from(inn.querySelectorAll("[data-arrive]"), {
          autoAlpha: 0,
          y: 10,
          duration: DUR.ui + 0.14,
          ease: EASE.arrive,
          stagger: STAGGER.items,
          delay: 0.08,
          clearProps: "opacity,visibility,transform",
        });
      }
      // the handwritten flow comes in once the sheet has crossed the stage
      const note = flowSide ? flow.children[shown] : null;
      if (note) gsap.from(note, { autoAlpha: 0, x: -8, duration: DUR.ui + 0.14, ease: EASE.arrive, delay: WIPE, clearProps: "opacity,visibility,transform" });
    },
    { dependencies: [shown, reduced] },
  );

  // ---- tilt: the stage leans toward the pointer (fine pointers, full motion, the interface side:
  // the diagram's nodes are aimed at, so that side holds still) ------------------------------------
  useEffect(() => {
    const el = tiltRef.current;
    const box = boxRef.current;
    if (!el || !box || reduced || !fine || !pinned || shownView !== "interface") return;
    gsap.set(el, { transformPerspective: 1600, transformOrigin: "50% 50%" });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.7, ease: EASE.arrive });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.7, ease: EASE.arrive });
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const r = box.getBoundingClientRect();
      const nx = gsap.utils.clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1);
      const ny = gsap.utils.clamp(-1, 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      ry(nx * TILT);
      rx(-ny * TILT);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
    };
    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerleave", onLeave);
    return () => {
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });
    };
  }, [reduced, fine, pinned, shownView]);

  const current = PROJECTS[shown];
  const top = slides[slides.length - 1];
  const arch: ArchProps = useMemo(() => ({ paused: archPaused, onStep: steps.set }), [archPaused, steps]);
  const onSide = (v: WorkView) => {
    if (v === "architecture") warmArch();
    setView(v);
  };

  return (
    <div ref={trackRef} data-work-stage="" className={`relative ${className ?? ""}`} style={TRACK_STYLE}>
      <div
        ref={panelRef}
        className="sticky top-(--work-top) grid h-(--work-panel) grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] gap-x-[clamp(28px,4vw,72px)] py-[clamp(16px,2.6svh,32px)] lg:grid-cols-[minmax(0,0.64fr)_minmax(0,1fr)]"
      >
        {/* ---- left: the index and the active project's details ---- */}
        <div className="flex min-h-0 flex-col justify-center">
          <div role="tablist" aria-label="Featured projects" aria-orientation="vertical" className="flex flex-col gap-1 [@media(max-height:48.74rem)]:gap-0.5">
            {PROJECTS.map((p, i) => {
              const on = i === active;
              return (
                <button
                  key={p.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`work-tab-${p.id}`}
                  aria-selected={on}
                  aria-controls={`work-panel-${p.id}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(i)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 min-h-11 rounded-window border border-transparent px-3 py-2 text-left [@media(min-height:48.75rem)_and_(max-height:53.74rem)]:py-1.5 [@media(max-height:48.74rem)]:py-1 transition-[background-color,border-color,box-shadow,scale] duration-(--dur-ui) ease-arrive hover:bg-card/60 active:scale-[0.99] aria-selected:border-line aria-selected:bg-card aria-selected:shadow-card"
                >
                  <ProjectGlyph id={p.id} active={on} />
                  <span className="min-w-0">
                    <span className={`type-h4 block truncate transition-colors duration-(--dur-ui) ${on ? "text-ink" : "text-graphite group-hover:text-ink"}`}>
                      {p.shortTitle}
                    </span>
                    <span className="type-mono block truncate text-graphite [@media(max-height:53.74rem)]:hidden">{p.category}</span>
                  </span>
                  <span className="type-mono self-start pt-1 text-graphite">{p.year}</span>
                </button>
              );
            })}
          </div>

          <span aria-hidden="true" className="relative mx-3 mt-[clamp(14px,2.4svh,28px)] block h-3 w-24 [@media(max-height:48.74rem)]:hidden">
            <SketchLine seed="work-index-rule" tone="pencil" />
          </span>

          <div ref={detailsRef} className="mt-[clamp(10px,1.8svh,22px)] grid px-3">
            {PROJECTS.map((p, i) => (
              <div
                key={p.id}
                role="tabpanel"
                id={`work-panel-${p.id}`}
                aria-labelledby={`work-tab-${p.id}`}
                className={`[grid-area:1/1] ${i === shown ? "visible" : "invisible"}`}
              >
                <h3 data-arrive className="type-h3 text-[clamp(1.375rem,1.05rem+0.9vw,2rem)] [@media(max-height:51.24rem)]:sr-only">
                  {p.title}
                </h3>
                <p data-arrive className="type-body mt-2 text-graphite">
                  {p.tagline}
                </p>
                <div data-arrive>
                  <ProjectFacts project={p} className="mt-3.5" />
                </div>
                <div data-arrive>
                  <ProjectStack project={p} className="mt-3.5" />
                </div>
                <div data-arrive>
                  <ProjectActions project={p} className="mt-5" />
                </div>
                {flowSentence(p) ? <p className="sr-only">{flowSentence(p)}</p> : null}
              </div>
            ))}
          </div>
        </div>

        {/* ---- right: the stage (the window fits the column: width, or height minus the switch row
             and the flow line) ---- */}
        <div ref={areaRef} className="relative min-h-0 [--ctl-h:3.5rem] [--flow-h:4.5rem] [container-type:size]">
          <div className="flex h-full flex-col items-center justify-center">
            <div className="relative z-(--z-raised) flex h-(--ctl-h) w-[min(100cqw,calc((100cqh-var(--flow-h)-var(--ctl-h))*16/11))] shrink-0 items-start justify-end">
              <ViewSwitch value={view} onChange={onSide} onIntent={warmArch} label="Show the project as" qa="work-view" />
            </div>
            <div ref={boxRef} data-qa="work-stage-window" data-view={shownView} className="relative aspect-[16/11] w-[min(100cqw,calc((100cqh-var(--flow-h)-var(--ctl-h))*16/11))] shrink-0 rounded-card">
              <div ref={tiltRef} className="absolute inset-0">
                {slides.map((s) => (
                  <StageSlide key={s.key} slide={s} live={pinned} sketchMode={sketchMode} onEntered={onEntered} arch={s.key === top.key ? arch : null} />
                ))}
              </div>
              {shownView === "interface" ? (
                <TransitionLink
                  href={routes.work(current.id)}
                  label={current.shortTitle}
                  tabIndex={-1}
                  aria-hidden="true"
                  data-cursor-label="Case study"
                  className="absolute inset-0 rounded-card"
                >
                  <span className="sr-only">{current.shortTitle} case study</span>
                </TransitionLink>
              ) : null}
            </div>
            <div ref={flowRef} className="grid min-h-(--flow-h) w-[min(100cqw,calc((100cqh-var(--flow-h)-var(--ctl-h))*16/11))] shrink-0 px-2 pt-4">
              {PROJECTS.map((p, i) => (
                <div key={p.id} className={`[grid-area:1/1] ${i === shown && shownView === "interface" ? "visible" : "invisible"}`}>
                  <FlowNote project={p} />
                </div>
              ))}
              {shownView === "architecture" && pinned ? (
                <div className="min-w-0 [grid-area:1/1]">
                  <StageNarration store={steps} project={current} paused={archPaused} onTogglePause={() => setArchPaused((p) => !p)} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One project, one side, on the stage. A new project arrives as a sheet of dotted paper wiping
 * across (clip-path, pen) with a pencil line riding its leading edge; the other side of the same
 * project arrives by turning the window over (the old side turns away to edge-on, exit; this one
 * turns in, arrive). The sketch on it holds for a beat, then `onEntered` drops the slide
 * underneath and turns this one to "ship" (the mini-UI compiles + stamp, or the diagram compiles
 * and its journey starts).
 * `live` = the stage is the layout on screen. Elsewhere (phones, portrait tablets) it is a
 * display:none twin that still follows the shared side, and a diagram there has nothing to
 * measure: the architecture side mounts only while live.
 */
const StageSlide = memo(function StageSlide({
  slide,
  live,
  sketchMode,
  onEntered,
  arch,
}: {
  slide: Slide;
  live: boolean;
  sketchMode: boolean;
  onEntered: (key: number) => void;
  arch: ArchProps | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const cb = useRef(onEntered);
  useEffect(() => {
    cb.current = onEntered;
  }, [onEntered]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const clip = clipRef.current;
      const edge = edgeRef.current;
      if (!root) return;
      if (slide.enter === "wipe" && clip && edge) {
        const tl = gsap.timeline();
        tl.fromTo(clip, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: WIPE, ease: EASE.pen }, 0);
        tl.fromTo(edge, { x: 0, autoAlpha: 1 }, { x: () => root.offsetWidth, duration: WIPE, ease: EASE.pen }, 0);
        tl.to(edge, { autoAlpha: 0, duration: DUR.exit, ease: EASE.exit }, WIPE);
        tl.call(
          () => {
            gsap.set(clip, { clearProps: "clipPath" });
            cb.current(slide.key);
          },
          [],
          WIPE + HOLD,
        );
      } else if (slide.enter === "flip") {
        // one turn: the old side swings its near edge out toward the margin, the new side comes
        // round from edge-on; both lift a little (scale) so the turn stays inside the stage
        const prev = root.previousElementSibling as HTMLElement | null;
        const tl = gsap.timeline();
        gsap.set(root, { transformPerspective: 2400, rotationY: 90, scale: 0.93, transformOrigin: "50% 50%" });
        if (prev) tl.to(prev, { transformPerspective: 2400, rotationY: -90, scale: 0.93, transformOrigin: "50% 50%", duration: FLIP_OUT, ease: EASE.exit }, 0);
        tl.to(root, { rotationY: 0, scale: 1, duration: FLIP_IN, ease: EASE.arrive }, prev ? FLIP_OUT : 0);
        tl.call(
          () => {
            gsap.set(root, { clearProps: "transform" });
            cb.current(slide.key);
          },
          [],
          (prev ? FLIP_OUT : 0) + FLIP_IN + 0.04,
        );
      }
    },
    // a slide enters once, when it mounts
    { scope: rootRef, dependencies: [] },
  );

  const state: MiniUIState = sketchMode ? "sketch" : slide.state;
  return (
    <div ref={rootRef} data-side={slide.view} className="absolute inset-0 [backface-visibility:hidden]">
      <div ref={clipRef} className="absolute inset-0">
        {/* the sheet the sketch is drawn on (hidden under the shipped window) */}
        <div aria-hidden="true" className="paper-dots absolute inset-0 rounded-card bg-paper" />
        {slide.view === "architecture" ? (
          live ? <ArchitectureWindow project={projectOf(slide.id)} state={state} paused={arch?.paused ?? false} onStep={arch?.onStep} /> : null
        ) : (
          <MiniUI projectId={slide.id} state={state} size="md" />
        )}
      </div>
      {slide.enter === "wipe" ? (
        <div ref={edgeRef} aria-hidden="true" className="pointer-events-none invisible absolute -top-4 -bottom-4 -left-2 w-4">
          <SketchLine seed={`work-wipe-${slide.id}`} orientation="vertical" tone="ink" strokeWidth={2} />
        </div>
      ) : null}
    </div>
  );
});

function projectOf(id: string) {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
}
