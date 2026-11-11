"use client";

import { useRef } from "react";
import { education } from "@/content";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/media";

export function Education() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Rows are wiped in with a clip-path (no rise, no fade).
  // Rows already in view at load are left alone, so nothing flashes after the intro.
  // Reduced motion: no-op, everything stays visible.
  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced) return;
      const rows = gsap.utils.toArray<HTMLElement>("[data-edu]", root);
      if (
        !rows.length ||
        rows[0].getBoundingClientRect().top < window.innerHeight * 0.9
      )
        return;
      // Each row is uncovered left to right, like a line being read off a datasheet.
      gsap.fromTo(
        rows,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: DUR.rise,
          ease: EASE.wipe,
          stagger: STAGGER.history,
          clearProps: "clipPath",
          scrollTrigger: { trigger: root, start: "top 82%", once: true },
        },
      );
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );
  return (
    <div ref={ref} className="md:grid md:grid-cols-10 md:gap-x-6">
      <h3 id="edu-title" className="type-lead font-bold md:col-span-3">
        Education
      </h3>
      <ul
        aria-labelledby="edu-title"
        className="mt-4 border-t-[1.5px] border-ink md:col-span-7 md:mt-0"
      >
        {education.map((ed) => (
          <li
            key={ed.id}
            data-edu
            className="grid gap-x-6 gap-y-2 border-b border-rule py-5 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <p className="text-[length:clamp(18px,1.4vw,20px)] leading-[1.3] font-bold tracking-[-0.01em]">
                {ed.qualification}
              </p>
              <p className="type-small mt-0.5 text-ink-muted">{ed.field}</p>
              <p className="type-small mt-0.5">
                {ed.institution}, {ed.location}
              </p>
              {ed.note ? (
                <p className="type-small mt-2 font-semibold">{ed.note}</p>
              ) : null}
            </div>
            <p className="type-readout num text-ink-muted sm:text-right">
              {ed.period}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
