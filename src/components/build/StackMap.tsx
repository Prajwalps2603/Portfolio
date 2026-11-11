"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { MotionLite } from "@/lib/motion/lazyMotion";
import { AppWindow, Highlight, IconButton, LiveDot } from "@/components/ui";
import { Pause, Play } from "@/components/icons";
import { DUR } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { HandPath } from "./HandPath";
import {
  neighbours,
  viewKey,
  type Accent,
  type Graph,
  type MapNode,
  type MapView,
  type NodeId,
} from "./graph";
import type { EngineState, MapEngine } from "./engine";

/**
 * THE LIVE STACK MAP ("02 What I build", the section's second beat).
 *
 * The shape of what Prajwal builds end to end: Interface -> API -> Intelligence -> Data ->
 * Automation -> Deploy, each node listing real technologies from skills.ts. Calm at rest (a few
 * slow packets circulate); vivid on interaction: a capability row lights its path in the row's
 * colour, a node lights its wires and says what happens there.
 *
 * - React renders everything that carries meaning (the nodes are real buttons in an ordered list,
 *   with the same facts in text) and lights the nodes. The engine (./engine, loaded with import()
 *   when the map nears the viewport) owns the aria-hidden SVG layers and all the motion.
 * - Layout follows the map's OWN width (container queries): 3 x 2 (tall) beside the rows or on
 *   phones, 2 x 3 (wide) above the rows on tablets and laptops.
 * - Reduced motion / Motion off: the finished, static map; lighting still works (colour and
 *   opacity only). Sketch mode: the map shows its sketch.
 */

type Props = {
  /** The map's data, derived on the server (./model.ts). */
  graph: Graph;
  view: MapView;
  /** The node pinned by a click / tap (aria-pressed). */
  pinned: NodeId | null;
  onNodeHover: (id: NodeId | null) => void;
  onNodeFocus: (id: NodeId | null) => void;
  onNodeToggle: (id: NodeId) => void;
  className?: string;
};

/** Tall (3 x 2) by default, wide (2 x 3) from a 42rem-wide map. DOM order stays canonical. */
const PLACE: Record<NodeId, string> = {
  interface:
    "col-start-1 row-start-1 justify-self-start @2xl:col-start-1 @2xl:row-start-1 @2xl:justify-self-start",
  api: "col-start-2 row-start-1 justify-self-end @2xl:col-start-1 @2xl:row-start-2 @2xl:justify-self-start",
  intelligence:
    "col-start-1 row-start-2 justify-self-start @2xl:col-start-2 @2xl:row-start-1 @2xl:justify-self-center",
  data: "col-start-2 row-start-2 justify-self-end @2xl:col-start-2 @2xl:row-start-2 @2xl:justify-self-center",
  automation:
    "col-start-1 row-start-3 justify-self-start @2xl:col-start-3 @2xl:row-start-1 @2xl:justify-self-end",
  deploy:
    "col-start-2 row-start-3 justify-self-end @2xl:col-start-3 @2xl:row-start-2 @2xl:justify-self-end",
};

const FLOOD: Record<Accent, string> = {
  lime: "bg-lime",
  blue: "bg-blue-soft",
  tangerine: "bg-tangerine-soft",
};
const SWATCH: Record<Accent, string> = {
  lime: "bg-lime",
  blue: "bg-blue",
  tangerine: "bg-tangerine",
};
const LEGEND: { accent: Accent; label: string }[] = [
  { accent: "lime", label: "request" },
  { accent: "blue", label: "data" },
  { accent: "tangerine", label: "result" },
];

/** CSS_EASE.arrive / .exit as Motion cubic-bezier arrays. */
const ARRIVE = [0.16, 1, 0.3, 1] as const;
const EXIT = [0.32, 0, 0.67, 0] as const;

type NodeState = "idle" | "dim" | "lit" | "home" | "focus";

function stateOf(id: NodeId, v: MapView, edges: Graph["edges"]): NodeState {
  if (v.kind === "idle") return "idle";
  if (v.kind === "path")
    return v.path.home.includes(id)
      ? "home"
      : v.path.route.includes(id)
        ? "lit"
        : "dim";
  if (v.node === id) return "focus";
  return neighbours(edges, v.node).includes(id) ? "lit" : "dim";
}

export function StackMap({
  graph,
  view,
  pinned,
  onNodeHover,
  onNodeFocus,
  onNodeToggle,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const [playing, setPlaying] = useState(true);
  const key = viewKey(view);
  const accent: Accent = view.kind === "path" ? view.path.accent : "lime";

  // the newest state, for the engine when it arrives (and for effects keyed by primitives)
  const latest = useRef<EngineState>({ graph, view, playing, reduced, sketch });
  useLayoutEffect(() => {
    latest.current = { graph, view, playing, reduced, sketch };
  });

  // Load the engine once the map is within ~a screen and a half (on the home page that is right
  // after hydration, but outside the initial JS), mount it, and tear it down on unmount.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    let engine: MapEngine | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        void import("./engine").then((m) => {
          if (cancelled) return;
          engine = m.mountMap(root, latest.current);
          engineRef.current = engine;
          root.dataset.engine = "ready";
        });
      },
      { rootMargin: "1200px 0px" },
    );
    io.observe(root);
    return () => {
      cancelled = true;
      io.disconnect();
      engine?.destroy();
      engineRef.current = null;
      delete root.dataset.engine;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setView(latest.current.view);
  }, [key]);
  useEffect(() => {
    engineRef.current?.setPlaying(playing);
  }, [playing]);
  useEffect(() => {
    engineRef.current?.setReduced(reduced);
  }, [reduced]);
  useEffect(() => {
    engineRef.current?.setSketch(sketch);
  }, [sketch]);

  return (
    <div
      ref={rootRef}
      data-qa="build-map"
      data-view={key}
      data-playing={playing}
      // the map draws its own sketch (JS); the site-wide restyle must not re-layout its nodes
      data-sketch-skip=""
      // short viewports (a 1366 x 768 laptop): two technologies per node and tighter rows, so the
      // sticky map always fits under the header with its pause control in view
      className={[
        "group/map @container relative [--map-gy:3.5rem] [--t3:block] [@media(max-height:779px)]:[--map-gy:2.25rem] [@media(max-height:779px)]:[--t3:none]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AppWindow
        title="stack.map"
        variant={sketch ? "sketch" : "ship"}
        seed="build-map"
        bodyClassName="flex flex-col"
        actions={
          // JS + full motion only: without them nothing moves, so there is nothing to call live
          <span className="hidden items-center gap-2 text-graphite [.js:not(.rm)_&]:inline-flex">
            {playing && !sketch ? (
              <LiveDot pulse />
            ) : (
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-pencil"
              />
            )}
            <span className="type-mono">
              {sketch ? "sketch" : playing ? "live" : "paused"}
            </span>
          </span>
        }
      >
        <div
          data-canvas=""
          className="relative flex-1 bg-paper paper-dots px-3 pt-2 pb-4 @md:px-6 @md:pt-3 @md:pb-6"
        >
          <svg
            data-under=""
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
          />

          {/* the annotation: a hint, the lit path (on the row's highlighter) or what happens at a node */}
          <div
            aria-hidden="true"
            className="relative flex h-[4.5rem] items-center gap-3 overflow-hidden pr-2 @md:h-16 @md:pr-4"
          >
            <span data-origin="" className="ml-6 size-4 shrink-0 @md:ml-9" />
            <Annotation view={view} reduced={reduced} nodes={graph.nodes} />
          </div>

          <ol
            aria-label="What I build, end to end"
            className="relative mt-3 grid grid-cols-2 gap-x-5 gap-y-8 @md:gap-x-10 @md:gap-y-(--map-gy) @2xl:grid-cols-3"
          >
            {graph.nodes.map((n) => (
              <li
                key={n.id}
                className={`flex w-full @md:max-w-[11.25rem] ${PLACE[n.id]}`}
              >
                <MapNodeButton
                  node={n}
                  state={stateOf(n.id, view, graph.edges)}
                  accent={accent}
                  pressed={pinned === n.id}
                  onHover={onNodeHover}
                  onFocus={onNodeFocus}
                  onToggle={onNodeToggle}
                />
              </li>
            ))}
          </ol>

          <svg
            data-over=""
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
          />
        </div>

        {/* legend + pause (WCAG 2.2.2): only when something can move */}
        <div className="hidden h-12 items-center gap-3 border-t border-line pr-2 pl-3.5 sketch:border-transparent [.js:not(.rm)_&]:flex @md:pl-5">
          <ul
            aria-hidden="true"
            className="type-mono flex min-w-0 items-center gap-x-3 text-graphite @md:gap-x-5"
          >
            {LEGEND.map((l) => (
              <li
                key={l.accent}
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <span
                  className={`h-1.75 w-3.25 shrink-0 rounded-full border border-ink ${SWATCH[l.accent]}`}
                />
                {l.label}
              </li>
            ))}
          </ul>
          <IconButton
            size="sm"
            className="ml-auto"
            label="Pause the stack map"
            aria-pressed={!playing}
            data-qa="build-map-pause"
            icon={playing ? <Pause /> : <Play />}
            onClick={() => setPlaying((p) => !p)}
          />
        </div>
      </AppWindow>
    </div>
  );
}

/** The handwritten line at the top of the canvas. Swaps with a short fade (Motion, React state). */
function Annotation({
  view,
  reduced,
  nodes,
}: {
  view: MapView;
  reduced: boolean;
  nodes: MapNode[];
}) {
  const key = viewKey(view);
  const node =
    view.kind === "node" ? nodes.find((n) => n.id === view.node) : undefined;
  return (
    <MotionLite>
      <AnimatePresence mode="wait" initial={false}>
        <m.p
          key={key}
          data-qa="build-map-label"
          className="type-hand-sm min-w-0 text-ink @md:type-hand"
          initial={{ opacity: 0, y: reduced ? 0 : 5 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: DUR.ui, ease: ARRIVE },
          }}
          exit={{
            opacity: 0,
            y: reduced ? 0 : -3,
            transition: { duration: DUR.tap, ease: EXIT },
          }}
        >
          {view.kind === "path" ? (
            <Highlight
              color={view.path.accent}
              trigger="mount"
              className="[--hl-h:1.02em] [--hl-y:60%]"
            >
              <HandPath
                words={view.path.route.map(
                  (id) => nodes.find((n) => n.id === id)?.sketch ?? id,
                )}
              />
            </Highlight>
          ) : node ? (
            node.note
          ) : (
            <span className="text-graphite">
              <span className="fine:hidden">
                tap a capability to trace its path
              </span>
              <span className="hidden fine:inline">
                hover a capability to trace its path
              </span>
            </span>
          )}
        </m.p>
      </AnimatePresence>
    </MotionLite>
  );
}

type NodeButtonProps = {
  node: MapNode;
  state: NodeState;
  accent: Accent;
  pressed: boolean;
  onHover: (id: NodeId | null) => void;
  onFocus: (id: NodeId | null) => void;
  onToggle: (id: NodeId) => void;
};

/**
 * One layer of the stack: a crisp card (mono layer label + real technologies) with its sketch
 * twin's handwritten label, lit by the current view. A real button: hover, focus or click / tap
 * lights its wires and shows what happens there; click pins it (aria-pressed), Esc unpins.
 *
 * Off the lit path ("dim") a layer recedes WITHOUT fading its words: the card goes flat (flush
 * with the paper canvas, hairline outline, no lift), the stamp fades, the engine fades its wires
 * and its pencil twin, and the text steps down from ink to graphite (6.8:1, in both modes).
 */
function MapNodeButton({
  node,
  state,
  accent,
  pressed,
  onHover,
  onFocus,
  onToggle,
}: NodeButtonProps) {
  const noteId = useId();
  const lit = state === "lit" || state === "home" || state === "focus";
  const dim = state === "dim";
  // a pinned layer keeps its card while another one is explored (its pressed state stays visible)
  const flat = dim && !pressed;
  return (
    <button
      type="button"
      data-node={node.id}
      data-state={state}
      data-qa={`build-map-node-${node.id}`}
      aria-pressed={pressed}
      aria-describedby={noteId}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") onHover(node.id);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") onHover(null);
      }}
      onFocus={(e) =>
        onFocus(e.currentTarget.matches(":focus-visible") ? node.id : null)
      }
      onBlur={() => onFocus(null)}
      onClick={() => onToggle(node.id)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && pressed) {
          e.preventDefault();
          onToggle(node.id);
        }
      }}
      data-flood={state === "home" ? accent : undefined}
      className="group/node relative isolate flex w-full min-w-0 flex-col items-start rounded-panel px-2.5 py-2.5 text-left @md:px-3.5 @md:py-3"
    >
      {/* the card (crisp layer); off the lit path it goes flat: flush with the canvas (paper, so
          the dot grid never runs under its words), no lift, no shadow */}
      <span
        data-crisp=""
        aria-hidden="true"
        className={`absolute inset-0 -z-20 rounded-panel border transition-[border-color,box-shadow,background-color] duration-(--dur-ui) ease-arrive group-data-[mode=sketch]/map:opacity-0 ${
          lit ? "border-ink" : "border-line"
        } ${flat ? "bg-paper shadow-none" : `bg-card ${state === "focus" || pressed ? "shadow-lift" : "shadow-card"}`}`}
      />
      {/* the row's highlighter floods the layers a capability lives in */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 -z-10 origin-left rounded-panel transition-[scale] group-data-[mode=sketch]/map:hidden reduced:transition-none ${FLOOD[accent]} ${
          state === "home"
            ? "scale-x-100 duration-(--dur-ui) ease-pen"
            : "scale-x-0 duration-(--dur-exit) ease-exit"
        }`}
      />
      <span
        data-crisp=""
        className="relative flex min-w-0 flex-col gap-1 group-data-[mode=sketch]/map:opacity-0"
      >
        <span
          className={`type-micro tracking-[0.08em] uppercase transition-colors duration-(--dur-ui) ${lit ? "text-ink" : "text-graphite"}`}
        >
          {node.label}
          <span className="sr-only">: </span>
        </span>
        <span
          className={`flex flex-col font-sans text-(length:--text-mono) leading-[1.4] transition-colors duration-(--dur-ui) ease-arrive ${dim ? "text-graphite" : "text-ink"}`}
        >
          {node.techs.map((t, i) => (
            <span
              key={t}
              data-tech=""
              className={i >= 2 ? "hidden @md:[display:var(--t3)]" : "block"}
            >
              {t}
              {i < node.techs.length - 1 ? (
                <span className="sr-only">, </span>
              ) : null}
            </span>
          ))}
        </span>
      </span>
      {/* the sketch twin's handwriting (the engine draws the pencil box around it): inked when
          lit, graphite otherwise; never faded (the box and scribbles recede, the words do not) */}
      <span
        data-sk-label=""
        aria-hidden="true"
        className={`type-hand-sm pointer-events-none absolute top-1.5 left-2.5 opacity-0 transition-colors duration-(--dur-ui) ease-arrive group-data-[mode=sketch]/map:opacity-100 @md:left-3.5 ${
          lit ? "text-ink" : "text-graphite"
        }`}
      >
        {node.sketch}
      </span>
      <span id={noteId} hidden>
        {node.note}
      </span>
    </button>
  );
}
