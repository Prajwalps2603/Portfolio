"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, Plus } from "@/components/icons";
import { Tag } from "@/components/ui";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { SketchCircle } from "@/components/sketch";
import { TransitionLink } from "@/components/transition";
import { HandPath } from "./HandPath";
import { StackMap } from "./StackMap";
import { routeSentence, viewKey, type Accent, type CapabilityPath, type Graph, type MapView, type NodeId } from "./graph";

/**
 * The interactive half of "02 What I build" (the client island): the six capability rows and
 * the live stack map, sharing one state. Hovering, focusing or opening a row lights that
 * capability's path on the map (in the row's colour); hovering, focusing or pressing a map node
 * lights its wires, says what happens there, and circles the rows whose path runs through it.
 */

export type ProofLink =
  | { kind: "page"; id: string; label: string; href: string }
  | { kind: "external"; id: string; label: string; href: string; hint: string }
  | { kind: "section"; id: string; label: string; href: string };

/** A capability as the row shows it, its proof already resolved (on the server). */
export type CapRow = { id: string; title: string; subtitle: string; description: string; tags: string[]; proof: ProofLink[] };

/** Row accents rotate lime / blue-soft / tangerine-soft (graph.accentOf). Ink text on every one. */
const FLOOD: Record<Accent, string> = { lime: "bg-lime", blue: "bg-blue-soft", tangerine: "bg-tangerine-soft" };
const UNDERLINE: Record<Accent, string> = { lime: "decoration-lime-deep", blue: "decoration-blue-deep", tangerine: "decoration-tangerine-deep" };

/** The proof links sit on the flood (a coloured-pencil hatch in sketch mode): always ink, with the
 *  row's accent carried by the underline only, never by the text colour. */
const proofLink = "type-hand inline-flex min-h-11 items-center gap-1 rounded-chip text-ink underline decoration-2 underline-offset-4";

type RowProps = {
  cap: CapRow;
  path: CapabilityPath;
  graph: Graph;
  index: number;
  open: boolean;
  /** A map node is lit that this capability's path runs through. */
  marked: boolean;
  onHover: (id: string | null) => void;
  onFocusChange: (id: string | null) => void;
  onToggle: (id: string) => void;
};

function Row({ cap, path, graph, index, open, marked, onHover, onFocusChange, onToggle }: RowProps) {
  const uid = useId();
  const panelId = `${uid}-proof`;
  const tilt = index % 2 === 0 ? "-rotate-[1.2deg]" : "rotate-[0.8deg]";
  const underline = `${proofLink} ${UNDERLINE[path.accent]}`;
  const words = path.route.map((id) => graph.nodes.find((n) => n.id === id)?.sketch ?? id);

  return (
    <li
      className="group relative isolate border-b border-line first:border-t first:border-t-ink"
      data-open={open}
      data-flood={open ? path.accent : undefined}
      data-qa={`build-row-${cap.id}`}
      data-route={path.route.join(">")}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") onHover(cap.id);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") onHover(null);
      }}
      onFocus={(e) => onFocusChange(e.target.matches(":focus-visible") ? cap.id : null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onFocusChange(null);
      }}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 -inset-y-px -z-10 origin-left scale-x-0 transition-transform duration-(--dur-exit) ease-(--ease-exit) group-data-[open=true]:scale-x-100 group-data-[open=true]:duration-(--dur-ui) group-data-[open=true]:ease-(--ease-pen) reduced:transition-none ${FLOOD[path.accent]}`}
      />
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-4 gap-y-3 px-1 py-7 md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1.15fr)_auto] md:gap-x-8 md:px-5 md:py-9 lg:grid-cols-[2.75rem_minmax(0,1fr)_auto] lg:gap-x-6 lg:gap-y-4 lg:py-8">
        <span className="type-mono justify-self-start pt-2 text-graphite group-data-[open=true]:text-ink lg:row-span-2">
          <span className="relative inline-block px-0.5">
            {String(index + 1).padStart(2, "0")}
            {marked ? <SketchCircle seed={`build-mark-${cap.id}`} draw="mount" drawDuration={0.42} inset={-8} strokeWidth={1.8} tone="ink" /> : null}
          </span>
        </span>
        <div className="min-w-0 md:pr-4 lg:pr-0">
          <h3 className="type-h3">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => onToggle(cap.id)}
              className="rounded-chip text-left after:absolute after:inset-0 after:content-['']"
            >
              {cap.title}
            </button>
          </h3>
          <p className="type-mono mt-2 text-graphite group-data-[open=true]:text-ink">{cap.subtitle}</p>
        </div>
        <span
          aria-hidden="true"
          className="col-start-3 row-start-1 grid size-12 place-items-center rounded-full border border-ink bg-card text-ink transition-colors duration-(--dur-feedback) group-data-[open=true]:bg-ink group-data-[open=true]:text-paper md:col-start-4 lg:col-start-3"
        >
          <Plus className="size-5 transition-transform duration-(--dur-ui) ease-(--ease-arrive) group-data-[open=true]:rotate-45 reduced:transition-none" />
        </span>
        <div className="col-span-3 min-w-0 md:col-span-1 md:col-start-3 md:row-start-1 lg:col-start-2 lg:row-start-2">
          <p className="type-body measure text-ink">{cap.description}</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${cap.title} tags`}>
            {cap.tags.map((t) => (
              <Tag as="li" key={t} className="bg-card/70">
                {t}
              </Tag>
            ))}
          </ul>
        </div>
      </div>

      <div
        id={panelId}
        role="group"
        aria-label={`Proof for ${cap.title}`}
        inert={!open}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-(--dur-exit) ease-(--ease-exit) group-data-[open=true]:grid-rows-[1fr] group-data-[open=true]:duration-(--dur-ui) group-data-[open=true]:ease-(--ease-arrive) reduced:transition-none"
      >
        <div className="overflow-hidden">
          <div className="px-1 pb-8 md:px-5 md:pb-10 md:pl-[calc(1.25rem+4.5rem+2rem)] lg:pl-[calc(1.25rem+2.75rem+1.5rem)]">
            <div className="flex -translate-x-6 flex-wrap items-baseline gap-x-3 gap-y-1 opacity-0 transition-[opacity,translate] duration-(--dur-exit) ease-(--ease-exit) group-data-[open=true]:translate-x-0 group-data-[open=true]:opacity-100 group-data-[open=true]:duration-(--dur-ui) group-data-[open=true]:ease-(--ease-arrive) reduced:translate-x-0 reduced:transition-none">
              <span className={`type-hand-lg inline-block origin-left ${tilt}`}>proof:</span>
              <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                {cap.proof.map((p) => (
                  <li key={p.id}>
                    {p.kind === "page" ? (
                      <TransitionLink href={p.href} label={p.label} className={underline}>
                        {p.label}
                        <span className="sr-only">, case study</span>
                      </TransitionLink>
                    ) : p.kind === "external" ? (
                      <ExternalLink href={p.href} hint={p.hint} className={underline}>
                        {p.label}
                      </ExternalLink>
                    ) : (
                      <a href={p.href} className={underline}>
                        {p.label}
                        <span className="sr-only">, in the experience section</span>
                        <ArrowUpRight className="size-[0.8em] rotate-90" aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {/* the path through the stack: on the map beside the rows at desktop, written here
                below it (where the map may be off screen); in words for assistive tech always */}
            <p className="mt-1 flex -translate-x-6 flex-wrap items-baseline gap-x-3 opacity-0 transition-[opacity,translate] duration-(--dur-exit) ease-(--ease-exit) group-data-[open=true]:translate-x-0 group-data-[open=true]:opacity-100 group-data-[open=true]:delay-75 group-data-[open=true]:duration-(--dur-ui) group-data-[open=true]:ease-(--ease-arrive) reduced:translate-x-0 reduced:transition-none lg:sr-only">
              <span aria-hidden="true" className={`type-hand-lg inline-block origin-left ${tilt}`}>
                path:
              </span>
              <span aria-hidden="true" className="type-hand text-ink">
                <HandPath words={words} />
              </span>
              <span className="sr-only">Path through the stack: {routeSentence(path.route, graph.nodes)}.</span>
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * The view the map shows, settled: a new path or node shows after a beat (sweeping the pointer
 * down the rows does not strobe the map), and "nothing" waits a little longer (moving from one
 * row to the next never flashes the idle state in between).
 */
function useSettled(raw: MapView): MapView {
  const [shown, setShown] = useState<MapView>(raw);
  const latest = useRef(raw);
  useLayoutEffect(() => {
    latest.current = raw;
  });
  const key = viewKey(raw);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(latest.current), latest.current.kind === "idle" ? 160 : 40);
    return () => window.clearTimeout(t);
  }, [key]);
  return shown;
}

export function BuildBody({ rows, graph }: { rows: CapRow[]; graph: Graph }) {
  const [rowHover, setRowHover] = useState<string | null>(null);
  const [rowFocus, setRowFocus] = useState<string | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [nodeHover, setNodeHover] = useState<NodeId | null>(null);
  const [nodeFocus, setNodeFocus] = useState<NodeId | null>(null);
  const [nodePin, setNodePin] = useState<NodeId | null>(null);

  const toggleRow = useCallback((id: string) => setOpened((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id])), []);
  const toggleNode = useCallback((id: NodeId) => setNodePin((p) => (p === id ? null : id)), []);

  const pathOf = (id: string | null) => (id ? graph.paths.find((p) => p.id === id) : undefined);
  const activeNode = nodeHover ?? nodeFocus ?? nodePin;
  const activePath = pathOf(rowHover ?? rowFocus ?? opened[opened.length - 1] ?? null);
  const raw: MapView = activeNode ? { kind: "node", node: activeNode } : activePath ? { kind: "path", path: activePath } : { kind: "idle" };
  const view = useSettled(raw);
  const marked = view.kind === "node" ? graph.paths.filter((p) => p.route.includes(view.node)).map((p) => p.id) : [];

  return (
    <div className="mt-12 grid gap-y-10 md:mt-14 md:gap-y-12 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)] lg:items-start lg:gap-x-[clamp(2.5rem,4vw,4.5rem)]">
      {/* sticky beside the rows; on very short viewports it simply scrolls with them */}
      <div className="[--map-pos:sticky] lg:col-start-2 lg:row-start-1 lg:top-[calc(var(--header-h)+1.25rem)] lg:[position:var(--map-pos)] [@media(max-height:619px)]:[--map-pos:relative]">
        <StackMap graph={graph} view={view} pinned={nodePin} onNodeHover={setNodeHover} onNodeFocus={setNodeFocus} onNodeToggle={toggleNode} />
      </div>
      <ol className="lg:col-start-1 lg:row-start-1">
        {rows.map((c, i) => {
          const path = pathOf(c.id);
          if (!path) return null;
          return (
            <Row
              key={c.id}
              cap={c}
              path={path}
              graph={graph}
              index={i}
              open={opened.includes(c.id) || rowHover === c.id || rowFocus === c.id}
              marked={marked.includes(c.id)}
              onHover={setRowHover}
              onFocusChange={setRowFocus}
              onToggle={toggleRow}
            />
          );
        })}
      </ol>
    </div>
  );
}
