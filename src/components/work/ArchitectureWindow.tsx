"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Project } from "@/content";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { useInView } from "@/lib/hooks/useInView";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { AppWindow, IconButton } from "@/components/ui";
import { Pause, Play } from "@/components/icons";
import { drawOn, hideStrokes, showStrokes } from "@/components/sketch";
import {
  roughArrow,
  roughCircle,
  roughLine,
  roughRect,
  tight,
} from "@/components/sketch/rough";
import {
  SystemDiagram,
  hasDrawn,
  projectDiagram,
  type DiagramPhase,
  type PacketKind,
} from "@/components/diagram";
import { usePlayGate } from "@/components/diagram/playGate";
import { FlowNote } from "./parts";

/**
 * 03 SELECTED WORK, the architecture side of a project (lazy chunk: loaded on the first switch to
 * "Architecture", or warmed when the switch is hovered / the stage is on screen).
 *
 * - ArchitectureWindow: an app window (`<id> — architecture`) whose body is the living diagram on
 *   a dotted canvas. Its chrome has a pencil twin that draws with the diagram's sketch (the same
 *   play gate: once it is on screen; never again once the diagram has drawn this session) and
 *   compiles with it; the SHIPPED stamp lands once the first request has made the full journey.
 * - Narration: the line under the window: a pause control, the journey's steps as dots in their
 *   packet colours, and the current step handwritten (Caveat). Static numbered flow with reduced
 *   motion / sketch mode.
 * - ArchitectureCard: the window + narration for the stacked cards (vertical, height from content).
 */

type FrameGeom = {
  key: string;
  W: number;
  H: number;
  paths: { d: string; t: string; sw: number; tone: string }[];
  title: { x: number; y: number; h: number } | null;
};

/** Layout box of `el` relative to `root` (offset chain: transforms such as the tilt are ignored). */
function boxIn(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    const p = n.offsetParent as HTMLElement | null;
    if (!p) return null;
    if (p !== root) {
      x += p.clientLeft;
      y += p.clientTop;
    }
    n = p;
  }
  return n === root ? { x, y, w: el.offsetWidth, h: el.offsetHeight } : null;
}

const CLIP_HIDDEN = "inset(-30% 106% -30% -6%)";
const CLIP_SHOWN = "inset(-30% 0% -30% -6%)";

/** The crisp chrome turns transparent while the window is a sketch (its pencil twin shows). */
const CHROME = [
  "transition-[background-color,border-color,box-shadow] duration-(--dur-ui) ease-arrive",
  "[&_.aw-panel]:transition-[background-color,border-color] [&_.aw-panel]:duration-(--dur-ui) [&_.aw-panel]:ease-arrive",
  "[&_.aw-bar]:transition-[border-color] [&_.aw-bar]:duration-(--dur-ui)",
  "[&_.aw-dots]:transition-opacity [&_.aw-dots]:duration-(--dur-ui) [&_.aw-title]:transition-opacity [&_.aw-title]:duration-(--dur-ui)",
  "group-data-[chrome=sketch]/arch:border-transparent group-data-[chrome=sketch]/arch:bg-transparent group-data-[chrome=sketch]/arch:shadow-none",
  "group-data-[chrome=sketch]/arch:[&_.aw-panel]:border-transparent group-data-[chrome=sketch]/arch:[&_.aw-panel]:bg-transparent",
  "group-data-[chrome=sketch]/arch:[&_.aw-bar]:border-transparent",
  "group-data-[chrome=sketch]/arch:[&_.aw-dots]:opacity-0 group-data-[chrome=sketch]/arch:[&_.aw-title]:opacity-0",
].join(" ");

export function ArchitectureWindow({
  project,
  state = "ship",
  fit = "fill",
  paused = false,
  onStep,
  className,
}: {
  project: Project;
  /** Controlled: "sketch" draws, "sketch" -> "ship" compiles and starts the journey. */
  state?: "sketch" | "ship";
  /** fill: a 16:11 window (the stage). auto: height from the diagram (the cards). */
  fit?: "fill" | "auto";
  paused?: boolean;
  onStep?: (index: number) => void;
  className?: string;
}) {
  const spec = projectDiagram(project);
  const reduced = useReducedMotion();
  const { on: sketchMode } = useSketchMode();
  const [phase, setPhase] = useState<DiagramPhase>(() =>
    sketchMode || state === "sketch" ? "sketch" : "ship",
  );
  const title = `${project.id} — architecture`;

  const rootRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState<FrameGeom | null>(null);

  // the pencil twin of the chrome, measured from the crisp window
  useLayoutEffect(() => {
    const root = rootRef.current;
    const win = winRef.current;
    if (!root || !win) return;
    const measure = () => {
      const panel = win.querySelector<HTMLElement>(".aw-panel");
      const bar = win.querySelector<HTMLElement>(".aw-bar");
      const tEl = win.querySelector<HTMLElement>(".aw-title");
      const outer = boxIn(win, root);
      const p = panel ? boxIn(panel, root) : null;
      const b = bar ? boxIn(bar, root) : null;
      if (!outer || !p || !b) return;
      const key = `${outer.w}x${outer.h}|${p.x},${p.y},${p.w},${p.h}|${b.h}`;
      setFrame((prev) => {
        if (prev?.key === key) return prev;
        const seed = `arch-${project.id}`;
        const paths: FrameGeom["paths"] = [];
        const rect = (
          bx: typeof outer,
          r: number,
          s: string,
          sw: number,
          tone: string,
        ) => {
          const o = { seed: `${seed}-${s}`, radius: r, passes: 2 as const };
          const x = bx.x + sw / 2;
          const y = bx.y + sw / 2;
          const w = bx.w - sw;
          const h = bx.h - sw;
          paths.push({
            d: roughRect(x, y, w, h, o),
            t: roughRect(x, y, w, h, tight(o)),
            sw,
            tone,
          });
        };
        rect(outer, 26, "frame", 1.6, "text-pencil");
        rect(p, 16, "panel", 1.5, "text-ink/75");
        const ly = b.y + b.h;
        const lo = { seed: `${seed}-bar`, passes: 1 as const };
        paths.push({
          d: roughLine([p.x + 8, ly], [p.x + p.w - 8, ly - 1], lo),
          t: roughLine([p.x + 8, ly], [p.x + p.w - 8, ly - 1], tight(lo)),
          sw: 1.4,
          tone: "text-ink/75",
        });
        win.querySelectorAll<HTMLElement>(".aw-dot").forEach((dot, i) => {
          const d = boxIn(dot, root);
          if (!d) return;
          const co = { seed: `${seed}-dot-${i}`, passes: 1 as const };
          const r = d.w / 2;
          paths.push({
            d: roughCircle(d.x + r, d.y + r, r, co),
            t: roughCircle(d.x + r, d.y + r, r, { ...co, roughness: 0 }),
            sw: 1.3,
            tone: "text-ink/75",
          });
        });
        const tb = tEl ? boxIn(tEl, root) : null;
        return {
          key,
          W: root.offsetWidth,
          H: root.offsetHeight,
          paths,
          title: tb ? { x: tb.x, y: tb.y, h: tb.h } : null,
        };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [project.id]);

  // The chrome sketch draws with the diagram's: when the window is on screen (the diagram's own
  // gate, so an off-screen card waits with its strokes hidden), once; a spec the diagram already
  // drew this session (read at mount: the diagram marks it the moment it starts) is just there.
  const live = usePlayGate(rootRef, { threshold: 0.2 });
  const [drawnBefore] = useState(() => hasDrawn(spec.id));
  const drawn = useRef(false);
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (phase !== "sketch" || !frame || !svg) return;
    if (reduced || drawn.current || drawnBefore) {
      showStrokes(svg);
      return;
    }
    if (!live) {
      const t = titleRef.current;
      hideStrokes(svg);
      if (t) gsap.set(t, { clipPath: CLIP_HIDDEN });
      return () => {
        showStrokes(svg);
        if (t) gsap.set(t, { clearProps: "clipPath" });
      };
    }
    drawn.current = true;
    const tl = gsap.timeline();
    tl.add(drawOn(svg, { duration: DUR.draw }), 0);
    if (titleRef.current)
      tl.fromTo(
        titleRef.current,
        { clipPath: CLIP_HIDDEN },
        { clipPath: CLIP_SHOWN, duration: 0.4, ease: EASE.pen },
        0.2,
      );
    return () => {
      tl.progress(1).kill();
      showStrokes(svg);
      if (titleRef.current)
        gsap.set(titleRef.current, { clearProps: "clipPath" });
    };
  }, [phase, frame, reduced, live, drawnBefore]);

  // the chrome compiles with the diagram: strokes tighten and leave, the crisp chrome fades in (CSS)
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (phase !== "compiling" || !svg) return;
    const paths = Array.from(
      svg.querySelectorAll<SVGPathElement>("path[data-tight]"),
    );
    const tl = gsap.timeline();
    paths.forEach((p) => {
      const t = p.getAttribute("data-tight");
      if (t) tl.to(p, { attr: { d: t }, duration: 0.22, ease: EASE.pen }, 0);
    });
    tl.to(svg, { opacity: 0, duration: DUR.exit, ease: EASE.exit }, 0.18);
    if (titleRef.current)
      tl.to(
        titleRef.current,
        { opacity: 0, duration: DUR.feedback, ease: EASE.exit },
        0.08,
      );
    return () => {
      tl.kill();
      paths.forEach((p) => {
        const d = p.getAttribute("data-rough");
        if (d) p.setAttribute("d", d);
      });
      gsap.set([svg, titleRef.current].filter(Boolean), {
        clearProps: "opacity",
      });
    };
  }, [phase]);

  const chrome = phase === "sketch" ? "sketch" : "ship";
  return (
    <div
      ref={rootRef}
      data-qa="arch-window"
      data-project={project.id}
      data-state={phase}
      data-chrome={chrome}
      className={`group/arch relative ${fit === "fill" ? "size-full" : "w-full"} ${className ?? ""}`}
    >
      <AppWindow
        ref={winRef}
        title={title}
        ratio={fit === "fill" ? "16 / 11" : null}
        seed={`arch-${project.id}`}
        className={`${fit === "fill" ? "size-full" : ""} ${CHROME}`}
        bodyClassName="bg-paper paper-dots transition-[background-color] duration-(--dur-ui) ease-arrive group-data-[chrome=sketch]/arch:bg-transparent group-data-[chrome=sketch]/arch:bg-none"
      >
        <SystemDiagram
          spec={spec}
          state={state}
          fit={fit}
          paused={paused}
          onStep={onStep}
          onPhase={setPhase}
        />
      </AppWindow>

      {/* the chrome's pencil twin (decorative) */}
      {frame ? (
        <svg
          ref={svgRef}
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 size-full overflow-visible group-data-[state=ship]/arch:invisible"
          viewBox={`0 0 ${frame.W} ${frame.H}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {frame.paths.map((p, i) => (
            <path
              key={i}
              data-stroke=""
              d={p.d}
              data-rough={p.d}
              data-tight={p.t}
              stroke="currentColor"
              strokeWidth={p.sw}
              className={p.tone}
            />
          ))}
        </svg>
      ) : null}
      {frame?.title ? (
        <span
          ref={titleRef}
          aria-hidden="true"
          className="type-hand-sm pointer-events-none absolute leading-none whitespace-nowrap text-graphite group-data-[state=ship]/arch:invisible"
          style={{
            left: frame.title.x,
            top: frame.title.y + frame.title.h / 2,
            transform: "translateY(-50%)",
          }}
        >
          {title}
        </span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The narration under the window
// ---------------------------------------------------------------------------------------------

const DOT: Record<PacketKind, string> = {
  request: "bg-lime",
  data: "bg-blue",
  response: "bg-tangerine",
};
const BADGE: Record<PacketKind, string> = {
  request: "bg-lime text-ink",
  data: "bg-blue text-paper",
  response: "bg-tangerine text-ink",
};

/** The current step, written left to right (Caveat). */
function WrittenStep({ text, live }: { text: string; live: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !live || reduced) return;
    const tw = gsap.fromTo(
      el,
      { clipPath: CLIP_HIDDEN },
      {
        clipPath: CLIP_SHOWN,
        duration: 0.45,
        ease: EASE.pen,
        clearProps: "clipPath",
      },
    );
    return () => {
      tw.kill();
    };
  }, [live, reduced]);
  return (
    <span
      ref={ref}
      data-qa="arch-step"
      className={`type-hand min-w-0 truncate pr-1 ${live ? "text-ink" : "text-graphite"}`}
    >
      {text}
    </span>
  );
}

export function Narration({
  project,
  step,
  paused,
  onTogglePause,
  className,
}: {
  project: Project;
  step: number | null;
  paused: boolean;
  onTogglePause: () => void;
  className?: string;
}) {
  const spec = projectDiagram(project);
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const steps = spec.steps;
  if (!steps.length)
    return <FlowNote project={project} className={className} />;

  if (reduced || sketch) {
    // the whole route at once, numbered like the badges on the nodes
    return (
      <p
        data-qa="arch-narration"
        data-static=""
        aria-hidden="true"
        className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-graphite ${className ?? ""}`}
      >
        {steps.map((s, i) => (
          <Fragment key={i}>
            {i > 0 ? (
              <svg
                width={22}
                height={14}
                viewBox="0 0 22 14"
                className="shrink-0 overflow-visible text-pencil"
              >
                <path
                  d={roughArrow([2, 8], [19, 6], {
                    seed: `${project.id}-arch-flow-${i}`,
                    bend: -0.12,
                    head: 5,
                  })}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              {sketch ? null : (
                <span
                  className={`grid size-4 place-items-center rounded-full border border-ink font-mono text-micro leading-none tabular-nums ${BADGE[s.kind]}`}
                >
                  {i + 1}
                </span>
              )}
              <span className="type-hand-sm">{s.text}</span>
            </span>
          </Fragment>
        ))}
      </p>
    );
  }

  const cur = step ?? -1;
  return (
    <div
      data-qa="arch-narration"
      data-step={cur}
      className={`flex min-w-0 items-center gap-3 ${className ?? ""}`}
    >
      <IconButton
        size="sm"
        label="Pause the request animation"
        aria-pressed={paused}
        icon={paused ? <Play /> : <Pause />}
        onClick={onTogglePause}
        data-qa="arch-pause"
        data-cursor="blue"
      />
      <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
        {steps.map((s, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-full border transition-[scale,background-color,border-color] duration-(--dur-ui) ease-arrive ${i <= cur ? `${DOT[s.kind]} border-ink` : "border-pencil"} ${i === cur ? "scale-[1.35]" : ""}`}
          />
        ))}
      </span>
      <span aria-hidden="true" className="flex min-w-0 items-baseline gap-2">
        <span className="font-mono text-label text-graphite tabular-nums">
          {Math.max(1, cur + 1)}/{steps.length}
        </span>
        <WrittenStep
          key={`${project.id}-${cur}`}
          text={steps[Math.max(0, cur)].text}
          live={cur >= 0}
        />
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The stacked cards
// ---------------------------------------------------------------------------------------------

/** A card's architecture side: draws when it scrolls into view, then runs; its own pause. */
export function ArchitectureCard({ project }: { project: Project }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.3 });
  const [state, setState] = useState<"sketch" | "ship">(
    reduced ? "ship" : "sketch",
  );
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  useEffect(() => {
    if (state === "ship" || (!inView && !reduced)) return;
    const t = window.setTimeout(() => setState("ship"), reduced ? 0 : 260);
    return () => window.clearTimeout(t);
  }, [inView, reduced, state]);
  return (
    <div ref={ref} className="flex flex-col gap-6">
      <div className="relative">
        {/* the sheet the sketch is drawn on (the shipped window covers it) */}
        <div
          aria-hidden="true"
          className="paper-dots absolute inset-0 rounded-card bg-paper"
        />
        <ArchitectureWindow
          project={project}
          state={state}
          fit="auto"
          paused={paused}
          onStep={setStep}
        />
      </div>
      <Narration
        project={project}
        step={step}
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
        className="px-1"
      />
    </div>
  );
}
