"use client";

/**
 * "Also shipped": the archive as a container port. Every archive project is a shipping container
 * (./port/model.ts). The drawing (./port/PortScene.tsx, lazy; geometry in ./port/scene.ts): a
 * ship-to-shore crane loads them from the yard onto the MV SHIPPED and unloads them again, on a
 * clock, while the port is on screen (a visible pause control stops it).
 *
 * Opening one: the yard list under the drawing is a tablist (one tab per container; arrow keys,
 * Home, End), and a click on a container in the drawing selects its tab too. Below it, the opened
 * container: a bill of lading on a clipboard (the tabpanel: code, title, category and year, line,
 * summary, cargo, source and live links) beside the container itself, seen from its door end with
 * the doors swung wide (./port/OpenContainer.tsx, geometry in ./port/container.ts) and the stack
 * inside as crates. Choosing another container swings the doors shut, switches the papers and the
 * paint, and swings them open on the new cargo. The first time it comes in, its doors open.
 * Reduced motion: still (the loaded ship; doors open; the papers switch at once). No JavaScript:
 * the drawings and the tabs are hidden and every bill of lading is listed.
 */
import { useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import dynamic from "next/dynamic";
import { archiveProjects, profile, type Project } from "@/content";
import { Card, ExternalLink, IconButton, LiveDot, Pill } from "@/components/ui";
import { Pause, Play } from "@/components/icons";
import { HandArrow, HandNote } from "@/components/sketch";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { useReducedMotion } from "@/lib/motion/media";
import { useInView } from "@/lib/hooks/useInView";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { boxesOf, type Box } from "./port/model";
import { Crate, OpenContainer, type ContainerApi } from "./port/OpenContainer";

const PortScene = dynamic(() => import("./port/PortScene").then((m) => m.PortScene), { ssr: false });

const BOXES = boxesOf(archiveProjects);

/** No JavaScript: the drawings and the tabs are hidden, and every bill of lading is listed. */
const NO_JS =
  "#work-port [data-qa=port],#work-port [data-port-tabs],#work-port [data-port-box]{display:none!important}#work-port [data-port-panel]{visibility:visible!important;grid-area:auto!important}#work-port [data-port-papers]{gap:2rem}";

export function AlsoShipped({ className }: { className?: string }) {
  const github = profile.socials.find((s) => s.kind === "github");
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const [selected, setSelected] = useState(0);
  const [shown, setShown] = useState(0);
  const [paused, setPaused] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  const near = useInView(scene, { rootMargin: "900px 0px", once: true });
  const hold = useRef<HTMLDivElement>(null);
  const api = useRef<ContainerApi>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const busy = useRef<gsap.core.Timeline | null>(null);
  const still = reduced || sketch;

  /** The opened container's parts that move: its crates and the shown bill of lading. */
  const parts = () => {
    const box = hold.current;
    return {
      crates: box ? Array.from(box.querySelectorAll<HTMLElement>("[data-crate]")) : [],
      paper: box?.querySelector<HTMLElement>("[data-port-panel].visible [data-paper]") ?? null,
    };
  };

  /** Doors swing open, the cargo settles in, the paper lands on the clipboard. */
  const opening = (tl: gsap.core.Timeline, at: number) => {
    const door = { t: 0 };
    const { crates, paper } = parts();
    tl.fromTo(door, { t: 0 }, { t: 1, duration: 0.75, ease: EASE.arrive, onUpdate: () => api.current?.setOpen(door.t) }, at);
    if (crates.length) tl.fromTo(crates, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: EASE.arrive, stagger: 0.05 }, at + 0.28);
    if (paper) tl.fromTo(paper, { autoAlpha: 0, x: -14, rotation: -4 }, { autoAlpha: 1, x: 0, rotation: -1.2, duration: 0.5, ease: EASE.arrive }, at + 0.06);
  };

  const { contextSafe } = useGSAP(
    () => {
      const box = hold.current;
      // the doors are drawn straight to the DOM (no GSAP to revert): start every run from open,
      // so a run that shut them (before reduced motion or sketch mode was known) cannot leave them shut
      api.current?.setOpen(1);
      if (!box || still) return;
      const r = box.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85) return;
      // hidden from JS only: shut, the cargo and the paper out of sight, until it comes in
      api.current?.setOpen(0);
      const { crates, paper } = parts();
      gsap.set([...crates, ...(paper ? [paper] : [])], { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: box,
        start: () => safeStart(box, "top 76%"),
        once: true,
        onEnter: () => opening(gsap.timeline(), 0.1),
      });
    },
    { dependencies: [still], revertOnUpdate: true },
  );

  /** Shut the doors on this container, switch to the next, open them on its cargo. */
  const swap = contextSafe((next: number) => {
    if (still || !api.current) {
      setShown(next);
      return;
    }
    busy.current?.kill();
    const tl = gsap.timeline();
    busy.current = tl;
    const door = { t: 1 };
    const { crates, paper } = parts();
    tl.fromTo(door, { t: 1 }, { t: 0, duration: 0.3, ease: EASE.exit, onUpdate: () => api.current?.setOpen(door.t) });
    if (crates.length) tl.to(crates, { autoAlpha: 0, y: 8, duration: 0.16, ease: EASE.exit }, 0);
    if (paper) tl.to(paper, { autoAlpha: 0, x: -10, duration: 0.18, ease: EASE.exit }, 0);
    tl.call(() => {
      flushSync(() => setShown(next));
      const after = gsap.timeline();
      busy.current = after;
      opening(after, 0.06);
    });
  });

  const select = (i: number) => {
    if (i === selected) return;
    setSelected(i);
    swap(i);
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = BOXES.length;
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    select(to);
    tabs.current[to]?.focus();
  };

  return (
    <Card as="div" id="work-port" padding="none" className={`overflow-hidden ${className ?? ""}`}>
      <noscript>
        <style>{NO_JS}</style>
      </noscript>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 px-[clamp(20px,3.2vw,44px)] pt-[clamp(24px,3vw,40px)]">
        <h3 id="work-more-title" className="type-h3">
          Also shipped
        </h3>
        {github ? (
          <ExternalLink
            href={github.href}
            arrow={false}
            hint="GitHub profile, opens in a new tab"
            data-cursor="blue"
            className="group -mr-2 inline-flex min-h-11 -rotate-2 items-center gap-1 rounded-chip px-2 text-blue-deep"
          >
            <span className="type-hand underline decoration-blue-deep/0 decoration-2 underline-offset-4 transition-[text-decoration-color] duration-(--dur-feedback) group-hover:decoration-blue-deep/60">
              more on GitHub
            </span>
            <HandArrow direction="right" seed="work-more-github" tone="blue" className="transition-transform duration-(--dur-ui) ease-arrive group-hover:translate-x-1 reduced:transition-none" />
          </ExternalLink>
        ) : null}
      </div>

      {/* the port: the crane loads and unloads the ship on its own (decoration; the yard list is below) */}
      <div className="relative mt-[clamp(14px,2vw,24px)]">
        <div
          ref={scene}
          aria-hidden="true"
          data-qa="port"
          className="paper-dots relative h-[clamp(13.5rem,64vw,17rem)] border-y border-line bg-paper md:h-auto md:aspect-[1000/345]"
        >
          {near ? <PortScene boxes={BOXES} selected={selected} onPick={select} reduced={reduced} sketch={sketch} paused={paused} /> : null}
          <HandNote tone="graphite" size="sm" rotate={-3} arrow="down" seed="port-note" className="pointer-events-none absolute top-3 left-[clamp(16px,3vw,40px)] max-md:hidden">
            the crane never stops · click a container to open it
          </HandNote>
        </div>
        {still ? null : (
          <IconButton
            label={paused ? "Play the crane" : "Pause the crane"}
            aria-pressed={paused}
            size="sm"
            icon={paused ? <Play /> : <Pause />}
            onClick={() => setPaused((p) => !p)}
            data-qa="port-pause"
            className="absolute top-3 right-3 bg-card"
          />
        )}
      </div>

      {/* the yard list: one tab per container */}
      <div data-port-tabs="" className="px-[clamp(20px,3.2vw,44px)] pt-5">
        <div role="tablist" aria-label="Containers: the projects" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 max-md:snap-x max-md:snap-mandatory md:flex-wrap md:overflow-visible">
          {archiveProjects.map((p, i) => {
            const b = BOXES[i];
            const on = i === selected;
            return (
              <button
                key={p.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`port-tab-${p.id}`}
                aria-selected={on}
                aria-controls={`port-panel-${p.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onTabKey(e, i)}
                data-qa="port-tab"
                className="type-ui inline-flex min-h-11 shrink-0 cursor-pointer snap-start items-center gap-2 rounded-chip border border-line-strong bg-card px-3 text-ink transition-colors duration-(--dur-feedback) hocus:border-ink aria-selected:border-ink aria-selected:bg-lime"
              >
                <BoxGlyph box={b} />
                <span className="type-mono text-graphite tabular-nums">{b.no}</span>
                <span className="whitespace-nowrap">{p.shortTitle}</span>
                {b.live ? <LiveDot size={7} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* the opened container: its bill of lading on the left, the container and its cargo on the right */}
      <div className="px-[clamp(20px,3.2vw,44px)] pt-4 pb-[clamp(20px,3.2vw,44px)]">
        <div ref={hold} data-qa="port-hold" className="paper-dots relative overflow-hidden rounded-panel border border-line bg-paper px-[clamp(16px,3vw,40px)] py-[clamp(20px,3vw,36px)]">
          <div className="grid items-center gap-x-[clamp(20px,4vw,56px)] gap-y-5 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div data-port-papers="" className="grid">
              {archiveProjects.map((p, i) => (
                <Bill key={p.id} project={p} box={BOXES[i]} shown={i === shown} />
              ))}
            </div>
            <div data-port-box="" className="max-md:order-first">
              <div className="relative mx-auto aspect-[556/342] w-full max-w-[42rem]">
                <OpenContainer box={BOXES[shown]} stack={archiveProjects[shown].stack} sketch={sketch} api={api} />
              </div>
              {/* phones: the cargo unloaded in front of the container */}
              <div aria-hidden="true" className="mt-3 flex flex-wrap justify-center gap-2 md:hidden">
                {archiveProjects[shown].stack.map((s) => (
                  <Crate key={s} label={s} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** One container's papers: the tabpanel, a bill of lading on a clipboard. */
function Bill({ project: p, box, shown }: { project: Project; box: Box; shown: boolean }) {
  return (
    <div role="tabpanel" id={`port-panel-${p.id}`} aria-labelledby={`port-tab-${p.id}`} data-port-panel="" className={`[grid-area:1/1] ${shown ? "visible" : "invisible"}`}>
      <div data-paper="" className="relative mt-3 -rotate-[1.2deg] rounded-[6px] border border-line bg-card px-5 pt-7 pb-5 shadow-card sm:px-7">
        <Clip />
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-dashed border-line-strong pb-2.5">
          <p className="type-label text-graphite">Bill of lading</p>
          <p className="type-mono text-graphite tabular-nums">{box.code}</p>
        </div>
        <h4 className="type-h4 mt-3.5">{p.title}</h4>
        <p className="type-mono mt-1 text-graphite">
          {p.category} · {p.year}
        </p>
        <p className="type-body mt-3 text-ink">{p.tagline}</p>
        <p className="type-small mt-2 text-graphite">{p.summary}</p>
        <p className="type-mono mt-3 text-graphite">
          <span className="text-ink">Cargo:</span> {p.stack.join(" · ")}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {p.links.repo ? (
            <Pill href={p.links.repo} size="sm" hint="source on GitHub, opens in a new tab" data-cursor="blue">
              Source on GitHub<span className="sr-only">: {p.shortTitle}</span>
            </Pill>
          ) : null}
          {p.links.live ? (
            <Pill href={p.links.live} variant="outline" size="sm" hint="live site, opens in a new tab" data-cursor="tangerine" iconBefore={<LiveDot />}>
              Live site<span className="sr-only">: {p.shortTitle}</span>
            </Pill>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The clipboard's clip, at the top of the paper. */
function Clip() {
  return (
    <svg aria-hidden="true" width="64" height="26" viewBox="0 0 64 26" fill="none" className="absolute -top-[15px] left-1/2 -translate-x-1/2">
      <path d="M22 12 C22 2 42 2 42 12" strokeWidth={2} className="stroke-ink" />
      <path d="M26 12 C26 6 38 6 38 12" strokeWidth={1.6} className="stroke-graphite" />
      <rect x={6} y={11} width={52} height={13} rx={3} strokeWidth={1.6} className="fill-ink stroke-ink" />
      <rect x={10} y={15} width={44} height={2} rx={1} className="fill-lime" />
    </svg>
  );
}

/** A tiny container in the tab: its paint, its ridges. */
function BoxGlyph({ box }: { box: Box }) {
  const fill = { "blue-soft": "fill-blue-soft", ink: "fill-ink", card: "fill-card", graphite: "fill-graphite", "paper-2": "fill-paper-2" }[box.tone];
  return (
    <svg aria-hidden="true" width="22" height="11" viewBox="0 0 22 11" fill="none" className="shrink-0">
      <rect x={0.75} y={0.75} width={20.5} height={9.5} rx={0.8} strokeWidth={1.2} className={`${fill} stroke-ink`} />
      {[5, 9, 13, 17].map((x) => (
        <line key={x} x1={x} y1={2.5} x2={x} y2={8.5} strokeWidth={0.9} className={box.dark ? "stroke-ash" : "stroke-line-strong"} />
      ))}
    </svg>
  );
}
