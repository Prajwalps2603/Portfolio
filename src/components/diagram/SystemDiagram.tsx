"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { drawOn, hideStrokes, showStrokes } from "@/components/sketch/draw";
import { roughLine } from "@/components/sketch/rough";
import {
  chooseOrientation,
  fitPerTrack,
  layoutLanes,
  nodeBox,
  placeNote,
  planGrid,
  routeEdges,
  trackPoint,
  visiblePoints,
  type Box,
  type EdgeGeom,
  type Orientation,
} from "./geometry";
import { inSight, usePlayGate, useSeen } from "./playGate";
import {
  neighbours,
  passesThrough,
  stepsAt,
  type DiagramSpec,
  type PacketKind,
} from "./spec";

/**
 * THE LIVING SYSTEM DIAGRAM (the diagram grammar, one engine for the whole site).
 *
 *   <SystemDiagram spec={projectDiagram(project)} state={state} fit="fill" onStep={setStep} />
 *
 * - Layout from data: lanes (layers) laid out top to bottom or left to right (`orientation`
 *   "auto" picks what fits the box), short lanes centred (a lone part may sit under the parts it
 *   talks to), node order chosen so edges stay short; long edges run down the gutters between
 *   columns, not round the outside.
 *   The DOM sizes the nodes (real text); the engine measures them and routes the edges.
 * - `state` "sketch": pencil boxes, Caveat labels, rough edges.
 * - THE REVEAL ("sketch" -> "ship"), about 3s the first time a spec is seen in the session:
 *   the sketch draws itself once it is on screen (pen, 0.9s), compiles (strokes tighten onto the
 *   cards, Caveat swaps to Inter + mono, the cards fill; 0.6s), then the FIRST REQUEST runs the
 *   whole route at speed (~1.5s: the route inks in, every step badge pops, the highlighter bands
 *   swipe, each step is reported at that pace) and the response coming back is journey 1
 *   (`onJourney(1)`; nothing listens since the SHIPPED stamp left the windows, 2026-11-10).
 * - COMPILED ONCE PER VIEW: from then on the diagram stays shipped. The lit route (ink traces,
 *   numbered badges, highlighter bands) never clears; only a sketch phase (the `state` prop, sketch
 *   mode) takes it back to pencil.
 * - A spec already drawn this session never redraws: its sketch is simply there, and "ship" is a
 *   0.7s CROSS-WIPE (a pencil line sweeps along the layers; behind it the cards are shipped, each
 *   settling as the line passes), then the route inks in (~0.8s) and journey 1 is reported at once
 *   (the stamp lands, no replay).
 * - A click / tap / Enter on the diagram during the reveal skips it: a 0.42s wipe to shipped, the
 *   route inks in, the stamp, the loop.
 * - THE LOOP (reading pace) moves packets only: a packet travels the content's flow over the lit
 *   route (lime request in, blue between services, tangerine response out); the card it reaches
 *   gets a short ink pulse (an ink border, a ring breathing out once, its badge ticks) and the step
 *   is reported by `onStep` (step 0 again as the loop starts, after the first request). A step
 *   holds at least READ.hold seconds, so a narration line can be read.
 * - Hover / keyboard focus / tap on a node: its connected edges turn ink, the rest dims to 35%,
 *   and a handwritten note says what happens there (its steps; else the layer), placed where it
 *   buries no other part (a one-line strip in a lane gap when the cards are dense). Nodes are real
 *   buttons (one tab stop, arrow keys move between them, click / tap / Enter pins, a second tap,
 *   a tap anywhere else or Esc lets go).
 * - The play gate (./playGate): everything that moves pauses where it is when the diagram leaves
 *   the screen or the tab is hidden, and resumes from there. The loop also eases to a stop while
 *   the pointer is over the diagram, while a part is hovered, focused or pinned, and with `paused`
 *   (a visible pause control); `paused` during the first request skips it.
 * - Reduced motion (or Motion: off): the finished diagram, every step marked, no packet.
 * - Sketch mode (html[data-sketch]): the sketch state.
 * The SVGs and the notes are aria-hidden; the buttons and an ordered list carry the meaning.
 */

export type DiagramState = "sketch" | "ship";
export type DiagramPhase = "sketch" | "compiling" | "ship";

export type SystemDiagramProps = {
  spec: DiagramSpec;
  /** Controlled. Default "ship". "sketch" -> "ship" plays the reveal (see above). */
  state?: DiagramState;
  /** fill: fills its (sized) box, density steps down to fit. auto: height follows the content. */
  fit?: "fill" | "auto";
  orientation?: "auto" | Orientation;
  /** External pause (a visible pause control). */
  paused?: boolean;
  /**
   * The journey reached step `index`: at the first request's pace during the reveal, then at
   * reading pace (each step held at least ~1.7s); reported as 0 again when the loop starts.
   */
  onStep?: (index: number) => void;
  /**
   * A full journey (the response is back) completed; `count` from 1. Journey 1 is the reveal's
   * first request; a spec that already shipped earlier in the session (or a skipped reveal)
   * reports 1 as soon as it is shipped and on screen, so a stamp keyed to it lands right away.
   */
  onJourney?: (count: number) => void;
  onPhase?: (phase: DiagramPhase) => void;
  className?: string;
};

type Tier = {
  vars: Record<string, string>;
  label: string;
  minNode: number;
  pad: number;
};

/** Density tiers: roomy -> regular -> compact (fill mode steps down until it fits). */
const TIERS: Tier[] = [
  {
    vars: {
      "--dg-pad": "20px",
      "--dg-gap": "26px",
      "--dg-lane-gap": "18px",
      "--dg-sub-gap": "10px",
      "--dg-node-max": "15.5rem",
      "--dg-px": "14px",
      "--dg-py": "10px",
    },
    label: "text-ui",
    minNode: 150,
    pad: 20,
  },
  {
    vars: {
      "--dg-pad": "16px",
      "--dg-gap": "18px",
      "--dg-lane-gap": "22px",
      "--dg-sub-gap": "8px",
      "--dg-node-max": "14rem",
      "--dg-px": "12px",
      "--dg-py": "8px",
    },
    label: "text-mono",
    minNode: 128,
    pad: 16,
  },
  {
    vars: {
      "--dg-pad": "12px",
      "--dg-gap": "10px",
      "--dg-lane-gap": "12px",
      "--dg-sub-gap": "6px",
      "--dg-node-max": "13rem",
      "--dg-px": "10px",
      "--dg-py": "6px",
    },
    label: "text-label",
    minNode: 108,
    pad: 12,
  },
];

const BADGE: Record<PacketKind, string> = {
  request: "bg-lime text-ink",
  data: "bg-blue text-paper",
  response: "bg-tangerine text-ink",
};
/** One highlighter band per line of the label (cloned inline background, like <Highlight>). */
const BAND: Record<PacketKind, string> = {
  request: "bg-[linear-gradient(var(--color-lime),var(--color-lime))]",
  data: "bg-[linear-gradient(var(--color-blue-soft),var(--color-blue-soft))]",
  response:
    "bg-[linear-gradient(var(--color-tangerine-soft),var(--color-tangerine-soft))]",
};
/** Bands reveal left to right (clip-path), with room for their overhang. */
const BAND_HIDDEN = "inset(-25% 104% -25% -4%)";
const BAND_SHOWN = "inset(-25% -4% -25% -4%)";
const NOTE_BG: Record<PacketKind, string> = {
  request: "bg-lime-soft",
  data: "bg-blue-soft",
  response: "bg-tangerine-soft",
};
/** Degrees the inspect note leans (the one-line strip leans less, so it stays inside a lane gap). */
const NOTE_TILT = -1.5;
const NOTE_TILT_LINE = -0.6;
const KIND_WORD: Record<PacketKind, string> = {
  request: "request in",
  data: "between services",
  response: "response out",
};

/** Labels write themselves left to right. */
const CLIP_HIDDEN = "inset(-30% 106% -30% -6%)";
const CLIP_SHOWN = "inset(-30% 0% -30% -6%)";

/** px a packet travels under a card's edge as it leaves / arrives (it slides out from under it). */
const SLIDE = 16;

/** Seconds: the cross-wipe of a sketch already drawn this session, and the skip's quicker one. */
const WIPE = 0.7;
const WIPE_FAST = 0.42;
/** px the wipe runs past both ends of the box, so card shadows and the riding line clear it. */
const WIPE_OVER = 24;

/** How a journey is paced. */
type Pace = {
  /** When the first step is marked / the first hop leaves. */
  start: number;
  /** A beat inside the first card before the request sets off. */
  lead: number;
  /** Seconds for a hop of `len` px. */
  hop: (len: number) => number;
  /** A beat passing through a service on the way. */
  through: number;
  /** The least time a step holds before the packet moves on. */
  dwell: number;
  /** The least time from one step's report to the next (a narration line must be readable). */
  hold: number;
  /** The first request: the route inks in behind the packet, badges pop, bands swipe. */
  light: boolean;
  /** The loop: the card the packet is in gets the ink pulse. */
  ink: boolean;
};

/** The loop, at reading pace (over the lit route: only the packet moves). */
const READ: Pace = {
  start: 0.6,
  lead: 0.45,
  hop: (l) => Math.min(1.1, Math.max(0.5, 0.32 + l / 300)),
  through: 0.16,
  dwell: 0.7,
  hold: 1.7,
  light: false,
  ink: true,
};
/** The first request of a reveal: the whole route at speed (~1-1.4s). */
const FIRST: Pace = {
  start: 0.08,
  lead: 0,
  hop: (l) => Math.min(0.22, Math.max(0.1, 0.06 + l / 1700)),
  through: 0.03,
  dwell: 0.06,
  hold: 0,
  light: true,
  ink: false,
};
/** The last step of a journey holds longer; then a rest before the next request sets off. */
const DWELL_END = 1.8;
const REST = 0.6;
/** After the first request: the lit route holds while the stamp lands, then the loop takes over. */
const FIRST_HOLD = 0.95;
const FIRST_REST = 0.35;
/** px the ink ring of the pulse breathes out past a card's edge. */
const PULSE = 7;

/**
 * Session memory (module state, as long as the tab's app lives): specs whose sketch has drawn
 * itself (their next reveal is the cross-wipe, never a redraw) and specs that have shipped (their
 * next reveal skips the first request and reports journey 1 at once).
 */
const drawnSpecs = new Set<string>();
const shippedSpecs = new Set<string>();

/** True once the spec's sketch has drawn itself this session (e.g. a window frame can skip its own redraw). */
export function hasDrawn(specId: string): boolean {
  return drawnSpecs.has(specId);
}

/** True once the spec has shipped (its first request made it, or the reveal was skipped) this session. */
export function hasShipped(specId: string): boolean {
  return shippedSpecs.has(specId);
}

/** The linear progress at which a monotonic 0..1 ease reaches `v` (bisection). */
function invertEase(ease: (p: number) => number, v: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < v) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

type Geom = {
  key: string;
  W: number;
  H: number;
  boxes: Record<string, Box>;
  edges: Record<string, EdgeGeom>;
  sketch: Record<string, { rough: string; tight: string }>;
};

type Hop = {
  edge: string;
  from: string;
  to: string;
  step: number;
  kind: PacketKind;
  index: number;
};

type Intro = "draw" | "compile" | "wipe" | "first";
type CompileKind = "compile" | "wipe" | "fast";

/** The run state: one mutable record that effects, handlers and GSAP callbacks share. */
type Run = {
  /** idle: shipped, waiting to be seen. first: the first request. enter: handing over. loop: narrated. */
  stage: "idle" | "first" | "enter" | "loop";
  built: boolean;
  specId: string;
  first: gsap.core.Timeline | null;
  loop: gsap.core.Timeline | null;
  /** Packet away, no card inked (between journeys, handing over). */
  settle: (() => void) | null;
  /** Lights the whole route (ink traces, badges, bands) from wherever it is: animated, or at once. */
  light: ((animate: boolean) => void) | null;
  scale: gsap.core.Tween | null;
  count: number;
  live: boolean;
  paused: boolean;
  /** Someone is reading: the pointer is over the diagram, or a part is hovered, focused or pinned. */
  holding: boolean;
  /** A skip was asked for (click / tap / Enter during the reveal). */
  skip: boolean;
  intro: Intro | null;
  introTl: gsap.core.Timeline | null;
};

export function SystemDiagram({
  spec,
  state = "ship",
  fit = "fill",
  orientation = "auto",
  paused = false,
  onStep,
  onJourney,
  onPhase,
  className,
}: SystemDiagramProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduced = useReducedMotion();
  const { on: sketchMode } = useSketchMode();
  const target: DiagramState = sketchMode ? "sketch" : state;
  const fill = fit === "fill";

  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boxesRef = useRef<SVGSVGElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<SVGSVGElement>(null);
  const packetRef = useRef<HTMLSpanElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  // ---- layout ---------------------------------------------------------------------------------
  const [tier, setTier] = useState(fill ? 0 : 1);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [tick, setTick] = useState(0);
  const [geom, setGeom] = useState<Geom | null>(null);
  const T = TIERS[tier];

  const lanes = useMemo(() => layoutLanes(spec), [spec]);
  const o: Orientation =
    orientation !== "auto"
      ? orientation
      : fill && size
        ? chooseOrientation(spec, size.w, size.h)
        : "rows";
  const perTrack = useMemo(() => {
    const most = Math.max(1, ...spec.lanes.map((l) => l.nodes.length));
    if (o === "columns" || fill || !size) return most;
    const gap = parseFloat(T.vars["--dg-gap"]);
    return fitPerTrack(spec, size.w - T.pad * 2, T.minNode, gap);
  }, [spec, o, fill, size, T]);
  const plan = useMemo(
    () => planGrid(lanes.order, o, perTrack, fill, lanes.offsets),
    [lanes, o, perTrack, fill],
  );
  const reading = useMemo(() => plan.tracks.flat(), [plan]);

  // observe the box (and every node: fonts, wrapping) -> re-measure
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let last = "";
    const ro = new ResizeObserver(() => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      const k = `${w}x${fill ? h : 0}`;
      if (k !== last) {
        last = k;
        setSize({ w, h });
        setTier(fill ? 0 : 1);
      }
      setTick((t) => t + 1);
    });
    ro.observe(root);
    Object.values(buttons.current).forEach((b) => b && ro.observe(b));
    const fonts = typeof document !== "undefined" ? document.fonts : null;
    let alive = true;
    fonts?.ready.then(() => alive && setTick((t) => t + 1)).catch(() => {});
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [fill, plan]);

  // measure: step the density down until it fits, then route the edges
  useLayoutEffect(() => {
    const root = rootRef.current;
    const grid = gridRef.current;
    if (!root || !grid || !size) return;
    if (
      fill &&
      tier < TIERS.length - 1 &&
      (grid.scrollHeight > grid.clientHeight + 1 ||
        grid.scrollWidth > grid.clientWidth + 1)
    ) {
      setTier((t) => Math.min(TIERS.length - 1, t + 1));
      return;
    }
    const boxes: Record<string, Box> = {};
    for (const id of reading) {
      const el = buttons.current[id];
      if (!el || !el.offsetParent) continue;
      boxes[id] = {
        x: el.offsetLeft,
        y: el.offsetTop,
        w: el.offsetWidth,
        h: el.offsetHeight,
      };
    }
    const W = root.clientWidth;
    const H = root.clientHeight;
    const key = `${spec.id}|${o}|${W}x${H}|${reading.map((id) => (boxes[id] ? `${boxes[id].x},${boxes[id].y},${boxes[id].w},${boxes[id].h}` : "-")).join(";")}`;
    if (geom?.key === key) return;
    const edges = routeEdges({
      spec,
      plan,
      boxes,
      cross: o === "rows" ? W : H,
      pad: Math.max(6, T.pad * 0.5),
    });
    const sketch: Geom["sketch"] = {};
    for (const id of reading)
      if (boxes[id]) sketch[id] = nodeBox(boxes[id], `${spec.id}|${id}`, 10);
    setGeom({ key, W, H, boxes, edges, sketch });
  }, [size, tick, tier, plan, reading, spec, o, fill, geom?.key, T.pad]);

  // ---- run state + the play gate (on screen, tab visible) -------------------------------------------
  const run = useRef<Run>({
    stage: "idle",
    built: false,
    specId: spec.id,
    first: null,
    loop: null,
    settle: null,
    light: null,
    scale: null,
    count: 0,
    live: false,
    paused,
    holding: false,
    skip: false,
    intro: null,
    introTl: null,
  });
  const live = usePlayGate(rootRef, { threshold: 0.2 });

  /** What the reveal is doing right now (data-intro, for QA and the skip). */
  const markIntro = useCallback((kind: Intro | null) => {
    run.current.intro = kind;
    const root = rootRef.current;
    if (!root) return;
    if (kind) root.dataset.intro = kind;
    else delete root.dataset.intro;
  }, []);

  // ---- phase ----------------------------------------------------------------------------------
  const [phase, setPhase] = useState<DiagramPhase>(() =>
    target === "sketch" ? "sketch" : "ship",
  );
  const [compileKind, setCompileKind] = useState<CompileKind>("compile");
  const targetRef = useRef(target);
  const drawing = useRef(false);
  /** This sketch phase drew its sketch (so "ship" compiles; otherwise it cross-wipes). */
  const drewNow = useRef(false);
  const pendingShip = useRef(false);

  const beginCompile = useCallback(() => {
    const kind: CompileKind = run.current.skip
      ? "fast"
      : drewNow.current
        ? "compile"
        : "wipe";
    const root = rootRef.current;
    if (root)
      root.dataset.reveal =
        kind === "compile" ? "first" : kind === "wipe" ? "revisit" : "skip";
    // marked now (not when the compile effect runs), so no click falls between two reveal steps
    markIntro(kind === "compile" ? "compile" : "wipe");
    setCompileKind(kind);
    setPhase("compiling");
  }, [markIntro]);

  useLayoutEffect(() => {
    targetRef.current = target;
    if (target === "sketch") {
      pendingShip.current = false;
      if (phase !== "sketch") {
        drewNow.current = false;
        run.current.skip = false;
        setPhase("sketch");
      }
      return;
    }
    if (phase !== "sketch") return;
    const root = rootRef.current;
    if (reduced || !geom || !root) {
      setPhase("ship");
      return;
    }
    if (drawing.current) {
      pendingShip.current = true;
      return;
    }
    if (!drewNow.current && !drawnSpecs.has(spec.id)) {
      // a first reveal that has not been seen yet: it draws when it comes on screen, then compiles
      pendingShip.current = true;
      return;
    }
    if (!inSight(root)) {
      // nobody is watching: ship at once
      root.dataset.reveal = "instant";
      setPhase("ship");
      return;
    }
    beginCompile();
  }, [target, phase, reduced, geom, spec.id, beginCompile]);

  const onPhaseRef = useRef(onPhase);
  const onStepRef = useRef(onStep);
  const onJourneyRef = useRef(onJourney);
  useLayoutEffect(() => {
    onPhaseRef.current = onPhase;
    onStepRef.current = onStep;
    onJourneyRef.current = onJourney;
  });
  useEffect(() => {
    onPhaseRef.current?.(phase);
  }, [phase]);

  // Seen (latched once): in sight when it is first laid out (checked synchronously, so a window
  // turning in draws at once) or when the gate first opens. A latch, so the gate flickering later
  // never interrupts a draw.
  const geomKey = geom?.key;
  const seen = useSeen(rootRef, live, { ready: !!geomKey, threshold: 0.2 });

  // The sketch draws itself once per session, when it is seen (pen order: boxes, labels, then the
  // edges). Until then its strokes wait hidden (set from JS only). Not in a GSAP context:
  // reverting a draw-on would put the strokes back to hidden; it is finished instead.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (phase !== "sketch" || !geomKey || !root) return;
    const groups = [
      root.querySelector("[data-g=boxes]"),
      root.querySelector("[data-g=edges]"),
    ].filter(Boolean) as Element[];
    if (reduced || drewNow.current || drawnSpecs.has(spec.id)) {
      showStrokes(groups);
      return;
    }
    const labels = gsap.utils.toArray<HTMLElement>("[data-sk-label]", root);
    const links = gsap.utils.toArray<SVGPathElement>("[data-link]", root);
    const written = [...labels, ...links];
    const unset = () => {
      if (written.length) gsap.set(written, { clearProps: "clipPath,opacity" });
    };
    if (!seen) {
      hideStrokes(groups);
      if (labels.length) gsap.set(labels, { clipPath: CLIP_HIDDEN });
      if (links.length) gsap.set(links, { opacity: 0 });
      return () => {
        showStrokes(groups);
        unset();
      };
    }
    drawnSpecs.add(spec.id);
    drewNow.current = true;
    drawing.current = true;
    markIntro("draw");
    const finish = () => {
      drawing.current = false;
      if (run.current.intro === "draw") run.current.introTl = null;
      showStrokes(groups);
      unset();
      if (pendingShip.current && targetRef.current === "ship") {
        pendingShip.current = false;
        beginCompile();
      } else if (run.current.intro === "draw") markIntro(null);
    };
    const tl = gsap.timeline({ onComplete: finish });
    tl.add(drawOn(groups, { duration: DUR.draw }), 0);
    if (labels.length)
      tl.fromTo(
        labels,
        { clipPath: CLIP_HIDDEN },
        {
          clipPath: CLIP_SHOWN,
          duration: 0.3,
          ease: EASE.pen,
          stagger: Math.min(0.08, 0.5 / labels.length),
        },
        0.06,
      );
    if (links.length)
      tl.fromTo(
        links,
        { opacity: 0 },
        { opacity: 1, duration: DUR.ui, ease: EASE.arrive },
        DUR.draw * 0.7,
      );
    run.current.introTl = tl;
    return () => {
      tl.eventCallback("onComplete", null);
      tl.kill();
      finish();
    };
  }, [phase, geomKey, reduced, spec.id, seen, markIntro, beginCompile]);

  // "sketch" -> "ship": THE COMPILE (first reveal: pencil boxes tighten onto the cards and fade,
  // labels swap, cards settle in) or THE CROSS-WIPE (a sketch drawn earlier: a pencil line sweeps
  // along the layers, behind it the cards are shipped).
  useGSAP(
    () => {
      const root = rootRef.current;
      if (phase !== "compiling" || !root || !geom) return;
      const r = run.current;
      // On completion the intro mark stays: the journey effect, in the same commit, marks "first"
      // or clears it, so no click falls between two reveal steps.
      const done = () => {
        r.introTl = null;
        setPhase("ship");
      };
      /** Reverted (completed, or cut short, e.g. sketch mode mid-compile): drop the stale handle. */
      const release = () => {
        r.introTl = null;
        if (r.intro === "compile" || r.intro === "wipe") markIntro(null);
      };
      if (compileKind === "compile") {
        markIntro("compile");
        const q = (sel: string) => root.querySelector<HTMLElement>(sel);
        const tl = gsap.timeline({ onComplete: done });
        root.querySelectorAll<SVGPathElement>("[data-box]").forEach((p) => {
          const d = p.getAttribute("data-tight");
          if (d) tl.to(p, { attr: { d }, duration: 0.22, ease: EASE.pen }, 0);
        });
        const n = reading.length;
        reading.forEach((id, rank) => {
          const at = 0.1 + (n > 1 ? rank / (n - 1) : 0) * 0.2;
          const label = q(`[data-sk-label="${id}"]`);
          const box = root.querySelector(`[data-box="${id}"]`);
          const skin = q(`[data-node="${id}"] [data-skin]`);
          const face = q(`[data-node="${id}"] [data-face]`);
          if (label)
            tl.to(
              label,
              { opacity: 0, y: -3, duration: 0.12, ease: EASE.exit },
              at,
            );
          if (box)
            tl.to(
              box,
              { opacity: 0, duration: DUR.exit, ease: EASE.exit },
              at + 0.04,
            );
          const crisp = [skin, face].filter(Boolean) as HTMLElement[];
          if (crisp.length)
            tl.fromTo(
              crisp,
              { opacity: 0, scale: 0.97 },
              { opacity: 1, scale: 1, duration: DUR.ui, ease: EASE.arrive },
              at + 0.06,
            );
        });
        const edges = root.querySelector("[data-g=edges]");
        if (edges)
          tl.fromTo(
            edges,
            { opacity: 0.7 },
            { opacity: 1, duration: DUR.ui, ease: EASE.arrive },
            0.12,
          );
        r.introTl = tl;
        return release;
      }

      markIntro("wipe");
      const D = compileKind === "fast" ? WIPE_FAST : WIPE;
      const rows = plan.orientation === "rows";
      const { W, H } = geom;
      const over = WIPE_OVER;
      const span = (rows ? H : W) + over * 2;
      const crisp = gridRef.current;
      const sketchLayers = [boxesRef.current, labelsRef.current].filter(
        Boolean,
      ) as (HTMLElement | SVGSVGElement)[];
      const line = wipeRef.current;
      const p = { v: 0 };
      const apply = () => {
        const at = p.v * span - over;
        if (crisp)
          crisp.style.clipPath = rows
            ? `inset(${-over}px ${-over}px ${H - at}px ${-over}px)`
            : `inset(${-over}px ${W - at}px ${-over}px ${-over}px)`;
        const rest = rows
          ? `inset(${at}px ${-over}px ${-over}px ${-over}px)`
          : `inset(${-over}px ${-over}px ${-over}px ${at}px)`;
        sketchLayers.forEach((el) => {
          el.style.clipPath = rest;
        });
        if (line)
          line.style.transform = rows
            ? `translate3d(0, ${at.toFixed(1)}px, 0)`
            : `translate3d(${at.toFixed(1)}px, 0, 0)`;
      };
      apply();
      const ease = gsap.parseEase(EASE.pen);
      const tl = gsap.timeline({ onComplete: done });
      if (line)
        tl.fromTo(
          line,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.08, ease: EASE.arrive },
          0,
        );
      tl.to(p, { v: 1, duration: D, ease: EASE.pen, onUpdate: apply }, 0);
      if (line)
        tl.to(
          line,
          {
            autoAlpha: 0,
            duration: Math.min(DUR.exit, D * 0.3),
            ease: EASE.exit,
          },
          D * 0.8,
        );
      // each card settles as the line passes over its leading edge
      for (const id of reading) {
        const b = geom.boxes[id];
        if (!b) continue;
        const crossing = Math.min(
          1,
          Math.max(0, ((rows ? b.y : b.x) + over) / span),
        );
        const parts = root.querySelectorAll(
          `[data-node="${id}"] [data-skin], [data-node="${id}"] [data-face]`,
        );
        if (parts.length)
          tl.fromTo(
            parts,
            { scale: 0.97 },
            { scale: 1, duration: DUR.ui, ease: EASE.arrive },
            D * invertEase(ease, crossing),
          );
      }
      r.introTl = tl;
      return () => {
        release();
        if (crisp) crisp.style.clipPath = "";
        sketchLayers.forEach((el) => {
          el.style.clipPath = "";
        });
        if (line) line.style.transform = "";
      };
    },
    {
      scope: rootRef,
      dependencies: [phase, compileKind],
      revertOnUpdate: true,
    },
  );

  // ---- the journey ------------------------------------------------------------------------------
  const hops: Hop[] = useMemo(() => {
    const out: Hop[] = [];
    spec.steps.forEach((s, step) =>
      s.hops.forEach((h) =>
        out.push({ ...h, step, kind: s.kind, index: out.length }),
      ),
    );
    return out;
  }, [spec]);

  const report = useCallback((i: number) => {
    const root = rootRef.current;
    if (root) root.dataset.step = String(i);
    onStepRef.current?.(i);
  }, []);

  /** The first request is back (or this spec shipped before): journey 1, the stamp's cue, once. */
  const shipNow = useCallback(() => {
    const r = run.current;
    shippedSpecs.add(r.specId);
    if (r.count > 0) return;
    r.count = 1;
    const root = rootRef.current;
    if (root) root.dataset.journeys = "1";
    onJourneyRef.current?.(1);
  }, []);

  /**
   * Run / pause / hand over, from the run record: the first request plays while on screen in a
   * visible tab (it ignores hover, it is short); the loop also holds while someone is reading
   * (pointer over the diagram, a part hovered, focused or pinned: eased to a stop) and while
   * `paused`. Pausing keeps the playhead: play() resumes from there. Handing over never clears
   * the route: it lights whatever the first request had not reached yet (all of it when there was
   * none: a spec shipped earlier, a skip, the pause control).
   */
  const sync = useCallback(() => {
    const r = run.current;
    const root = rootRef.current;
    const running = (on: boolean) => {
      if (root) root.dataset.running = on ? "true" : "false";
    };
    if (!r.built) {
      running(false);
      return;
    }
    if (r.stage === "idle") {
      if (!r.live) {
        running(false);
        return;
      }
      if (r.first && r.count === 0 && !r.paused && !r.skip) {
        r.stage = "first";
        markIntro("first");
      } else r.stage = "enter";
    }
    if (r.stage === "first") {
      const tl = r.first;
      if (tl && !r.paused && !r.skip) {
        running(r.live);
        if (r.live) tl.play();
        else tl.pause();
        return;
      }
      // paused or skipped mid-way: straight to shipped (the stamp lands, the loop takes over)
      r.stage = "enter";
    }
    if (r.stage === "enter") {
      if (r.first) {
        r.first.eventCallback("onComplete", null);
        r.first.kill();
        r.first = null;
      }
      r.settle?.();
      r.light?.(r.live);
      r.stage = "loop";
      r.skip = false;
      if (r.intro) markIntro(null);
      shipNow();
      if (r.loop) report(0);
    }
    const tl = r.loop;
    const go = r.live && !r.paused && !r.holding;
    running(!!tl && go);
    if (!tl) return;
    r.scale?.kill();
    if (go) {
      tl.play();
      r.scale = gsap.to(tl, { timeScale: 1, duration: 0.4, ease: EASE.arrive });
    } else if (r.holding && r.live && !r.paused) {
      r.scale = gsap.to(tl, {
        timeScale: 0,
        duration: 0.3,
        ease: EASE.exit,
        onComplete: () => void tl.pause(),
      });
    } else {
      tl.pause();
    }
  }, [markIntro, report, shipNow]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const packet = packetRef.current;
      const r = run.current;
      r.first = null;
      r.loop = null;
      r.settle = null;
      r.light = null;
      r.stage = "idle";
      r.built = false;
      r.specId = spec.id;
      if (root) delete root.dataset.lit;
      if (phase !== "ship") {
        r.count = 0;
        if (root) delete root.dataset.journeys;
      }
      if (phase !== "ship" || reduced || !geom || !root || !packet) {
        if (phase === "ship" && r.intro) markIntro(null);
        sync();
        return;
      }
      if (!spec.steps.length) {
        // nothing travels: shipped as soon as someone sees it
        if (r.intro) markIntro(null);
        r.built = true;
        sync();
        return () => {
          r.built = false;
        };
      }
      const badges = spec.steps.map((_, i) =>
        root.querySelector<HTMLElement>(`[data-badge="${i}"]`),
      );
      const bands = spec.steps.map((_, i) =>
        root.querySelector<HTMLElement>(`[data-band="${i}"]`),
      );
      const traces = hops.map((h) =>
        root.querySelector<SVGPathElement>(`[data-trace="${h.index}"]`),
      );
      const lens = traces.map((p) => {
        try {
          return p ? Math.ceil(p.getTotalLength()) + 2 : 0;
        } catch {
          return 0;
        }
      });
      const rings: Record<string, HTMLElement | null> = {};
      for (const s of spec.steps)
        rings[s.node] ??= root.querySelector<HTMLElement>(
          `[data-node="${s.node}"] [data-pulse]`,
        );
      const badgeEls = badges.filter(Boolean) as HTMLElement[];
      const bandEls = bands.filter(Boolean) as HTMLElement[];
      const ringEls = Object.values(rings).filter(Boolean) as HTMLElement[];

      // The route starts unlit (set from JS only: without it the finished diagram renders):
      // traces undrawn, badges and bands hidden, no packet.
      if (badgeEls.length) gsap.set(badgeEls, { autoAlpha: 0, scale: 0.6 });
      if (bandEls.length) gsap.set(bandEls, { clipPath: BAND_HIDDEN });
      hops.forEach((h, i) => {
        const p = traces[i];
        if (!p) return;
        const rev = h.from !== geom.edges[h.edge]?.a;
        p.style.strokeDasharray = `${lens[i]} ${lens[i]}`;
        p.style.strokeDashoffset = `${rev ? -lens[i] : lens[i]}`;
      });
      gsap.set(packet, { autoAlpha: 0 });
      const markLit = () => {
        root.dataset.lit = "true";
      };

      /** The card the packet is inside gets an ink border. */
      const hot = (id: string | null) => {
        root
          .querySelectorAll("[data-hot]")
          .forEach((el) => el.removeAttribute("data-hot"));
        if (id)
          root
            .querySelector(`[data-node="${id}"]`)
            ?.setAttribute("data-hot", "");
      };
      const settle = () => {
        hot(null);
        gsap.set(packet, { autoAlpha: 0 });
      };
      r.settle = settle;

      // The whole route lit, from wherever it is (each tween reads its start when it first
      // renders): the traces ink in along the journey, the badges pop, the bands swipe (~0.8s).
      const lightTl = gsap.timeline({ paused: true, onComplete: markLit });
      traces.forEach((p, i) => {
        if (p)
          lightTl.to(
            p,
            { strokeDashoffset: 0, duration: 0.45, ease: EASE.pen },
            i * 0.05,
          );
      });
      spec.steps.forEach((_, si) => {
        const at = 0.12 + si * 0.08;
        if (badges[si])
          lightTl.to(
            badges[si],
            { autoAlpha: 1, scale: 1, duration: DUR.ui, ease: EASE.arrive },
            at,
          );
        if (bands[si])
          lightTl.to(
            bands[si],
            { clipPath: BAND_SHOWN, duration: 0.4, ease: EASE.pen },
            at + 0.04,
          );
      });
      r.light = (animate) => {
        if (animate) {
          lightTl.play(0);
          return;
        }
        lightTl.progress(1);
        markLit();
      };

      /**
       * The packet reached step `si`: the short ink pulse. Its card's border inks (until the packet
       * moves on), an ink ring breathes out once past the card's edge, its badge ticks. Fired from
       * the loop's callbacks (never replayed backwards when the loop wraps).
       */
      const arrive = (si: number) => {
        const id = spec.steps[si].node;
        hot(id);
        const ring = rings[id];
        const b = geom.boxes[id];
        if (ring && b) {
          gsap.fromTo(
            ring,
            { opacity: 0.6, scaleX: 1, scaleY: 1 },
            {
              opacity: 0,
              scaleX: 1 + (PULSE * 2) / b.w,
              scaleY: 1 + (PULSE * 2) / b.h,
              duration: 0.8,
              ease: EASE.arrive,
              overwrite: true,
            },
          );
        }
        const badge = badges[si];
        if (badge)
          gsap.fromTo(
            badge,
            { scale: 1.3 },
            { scale: 1, duration: 0.45, ease: EASE.arrive, overwrite: "auto" },
          );
      };

      /** The stretch of its edge a hop's packet travels: the visible edge, sliding under both cards. */
      const leg = (h: Hop) => {
        const e = geom.edges[h.edge];
        if (!e) return null;
        const rev = h.from !== e.a;
        const tr = e.track;
        const span = Math.max(1, tr.visEnd - tr.visStart);
        const vis0 = rev ? tr.total - tr.visEnd : tr.visStart;
        return {
          tr,
          rev,
          span,
          vis0,
          from: Math.max(0, vis0 - SLIDE),
          to: Math.min(tr.total, vis0 + span + SLIDE),
        };
      };
      /** Seconds the packet travels to reach step `si` at `pace`. */
      const travel = (si: number, pace: Pace) => {
        const list = hops.filter((h) => h.step === si);
        let d = 0;
        list.forEach((h, k) => {
          const g = leg(h);
          if (g)
            d +=
              pace.hop(g.to - g.from) +
              (k < list.length - 1 ? pace.through : 0);
        });
        return d;
      };

      /** One journey into `tl` at `pace`; returns the time the last step is marked. */
      const build = (tl: gsap.core.Timeline, pace: Pace): number => {
        let t = pace.start;
        let shown = false;
        const last = spec.steps.length - 1;
        for (let si = 0; si <= last; si++) {
          const step = spec.steps[si];
          const list = hops.filter((h) => h.step === si);
          // the request starts inside the first card it leaves from (a beat, then it sets off)
          if (si === 0 && list.length && pace.lead) {
            if (pace.ink) tl.call(hot, [list[0].from], t);
            t += pace.lead;
          }
          list.forEach((h, k) => {
            const g = leg(h);
            if (!g) return;
            const { tr, rev, span, vis0, from, to } = g;
            // the first request inks the route in behind it; the loop rides the lit route
            const trace = pace.light ? traces[h.index] : null;
            const L = lens[h.index];
            const dur = pace.hop(to - from);
            const proxy = { s: from };
            tl.call(
              () => {
                packet.dataset.kind = step.kind;
                if (pace.ink) hot(null);
              },
              [],
              t,
            );
            if (!shown) {
              tl.set(packet, { autoAlpha: 1 }, t);
              shown = true;
            }
            tl.fromTo(
              proxy,
              { s: from },
              {
                s: to,
                duration: dur,
                ease: EASE.pen,
                onUpdate: () => {
                  const pt = trackPoint(tr, proxy.s, rev);
                  packet.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0) rotate(${pt.a.toFixed(3)}rad)`;
                  if (trace && L) {
                    const f = Math.min(1, Math.max(0, (proxy.s - vis0) / span));
                    trace.style.strokeDashoffset = `${(rev ? -1 : 1) * L * (1 - f)}`;
                  }
                },
              },
              t,
            );
            t += dur;
            if (k < list.length - 1) {
              // passing through a service on the way
              if (pace.ink) tl.call(hot, [h.to], t);
              t += pace.through;
            }
          });
          tl.call(report, [si], t);
          if (pace.ink) tl.call(arrive, [si], t);
          if (pace.light) {
            const b = badges[si];
            const band = bands[si];
            if (b)
              tl.fromTo(
                b,
                { autoAlpha: 0, scale: 0.6 },
                { autoAlpha: 1, scale: 1, duration: 0.2, ease: EASE.arrive },
                t,
              );
            if (band)
              tl.fromTo(
                band,
                { clipPath: BAND_HIDDEN },
                { clipPath: BAND_SHOWN, duration: 0.26, ease: EASE.pen },
                t + 0.06,
              );
          }
          // a step holds until the next one is due: never sooner than `hold` after it was reported
          if (si < last)
            t += Math.max(pace.dwell, pace.hold - travel(si + 1, pace));
        }
        return t;
      };

      // THE LOOP: packets only, over the lit route (nothing it lights is ever cleared)
      const loop = gsap.timeline({
        paused: true,
        repeat: -1,
        onRepeat: settle,
      });
      loop.call(settle, [], 0.01);
      let t = build(loop, READ);
      loop.call(
        () => {
          r.count += 1;
          root.dataset.journeys = String(r.count);
          onJourneyRef.current?.(r.count);
        },
        [],
        t + 0.5,
      );
      t += DWELL_END;
      loop.call(settle, [], t);
      loop.set({}, {}, t + REST);
      r.loop = loop;

      // the first request of a first reveal: the whole route at speed, inked in for good, then
      // the stamp's cue
      if (!shippedSpecs.has(spec.id) && r.count === 0) {
        const first = gsap.timeline({
          paused: true,
          onComplete: () => {
            r.stage = "enter";
            sync();
          },
        });
        let f = build(first, FIRST);
        first.call(shipNow, [], f + 0.04);
        first.to(
          packet,
          { autoAlpha: 0, duration: DUR.exit, ease: EASE.exit },
          f + 0.12,
        );
        first.call(markLit, [], f + 0.34);
        f += FIRST_HOLD;
        first.set({}, {}, f + FIRST_REST);
        r.first = first;
      }

      r.built = true;
      // the reveal's last step: the first request is pending (a click still skips it), or done
      if (r.first && r.count === 0 && !r.skip) markIntro("first");
      else if (r.intro) markIntro(null);
      sync();
      return () => {
        r.scale?.kill();
        r.first = null;
        r.loop = null;
        r.settle = null;
        r.light = null;
        r.built = false;
        r.stage = "idle";
        if (r.intro === "first") markIntro(null);
        // the pulses and ticks run outside the context (fired from callbacks): end them here
        gsap.killTweensOf([...ringEls, ...badgeEls]);
        [...ringEls, ...badgeEls, ...bandEls].forEach((el) =>
          el.removeAttribute("style"),
        );
        root
          .querySelectorAll("[data-hot]")
          .forEach((el) => el.removeAttribute("data-hot"));
        traces.forEach((p) => {
          if (!p) return;
          p.style.strokeDasharray = "";
          p.style.strokeDashoffset = "";
        });
        packet.style.transform = "";
        delete root.dataset.lit;
      };
    },
    {
      scope: rootRef,
      dependencies: [
        phase,
        reduced,
        geom,
        spec,
        hops,
        sync,
        shipNow,
        markIntro,
        report,
      ],
      revertOnUpdate: true,
    },
  );

  // ---- inspect (hover / keyboard focus / pin) -----------------------------------------------------
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [pinId, setPinId] = useState<string | null>(null);
  const inspect = hoverId ?? focusId ?? pinId;
  const [tabStop, setTabStop] = useState<string | null>(null);
  const stop = tabStop && spec.nodes[tabStop] ? tabStop : (reading[0] ?? null);
  /** A mouse / pen pointer is over the diagram (someone is reading it). */
  const [over, setOver] = useState(false);
  // Keyboard focus inside the diagram is a focused part (`focusId`, :focus-visible only, so a
  // click's leftover focus never holds the loop once the pointer has gone).
  const hold = inspect !== null ? "inspect" : over ? "hover" : null;

  // run / pause: on screen in a visible tab (the gate), not paused, nobody reading
  useEffect(() => {
    const r = run.current;
    r.live = live;
    r.paused = paused;
    r.holding = hold !== null;
    const root = rootRef.current;
    if (root) {
      root.dataset.gate = live ? "on" : "off";
      if (hold) root.dataset.hold = hold;
      else delete root.dataset.hold;
    }
    sync();
  }, [live, paused, hold, sync]);

  // a tap / click anywhere outside the diagram lets go of the pinned part
  useEffect(() => {
    if (!pinId) return;
    const off = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setPinId(null);
    };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [pinId]);

  /**
   * A click / tap / Enter during the reveal skips it (the visitor asked for sketch mode: no).
   * Returns true when it did, so the same click does not also pin a part.
   */
  const trySkip = (): boolean => {
    if (sketchMode || reduced) return false;
    const r = run.current;
    if (!r.intro) return false;
    r.skip = true;
    if (r.intro === "first") sync();
    else r.introTl?.progress(1);
    return true;
  };

  /** The empty sheet: skips the reveal, else lets go of the pinned part. */
  const onSheetClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest?.("[data-node]")) return;
    if (trySkip()) return;
    setPinId(null);
  };

  const related = useMemo(
    () => (inspect ? neighbours(spec, inspect) : null),
    [spec, inspect],
  );

  const onNodeKey = (e: ReactKeyboardEvent<HTMLButtonElement>, id: string) => {
    const ti = plan.trackOf[id];
    const row = plan.tracks[ti] ?? [];
    const i = row.indexOf(id);
    const rows = plan.orientation === "rows";
    const crossPrev = rows ? "ArrowLeft" : "ArrowUp";
    const crossNext = rows ? "ArrowRight" : "ArrowDown";
    const mainPrev = rows ? "ArrowUp" : "ArrowLeft";
    const mainNext = rows ? "ArrowDown" : "ArrowRight";
    let next: string | null = null;
    if (e.key === "Escape") {
      if (pinId) {
        e.preventDefault();
        setPinId(null);
      }
      return;
    }
    if (e.key === crossPrev) next = row[i - 1] ?? null;
    else if (e.key === crossNext) next = row[i + 1] ?? null;
    else if (e.key === mainPrev || e.key === mainNext) {
      const other = plan.tracks[ti + (e.key === mainNext ? 1 : -1)];
      if (other?.length) {
        const me = geom?.boxes[id];
        const centre = (b?: Box) =>
          b ? (rows ? b.x + b.w / 2 : b.y + b.h / 2) : 0;
        next = me
          ? other.reduce(
              (best, n) =>
                Math.abs(centre(geom?.boxes[n]) - centre(me)) <
                Math.abs(centre(geom?.boxes[best]) - centre(me))
                  ? n
                  : best,
              other[0],
            )
          : other[0];
      }
    } else if (e.key === "Home") next = reading[0] ?? null;
    else if (e.key === "End") next = reading[reading.length - 1] ?? null;
    else return;
    e.preventDefault();
    if (next) {
      setTabStop(next);
      buttons.current[next]?.focus();
    }
  };

  // The note goes where it buries nothing: never its own card, no other card if it can help it
  // (dimmed or not), not over its card's own ink edges, as close to its card as that allows
  // (placeNote). Where the cards are dense it becomes a one-line strip that fits a lane gap.
  const [note, setNote] = useState<{
    x: number;
    y: number;
    line: boolean;
  } | null>(null);
  const noteBox = inspect && geom ? geom.boxes[inspect] : null;
  useLayoutEffect(() => {
    const el = noteRef.current;
    if (!el || !noteBox || !geom || !inspect) {
      setNote(null);
      return;
    }
    // measure both shapes (data-fit drives the CSS; the chosen one is put back below)
    const measure = (fit: "wrap" | "line") => {
      el.dataset.fit = fit;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // the tilt widens the box a little: keep that clear too
      const a =
        (Math.abs(fit === "line" ? NOTE_TILT_LINE : NOTE_TILT) * Math.PI) / 180;
      return {
        w,
        h,
        bw: w * Math.cos(a) + h * Math.sin(a),
        bh: h * Math.cos(a) + w * Math.sin(a),
      };
    };
    const wrap = measure("wrap");
    const line = measure("line");
    const avoid = related
      ? [...related.edges].flatMap((id) =>
          geom.edges[id] ? [visiblePoints(geom.edges[id].track)] : [],
        )
      : [];
    const best = placeNote({
      W: geom.W,
      H: geom.H,
      node: noteBox,
      inspect,
      boxes: geom.boxes,
      near: related?.nodes ?? new Set<string>(),
      sizes: [
        { w: wrap.bw, h: wrap.bh },
        { w: line.bw, h: line.bh },
      ],
      avoid,
    });
    const m = best.size === 1 ? line : wrap;
    const next = {
      x: best.x + (m.bw - m.w) / 2,
      y: best.y + (m.bh - m.h) / 2,
      line: best.size === 1,
    };
    el.dataset.fit = next.line ? "line" : "wrap";
    setNote((p) =>
      p &&
      p.line === next.line &&
      Math.abs(p.x - next.x) < 0.5 &&
      Math.abs(p.y - next.y) < 0.5
        ? p
        : next,
    );
  }, [noteBox, geom, inspect, related]);

  // ---- render -------------------------------------------------------------------------------------
  const rootStyle = {
    ...T.vars,
    ...(fill ? { height: "100%" } : null),
  } as CSSProperties;
  const gridStyle: CSSProperties =
    plan.orientation === "rows"
      ? {
          gridTemplateRows: plan.templateLanes,
          gridTemplateColumns: plan.templateSlots,
          columnGap: "var(--dg-gap)",
          height: fill ? "100%" : undefined,
        }
      : {
          gridTemplateColumns: plan.templateLanes,
          gridTemplateRows: plan.templateSlots,
          rowGap: "var(--dg-gap)",
          height: fill ? "100%" : undefined,
        };
  const groupLabel = `${spec.name} architecture: ${reading.length} parts in ${spec.lanes.filter((l) => l.nodes.length).length} layers. Arrow keys move between parts; Enter pins a part.`;
  /**
   * What happens at a node, from the content: the flow steps it hosts; else the steps whose request
   * passes through it; else the layer's note; else the layer's name.
   */
  const noteFor = (id: string, spoken = false): string[] => {
    const n = spec.nodes[id];
    const here = stepsAt(spec, id);
    if (here.length)
      return here.map((s) =>
        spoken
          ? `Step ${s.index + 1} of ${spec.steps.length}: ${s.text}${s.note ? `, ${s.note}` : ""}`
          : `${s.index + 1} · ${s.note ?? s.text}`,
      );
    const via = passesThrough(spec, id);
    if (via.length) {
      const nums = via.map((i) => i + 1);
      const list =
        nums.length > 1
          ? `${nums.slice(0, -1).join(", ")} and ${nums[nums.length - 1]}`
          : `${nums[0]}`;
      return [
        spoken
          ? `${n.layer} layer. Requests pass through here in step${nums.length > 1 ? "s" : ""} ${list}: ${via.map((i) => spec.steps[i].text).join("; ")}.`
          : `on the way in step${nums.length > 1 ? "s" : ""} ${list}`,
      ];
    }
    return [n.note ?? `${n.layer} layer`];
  };
  const noteKind = inspect ? stepsAt(spec, inspect).at(-1)?.kind : undefined;
  const wiping = phase === "compiling" && compileKind !== "compile";
  const rows = plan.orientation === "rows";

  // The sheet's own click only skips the reveal / lets go of a pin (pointer convenience): the parts
  // are the buttons, and they skip / pin from the keyboard too.
  return (
    <div
      ref={rootRef}
      data-qa="diagram"
      data-diagram={spec.id}
      data-state={wiping ? "wiping" : phase}
      data-orientation={plan.orientation}
      data-tier={tier}
      data-inspect={inspect ?? undefined}
      data-pinned={pinId ?? undefined}
      data-paused={paused ? "true" : undefined}
      onClick={onSheetClick}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse" || e.pointerType === "pen") setOver(true);
      }}
      onPointerLeave={() => setOver(false)}
      className={`group/dg relative ${fill ? "h-full" : ""} ${className ?? ""}`}
      style={rootStyle}
    >
      {/* edges and ink traces (decorative) */}
      <svg
        ref={svgRef}
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        viewBox={geom ? `0 0 ${geom.W} ${geom.H}` : undefined}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {geom ? (
          <>
            <g data-g="edges">
              {spec.edges.map((e) => {
                const g = geom.edges[e.id];
                if (!g) return null;
                const rel = related
                  ? related.edges.has(e.id)
                    ? "1"
                    : "0"
                  : undefined;
                const link = e.kind === "link";
                return (
                  <path
                    key={e.id}
                    data-edge={e.id}
                    data-rel={rel}
                    {...(link ? { "data-link": "" } : { "data-stroke": "" })}
                    d={g.rough}
                    stroke="currentColor"
                    strokeWidth={link ? 1.4 : 1.5}
                    strokeDasharray={link ? "2 6" : undefined}
                    className={`${link ? "text-pencil" : "text-graphite group-data-[state=sketch]/dg:text-pencil"} transition-[opacity,color] duration-(--dur-feedback) ease-arrive data-[rel=0]:opacity-35 data-[rel=1]:text-ink`}
                  />
                );
              })}
            </g>
            <g
              data-g="traces"
              className="group-data-[state=compiling]/dg:invisible group-data-[state=sketch]/dg:invisible group-data-[state=wiping]/dg:invisible"
            >
              {hops.map((h) => {
                const g = geom.edges[h.edge];
                if (!g) return null;
                const rel = related
                  ? related.edges.has(h.edge)
                    ? "1"
                    : "0"
                  : undefined;
                return (
                  <path
                    key={h.index}
                    data-trace={h.index}
                    data-rel={rel}
                    d={g.line}
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-ink transition-opacity duration-(--dur-feedback) ease-arrive data-[rel=0]:opacity-35"
                  />
                );
              })}
            </g>
          </>
        ) : null}
      </svg>

      {/* the pencil boxes (decorative; their own layer so the cross-wipe can clip them) */}
      <svg
        ref={boxesRef}
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 size-full overflow-visible group-data-[state=ship]/dg:invisible"
        viewBox={geom ? `0 0 ${geom.W} ${geom.H}` : undefined}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {geom ? (
          <g data-g="boxes">
            {reading.map((id) => {
              const s = geom.sketch[id];
              return s ? (
                <path
                  key={id}
                  data-box={id}
                  data-stroke=""
                  d={s.rough}
                  data-tight={s.tight}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-ink/75"
                />
              ) : null;
            })}
          </g>
        ) : null}
      </svg>

      {/* the packet (painted below the cards, so it slides under them at every node) */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span
          ref={packetRef}
          data-qa="diagram-packet"
          data-kind="request"
          className="invisible absolute top-0 left-0 -mt-[6px] -ml-[11px] block h-[12px] w-[22px] rounded-pill border-[1.5px] border-ink opacity-0 will-change-transform data-[kind=data]:bg-blue data-[kind=request]:bg-lime data-[kind=response]:bg-tangerine"
        />
      </span>

      {/* the nodes: real buttons, laid out by the grid */}
      <div
        ref={gridRef}
        role="group"
        aria-label={groupLabel}
        className="grid p-(--dg-pad)"
        style={gridStyle}
      >
        {reading.map((id) => {
          const n = spec.nodes[id];
          const here = stepsAt(spec, id);
          const rel = related ? (related.nodes.has(id) ? "1" : "0") : undefined;
          const pinned = pinId === id;
          const area = plan.area[id];
          const nodeStyle: CSSProperties =
            plan.orientation === "rows"
              ? plan.alone[id]
                ? // alone in its track: at least one slot wide, wider (up to the max) when its label needs it
                  {
                    ...area,
                    justifySelf: "center",
                    width: "fit-content",
                    minWidth: `min(100%, var(--dg-node-max), calc((100% + var(--dg-gap)) / ${plan.spanSlots[id] ?? plan.slots} - var(--dg-gap)))`,
                    maxWidth: "min(100%, var(--dg-node-max))",
                  }
                : {
                    ...area,
                    justifySelf: "center",
                    width: "min(100%, var(--dg-node-max))",
                  }
              : { ...area, alignSelf: "center" };
          return (
            <button
              key={id}
              ref={(el) => {
                buttons.current[id] = el;
              }}
              type="button"
              data-node={id}
              data-qa="diagram-node"
              data-layer={n.layer}
              data-rel={rel}
              data-insp={inspect === id ? "1" : undefined}
              data-pinned={pinned ? "" : undefined}
              data-cursor="blue"
              aria-pressed={pinned}
              aria-describedby={`${uid}-d-${id}`}
              tabIndex={id === stop ? 0 : -1}
              onClick={() => {
                if (trySkip()) return;
                setPinId((p) => (p === id ? null : id));
              }}
              onKeyDown={(e) => onNodeKey(e, id)}
              onFocus={(e) => {
                setTabStop(id);
                if (e.currentTarget.matches(":focus-visible")) setFocusId(id);
              }}
              onBlur={() => setFocusId((f) => (f === id ? null : f))}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse" || e.pointerType === "pen")
                  setHoverId(id);
              }}
              onPointerLeave={() => setHoverId((h) => (h === id ? null : h))}
              className="group/node relative flex min-w-0 flex-col justify-center rounded-chip px-(--dg-px) py-(--dg-py) text-left transition-opacity duration-(--dur-feedback) ease-arrive coarse:min-h-11 data-[rel=0]:opacity-35"
              style={nodeStyle}
            >
              <span
                data-skin=""
                aria-hidden="true"
                className="absolute inset-0 rounded-chip border border-line bg-card shadow-card transition-[border-color,box-shadow] duration-(--dur-feedback) ease-arrive group-aria-pressed/node:border-ink group-aria-pressed/node:shadow-lift group-data-[hot]/node:border-ink group-data-[insp=1]/node:border-ink group-data-[state=compiling]/dg:opacity-0 group-data-[state=sketch]/dg:opacity-0"
              />
              {here.length ? (
                // the ink pulse: a ring that breathes out once when the packet reaches this step
                <span
                  data-pulse=""
                  data-qa="diagram-pulse"
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-chip border-2 border-ink opacity-0"
                />
              ) : null}
              <span
                data-face=""
                className="relative flex min-w-0 flex-col gap-0.5 group-data-[state=compiling]/dg:opacity-0 group-data-[state=sketch]/dg:opacity-0"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-micro font-medium tracking-[0.08em] text-graphite uppercase">
                    {n.micro}
                  </span>
                  {here.length ? (
                    <span aria-hidden="true" className="flex shrink-0 gap-1">
                      {here.map((s) => (
                        <span
                          key={s.index}
                          data-badge={s.index}
                          className={`grid size-4 place-items-center rounded-full border border-ink font-mono text-micro leading-none tabular-nums group-data-[state=compiling]/dg:invisible group-data-[state=sketch]/dg:invisible group-data-[state=wiping]/dg:invisible ${BADGE[s.kind]}`}
                        >
                          {s.index + 1}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`relative max-w-full self-start font-sans leading-tight font-semibold text-pretty text-ink ${T.label}`}
                >
                  {here.map((s) => (
                    <span
                      key={s.index}
                      data-band={s.index}
                      aria-hidden="true"
                      className="absolute inset-0 text-transparent select-none group-data-[state=compiling]/dg:invisible group-data-[state=sketch]/dg:invisible group-data-[state=wiping]/dg:invisible"
                    >
                      <span
                        className={`-mx-[0.12em] box-decoration-clone bg-no-repeat px-[0.12em] [background-position:0_88%] [background-size:100%_0.62em] ${BAND[s.kind]}`}
                      >
                        {n.label}
                      </span>
                    </span>
                  ))}
                  <span className="relative">{n.label}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* the sketch labels (Caveat), at the boxes */}
      {geom ? (
        <div
          ref={labelsRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 group-data-[state=ship]/dg:invisible"
        >
          {reading.map((id) => {
            const b = geom.boxes[id];
            if (!b) return null;
            return (
              <span
                key={id}
                data-sk-label={id}
                className="type-hand-sm absolute flex items-center justify-center px-1.5 text-center leading-[1.05] text-ink"
                style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
              >
                {spec.nodes[id].label}
              </span>
            );
          })}
        </div>
      ) : null}

      {/* the cross-wipe's pencil line, riding the edge between sketch and shipped */}
      {wiping && geom ? (
        <svg
          ref={wipeRef}
          data-qa="diagram-wipe"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none invisible absolute top-0 left-0 overflow-visible text-ink opacity-0"
          width={rows ? geom.W : 12}
          height={rows ? 12 : geom.H}
          viewBox={rows ? `0 -6 ${geom.W} 12` : `-6 0 12 ${geom.H}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={rows ? { marginTop: -6 } : { marginLeft: -6 }}
        >
          <path
            d={
              rows
                ? roughLine([6, 0], [geom.W - 6, 0], {
                    seed: `${spec.id}-wipe`,
                    passes: 2,
                  })
                : roughLine([0, 6], [0, geom.H - 6], {
                    seed: `${spec.id}-wipe`,
                    passes: 2,
                  })
            }
            stroke="currentColor"
            strokeWidth={2}
            strokeOpacity={0.85}
          />
        </svg>
      ) : null}

      {/* the handwritten note of the inspected node (wrap: the natural note; line: a one-line strip
          for a lane gap, its lines run on with a dot between them) */}
      {inspect && noteBox ? (
        <p
          ref={noteRef}
          data-qa="diagram-note"
          data-fit={note?.line ? "line" : "wrap"}
          data-pinned={pinId && inspect === pinId ? "" : undefined}
          aria-hidden="true"
          className={`group/note type-hand-sm pointer-events-none absolute z-(--z-raised) w-max max-w-[min(17rem,90%)] rounded-chip border border-ink/15 px-3 py-1 text-center text-ink shadow-lift data-[fit=line]:max-w-none data-[fit=line]:py-0 data-[fit=line]:leading-[1.1] data-[fit=line]:whitespace-nowrap ${noteKind ? NOTE_BG[noteKind] : "bg-card"}`}
          style={{
            left: note?.x ?? noteBox.x,
            top: note?.y ?? noteBox.y + noteBox.h + 6,
            rotate: `${note?.line ? NOTE_TILT_LINE : NOTE_TILT}deg`,
            visibility: note ? undefined : "hidden",
          }}
        >
          {noteFor(inspect).map((line, i) => (
            <span
              key={line}
              className="block group-data-[fit=line]/note:inline"
            >
              {i > 0 ? (
                <span className="hidden px-2 text-graphite group-data-[fit=line]/note:inline">
                  ·
                </span>
              ) : null}
              {line}
            </span>
          ))}
        </p>
      ) : null}

      {/* the DOM equivalent: descriptions of every part, and the journey in order */}
      <div className="sr-only">
        {reading.map((id) => (
          <span key={id} id={`${uid}-d-${id}`}>
            {noteFor(id, true).join(". ")}
          </span>
        ))}
        {spec.steps.length ? (
          <ol aria-label={`One request through ${spec.name}`}>
            {spec.steps.map((s, i) => (
              <li key={i}>
                Step {i + 1} of {spec.steps.length}: {s.text}, at{" "}
                {spec.nodes[s.node].label} ({spec.nodes[s.node].layer} layer,{" "}
                {KIND_WORD[s.kind]}).
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
