"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { gsap } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import {
  roughArrow,
  roughLine,
  roughRect,
  tight,
} from "@/components/sketch/rough";
import { HandNote } from "@/components/sketch";
import { AppWindow } from "@/components/ui";
import { Check } from "@/components/icons";
import {
  LANE_LABEL,
  connected,
  dropMid,
  returnPath,
  roughDrop,
  roughHead,
  sampleLut,
  type JourneyModel,
  type Lut,
} from "./model";

/**
 * THE BOARD (>= 900px): the project's architecture as lanes (columns, left to right) and its flow
 * as stops (rows, top to bottom), inside an app window. The grid places every node on the server;
 * the hand-drawn connectors are measured and drawn after hydration in one overlay SVG.
 *
 * The board renders state (which stops have compiled, which one is lit, what is focused); the
 * per-frame motion (packet position, ink behind it) is written by the engine in HowItWorks through
 * the geometry this component publishes in `geo`.
 */

export type Mode = "live" | "static" | "sketch";

export type BoardGeo = {
  /** Segment 0..N: the ink path (the return's is the mask that reveals the dashed ink), its samples and its inked arrowhead. */
  segs: { ink: SVGPathElement; lut: Lut; head: SVGPathElement | null }[];
  fwd: HTMLElement;
  back: HTMLElement;
};

type Box = { x: number; y: number; w: number; h: number };
type Shape = {
  w: number;
  h: number;
  railX: number;
  guides: string;
  nodes: Box[];
  you: Box;
  outlines: { rough: string; tight: string }[];
  segs: { pencil: string; ink: string; head: string; dashed: boolean }[];
};

type BoardProps = {
  model: JourneyModel;
  mode: Mode;
  /** Stops reached (0..N+1): stops 1..reached have compiled; N+1 = the response is back. */
  reached: number;
  /** The lit stop (1..N), 0 for none. */
  active: number;
  focus: number | null;
  onFocus: (k: number | null) => void;
  onSelect: (k: number) => void;
  geo: RefObject<BoardGeo | null>;
  onGeometry: () => void;
};

const NODE_RADIUS = 14; // --radius-panel: the sketch outline matches the crisp surface

export function JourneyBoard({
  model,
  mode,
  reached,
  active,
  focus,
  onFocus,
  onSelect,
  geo,
  onGeometry,
}: BoardProps) {
  const { stops, lanes, id } = model;
  const n = stops.length;
  const bodyRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fwdRef = useRef<HTMLSpanElement>(null);
  const backRef = useRef<HTMLSpanElement>(null);
  const [shape, setShape] = useState<Shape | null>(null);
  const live = mode === "live";
  const back = mode === "static" || (live && reached > n);
  const link = connected(focus, n);
  const noteFor = focus ?? (live && active > 0 ? active : null);

  // Measure the laid-out grid and draw the connectors at true pixel size.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    let raf = 0;
    const measure = () => {
      const b = body.getBoundingClientRect();
      if (b.width < 40 || b.height < 40) return; // hidden on phones / portrait tablets
      const rel = (el: Element | null): Box => {
        const r = el?.getBoundingClientRect();
        return r
          ? { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height }
          : { x: 0, y: 0, w: 0, h: 0 };
      };
      const heads = Array.from(body.querySelectorAll("[data-lane-head]")).map(
        rel,
      );
      const nodes = Array.from(body.querySelectorAll("[data-node]")).map(rel);
      const you = rel(body.querySelector("[data-you]"));
      if (!heads.length || nodes.length !== n) return;
      const w = Math.round(b.width);
      const h = Math.round(b.height);
      const cx = (r: Box) => r.x + r.w / 2;
      const cy = (r: Box) => r.y + r.h / 2;

      // lane dividers (dashed pencil) and the rule under the lane headings
      const ruleY = Math.max(...heads.map((r) => r.y + r.h)) + 6;
      let guides = roughLine(
        [heads[0].x, ruleY],
        [heads[heads.length - 1].x + heads[heads.length - 1].w, ruleY],
        { seed: `${id}-rule`, roughness: 0.5, passes: 1 },
      );
      for (let j = 0; j < heads.length - 1; j++) {
        const x = (heads[j].x + heads[j].w + heads[j + 1].x) / 2;
        guides += roughLine([x, ruleY + 14], [x, h - 14], {
          seed: `${id}-lane-${j}`,
          roughness: 0.45,
          bowing: 0.4,
          passes: 1,
        });
      }

      const outlines = nodes.map((r, i) => {
        const o = {
          seed: `${id}-node-${i + 1}`,
          radius: NODE_RADIUS,
          roughness: 0.9,
        };
        return {
          rough: roughRect(r.x + 0.8, r.y + 0.8, r.w - 1.6, r.h - 1.6, o),
          tight: roughRect(
            r.x + 0.8,
            r.y + 0.8,
            r.w - 1.6,
            r.h - 1.6,
            tight(o),
          ),
        };
      });

      const segs: Shape["segs"] = [];
      const stopsBox = [you, ...nodes];
      for (let j = 0; j < n; j++) {
        const from = stopsBox[j];
        const to = stopsBox[j + 1];
        const a = [cx(from), from.y + from.h] as const;
        const z = [cx(to), to.y] as const;
        const mid = dropMid(a, z);
        segs.push({
          pencil: roughDrop(a, z, `${id}-seg-${j}-pencil`, {
            amp: 1.5,
            passes: 2,
          }),
          ink: roughDrop(a, z, `${id}-seg-${j}-ink`, { amp: 0.7 }),
          head: roughHead(mid.at, mid.angle, `${id}-seg-${j}`),
          dashed: false,
        });
      }
      // the response: out of the last stop, down the left rail, back into "You"
      const last = nodes[n - 1];
      const railX = Math.max(10, heads[0].x / 2);
      const ret = returnPath(
        [last.x, cy(last)],
        railX,
        [you.x, cy(you)],
        `${id}-return`,
      );
      const midY = (cy(last) + cy(you)) / 2;
      segs.push({
        pencil: ret,
        ink: ret,
        head: roughHead([railX, midY], -Math.PI / 2, `${id}-return-head`),
        dashed: true,
      });

      setShape((prev) => {
        if (
          prev &&
          prev.w === w &&
          prev.h === h &&
          prev.segs.every((s, j) => s.ink === segs[j]?.ink) &&
          prev.outlines.every((o, i) => o.rough === outlines[i]?.rough)
        )
          return prev;
        return { w, h, railX, guides, nodes, you, outlines, segs };
      });
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(body);
    body
      .querySelectorAll("[data-node],[data-lane-head],[data-you]")
      .forEach((el) => ro.observe(el));
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [id, n]);

  // Publish the drawn geometry (samples for the packets, ink paths) to the engine.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!shape || !svg || !fwdRef.current || !backRef.current) {
      geo.current = null;
      return;
    }
    const segs = shape.segs.map((_, j) => {
      const ink = svg.querySelector<SVGPathElement>(`[data-ink="${j}"]`)!;
      const lut = sampleLut(ink);
      ink.style.strokeDasharray = `${lut.len + 2} ${lut.len + 2}`;
      return {
        ink,
        lut,
        head: svg.querySelector<SVGPathElement>(`[data-ink-head="${j}"]`),
      };
    });
    geo.current = { segs, fwd: fwdRef.current, back: backRef.current };
    onGeometry();
  }, [shape, geo, onGeometry]);

  // Compile: a stop's pencil outline straightens onto its crisp box as the request reaches it.
  const shipped = (k: number) => mode === "static" || (live && k <= reached);
  const prevShip = useRef<boolean[]>([]);
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !shape) return;
    stops.forEach((s, i) => {
      const path = svg.querySelector<SVGPathElement>(`[data-outline="${s.k}"]`);
      const now = shipped(s.k);
      if (path && prevShip.current[i] !== now) {
        const o = shape.outlines[i];
        gsap.killTweensOf(path);
        if (now && prevShip.current[i] === false && live) {
          // same commands, same number count (tight()), so the pencil line straightens onto the box
          gsap.fromTo(
            path,
            { attr: { d: o.rough } },
            { attr: { d: o.tight }, duration: 0.22, ease: EASE.pen },
          );
        } else {
          path.setAttribute("d", now ? o.tight : o.rough);
        }
      }
      prevShip.current[i] = now;
    });
  });

  return (
    <AppWindow
      title={`${id} — request journey`}
      seed={`${id}-journey`}
      actions={
        <Status
          n={n}
          reached={mode === "sketch" ? 0 : mode === "static" ? n + 1 : reached}
          active={active}
        />
      }
      className="w-full"
      bodyClassName="paper-dots"
    >
      <div
        ref={bodyRef}
        className="relative isolate grid px-3 pt-4 @container/board"
        style={
          {
            "--rail": "clamp(28px, 4%, 40px)",
            "--you-h": "56px",
            "--row-h": `clamp(74px, calc((100svh - var(--header-h) - 272px) / ${n}), 116px)`,
            gridTemplateColumns: `var(--rail) repeat(${lanes.length}, minmax(0, 1fr))`,
            gridTemplateRows: `auto var(--you-h) repeat(${n}, var(--row-h)) 10px`,
            columnGap: "10px",
          } as CSSProperties
        }
      >
        {/* the lane the request is in: a highlighter wash down the column (first: it paints under the connectors) */}
        {lanes.map((l, j) => {
          const lit = active > 0 && stops[active - 1]?.lane === j;
          return (
            <span
              key={`wash-${l.layer}`}
              aria-hidden="true"
              className={`-mx-1 origin-top rounded-panel bg-lime-soft/60 transition-[scale,opacity] ${lit ? "scale-y-100 opacity-100 duration-(--dur-swipe) ease-pen" : "scale-y-0 opacity-0 duration-(--dur-exit) ease-exit"}`}
              style={{ gridColumn: j + 2, gridRow: `3 / ${n + 3}` }}
            />
          );
        })}

        {/* connectors, lanes and outlines: measured, drawn under everything else */}
        <svg
          ref={svgRef}
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 overflow-visible"
          width={shape?.w}
          height={shape?.h}
          viewBox={shape ? `0 0 ${shape.w} ${shape.h}` : undefined}
        >
          {shape ? (
            <>
              <path
                d={shape.guides}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeDasharray="2 7"
                className="text-pencil"
              />
              {shape.outlines.map((o, i) => (
                <path
                  key={stops[i].k}
                  data-outline={stops[i].k}
                  d={o.rough}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-pencil transition-opacity ${shipped(stops[i].k) ? "opacity-0 delay-150 duration-(--dur-exit) ease-exit" : "opacity-100 duration-(--dur-feedback) ease-arrive"} ${link.stop(stops[i].k) ? "" : "opacity-35"}`}
                />
              ))}
              {shape.segs.map((s, j) => {
                const on = focus !== null && link.seg(j);
                return (
                  <g
                    key={j}
                    data-seg={j}
                    className={`transition-opacity duration-(--dur-ui) ease-arrive ${link.seg(j) ? "" : "opacity-35"}`}
                  >
                    <path
                      d={s.pencil}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeDasharray={s.dashed ? "1 7" : undefined}
                      className={`transition-colors duration-(--dur-feedback) ${on ? "text-ink" : "text-pencil"}`}
                    />
                    <path
                      d={s.head}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-colors duration-(--dur-feedback) ${on ? "text-ink" : "text-pencil"}`}
                    />
                    {s.dashed ? (
                      <>
                        <mask
                          id={`${id}-return-mask`}
                          maskUnits="userSpaceOnUse"
                          x="-10%"
                          y="-10%"
                          width="120%"
                          height="120%"
                        >
                          <path
                            data-ink={j}
                            d={s.ink}
                            fill="none"
                            stroke="#fff"
                            strokeWidth={8}
                            strokeLinecap="round"
                          />
                        </mask>
                        <path
                          d={s.ink}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeDasharray="1 7"
                          mask={`url(#${id}-return-mask)`}
                          className="text-ink"
                        />
                      </>
                    ) : (
                      <path
                        data-ink={j}
                        d={s.ink}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        className="text-ink"
                      />
                    )}
                    <path
                      data-ink-head={j}
                      d={s.head}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-ink"
                      style={{ opacity: 0 }}
                    />
                  </g>
                );
              })}
            </>
          ) : null}
        </svg>

        {/* the packets: lime = the request going in, tangerine = the response coming back */}
        <span
          ref={fwdRef}
          data-qa="journey-packet"
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 -mt-1.5 -ml-2.5 h-3 w-5 rounded-pill border-[1.5px] border-ink bg-lime opacity-0 will-change-transform"
        />
        <span
          ref={backRef}
          data-qa="journey-response"
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 -mt-1.5 -ml-2.5 h-3 w-5 rounded-pill border-[1.5px] border-ink bg-tangerine opacity-0 will-change-transform"
        />

        {/* lane headings: the architecture */}
        {lanes.map((l, j) => {
          const lit =
            active > 0 && stops[active - 1]?.lane === j && mode !== "sketch";
          return (
            <div
              key={l.layer}
              data-lane-head=""
              aria-hidden="true"
              className="min-w-0 pb-3"
              style={{ gridRow: 1, gridColumn: j + 2 }}
            >
              <p className="type-micro relative inline-block uppercase text-ink">
                <span
                  className={`absolute inset-x-[-3px] bottom-[1px] h-[0.62em] origin-left bg-lime transition-transform duration-(--dur-exit) ease-exit ${lit ? "scale-x-100 duration-(--dur-ui) ease-pen" : "scale-x-0"}`}
                />
                <span className="relative">{LANE_LABEL[l.layer]}</span>
              </p>
              {l.items.length ? (
                <ul className="type-micro mt-1 hidden text-graphite @min-[640px]/board:block">
                  {l.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}

        {/* You: where the request starts and where the response lands */}
        <div
          data-you=""
          aria-hidden="true"
          className="relative self-center justify-self-center"
          style={{ gridRow: 2, gridColumn: 2 }}
        >
          <span
            className={`type-ui flex h-9 items-center gap-2 rounded-pill border-[1.5px] border-ink px-3.5 transition-colors duration-(--dur-ui) ease-arrive ${back ? "bg-tangerine-soft" : "bg-card"} ${link.stop(0) || link.stop(n + 1) ? "" : "opacity-35"}`}
          >
            <span
              className={`size-2.5 rounded-full transition-colors duration-(--dur-ui) ${back ? "bg-tangerine" : mode === "sketch" ? "bg-pencil" : "bg-lime ring-[1.5px] ring-ink"}`}
            />
            You
            {back ? <Check size={15} /> : null}
          </span>
          <HandNote
            size="sm"
            tone="graphite"
            rotate={-3}
            arrow="left"
            seed={`${id}-you-hint`}
            className={`pointer-events-none absolute top-1/2 left-full ml-4 -translate-y-1/2 whitespace-nowrap transition-opacity duration-(--dur-ui) ${live && reached === 0 ? "opacity-100" : "opacity-0"}`}
          >
            scroll to send a request
          </HandNote>
        </div>

        {/* the stops */}
        {stops.map((s) => {
          const ship = shipped(s.k);
          const lit = live && active === s.k;
          const dim = !link.stop(s.k);
          return (
            <button
              key={s.k}
              type="button"
              data-node={s.k}
              data-qa={`journey-node-${s.k}`}
              data-state={ship ? "ship" : "sketch"}
              data-lit={lit || undefined}
              data-cursor="blue"
              aria-describedby={`${id}-does-${s.k}`}
              onPointerEnter={(e) => e.pointerType === "mouse" && onFocus(s.k)}
              onPointerLeave={(e) => e.pointerType === "mouse" && onFocus(null)}
              onFocus={() => onFocus(s.k)}
              onBlur={() => onFocus(null)}
              onClick={() => onSelect(s.k)}
              className={`group/jn relative w-full max-w-[11.5rem] self-center justify-self-center rounded-panel px-3 py-2 text-left transition-opacity duration-(--dur-ui) ease-arrive ${dim ? "opacity-35" : ""}`}
              style={{ gridRow: s.k + 2, gridColumn: s.lane + 2 }}
            >
              {/* the crisp surface (ship) */}
              <span
                aria-hidden="true"
                className="absolute inset-0 scale-[.96] rounded-panel border border-line bg-card opacity-0 shadow-card transition-[opacity,scale,border-color,box-shadow] duration-(--dur-exit) ease-exit group-data-[state=ship]/jn:scale-100 group-data-[state=ship]/jn:opacity-100 group-data-[state=ship]/jn:delay-75 group-data-[state=ship]/jn:duration-(--dur-ui) group-data-[state=ship]/jn:ease-arrive group-data-[lit]/jn:border-ink group-data-[lit]/jn:shadow-lift"
              />
              <span className="relative grid">
                {/* the idea: handwritten */}
                <span
                  aria-hidden="true"
                  className="type-hand-sm self-center text-graphite transition-opacity delay-75 duration-(--dur-feedback) ease-arrive [grid-area:1/1] group-data-[state=ship]/jn:opacity-0 group-data-[state=ship]/jn:delay-0 group-data-[state=ship]/jn:duration-(--dur-tap) group-data-[state=ship]/jn:ease-exit"
                >
                  {s.step}
                </span>
                {/* the software: micro-label + the real step */}
                <span className="flex translate-y-[3px] flex-col gap-0.5 opacity-0 transition-[opacity,translate] duration-(--dur-tap) ease-exit [grid-area:1/1] group-data-[state=ship]/jn:translate-y-0 group-data-[state=ship]/jn:opacity-100 group-data-[state=ship]/jn:delay-100 group-data-[state=ship]/jn:duration-(--dur-ui) group-data-[state=ship]/jn:ease-arrive">
                  <span className="type-micro flex items-center gap-1.5 uppercase text-graphite @max-[600px]/board:hidden">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-pencil transition-colors duration-(--dur-feedback) group-data-[lit]/jn:bg-lime group-data-[lit]/jn:ring-1 group-data-[lit]/jn:ring-ink"
                    />
                    {LANE_LABEL[s.layer]}
                  </span>
                  <span className="type-ui text-ink">
                    <span className="bg-[linear-gradient(var(--color-lime),var(--color-lime))] bg-no-repeat [background-position:0_88%] [background-size:0%_0.5em] [box-decoration-break:clone] transition-[background-size] duration-(--dur-exit) ease-exit group-data-[lit]/jn:[background-size:100%_0.5em] group-data-[lit]/jn:duration-(--dur-swipe) group-data-[lit]/jn:ease-pen">
                      {s.step}
                    </span>
                  </span>
                </span>
              </span>
              <span className="sr-only">{`, step ${s.k} of ${n}. Go to this step.`}</span>
            </button>
          );
        })}
        {/* what happens at each stop, for aria-describedby (hidden text is still read as a description) */}
        <div hidden>
          {stops.map((s) => (
            <p key={s.k} id={`${id}-does-${s.k}`}>
              {s.does ?? s.step}
            </p>
          ))}
        </div>

        {/* the margin note: the focused stop's, else the one the request is in */}
        {noteFor && shape && stops[noteFor - 1]?.note ? (
          <StopNote
            key={noteFor}
            shape={shape}
            stop={stops[noteFor - 1]}
            id={id}
            focused={focus !== null}
            last={noteFor === n}
          />
        ) : null}
      </div>
    </AppWindow>
  );
}

/** The step counter in the window bar (decorative: the step list says the same). */
function Status({
  n,
  reached,
  active,
}: {
  n: number;
  reached: number;
  active: number;
}) {
  const back = reached > n;
  return (
    <span
      aria-hidden="true"
      data-qa="journey-status"
      className="type-mono flex items-center gap-2 text-graphite"
    >
      <span
        className={`size-2 rounded-full ${back ? "bg-tangerine" : reached > 0 ? "bg-lime ring-1 ring-ink" : "bg-pencil"}`}
      />
      {back ? "back to you" : reached > 0 ? `step ${active} / ${n}` : "ready"}
    </span>
  );
}

/**
 * The handwritten margin note beside a stop: what happens there (journeys.ts `note`), with a small
 * doodled arrow pointing at it. Placed on the roomier side of the stop's row (each row holds one
 * stop); the last stop keeps its left side for the return path, so its note goes right, or above
 * the return path when the right is too tight. Ink for the stop the request is in, blue (the
 * interaction colour) for a hovered / focused stop.
 */
function StopNote({
  shape,
  stop,
  id,
  focused,
  last,
}: {
  shape: Shape;
  stop: JourneyModel["stops"][number];
  id: string;
  focused: boolean;
  last: boolean;
}) {
  const r = shape.nodes[stop.k - 1];
  const leftRoom = r.x - shape.railX - 18;
  const rightRoom = shape.w - (r.x + r.w) - 20;
  const MIN = 96;
  const side: "left" | "right" | "left-up" = last
    ? rightRoom >= MIN
      ? "right"
      : "left-up"
    : rightRoom >= leftRoom || leftRoom < MIN
      ? "right"
      : "left";
  const cy = r.y + r.h / 2;
  const style: CSSProperties =
    side === "right"
      ? {
          left: r.x + r.w + 8,
          top: cy,
          maxWidth: rightRoom,
          translate: "0 -50%",
        }
      : side === "left"
        ? {
            right: shape.w - r.x + 8,
            top: cy,
            maxWidth: leftRoom,
            translate: "0 -50%",
          }
        : {
            right: shape.w - r.x + 6,
            bottom: shape.h - cy + 10,
            maxWidth: leftRoom,
          };
  const arrow =
    side === "right"
      ? roughArrow([27, 12], [3, 8], {
          seed: `${id}-note-${stop.k}`,
          bend: -0.3,
          head: 6,
        })
      : roughArrow(
          [3, side === "left" ? 12 : 5],
          [27, side === "left" ? 8 : 15],
          { seed: `${id}-note-${stop.k}`, bend: 0.3, head: 6 },
        );
  const svg = (
    <svg
      aria-hidden="true"
      focusable="false"
      width={30}
      height={20}
      viewBox="0 0 30 20"
      className="shrink-0 overflow-visible"
    >
      <path
        d={arrow}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  return (
    <p
      aria-hidden="true"
      data-qa="journey-note"
      className={`type-hand-sm pointer-events-none absolute z-(--z-raised) flex items-center gap-1 transition-opacity duration-(--dur-ui) ease-arrive starting:opacity-0 ${focused ? "text-blue-deep" : "text-ink"}`}
      style={{ ...style, rotate: side === "right" ? "-2deg" : "2deg" }}
    >
      {side === "right" ? svg : null}
      <span className={side === "right" ? "" : "text-right"}>{stop.note}</span>
      {side === "right" ? null : svg}
    </p>
  );
}
