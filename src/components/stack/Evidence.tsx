"use client";

/**
 * The card that opens right under a layer when one of its tools is picked: the tool, its layer,
 * and where Prajwal used it (`usedIn` resolved to case studies, roles and repositories). It lives
 * in the layer's own flow, so it takes the tone it sits on: a paper card above the waterline, an
 * ink-2 card in the sea (`.card` and the `on-ink:` rows do it).
 */
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { ArrowRight, ArrowUpRight, Close } from "@/components/icons";
import { TransitionLink } from "@/components/transition";
import { Card, IconButton } from "@/components/ui";
import { DUR } from "@/lib/motion/eases";
import { MotionLite } from "@/lib/motion/lazyMotion";
import { useReducedMotion } from "@/lib/motion/media";
import type { StackKey } from "./state";
import { resolveUsedIn, type UsedInRef } from "./usedin";

const ROW =
  "group flex min-h-14 items-center justify-between gap-4 rounded-panel border border-line bg-paper px-4 py-2.5 text-ink transition-colors duration-(--dur-feedback) ease-arrive on-ink:border-seam on-ink:bg-ink on-ink:text-paper";
const ROW_LINK = `${ROW} hocus:border-ink on-ink:hocus:border-lime`;

function RowBody({ u }: { u: UsedInRef }) {
  return (
    <>
      <span className="min-w-0">
        <span className="type-ui block">{u.title}</span>
        <span className="type-small block text-graphite on-ink:text-fog">{u.meta}</span>
      </span>
      {u.kind === "repo" ? (
        <ArrowUpRight className="shrink-0 text-blue-deep on-ink:text-lime" />
      ) : u.kind === "plain" ? null : (
        <ArrowRight className="shrink-0 text-blue-deep transition-transform duration-(--dur-ui) ease-arrive group-hocus:translate-x-0.5 on-ink:text-lime reduced:transition-none" />
      )}
    </>
  );
}

function Row({ u }: { u: UsedInRef }) {
  if (u.kind === "case") {
    return (
      <TransitionLink href={u.href} label={u.title} className={ROW_LINK}>
        <RowBody u={u} />
        <span className="sr-only">, case study</span>
      </TransitionLink>
    );
  }
  if (u.kind === "role") {
    return (
      <a href={u.href} className={ROW_LINK}>
        <RowBody u={u} />
        <span className="sr-only">, in the experience section</span>
      </a>
    );
  }
  if (u.kind === "repo") {
    return (
      <a href={u.href} target="_blank" rel="noopener noreferrer" className={ROW_LINK}>
        <RowBody u={u} />
        <span className="sr-only"> (repository, opens in a new tab)</span>
      </a>
    );
  }
  return (
    <div className={ROW}>
      <RowBody u={u} />
    </div>
  );
}

type EvidenceProps = {
  /** The live region's id (the tools' aria-controls). */
  id: string;
  tool: StackKey | null;
  layer: string;
  /** The layer's one-liner: phones hide it above the tools, so the card repeats it there. */
  description: string;
  onClose: () => void;
};

export function Evidence({ id, tool, layer, description, onClose }: EvidenceProps) {
  const reduced = useReducedMotion();
  const used = tool ? resolveUsedIn(tool.usedIn) : [];
  const enter = { duration: reduced ? 0 : DUR.ui, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };
  const leave = { duration: reduced ? 0 : DUR.exit, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] };

  return (
    <div id={id} aria-live="polite">
      <MotionLite>
        <AnimatePresence initial={false} mode="wait">
          {tool ? (
            <m.div
              key={tool.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: enter }}
              exit={{ height: 0, opacity: 0, transition: leave }}
              className="overflow-hidden"
            >
              {/* the margins live inside the measured box, so the height animation never clips them */}
              <div className="pt-5 pb-1">
                <Card padding="md" data-qa="stack-card" data-tool={tool.id} className="max-w-[38rem]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="type-h4">{tool.label}</h4>
                      <p className="type-small mt-1 text-graphite on-ink:text-fog">{layer}</p>
                    </div>
                    <IconButton label={`Close ${tool.label}`} icon={<Close />} size="sm" onClick={onClose} />
                  </div>
                  <p className="type-small mt-3 text-graphite on-ink:text-fog sm:hidden">{description}</p>
                  <p className="type-ui mt-5">Where I used it</p>
                  {used.length ? (
                    <ul className="mt-3 flex flex-col gap-2">
                      {used.map((u) => (
                        <li key={u.id}>
                          <Row u={u} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="type-small mt-2 text-graphite on-ink:text-fog">No public project is linked to this one yet.</p>
                  )}
                </Card>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </MotionLite>
    </div>
  );
}
