"use client";

import { useRef } from "react";
import type { SkillGroup } from "@/content";
import { ChannelMark, ExternalLink } from "@/components/ui";
import { TransitionLink } from "@/components/transition";
import { ArrowRight } from "@/components/icons";
import { channelForLayer } from "@/lib/channels";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { resolveEvidence, type Evidence } from "./evidence";

type Props = {
  id: string;
  group: SkillGroup;
  skill: SkillGroup["skills"][number];
  color: string;
  inline?: boolean;
};

/** Where a part was used: the evidence behind one skill. Announced politely on change. */
export function Readout({ id, group, skill, color, inline }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const ch = channelForLayer(group.layer);
  const items = skill.usedIn
    .map(resolveEvidence)
    .filter((e): e is Evidence => e !== null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;
      const head = el.querySelector("[data-head]");
      const rows = gsap.utils.toArray<HTMLElement>("[data-ev]", el);
      if (head)
        gsap.from(head, {
          autoAlpha: 0,
          x: -8,
          duration: DUR.hover,
          ease: EASE.probe,
        });
      if (rows.length)
        gsap.from(rows, {
          y: 8,
          autoAlpha: 0,
          duration: 0.3,
          ease: EASE.panel,
          stagger: STAGGER.rows,
          delay: 0.04,
        });
    },
    {
      scope: ref,
      dependencies: [skill.name, group.id, reduced],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={ref}
      id={id}
      role="region"
      aria-live="polite"
      aria-label="Where this part was used"
      className={`border border-graticule-strong bg-bezel ${inline ? "p-4" : "p-6"}`}
    >
      <div data-head className="flex items-center gap-2.5" style={{ color }}>
        {ch ? (
          <ChannelMark ch={ch.id} />
        ) : (
          <span
            aria-hidden="true"
            className="inline-block size-[18px] border border-bone"
          />
        )}
        <span className="type-label text-muted">{group.label}</span>
      </div>
      <p className="type-title mt-3 text-bone">{skill.name}</p>
      <p className="type-readout mt-2 text-muted">
        {items.length ? (
          <>
            Used in <span className="num">{items.length}</span>{" "}
            {items.length === 1 ? "place" : "places"}
          </>
        ) : (
          "Listed on résumé"
        )}
      </p>
      {items.length ? (
        <ul className="mt-4">
          {items.map((e) => (
            <li
              key={e.id}
              data-ev
              className="rule-t flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0 py-3"
            >
              <div className="min-w-0">
                <p className="type-small font-semibold text-bone">{e.title}</p>
                <p className="type-readout text-muted">
                  {e.kind} / {e.meta}
                </p>
              </div>
              {e.href?.type === "internal" ? (
                <TransitionLink
                  href={e.href.to}
                  className="link-mono text-bone"
                >
                  {e.href.label} <ArrowRight />
                </TransitionLink>
              ) : e.href ? (
                <ExternalLink href={e.href.to} className="link-mono text-bone">
                  {e.href.label}
                </ExternalLink>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-small mt-3 text-muted">
          No project in this portfolio exercises it yet.
        </p>
      )}
    </div>
  );
}
