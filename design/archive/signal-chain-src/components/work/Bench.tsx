"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { featuredProjects, type Project } from "@/content";
import { routes } from "@/lib/routes";
import { stage } from "@/lib/stores/stage";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE, DUR, STAGGER } from "@/lib/motion/eases";
import { useMediaQuery, useReducedMotion } from "@/lib/motion/media";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { ExternalLink } from "@/components/ui";
import { TransitionLink } from "@/components/transition";
import { ArrowRight } from "@/components/icons";
import { Board, MountingHoles } from "./Board";
import { ConnectionList, WhatIfControl } from "./Probes";
import { benchFacts, defaultState, resolveSystem, type SysState } from "./system";

const projects = featuredProjects;

/**
 * 02 Systems: the bench. Entries scroll on the left and carry the essentials: name, one-line
 * purpose, 3-4 key facts, the what-if and links. On desktop the board and scope of the active
 * system are held in a sticky panel on the right and RE-ACQUIRE when an entry crosses 60% of the
 * viewport (old board off its rail 0.28s power2.in, the new one seats with the lock ease, chips
 * seat, copper draws at constant speed). The probe list sits in a per-entry drawer; the full spec
 * table, the request path and the sources live on the datasheet. On phones and portrait tablets
 * each entry carries its own board and scope inline; its drawer holds the what-if and the probes.
 * The probe state is kept here, per system, so the board, the scope and the lists always agree.
 */
export function Bench() {
  const root = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<(HTMLElement | null)[]>([]);
  const inlineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const reduced = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 861px)");
  const { scrollTo } = useSmoothScroll();

  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [states, setStates] = useState<Record<string, SysState>>(() =>
    Object.fromEntries(projects.map((p) => [p.id, defaultState(p.id)])),
  );
  const patch = (id: string, p: Partial<SysState>) => setStates((all) => ({ ...all, [id]: { ...all[id], ...p } }));
  // A tap on a connection that is already clipped replays its sweep (ping); it never un-probes.
  const probe = (id: string, conn: string, channel: number) =>
    setStates((all) => {
      const st = all[id];
      const pins = st.pins.slice();
      const ping = st.ping.slice();
      if (pins[channel - 1] === conn) ping[channel - 1] += 1;
      else pins[channel - 1] = conn;
      return { ...all, [id]: { ...st, pins, ping, last: conn } };
    });
  // Releasing is explicit: the Release control on the scope row.
  const release = (id: string, channel: number) =>
    setStates((all) => {
      const st = all[id];
      const pins = st.pins.slice();
      const freed = pins[channel - 1];
      pins[channel - 1] = null;
      return { ...all, [id]: { ...st, pins, last: st.last === freed ? null : st.last } };
    });

  // Switching the what-if clips a probe on every connection it changed, so the effect shows on the scope.
  const changeOption = (id: string, opt: number) =>
    setStates((all) => {
      const st = all[id];
      const before = resolveSystem(id, st.opt).conns;
      const pins = st.pins.slice();
      let last = st.last;
      resolveSystem(id, opt).conns.forEach((c, i) => {
        const was = before[i];
        if (c.channel === "sigma") return;
        if (was.idle !== c.idle || was.shape !== c.shape || was.label !== c.label) {
          pins[c.channel - 1] = c.id;
          last = c.id;
        }
      });
      return { ...all, [id]: { ...st, opt, pins, last } };
    });

  // Coming back from a datasheet: re-acquire that system.
  useEffect(() => {
    const slug = stage.get().returnFrom;
    if (!slug) return;
    const i = projects.findIndex((p) => p.id === slug);
    stage.set({ returnFrom: null });
    if (i < 0) return;
    setActive(i);
    setShown(i);
  }, []);

  // Which entry is at the reading line (60% of the viewport).
  useGSAP(
    () => {
      const triggers = entryRefs.current.map((el, i) =>
        el
          ? ScrollTrigger.create({
              trigger: el,
              start: "top 60%",
              end: "bottom 60%",
              onToggle: (self) => {
                if (self.isActive) setActive(i);
              },
            })
          : null,
      );
      return () => triggers.forEach((t) => t?.kill());
    },
    { scope: root },
  );

  // Swap: the old board leaves its rail, then the shown system changes.
  useEffect(() => {
    const board = boardRef.current;
    if (active === shown) return;
    if (!board || reduced || !desktop) {
      setShown(active);
      return;
    }
    let done = false;
    const tween = gsap.to(board, {
      x: -48,
      autoAlpha: 0,
      duration: 0.28,
      ease: EASE.exit,
      onComplete: () => {
        done = true;
        setShown(active);
      },
    });
    return () => {
      tween.kill();
      if (!done) gsap.to(board, { x: 0, autoAlpha: 1, duration: 0.15, ease: EASE.probe, overwrite: "auto" });
    };
  }, [active, shown, reduced, desktop]);

  // Arrival of the panel's board: it seats on its rail, the chips seat, the copper draws itself.
  useGSAP(
    () => {
      const board = boardRef.current;
      if (!board || reduced || !desktop) return;
      const chips = gsap.utils.toArray<HTMLElement>("[data-chip]", board);
      const tl = gsap.timeline();
      // The board seating on its rail is the one place the lock ease (2% overshoot) is used.
      tl.fromTo(
        board,
        { x: 56, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: DUR.panel, ease: EASE.lock, clearProps: "transform,opacity,visibility" },
        0,
      );
      if (chips.length) {
        tl.from(chips, { y: 8, autoAlpha: 0, duration: DUR.chip, ease: EASE.panel, stagger: STAGGER.chips, clearProps: "transform,opacity,visibility" }, 0.12);
      }
    },
    { scope: panelRef, dependencies: [shown, reduced, desktop], revertOnUpdate: true },
  );

  // The inline boards (phones, portrait tablets): chips seat once when they enter.
  useGSAP(
    () => {
      if (reduced || desktop) return;
      inlineRefs.current.forEach((el) => {
        if (!el) return;
        const chips = gsap.utils.toArray<HTMLElement>("[data-chip]", el);
        if (!chips.length) return;
        gsap.from(chips, {
          y: 8,
          autoAlpha: 0,
          duration: DUR.chip,
          ease: EASE.panel,
          stagger: STAGGER.chips,
          clearProps: "transform,opacity,visibility",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
    },
    { scope: root, dependencies: [reduced, desktop], revertOnUpdate: true },
  );

  const current = projects[shown] ?? projects[0];
  const currentState = states[current.id];
  const currentSystem = resolveSystem(current.id, currentState.opt);
  const probeConn = (id: string, system: ReturnType<typeof resolveSystem>, conn: string) => {
    const c = system.conns.find((x) => x.id === conn);
    if (c && c.channel !== "sigma") probe(id, conn, c.channel);
  };

  return (
    <div ref={root} className="mt-12 grid gap-x-[clamp(28px,4vw,64px)] min-[861px]:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
      <ol className="min-w-0">
        {projects.map((p, i) => (
          <li
            key={p.id}
            data-system={p.id}
            ref={(el) => {
              entryRefs.current[i] = el;
            }}
            onFocusCapture={() => setActive(i)}
            className="rule-t py-7 min-[861px]:py-8"
          >
            <Entry
              project={p}
              state={states[p.id]}
              patch={(x) => patch(p.id, x)}
              probe={(conn, ch) => probe(p.id, conn, ch)}
              release={(ch) => release(p.id, ch)}
              setOption={(opt) => changeOption(p.id, opt)}
              panelRef={panelRef}
              desktop={desktop}
              inlineRef={(el) => {
                inlineRefs.current[i] = el;
              }}
            />
          </li>
        ))}
      </ol>

      <div className="hidden min-[861px]:block">
        <div className="sticky top-[calc(var(--bar)+16px)]">
          <div ref={panelRef} data-instrument="" className="relative border border-graticule-strong bg-bezel p-5 lg:p-6">
            <MountingHoles />
            <div ref={boardRef}>
              <Board
                key={current.id}
                project={current}
                system={currentSystem}
                state={currentState}
                onRelease={(ch) => release(current.id, ch)}
              />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-graticule pt-4">
              <TransitionLink
                href={routes.work(current.id)}
                origin={panelRef}
                className="btn btn-solid" data-cta="bench-datasheet"
                data-cursor-label="Open datasheet"
              >
                Open datasheet <ArrowRight />
              </TransitionLink>
              <nav aria-label="Systems on the bench" className="flex">
                {projects.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={p.title}
                    aria-current={i === active ? "true" : undefined}
                    data-cursor-label={`Acquire: ${p.shortTitle}`}
                    onClick={() => {
                      const el = entryRefs.current[i];
                      if (el) scrollTo(el, { offset: -(window.innerHeight * 0.2) });
                    }}
                    className={`type-readout num grid h-11 min-w-11 place-items-center border-b px-1 transition-colors duration-200 ease-panel ${
                      i === active ? "border-bone text-bone" : "border-graticule-strong text-muted hover:text-bone"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          <p className="type-small mt-4 max-w-[58ch] text-muted">
            Each board is drawn from the system&rsquo;s own README: its parts and the connections between them. The scope
            shows the kind of traffic on a connection, not measured data. The request path and every source are on the
            datasheet.
          </p>
        </div>
      </div>
    </div>
  );
}

function Entry({
  project,
  state,
  patch,
  probe,
  release,
  setOption,
  panelRef,
  desktop,
  inlineRef,
}: {
  project: Project;
  state: SysState;
  patch: (p: Partial<SysState>) => void;
  probe: (conn: string, channel: number) => void;
  release: (channel: number) => void;
  setOption: (opt: number) => void;
  panelRef: RefObject<HTMLDivElement | null>;
  desktop: boolean;
  inlineRef: (el: HTMLDivElement | null) => void;
}) {
  const boardOrigin = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const titleId = `bench-${project.id}`;
  const probeId = useId();
  const system = resolveSystem(project.id, state.opt);
  const facts = benchFacts(project, system.record);

  const toggle = (where: "frame" | "row") => (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={probeId}
      onClick={() => setOpen((o) => !o)}
      data-cursor-label={open ? "Close probes" : "Probe this system"}
      className={
        where === "frame"
          ? "type-button flex min-h-11 w-full items-center justify-between gap-4 border-t border-graticule-strong px-4 text-left text-bone transition-colors duration-200 ease-panel hover:bg-graticule active:bg-graphite min-[861px]:hidden"
          : "link-mono hidden gap-2 text-bone min-[861px]:inline-flex coarse:min-h-11"
      }
    >
      {where === "frame" ? "Probe this system" : "Probe connections"}
      <svg aria-hidden="true" focusable="false" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-none">
        <path d="M1 7h12" />
        <path
          d="M7 1v12"
          style={{
            transformOrigin: "7px 7px",
            transform: open ? "scaleY(0)" : "scaleY(1)",
            transition: reduced ? "none" : "transform 300ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </svg>
    </button>
  );

  return (
    <article aria-labelledby={titleId} className="flex flex-col">
      <h3 id={titleId} className="type-title">
        {project.title}
      </h3>
      <p className="type-lead mt-3 max-w-[40ch]">{project.tagline}</p>

      <table className="mt-5 w-full max-w-[56ch] border-collapse">
        <caption className="sr-only">Key facts from the project record and its README; the datasheet lists all of them</caption>
        <tbody>
          {facts.map((f) => (
            <tr key={f.label} className="border-t border-graticule last:border-b">
              <th scope="row" className="type-small w-[36%] py-1.5 pr-4 text-left align-baseline font-normal text-muted first-letter:uppercase">
                {f.label}
              </th>
              <td className="type-readout py-1.5 align-baseline text-bone">{f.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Desktop: the what-if sits in the entry, beside the board it re-routes. */}
      <div className="mt-6 hidden min-[861px]:block">
        <WhatIfControl system={system} value={state.opt} onChange={setOption} effect="changed" />
      </div>

      {/* Phones and portrait tablets: the board and scope inline, in their instrument frame. */}
      <div
        ref={(el) => {
          boardOrigin.current = el;
          inlineRef(el);
        }}
        className="mt-6 border border-graticule-strong bg-bezel min-[861px]:hidden"
      >
        <div className="relative p-4 sm:p-5">
          <MountingHoles />
          <Board project={project} system={system} state={state} onRelease={release} />
        </div>
        {toggle("frame")}
      </div>

      <div
        id={probeId}
        className="grid min-[861px]:order-last"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          visibility: open ? "visible" : "hidden",
          transition: reduced
            ? "none"
            : `grid-template-rows ${open ? 420 : 220}ms cubic-bezier(0.16,1,0.3,1), visibility 0s linear ${open ? 0 : 220}ms`,
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="grid gap-8 pt-6">
            <div className="min-[861px]:hidden">
              <WhatIfControl system={system} value={state.opt} onChange={setOption} />
            </div>
            <ConnectionList
              title={project.title}
              conns={system.conns}
              state={state}
              readme={system.record.readme}
              onProbe={(id) => {
                const c = system.conns.find((x) => x.id === id);
                if (c && c.channel !== "sigma") probe(id, c.channel);
              }}
              onPreview={(id) => patch({ preview: id })}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 min-[861px]:mt-6">
        <TransitionLink
          href={routes.work(project.id)}
          origin={desktop ? panelRef : boardOrigin}
          className="link-mono coarse:min-h-11"
          data-cursor-label="Open datasheet"
        >
          Datasheet <ArrowRight />
        </TransitionLink>
        {project.links.repo ? (
          <ExternalLink href={project.links.repo} className="link-mono coarse:min-h-11" hint={`opens the ${project.shortTitle} repository in a new tab`}>
            Repository
          </ExternalLink>
        ) : null}
        {project.links.live ? (
          <ExternalLink href={project.links.live} className="link-mono coarse:min-h-11" hint={`opens the ${project.shortTitle} live demo in a new tab`}>
            Live
          </ExternalLink>
        ) : null}
        {toggle("row")}
      </div>
    </article>
  );
}
