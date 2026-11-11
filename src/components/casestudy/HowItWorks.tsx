"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Project } from "@/content";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import {
  BREAKPOINTS,
  useMediaQuery,
  useReducedMotion,
} from "@/lib/motion/media";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { Card, Highlight, Section, Tag } from "@/components/ui";
import {
  buildJourney,
  distanceFor,
  lutAt,
  positionAt,
  type JourneyModel,
  type JourneyPlan,
} from "./journey/model";
import { JourneyBoard, type BoardGeo, type Mode } from "./journey/Board";
import { JourneySteps, type RailGeo } from "./journey/Steps";

/**
 * "How it works": THE REQUEST JOURNEY, the case study's authored moment.
 *
 * One lime request leaves "You" and travels the project's real flow (projects.ts `flow`, explained
 * in journeys.ts), scrubbed by scroll. Every stop it reaches compiles from sketch to crisp and
 * lights up, its card on the right lights in sync, and at the end the tangerine response runs back
 * along the rail and the window gets the SHIPPED stamp.
 * - >= 900px: the board (lanes = the architecture, rows = the steps) is pinned (CSS sticky) while
 *   the step cards scroll past it, ending on the round trip card: the response lands as that card
 *   arrives and the pin ends as it reaches the reading line.
 * - Scrubbed both ways: every state (packets, inks, compiled stops, the stamp, the round trip) is a
 *   function of the scroll position, smoothed by 0.6s, so scrolling back rewinds the journey.
 * - Below: no pin; the step cards on a vertical rail, the packet travelling down it as you scroll.
 * - Reduced motion / Motion off: the finished board and the step list, static, no packets.
 * - Sketch mode: everything stays a sketch.
 * Hover / focus a stop: its path brightens, the rest dims, a margin note says what happens there;
 * click / Enter: the page scrolls to that step (the request travels there).
 */
export function HowItWorks({ project }: { project: Project }) {
  const model = useMemo(() => buildJourney(project), [project]);
  return (
    <Section id="how" tone="paper-2" labelledBy="how-title">
      <h2 id="how-title" className="type-display">
        How it <Highlight color="blue">works</Highlight>
      </h2>
      <p className="type-lead measure mt-5 text-graphite">
        {model
          ? `One request through ${project.shortTitle}, start to finish: each stop is a real step of the system, drawn in the layer where it runs.`
          : `${project.shortTitle} in layers, from what the user touches down to where it runs.`}
      </p>
      {model ? <Journey model={model} /> : <Layers project={project} />}
    </Section>
  );
}

/** Projects without a flow: the architecture as a plain list of layers. */
function Layers({ project }: { project: Project }) {
  return (
    <ul className="mt-12 flex flex-col gap-3">
      {project.architecture.map((l) => (
        <li key={l.layer}>
          <Card
            padding="sm"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6"
          >
            <p className="type-h4 sm:w-36 sm:shrink-0">{l.layer}</p>
            <ul className="flex flex-wrap gap-2">
              {l.items.map((it) => (
                <Tag as="li" key={it}>
                  {it}
                </Tag>
              ))}
            </ul>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function headerHeight(): number {
  const v = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--header-h"),
  );
  return Number.isFinite(v) && v > 0 ? v : 72;
}

type Engine = { render: () => void; seek: (k: number) => void };

function Journey({ model }: { model: JourneyModel }) {
  const n = model.stops.length;
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const wide = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`, false);
  const mode: Mode = sketch ? "sketch" : reduced ? "static" : "live";
  // Server HTML (and the first client render) is the finished journey: content first, no JS needed.
  const [reached, setReached] = useState(n + 1);
  const [focus, setFocus] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const boardGeo = useRef<BoardGeo | null>(null);
  const railGeo = useRef<RailGeo | null>(null);
  const engine = useRef<Engine | null>(null);
  // Lenis appears after the first render: always scroll through the latest API (smooth, or native with reduced motion).
  const { scrollTo } = useSmoothScroll();
  const scroll = useRef(scrollTo);
  useLayoutEffect(() => {
    scroll.current = scrollTo;
  }, [scrollTo]);
  const active = mode === "live" && reached >= 1 && reached <= n ? reached : 0;

  const onGeometry = useCallback(() => engine.current?.render(), []);
  const onSelect = useCallback((k: number) => {
    setFocus(k);
    engine.current?.seek(k);
  }, []);

  // THE ENGINE: scroll -> journey position s (0..N+1) -> packet, ink, and the stops reached.
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const cardOf = (k: number) =>
        root.querySelector<HTMLElement>(`[data-step-card="${k}"]`);
      const seekCard = (k: number, smooth: boolean) => {
        const card = cardOf(k);
        if (!card) return;
        const r = card.getBoundingClientRect();
        const head = headerHeight();
        scroll.current(
          window.scrollY +
            r.top +
            r.height / 2 -
            (head + (window.innerHeight - head) / 2),
          { immediate: !smooth },
        );
      };

      // Inks fully drawn (static) or hidden (sketch), no packets.
      const paintFinal = (s: number) => {
        const b = boardGeo.current;
        if (b) {
          b.segs.forEach((g) => {
            g.ink.style.strokeDashoffset = s > 0 ? "0" : `${g.lut.len + 2}`;
            if (g.head) g.head.style.opacity = s > 0 ? "1" : "0";
          });
          b.fwd.style.opacity = "0";
          b.back.style.opacity = "0";
        }
        const r = railGeo.current;
        if (r) {
          r.ink.style.strokeDashoffset = s > 0 ? "0" : `${r.len}`;
          r.fwd.style.opacity = "0";
          r.back.style.opacity = "0";
        }
      };

      if (mode !== "live") {
        const final = mode === "static" ? n + 1 : 0;
        setReached(final);
        paintFinal(final);
        engine.current = {
          render: () => paintFinal(final),
          seek: (k) => seekCard(k, false),
        };
        return () => {
          engine.current = null;
        };
      }

      const state = { s: 0, v: 0, last: 0, t: 0 };
      let lastReached = -1;
      let plan: JourneyPlan | null = null;
      let gridTop = 0;
      let head = 72;
      let railTop = 0;

      const paintBoard = (s: number) => {
        const b = boardGeo.current;
        if (!b) return;
        const seg = Math.min(Math.floor(s), n);
        const t = s - seg;
        b.segs.forEach((g, j) => {
          const p = s >= j + 1 ? 1 : j === seg ? t : 0;
          g.ink.style.strokeDashoffset = `${(g.lut.len + 2) * (1 - p)}`;
          if (g.head) g.head.style.opacity = p > 0.55 ? "1" : "0";
        });
        const isBack = seg === n;
        const el = isBack ? b.back : b.fwd;
        (isBack ? b.fwd : b.back).style.opacity = "0";
        if (s <= 0 || s >= n + 1 || t <= 0) {
          el.style.opacity = "0";
          return;
        }
        const [x, y, angle] = lutAt(b.segs[seg].lut, t);
        // it slips out of one stop and into the next: small and faint at both ends of a leg
        const vis = Math.min(1, Math.min(t, 1 - t) / 0.08);
        const stretch = 1 + Math.min(0.9, Math.abs(state.v) * 0.3);
        const k = 0.5 + 0.5 * vis;
        el.style.opacity = `${vis}`;
        el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad) scale(${stretch * k}, ${k / Math.sqrt(stretch)})`;
      };

      const paintRail = (s: number) => {
        const r = railGeo.current;
        if (!r) return;
        const ys = r.stops;
        const seg = Math.min(Math.floor(s), n);
        const t = s - seg;
        const y =
          s >= n + 1 ? ys[n + 1] : ys[seg] + (ys[seg + 1] - ys[seg]) * t;
        const span = Math.max(1, ys[n + 1] - ys[0]);
        r.ink.style.strokeDashoffset = `${r.len * (1 - (y - ys[0]) / span)}`;
        const isBack = seg === n;
        const el = isBack ? r.back : r.fwd;
        (isBack ? r.fwd : r.back).style.opacity = "0";
        const moving = s > 0 && s < n + 1;
        el.style.opacity = moving ? "1" : "0";
        const stretch = 1 + Math.min(0.6, Math.abs(state.v) * 0.25);
        el.style.transform = `translate(0, ${y}px) scale(${1 / Math.sqrt(stretch)}, ${stretch})`;
      };

      const render = () => {
        const s = state.s;
        const now = performance.now();
        const dt = state.t ? Math.max(1 / 240, (now - state.t) / 1000) : 1;
        state.v = state.v * 0.7 + ((s - state.last) / dt) * 0.3;
        state.t = now;
        state.last = s;
        const r = Math.min(n + 1, Math.floor(s + 1e-3));
        if (r !== lastReached) {
          lastReached = r;
          setReached(r);
        }
        if (wide) paintBoard(s);
        else paintRail(s);
      };

      const measure = () => {
        head = headerHeight();
        const vh = window.innerHeight;
        const rr = root.getBoundingClientRect();
        gridTop = rr.top + window.scrollY;
        if (wide) {
          const rho = (vh - head) / 2;
          const at = model.stops.map((s) => {
            const c = cardOf(s.k)?.getBoundingClientRect();
            return c ? c.top + c.height / 2 - rr.top - rho : 0;
          });
          const gaps = at.slice(1).map((a, i) => a - at[i]);
          const minGap = gaps.length ? Math.min(...gaps) : vh * 0.4;
          const dwell = Math.max(8, Math.min(vh * 0.07, minGap * 0.2));
          // The return leg ends one dwell before the round trip card (stop N+1) is centred, like every
          // other arrival, and never after the pin ends (the grid's bottom reaching the viewport's).
          const trip = cardOf(n + 1)?.getBoundingClientRect();
          const leave = (at[n - 1] ?? 0) + dwell;
          const pinEnd = rr.height - vh + head;
          const land =
            trip && trip.height > 0
              ? Math.min(
                  trip.top + trip.height / 2 - rr.top - rho - dwell,
                  pinEnd - dwell / 2,
                )
              : leave + vh * 0.3;
          plan = {
            at,
            dwell,
            lead: vh * 0.24,
            back: Math.max(vh * 0.12, land - leave),
          };
        } else {
          const w = railGeo.current?.wrap.getBoundingClientRect();
          railTop = w ? w.top + window.scrollY : gridTop;
        }
      };

      const target = (): number => {
        const y = window.scrollY;
        if (wide) return plan ? positionAt(y - (gridTop - head), plan) : 0;
        const r = railGeo.current;
        if (!r) return 0;
        const py = y + window.innerHeight * 0.62 - railTop;
        const ys = r.stops;
        if (py <= ys[0]) return 0;
        for (let i = 0; i <= n; i++)
          if (py < ys[i + 1])
            return i + (py - ys[i]) / Math.max(1, ys[i + 1] - ys[i]);
        return n + 1;
      };

      // scrub smoothing: the journey trails the scroll by up to 0.6s (ScrollTrigger's `scrub: 0.6`, same ease)
      const follow = gsap.quickTo(state, "s", {
        duration: 0.6,
        ease: "power3.out",
        onUpdate: render,
      });
      const sync = (jump: boolean) => {
        const s = target();
        if (jump) {
          follow(s, s); // restart the follower at the target: no tween from the old position
          state.s = s;
          state.last = s;
          state.v = 0;
          render();
        } else follow(s);
      };

      const st = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onRefresh: () => {
          measure();
          sync(false);
        },
        onUpdate: () => sync(false),
      });

      measure();
      sync(true);
      engine.current = {
        // new geometry (resize, fonts, a re-layout): repaint where the packet is, then follow the scroll again
        render: () => {
          measure();
          render();
          follow(target());
        },
        seek: (k) => {
          if (wide && plan)
            scroll.current(gridTop - head + distanceFor(k, plan), {
              duration: 1.1,
            });
          else seekCard(k, true);
        },
      };

      return () => {
        st.kill();
        engine.current = null;
      };
    },
    {
      scope: rootRef,
      dependencies: [mode, wide, n, model.id],
      revertOnUpdate: true,
    },
  );

  // Transitions only once the first real state is on screen (the server render is the finished one).
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setSettled(true)),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  // A tap outside the board clears the focused stop (touch has no pointer-leave).
  useEffect(() => {
    if (focus === null) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.("[data-node]"))
        setFocus(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [focus]);

  return (
    <div
      ref={rootRef}
      data-qa="journey"
      data-journey-mode={mode}
      data-reached={reached}
      className={`mt-12 grid items-start gap-10 md:mt-14 md:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] md:gap-8 lg:gap-12 ${settled ? "" : "[&_*]:transition-none!"}`}
    >
      <div className="hidden md:sticky md:top-(--header-h) md:flex md:h-[calc(100svh-var(--header-h))] md:items-center md:py-4 [html:not(.js)_&]:md:h-auto">
        <JourneyBoard
          model={model}
          mode={mode}
          reached={reached}
          active={active}
          focus={focus}
          onFocus={setFocus}
          onSelect={onSelect}
          geo={boardGeo}
          onGeometry={onGeometry}
        />
      </div>
      <JourneySteps
        model={model}
        mode={mode}
        reached={reached}
        active={active}
        focus={focus}
        onHover={setFocus}
        rail={railGeo}
        onGeometry={onGeometry}
      />
    </div>
  );
}
