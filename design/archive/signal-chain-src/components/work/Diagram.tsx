"use client";

import { useMemo } from "react";
import type { Project } from "@/content";
import { BoardGraph } from "./BoardGraph";
import { boardRows, resolveSystem, rowLabel } from "./system";

/**
 * Block diagram of a system on the datasheet: the same parts and the same typed connections as
 * the bench, with the protocol printed on every wire in its channel colour. Choosing a stage of
 * the request path (the stepper right below) lights the wires that carry it and dims the rest;
 * with no stage chosen, every wire reads at full strength. Signals run only on lit wires, and
 * stop with reduced motion and with Signals: paused.
 */
export function Diagram({ project, stage }: { project: Project; stage: number }) {
  const system = useMemo(() => resolveSystem(project.id, 0), [project.id]);
  const lit = useMemo(() => new Set(system.record.stages[stage] ?? []), [system, stage]);

  const description = useMemo(() => {
    const parts = boardRows(project)
      .map((r) => `${rowLabel(r)}: ${r.items.join(", ")}`)
      .join(". ");
    const wires = system.conns.map((c) => `${c.from} to ${c.to} over ${c.protocol}`).join("; ");
    return `Block diagram of ${project.title}. ${parts}. Connections: ${wires}.`;
  }, [project, system]);

  return (
    <figure>
      <div className="border border-rule bg-bone p-4 sm:p-6">
        <BoardGraph
          project={project}
          system={system}
          lit={lit}
          dimOthers={lit.size > 0}
          surface="sheet"
          labels
          description={description}
        />
      </div>
      <figcaption className="type-small mt-3 max-w-[70ch] text-ink-muted">
        <span className="type-readout mr-2 text-ink">Fig. 1</span>
        Parts by layer, with each wire labelled by its protocol (unlabelled wires are in-process calls). Dashed wires carry
        traffic only in the what-if branch described in the application note. Pick a stage of the request path below to
        light its wires.
      </figcaption>
    </figure>
  );
}
