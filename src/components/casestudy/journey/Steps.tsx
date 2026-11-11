"use client";

import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { roughLine } from "@/components/sketch/rough";
import { HandNote, SketchRect } from "@/components/sketch";
import { Tag } from "@/components/ui";
import { Check } from "@/components/icons";
import {
  LANE_LABEL,
  touchedLayers,
  type JourneyModel,
  type JourneyStop,
} from "./model";
import type { Mode } from "./Board";

/**
 * THE STEP LIST: the journey as an ordered list (the DOM equivalent of the diagram).
 * - >= 900px: one card per stop, each in a tall slot beside the pinned board; the card on the
 *   reading line is the stop the packet is in. An intro slot opens it; the round trip card closes
 *   it as stop N+1 (the response back with you): the return leg runs while it scrolls up, it
 *   compiles as the response lands, and the pin ends as it reaches the reading line, so the board
 *   never stays pinned beside an empty column.
 * - Phones and portrait tablets: the same cards on a vertical rail, "You" at the top and "back to
 *   you" at the bottom; the packet travels down the rail as you scroll (no pin).
 * Reduced motion / no JS: no slots, no rail packet, every card shipped (the round trip too).
 */

export type RailGeo = {
  wrap: HTMLElement;
  /** y of stop 0..N+1 (rail markers), relative to `wrap`. */
  stops: number[];
  ink: SVGPathElement;
  len: number;
  fwd: HTMLElement;
  back: HTMLElement;
};

type StepsProps = {
  model: JourneyModel;
  mode: Mode;
  reached: number;
  active: number;
  focus: number | null;
  onHover: (k: number | null) => void;
  rail: RefObject<RailGeo | null>;
  onGeometry: () => void;
};

const RAIL_X = 20;

export function JourneySteps({
  model,
  mode,
  reached,
  active,
  focus,
  onHover,
  rail,
  onGeometry,
}: StepsProps) {
  const { stops, id, name } = model;
  const n = stops.length;
  const wrapRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<SVGPathElement>(null);
  const fwdRef = useRef<HTMLSpanElement>(null);
  const backRef = useRef<HTMLSpanElement>(null);
  const [track, setTrack] = useState<{
    h: number;
    ys: number[];
    pencil: string;
    ink: string;
  } | null>(null);
  const live = mode === "live";
  const shipped = (k: number) => mode === "static" || (live && k <= reached);
  const back = mode === "static" || (live && reached > n);

  // the rail: measured from the markers (phones / portrait tablets only)
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    const measure = () => {
      const marks = Array.from(
        wrap.querySelectorAll<HTMLElement>("[data-rail-stop]"),
      );
      const w = wrap.getBoundingClientRect();
      const ys = marks.map((m) => {
        const r = m.getBoundingClientRect();
        return r.top - w.top + r.height / 2;
      });
      if (ys.length !== n + 2 || marks[0].offsetParent === null) return; // the rail is hidden (>= 900px)
      const h = Math.round(w.height);
      const pencil = roughLine([RAIL_X, ys[0]], [RAIL_X, ys[n + 1]], {
        seed: `${id}-rail-pencil`,
        roughness: 0.7,
        passes: 2,
      });
      const ink = roughLine([RAIL_X, ys[0]], [RAIL_X, ys[n + 1]], {
        seed: `${id}-rail-ink`,
        roughness: 0.4,
        passes: 1,
      });
      setTrack((prev) =>
        prev && prev.h === h && prev.ink === ink
          ? prev
          : { h, ys, pencil, ink },
      );
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [id, n]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const ink = inkRef.current;
    if (!track || !wrap || !ink || !fwdRef.current || !backRef.current) {
      rail.current = null;
      return;
    }
    let len = 0;
    try {
      len = ink.getTotalLength() + 2;
    } catch {
      len = track.ys[n + 1] - track.ys[0];
    }
    ink.style.strokeDasharray = `${len} ${len}`;
    rail.current = {
      wrap,
      stops: track.ys,
      ink,
      len,
      fwd: fwdRef.current,
      back: backRef.current,
    };
    onGeometry();
  }, [track, n, rail, onGeometry]);

  return (
    <div
      ref={wrapRef}
      data-qa="journey-steps"
      className="relative"
      style={{ "--slot": "clamp(240px, 34svh, 340px)" } as CSSProperties}
    >
      {/* >= 900px with motion: the opening slot, beside the board as it pins */}
      <div className="hidden flex-col justify-center [.js:not(.rm)_&]:md:flex [.js:not(.rm)_&]:md:min-h-(--slot)">
        <p className="type-h4">One request, start to finish</p>
        <p className="type-body measure mt-3 text-graphite">
          Scroll, and a request leaves you, stops at every step of {name} in the
          layer where it runs, and comes back.
        </p>
      </div>

      {/* phones and portrait tablets: the request starts with you */}
      <div className="relative flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 pl-12 md:hidden">
        <RailMark
          k={0}
          state={mode === "sketch" ? "idle" : back ? "back" : "start"}
        />
        <YouChip back={back} label="You" />
        {live && reached === 0 ? (
          <HandNote size="sm" rotate={-2} arrow="down" seed={`${id}-rail-hint`}>
            scroll to send a request
          </HandNote>
        ) : null}
      </div>

      <ol
        aria-label={`How a request moves through ${name}, step by step`}
        className="mt-5 flex flex-col gap-4 md:mt-0 md:gap-0"
      >
        {stops.map((s) => (
          <li
            key={s.k}
            className="relative pl-12 md:py-3 md:pl-0 [.js:not(.rm)_&]:md:flex [.js:not(.rm)_&]:md:min-h-(--slot) [.js:not(.rm)_&]:md:items-center"
          >
            <RailMark
              k={s.k}
              state={
                !shipped(s.k) ? "idle" : live && active === s.k ? "lit" : "done"
              }
              className="top-[23px] sm:top-[27px]"
            />
            <StepCard
              id={id}
              stop={s}
              ship={shipped(s.k)}
              lit={live && active === s.k}
              linked={focus === s.k}
              onHover={onHover}
            />
          </li>
        ))}
      </ol>

      {/* phones and portrait tablets: the response lands back with you */}
      <div className="relative mt-5 flex min-h-11 flex-wrap items-center gap-x-4 gap-y-3 pl-12 md:hidden">
        <RailMark k={n + 1} state={back ? "back" : "idle"} />
        <YouChip back={back} label="Back to you" />
      </div>

      {/* >= 900px: stop N+1, the response back with you; with motion it has its own slot, and the
          return leg runs while it scrolls up to the reading line */}
      <div className="hidden md:block md:py-3 [.js:not(.rm)_&]:md:flex [.js:not(.rm)_&]:md:min-h-(--slot) [.js:not(.rm)_&]:md:items-center">
        <RoundTrip model={model} back={back} lit={live && back} />
      </div>
      {/* >= 900px with motion: half the reading area, so the pin ends just as the round trip card
          reaches the reading line (the engine lands the response one dwell before that) */}
      <div
        aria-hidden="true"
        className="hidden h-[calc((100svh-var(--header-h))/2-var(--slot)/2)] [.js:not(.rm)_&]:md:block"
      />

      {/* the rail and its packets */}
      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute top-0 left-0 overflow-visible md:hidden"
        width={40}
        height={track?.h ?? 0}
      >
        {track ? (
          <>
            <path
              d={track.pencil}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              className="text-pencil"
            />
            <path
              ref={inkRef}
              d={track.ink}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              className="text-ink"
            />
          </>
        ) : null}
      </svg>
      <span
        ref={fwdRef}
        data-qa="journey-rail-packet"
        aria-hidden="true"
        className="pointer-events-none absolute top-0 -mt-2.5 h-5 w-3 rounded-pill border-[1.5px] border-ink bg-lime opacity-0 will-change-transform md:hidden"
        style={{ left: RAIL_X - 6 }}
      />
      <span
        ref={backRef}
        data-qa="journey-rail-response"
        aria-hidden="true"
        className="pointer-events-none absolute top-0 -mt-2.5 h-5 w-3 rounded-pill border-[1.5px] border-ink bg-tangerine opacity-0 will-change-transform md:hidden"
        style={{ left: RAIL_X - 6 }}
      />
    </div>
  );
}

/** One stop: its layer and technology, the step, and what happens there. Sketch until the request reaches it. */
function StepCard({
  id,
  stop,
  ship,
  lit,
  linked,
  onHover,
}: {
  id: string;
  stop: JourneyStop;
  ship: boolean;
  lit: boolean;
  linked: boolean;
  onHover: (k: number | null) => void;
}) {
  return (
    <article
      data-step-card={stop.k}
      data-qa={`journey-step-${stop.k}`}
      data-state={ship ? "ship" : "sketch"}
      data-lit={lit || undefined}
      data-linked={linked || undefined}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover(stop.k)}
      onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
      className="group/sc relative w-full rounded-card px-5 py-5 sm:px-6 sm:py-6"
    >
      {/* the idea: a pencil outline */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity delay-100 duration-(--dur-ui) ease-arrive group-data-[state=ship]/sc:opacity-0 group-data-[state=ship]/sc:delay-0 group-data-[state=ship]/sc:duration-(--dur-exit) group-data-[state=ship]/sc:ease-exit [html:not(.js)_&]:hidden"
      >
        <SketchRect
          seed={`${id}-card-${stop.k}`}
          radius={26}
          tone="pencil"
          roughness={0.8}
        />
      </span>
      {/* the software: a crisp card */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-card border border-line bg-card opacity-0 shadow-card transition-[opacity,border-color,box-shadow] duration-(--dur-exit) ease-exit group-data-[state=ship]/sc:opacity-100 group-data-[state=ship]/sc:duration-(--dur-ui) group-data-[state=ship]/sc:ease-arrive group-data-[lit]/sc:border-ink group-data-[lit]/sc:shadow-lift group-data-[linked]/sc:border-blue [html:not(.js)_&]:opacity-100"
      />
      <div className="relative">
        <p className="type-mono flex flex-wrap items-center gap-x-3 gap-y-1 text-graphite">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-pencil transition-colors duration-(--dur-feedback) group-data-[state=ship]/sc:bg-ink group-data-[lit]/sc:bg-lime group-data-[lit]/sc:ring-1 group-data-[lit]/sc:ring-ink"
            />
            {stop.layer}
            {stop.tech ? <span className="sr-only">:</span> : null}
          </span>
          {stop.tech ? <span className="text-ink">{stop.tech}</span> : null}
        </p>
        <h3 className="type-h4 mt-2.5">{stop.step}</h3>
        {stop.does ? (
          <p className="type-body mt-2 text-graphite">{stop.does}</p>
        ) : null}
      </div>
    </article>
  );
}

/**
 * The round trip (>= 900px): the journey's last card, stop N+1, where the response lands. How many
 * steps and layers it crossed, and what each layer ran on the way (the stops' `tech`, by lane, in
 * the board's order). A pencil outline until the response is back, then it compiles in sync with
 * the board (its "You" turns tangerine, the stamp lands) and "Back to you" gets the tangerine
 * highlighter; scrolling back up reverses all of it.
 */
function RoundTrip({
  model,
  back,
  lit,
}: {
  model: JourneyModel;
  back: boolean;
  lit: boolean;
}) {
  const { id, stops } = model;
  const n = stops.length;
  const layers = touchedLayers(model);
  return (
    <article
      data-step-card={n + 1}
      data-qa="journey-summary"
      data-state={back ? "ship" : "sketch"}
      data-lit={lit || undefined}
      aria-labelledby={`${id}-trip-title`}
      className="group/sc relative w-full rounded-card px-5 py-5 @container/trip sm:px-6 sm:py-6"
    >
      {/* the idea: a pencil outline */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity delay-100 duration-(--dur-ui) ease-arrive group-data-[state=ship]/sc:opacity-0 group-data-[state=ship]/sc:delay-0 group-data-[state=ship]/sc:duration-(--dur-exit) group-data-[state=ship]/sc:ease-exit [html:not(.js)_&]:hidden"
      >
        <SketchRect
          seed={`${id}-card-trip`}
          radius={26}
          tone="pencil"
          roughness={0.8}
        />
      </span>
      {/* the software: a crisp card */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-card border border-line bg-card opacity-0 shadow-card transition-[opacity,border-color,box-shadow] duration-(--dur-exit) ease-exit group-data-[state=ship]/sc:opacity-100 group-data-[state=ship]/sc:duration-(--dur-ui) group-data-[state=ship]/sc:ease-arrive group-data-[lit]/sc:border-ink group-data-[lit]/sc:shadow-lift [html:not(.js)_&]:opacity-100"
      />
      <div className="relative">
        <p className="type-mono flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-graphite">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-pencil transition-colors duration-(--dur-feedback) group-data-[state=ship]/sc:bg-tangerine"
            />
            Round trip
          </span>
          <span className="tabular-nums">
            {n} steps · {layers.length}{" "}
            {layers.length === 1 ? "layer" : "layers"}
          </span>
        </p>
        <h3
          id={`${id}-trip-title`}
          className="type-h4 mt-2.5 flex items-center gap-2"
        >
          <span className="bg-[linear-gradient(var(--color-tangerine-soft),var(--color-tangerine-soft))] bg-no-repeat [background-position:0_85%] [background-size:0%_0.62em] [box-decoration-break:clone] transition-[background-size] duration-(--dur-exit) ease-exit group-data-[state=ship]/sc:[background-size:100%_0.62em] group-data-[state=ship]/sc:delay-100 group-data-[state=ship]/sc:duration-(--dur-swipe) group-data-[state=ship]/sc:ease-pen">
            Back to you
          </span>
          <Check
            size={18}
            className="shrink-0 scale-75 opacity-0 transition-[opacity,scale] duration-(--dur-exit) ease-exit group-data-[state=ship]/sc:scale-100 group-data-[state=ship]/sc:opacity-100 group-data-[state=ship]/sc:delay-300 group-data-[state=ship]/sc:duration-(--dur-ui) group-data-[state=ship]/sc:ease-arrive"
          />
        </h3>
        <dl className="mt-4 grid gap-x-4 gap-y-2 border-t border-line pt-4 @min-[21rem]/trip:grid-cols-[auto_minmax(0,1fr)] @min-[21rem]/trip:gap-y-2.5">
          {layers.map((l) => (
            <Fragment key={l.layer}>
              <dt className="type-micro uppercase text-graphite @min-[21rem]/trip:pt-2">
                {LANE_LABEL[l.layer]}
              </dt>
              <dd className="mb-1.5 @min-[21rem]/trip:mb-0">
                <ul className="flex flex-wrap gap-1.5">
                  {l.tech.map((t) => (
                    <Tag as="li" key={t}>
                      {t}
                    </Tag>
                  ))}
                </ul>
              </dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </article>
  );
}

function YouChip({ back, label }: { back: boolean; label: string }) {
  return (
    <span
      aria-hidden="true"
      className={`type-ui inline-flex h-9 items-center gap-2 rounded-pill border-[1.5px] border-ink px-3.5 transition-colors duration-(--dur-ui) ease-arrive ${back ? "bg-tangerine-soft" : "bg-card"}`}
    >
      {label}
      {back ? <Check size={15} /> : null}
    </span>
  );
}

/** A stop on the rail (phones / portrait tablets). */
function RailMark({
  k,
  state,
  className,
}: {
  k: number;
  state: "idle" | "start" | "lit" | "done" | "back";
  className?: string;
}) {
  const look = {
    idle: "border-pencil bg-paper-2",
    start: "border-ink bg-lime",
    lit: "border-ink bg-lime scale-125",
    done: "border-ink bg-ink",
    back: "border-ink bg-tangerine",
  }[state];
  return (
    <span
      data-rail-stop={k}
      aria-hidden="true"
      className={`absolute left-[13px] size-3.5 rounded-full border-[1.5px] transition-[background-color,border-color,scale] duration-(--dur-ui) ease-arrive md:hidden ${look} ${className ?? "top-1/2 -mt-[7px]"}`}
    />
  );
}
