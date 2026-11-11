"use client";

import { useCallback, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { featuredProjects, type Project } from "@/content";
import type { Connection } from "@/content/projects";
import { Led } from "@/components/ui";
import { useReducedMotion } from "@/lib/motion/media";
import { useLoopsAllowed } from "@/lib/motion/preferences";
import { BoardGraph } from "./BoardGraph";
import { Scope } from "./Scope";
import { boardRows, rowLabel, type ResolvedSystem, type SysState } from "./system";
import { layerChannel } from "./layers";
import { Board3D } from "./board3d/Board3D";
import { markBoard3DFailed, useBoard3D } from "./board3d/capability";

type BoardProps = {
  project: Project;
  system: ResolvedSystem;
  state: SysState;
  /** Draw the copper in on arrival (the sticky panel re-draws on every acquisition). */
  drawIn?: boolean;
  /** Unpin the connection on a scope channel (the Release control on a scope row). */
  onRelease?: (channel: 1 | 2 | 3 | 4) => void;
  /**
   * Clip a probe on a connection (a pick on the 3D board). Optional: without it a pick presses
   * the connection's own button in the system's entry, so the bench state stays the one source.
   */
  onProbe?: (conn: string) => void;
  /** Preview the connection under the pointer on the 3D board. Optional: without it the preview is local to this board and its scope. */
  onPreview?: (conn: string | null) => void;
};

/** Chip rows of the 3D board: the most parts any featured system puts in one channel column. */
const ROWS = Math.max(
  1,
  ...featuredProjects.map((p) => {
    const perChannel = new Map<string, number>();
    p.architecture.forEach((l) => {
      const k = String(layerChannel(l.layer).id);
      perChannel.set(k, (perChannel.get(k) ?? 0) + l.items.length);
    });
    return Math.max(...perChannel.values());
  }),
);

/** Four mounting holes in the corners of a panel (decorative). The parent must be positioned. */
export function MountingHoles() {
  return (
    <>
      {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos) => (
        <svg key={pos} aria-hidden="true" focusable="false" width="9" height="9" viewBox="0 0 9 9" fill="none" className={`pointer-events-none absolute ${pos}`}>
          <circle cx="4.5" cy="4.5" r="3.5" stroke="var(--color-graticule-strong)" />
          <path d="M2.4 4.5h4.2" stroke="var(--color-graticule-strong)" />
        </svg>
      ))}
    </>
  );
}

/** Plated through-holes in the corners of the board itself: a ring, with the bench showing through. */
function PlatedHoles() {
  return (
    <>
      {["top-1.5 left-1.5", "top-1.5 right-1.5", "bottom-1.5 left-1.5", "bottom-1.5 right-1.5"].map((pos) => (
        <svg key={pos} aria-hidden="true" focusable="false" width="8" height="8" viewBox="0 0 8 8" className={`pointer-events-none absolute ${pos}`}>
          <circle cx="4" cy="4" r="3" fill="var(--color-bezel)" stroke="var(--color-graticule-strong)" strokeWidth="1.5" />
        </svg>
      ))}
    </>
  );
}

/** The board's graticule: faint dots on the FR4, the same grid the 3D board carries. */
const FR4: CSSProperties = {
  backgroundImage: "radial-gradient(circle, var(--color-graticule) 0.9px, transparent 1.3px)",
  backgroundSize: "14px 14px",
  backgroundPosition: "7px 7px",
};

/**
 * Press the connection's own button in its system's entry (the keyboard path), so a pick on the
 * canvas runs through exactly the control a click on the list runs through: same pin, same
 * "Probed" flash and announcement. Used only when the bench does not pass `onProbe`.
 */
function probeThroughList(projectId: string, conn: Connection): boolean {
  const entry = document.querySelector(`[data-system="${CSS.escape(projectId)}"]`);
  const label = `Probe: ${conn.label}`;
  const button = entry
    ? Array.from(entry.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")).find((b) => b.getAttribute("data-cursor-label") === label)
    : undefined;
  button?.click();
  return !!button;
}

/**
 * The board of one system, generated from its typed record: its parts (chips, outlined in the
 * channel colour of their layer), the connections wired between them, and the four-channel
 * scope that shows the shape of the traffic on the probed connections. Nothing here is
 * measured data.
 *
 * Two renderings, one state. Desktop and large-tablet landscape with a fine pointer, WebGL2 and
 * enough memory get the 3D bench board (lazy R3F chunk): hover or click a connection to probe
 * it, hover a chip for what it is wired to. Everywhere else, and whenever WebGL fails, the SVG
 * board. Both read the bench's probe state (pins, preview, stage), and a probe on the 3D board
 * goes through the same bench state, so the scope below always agrees with the board.
 *
 * Animation hooks (set by Bench): [data-chip] seats (SVG); the copper draws itself.
 */
export function Board({ project, system, state, drawIn = true, onRelease, onProbe, onPreview }: BoardProps) {
  const use3D = useBoard3D();
  const reduced = useReducedMotion();
  const loops = useLoopsAllowed();
  const [hoverConn, setHoverConn] = useState<string | null>(null);
  const [status, setStatus] = useState<"seating" | "seated">("seating");

  const preview = onPreview ? state.preview : (hoverConn ?? state.preview);
  const lit = useMemo(() => {
    const s = new Set<string>();
    state.pins.forEach((id) => id && s.add(id));
    if (preview) s.add(preview);
    system.record.stages[state.stage]?.forEach((id) => s.add(id));
    return s;
  }, [state.pins, preview, state.stage, system.record.stages]);

  const parts = useMemo(() => new Set(project.architecture.flatMap((l) => l.items)).size, [project]);

  const description = useMemo(() => {
    const parts = boardRows(project)
      .map((r) => `${rowLabel(r)}: ${r.items.map(system.nodeLabel).join(", ")}`)
      .join(". ");
    const wires = system.conns.map((c) => `${c.from} to ${c.to} over ${c.protocol} (${c.label})`).join("; ");
    return `Board of ${project.title}. ${parts}. Connections: ${wires}.`;
  }, [project, system]);

  const probe = useCallback(
    (conn: string) => {
      if (onProbe) return onProbe(conn);
      const c = system.conns.find((x) => x.id === conn);
      if (c && c.channel !== "sigma") probeThroughList(project.id, c);
    },
    [onProbe, system, project.id],
  );
  const hoverWire = useCallback((conn: string | null) => (onPreview ? onPreview(conn) : setHoverConn(conn)), [onPreview]);

  const legend: ReactNode = (
    <p className="type-readout mt-3 flex flex-wrap justify-between gap-x-4 border-t border-dashed border-graticule-strong pt-2 text-dim" aria-hidden="true">
      <span>{`U1 to U${parts}`}</span>
      <span>{`${project.architecture.length} layers / ${system.conns.length} connections`}</span>
    </p>
  );

  const seated = !use3D || status === "seated";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="type-lead text-bone max-[860px]:sr-only">{project.shortTitle}</p>
        <p className="type-label flex items-center gap-2 text-muted">
          <Led state={seated ? "on" : "blink"} color="var(--color-bone)" size={6} />
          {seated ? "Seated" : "Seating"}
        </p>
      </div>

      {use3D ? (
        <div className="mt-3">
          <Board3D
            project={project}
            system={system}
            state={state}
            rows={ROWS}
            lit={lit}
            preview={preview}
            reduced={reduced}
            loops={loops}
            onProbe={probe}
            onHoverWire={hoverWire}
            onStatus={setStatus}
            onFail={markBoard3DFailed}
            description={description}
          />
        </div>
      ) : (
        <div className="relative mt-4 border border-graticule-strong bg-graphite px-3.5 pt-4 pb-2.5 sm:px-4" style={FR4}>
          <PlatedHoles />
          <BoardGraph project={project} system={system} lit={lit} dimOthers drawIn={drawIn} description={description} />
          {legend}
        </div>
      )}

      <Scope conns={system.conns} pins={state.pins} preview={preview} signature={`${project.id}:${state.opt}`} ping={state.ping} onRelease={onRelease} />
    </div>
  );
}
