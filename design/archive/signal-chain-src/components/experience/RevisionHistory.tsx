"use client";

import { useRef } from "react";
import { certifications, experience } from "@/content";
import { Led } from "@/components/ui";
import { EASE } from "@/lib/motion/eases";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/media";

type Row = {
  id: string;
  rev: string;
  when: string;
  title: string;
  summary: string;
  highlights: string[];
  where: string;
  detail: string[];
  stack: string[];
  tag: "current" | "award" | null;
};

/**
 * The revision history of a datasheet, newest first. Revision numbers are computed: the oldest
 * entry is 1.0, each later one steps by 0.1, the current role is the major revision 2.0.
 * The final-year award (certifications, kind "Award") sits between the Dyashin internship and
 * the Rooman internship, as the direction specifies.
 */
function buildRows(): Row[] {
  const award = certifications.find((c) => c.kind === "Award");
  const rows: Omit<Row, "rev">[] = [];
  for (const e of experience) {
    rows.push({
      id: e.id,
      when: e.periodLabel,
      title: e.role,
      summary: e.summary,
      highlights: e.current ? e.highlights : [],
      where: e.company,
      detail: [...(e.location?.split(" · ") ?? [e.type]), ...(e.durationLabel ? [e.durationLabel] : [])],
      stack: e.stack,
      tag: e.current ? "current" : null,
    });
    if (award && e.id === "dyashin") {
      rows.push({
        id: award.id,
        when: award.year,
        title: award.title,
        summary: award.note ?? "",
        highlights: [],
        where: award.issuer,
        detail: [],
        stack: [],
        tag: "award",
      });
    }
  }
  const last = rows.length - 1;
  return rows.map((r, i) => ({
    ...r,
    rev: r.tag === "current" ? "2.0" : `1.${last - i}`,
  }));
}

const ROWS = buildRows();
const COLS = "md:grid-cols-[3.5rem_11.5rem_minmax(0,1fr)_minmax(0,15rem)]";

export function RevisionHistory() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Authored moment: a margin trace is drawn down the table as you scroll (stroke-dashoffset
  // scrub); the REV column and the shaded CURRENT row carry the sequence.
  // Reduced motion: the trace is complete.
  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced) return;
      const list = root.querySelector<HTMLElement>("[data-rev-list]");
      const trace = root.querySelector<SVGLineElement>("[data-trace]");
      if (!list || !trace) return;
      gsap.set(trace, { strokeDashoffset: 1 });
      gsap.to(trace, {
        strokeDashoffset: 0,
        ease: EASE.none,
        scrollTrigger: { trigger: list, start: "top 70%", end: "bottom 60%", scrub: 0.4, invalidateOnRefresh: true },
      });
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="rev-title" className="type-lead font-bold">
          Revision history
        </h3>
        <p className="type-readout text-ink-muted">Newest first</p>
      </div>
      <div aria-hidden="true" className={`mt-4 hidden border-b-[1.5px] border-ink pb-2.5 md:grid md:gap-x-6 ${COLS}`}>
        {["Rev", "Date", "Role", "Where"].map((h) => (
          <span key={h} className="type-label text-ink-muted">
            {h}
          </span>
        ))}
      </div>
      <div className="relative">
      <svg
        aria-hidden="true"
        data-trace-wrap
        className="pointer-events-none absolute top-0 -left-[14px] h-full w-[2px] overflow-visible md:-left-[18px]"
        preserveAspectRatio="none"
        viewBox="0 0 2 100"
      >
        <line data-trace x1="1" y1="0" x2="1" y2="100" pathLength={1} strokeDasharray={1} strokeDashoffset={0} stroke="var(--color-trace, currentColor)" strokeWidth="2" className="text-ink" />
      </svg>
      <ol data-rev-list aria-labelledby="rev-title" className="mt-4 border-t-[1.5px] border-ink md:mt-0 md:border-t-0">
        {ROWS.map((r) => {
          const cur = r.tag === "current";
          return (
            <li
              key={r.id}
              data-rev
              className={`relative grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-b border-rule py-5 md:gap-y-0 md:py-6 ${COLS} ${
                cur ? "-mx-3 bg-bone-shade px-3 md:-mx-4 md:px-4" : ""
              }`}
            >
              <span data-revnum className="type-readout font-semibold text-ink">
                <span className="sr-only">Revision </span>
                {r.rev}
              </span>
              <span className="type-readout num text-ink-muted">{r.when}</span>
              <div className="col-span-full min-w-0 md:col-span-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h4 className="text-[length:clamp(19px,1.5vw,22px)] leading-[1.25] font-bold tracking-[-0.01em] text-balance">
                    {r.title}
                  </h4>
                  {r.tag ? (
                    <span className="type-label inline-flex items-center gap-1.5 border border-ink px-1.5 py-0.5 text-ink">
                      {cur ? <Led state="on" color="currentColor" size={6} /> : null}
                      {cur ? "Current" : "Award"}
                    </span>
                  ) : null}
                </div>
                {r.summary ? <p className="type-small mt-1.5 max-w-[62ch] text-ink-muted text-pretty">{r.summary}</p> : null}
                {r.highlights.length ? (
                  <ul className="mt-3 flex max-w-[62ch] flex-col gap-2">
                    {r.highlights.map((h) => (
                      <li key={h} className="type-small flex gap-3 text-pretty text-ink">
                        <span aria-hidden="true" className="mt-[0.55em] size-1.5 flex-none bg-ink" />
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {r.stack.length ? <p className="type-readout mt-3 max-w-[62ch] text-ink-muted">{r.stack.join(", ")}</p> : null}
              </div>
              <div className="col-span-full md:col-span-1">
                <p className="type-small font-semibold">{r.where}</p>
                {r.detail.map((d) => (
                  <p key={d} className="type-readout mt-0.5 text-ink-muted">
                    {d}
                  </p>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
      </div>
    </div>
  );
}
