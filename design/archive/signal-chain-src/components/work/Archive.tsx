"use client";

import { useRef } from "react";
import { archiveProjects } from "@/content";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { ExternalLink } from "@/components/ui";

/**
 * 02.b Also built: the rest of the record. The index of names is always printed; the parts table
 * (what it is, stack, links) sits in a native <details>, so it opens without JavaScript and
 * find-in-page still reaches it. Motion: the index is wiped in left to right by clip-path once
 * when it scrolls in (skipped if it is already on screen at load); opening the table wipes its
 * rows in the same way, staggered. Reduced motion: nothing moves, everything is visible.
 */
export function Archive() {
  const ref = useRef<HTMLDivElement>(null);
  const details = useRef<HTMLDetailsElement>(null);
  const reduced = useReducedMotion();
  const count = archiveProjects.length;

  useGSAP(
    (_, contextSafe) => {
      const root = ref.current;
      const box = details.current;
      if (!root || !box || reduced) return;

      const index = root.querySelector<HTMLElement>("[data-wipe]");
      if (index && index.getBoundingClientRect().top > window.innerHeight) {
        gsap.fromTo(
          index,
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            duration: DUR.wipe,
            ease: EASE.out,
            clearProps: "clipPath",
            scrollTrigger: { trigger: index, start: "top 88%", once: true },
          },
        );
      }

      const onToggle = contextSafe!(() => {
        ScrollTrigger.refresh();
        if (!box.open) return;
        const rows = gsap.utils.toArray<HTMLElement>("tbody tr", box);
        if (!rows.length) return;
        gsap.fromTo(
          rows,
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: DUR.wipe, ease: EASE.out, stagger: STAGGER.rows, clearProps: "clipPath", overwrite: true },
        );
      });
      box.addEventListener("toggle", onToggle);
      return () => box.removeEventListener("toggle", onToggle);
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className="mt-20 md:mt-24">
      <h3 id="also-built" className="type-title">
        Also built <span className="num text-dim">[{count}]</span>
      </h3>
      <p data-wipe="" className="type-lead mt-4 max-w-[72ch] text-muted">
        {archiveProjects.map((p, i) => (
          <span key={p.id}>
            <span className="whitespace-nowrap text-bone">{p.title}</span>
            {i < count - 1 ? <span aria-hidden="true" className="text-dim"> / </span> : null}
            {i < count - 1 ? <span className="sr-only">, </span> : null}
          </span>
        ))}
      </p>

      <details ref={details} className="group mt-5">
        <summary
          className="type-button inline-flex min-h-11 cursor-pointer list-none items-center gap-3 border border-graticule-strong px-4 text-bone transition-colors duration-200 ease-panel hover:bg-bezel active:bg-graticule [&::-webkit-details-marker]:hidden"
          data-cursor-label="Open the parts list"
        >
          <span className="group-open:hidden">Show the parts list</span>
          <span className="hidden group-open:inline">Hide the parts list</span>
          <svg aria-hidden="true" focusable="false" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-none">
            <path d="M1 7h12" />
            <path d="M7 1v12" className="origin-center transition-transform duration-300 ease-expo group-open:scale-y-0 reduced:transition-none" />
          </svg>
        </summary>

        <table className="mt-6 w-full border-collapse text-left">
          <caption className="sr-only">Other projects: system, what it is, stack and links</caption>
          <thead className="max-md:sr-only">
            <tr className="border-b border-graticule-strong">
              <th scope="col" className="type-label w-[27%] py-2.5 pr-6 font-medium text-muted">
                System
              </th>
              <th scope="col" className="type-label w-[33%] py-2.5 pr-6 font-medium text-muted">
                What it is
              </th>
              <th scope="col" className="type-label py-2.5 pr-6 font-medium text-muted">
                Stack
              </th>
              <th scope="col" className="type-label w-[1%] py-2.5 font-medium whitespace-nowrap text-muted">
                Links
              </th>
            </tr>
          </thead>
          <tbody>
            {archiveProjects.map((p) => (
              <tr
                key={p.id}
                className="border-b border-graticule max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-4 max-md:gap-y-1.5 max-md:py-4 md:transition-colors md:duration-200 md:hover:bg-bezel"
              >
                <th scope="row" className="py-3.5 pr-6 text-left align-baseline font-normal max-md:p-0">
                  <span className="type-lead block font-semibold">{p.title}</span>
                  <span className="type-readout mt-0.5 block text-muted">
                    <span className="num">{p.year}</span> / {p.category}
                  </span>
                </th>
                <td className="type-small py-3.5 pr-6 align-baseline text-muted max-md:col-span-2 max-md:row-start-2 max-md:p-0">{p.tagline}</td>
                <td className="type-readout py-3.5 pr-6 align-baseline text-muted max-md:col-span-2 max-md:row-start-3 max-md:p-0">{p.stack.join(" / ")}</td>
                <td className="py-2 align-baseline max-md:col-start-2 max-md:row-start-1 max-md:p-0 md:whitespace-nowrap">
                  <span className="flex flex-wrap justify-end gap-x-5 gap-y-0 md:justify-start">
                    {p.links.repo ? (
                      <ExternalLink href={p.links.repo} className="link-mono" hint={`opens the ${p.shortTitle} repository in a new tab`}>
                        Repository
                      </ExternalLink>
                    ) : null}
                    {p.links.live ? (
                      <ExternalLink href={p.links.live} className="link-mono" hint={`opens the ${p.shortTitle} live demo in a new tab`}>
                        Live
                      </ExternalLink>
                    ) : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
