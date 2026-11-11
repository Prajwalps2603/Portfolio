"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useRef } from "react";
import { featuredProjects, type Project } from "@/content";
import { useMediaQuery } from "@/lib/motion/media";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { useInView } from "@/lib/hooks/useInView";
import { MiniUI } from "@/components/miniui";
import { PINNED_QUERY, ProjectActions, ProjectFacts, ProjectStack } from "./parts";
import { useLanded } from "./useLanded";
import { useReturnFrom } from "./useReturnFrom";
import { ViewSwitch } from "./ViewSwitch";
import { setProjectView, sideOf, useWorkState, type WorkView } from "./viewStore";

/**
 * 03 SELECTED WORK, the stacked cards (phones, portrait tablets, short laptop windows): the same
 * content as the pinned stage, no tilt. Each card's mini-UI compiles from its sketch once when it
 * scrolls into view (MiniUI autoplay; instant with reduced motion). Mini-UIs mount only near the
 * viewport, so the hidden twin of this layout on desktop costs no mini-UI at all.
 *
 * Every card has its own quiet "Interface | Architecture" switch, static above its window (where
 * the stage keeps its one switch) and first in the card, so keyboards and screen readers meet the
 * control before what it turns. It turns THAT card over: nothing floats over the cards, and nothing
 * above the reader changes. The window's column is pinned to the top of the card, so when it turns
 * to the taller architecture side the switch stays under the finger and the window grows downward.
 * The cards start on the shared side (useWorkView): the palette's "Show how my projects are built"
 * turns them all, once its scroll to #work has landed (useLanded).
 *
 * The architecture side is the living diagram laid out vertically (legible at 390px), with its
 * narration and pause control under it. It is a lazy chunk, warmed as the cards come on screen and
 * on intent (hover / focus of a switch).
 */

const loadArch = () => import("./ArchitectureWindow");
const ArchitectureCard = dynamic(() => loadArch().then((m) => m.ArchitectureCard), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="paper-dots aspect-[16/11] rounded-card bg-paper" />,
});
/** Warm the lazy chunk (the cards on screen, intent on a switch); a failed load just waits for the real one. */
const warmArch = () => {
  loadArch().catch(() => {});
};

export function WorkCards({ className }: { className?: string }) {
  const pinned = useMediaQuery(PINNED_QUERY);
  const wide = useMediaQuery("(min-width: 900px)");
  const { scrollTo } = useSmoothScroll();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useReturnFrom(!pinned, (i) => {
    const card = listRef.current?.children[i];
    if (!(card instanceof HTMLElement)) return;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
    scrollTo(card, { immediate: true, force: true, offset: -(header + 16) });
  });

  // every card's side; a shared turn shows once the page has stopped scrolling
  const work = useLanded(useWorkState());

  // the diagram chunk loads in the background once the cards are on screen (never while the
  // pinned stage stands in for them: this layout is display:none then, so it never intersects)
  const onScreen = useInView(rootRef, { rootMargin: "200px 0px", once: true });
  useEffect(() => {
    if (onScreen) warmArch();
  }, [onScreen]);

  return (
    <div ref={rootRef} data-work-cards="" className={`flex flex-col ${className ?? ""}`}>
      <ol ref={listRef} aria-label="Featured projects" className="flex flex-col gap-[clamp(64px,9vw,104px)]">
        {featuredProjects.map((p) => (
          <WorkCard key={p.id} project={p} side={sideOf(work, p.id)} live={!pinned} size={wide ? "md" : "sm"} />
        ))}
      </ol>
    </div>
  );
}

/**
 * One project. `live` = this layout is the one on screen: on desktop the cards are the hidden twin
 * of the pinned stage, and a shared flip there must not mount diagrams nobody sees.
 * Memoised: a card's own turn re-renders that card only.
 */
const WorkCard = memo(function WorkCard({ project, side, live, size }: { project: Project; side: WorkView; live: boolean; size: "sm" | "md" }) {
  const visualRef = useRef<HTMLDivElement>(null);
  const near = useInView(visualRef, { rootMargin: "480px 0px", once: true });
  const titleId = `work-card-${project.id}`;

  const onSide = (v: WorkView) => {
    if (v === "architecture") warmArch();
    setProjectView(project.id, v);
  };

  return (
    <li>
      <article aria-labelledby={titleId} className="grid gap-x-[clamp(28px,4vw,56px)] gap-y-7 sm:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
        <div className="min-w-0 sm:self-start">
          {/* the card's own switch (JS only: no dead control without it) */}
          <div data-qa="work-card-switch" data-project={project.id} className="mb-3 hidden justify-end [.js_&]:flex">
            <ViewSwitch value={side} onChange={onSide} onIntent={warmArch} label={`Show ${project.shortTitle} as`} qa="work-card-view" variant="quiet" />
          </div>
          <div ref={visualRef} data-qa="work-card-visual" data-project={project.id} data-view={side}>
            {side === "architecture" ? (
              live ? (
                <ArchitectureCard project={project} />
              ) : (
                <div aria-hidden="true" className="paper-dots aspect-[16/11] rounded-card bg-paper" />
              )
            ) : (
              <div aria-hidden="true" className="relative aspect-[16/11]">
                {/* the sheet the sketch is drawn on; the shipped window covers it */}
                <div className="paper-dots absolute inset-0 rounded-card bg-paper" />
                {near ? <MiniUI projectId={project.id} autoplay size={size} className="relative" /> : null}
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0 sm:self-center">
          <p className="type-mono text-graphite">
            {project.category} · {project.year}
          </p>
          <h3 id={titleId} className="type-h3 mt-2">
            {project.title}
          </h3>
          <p className="type-body mt-3 text-graphite">{project.tagline}</p>
          <ProjectFacts project={project} className="mt-5" />
          <ProjectStack project={project} className="mt-5" />
          <ProjectActions project={project} className="mt-6" />
        </div>
      </article>
    </li>
  );
});
