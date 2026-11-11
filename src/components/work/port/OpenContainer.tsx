"use client";

/**
 * The open container (geometry in ./container.ts): the selected project's container seen from its
 * door end, doors swung wide, looking in: its paint on the frame, the doors and the walls (shaded
 * per wall: the ceiling and the back darkest), a planked floor, and the box packed full: the
 * project's stack as stencilled wooden crates in the front row (in perspective, a tier at a time)
 * and other goods, cartons, stacked behind them toward the ceiling. Phones also get the stack as
 * crates under the drawing (the stencils are small there). Decoration: aria-hidden; the bill of
 * lading beside it carries the facts.
 *
 * The parent swings the doors through `api.setOpen(theta)` (0 shut .. 1 open); the paths are
 * written straight to the DOM, so a swing never re-renders React. The markup is the open state.
 */
import { useImperativeHandle, useMemo, useRef, type Ref } from "react";
import type { Box, BoxTone } from "./model";
import { INTERIOR, OPENING, VIEW, doorShapes, packCargo, type DoorShapes } from "./container";

const PAINT: Record<BoxTone, string> = {
  "blue-soft": "fill-blue-soft",
  ink: "fill-ink-2",
  card: "fill-card",
  graphite: "fill-graphite",
  "paper-2": "fill-paper-2",
};

export type ContainerApi = { setOpen: (theta: number) => void };

const OPEN_L = doorShapes("left", 1);
const OPEN_R = doorShapes("right", 1);
const PARTS = ["leaf", "shade", "ridges", "bars", "keepers", "handles", "seal"] as const;

export function OpenContainer({ box, stack, sketch, api }: { box: Box; stack: readonly string[]; sketch: boolean; api: Ref<ContainerApi> }) {
  const svg = useRef<SVGSVGElement>(null);
  // read inside the (stable) door handle: sketch mode draws no shading
  const pencil = useRef(sketch);
  pencil.current = sketch;

  useImperativeHandle(
    api,
    () => ({
      setOpen: (theta: number) => {
        const el = svg.current;
        if (!el) return;
        for (const side of ["left", "right"] as const) {
          const s = doorShapes(side, theta);
          for (const part of PARTS) {
            const path = el.querySelector<SVGPathElement>(`[data-door="${side}"] [data-part="${part}"]`);
            if (!path) continue;
            path.setAttribute("d", part === "shade" ? s.leaf : s[part]);
            if (part === "shade") path.setAttribute("opacity", s.inner && !pencil.current ? "0.2" : "0");
          }
        }
        const stencil = el.querySelectorAll<SVGTextElement>("[data-stencil]");
        stencil.forEach((t) => t.setAttribute("opacity", String(Math.max(0, 1 - theta / 0.12))));
      },
    }),
    [],
  );

  const ink = !sketch;
  const paint = ink ? PAINT[box.tone] : "fill-none";
  const line = ink ? "stroke-ink" : "stroke-graphite";
  const ridge = ink ? (box.dark ? "stroke-ash" : "stroke-ink") : "stroke-pencil";
  const ridgeOpacity = box.dark ? 0.9 : 0.28;
  const bar = ink ? (box.dark ? "stroke-fog" : "stroke-ink") : "stroke-graphite";
  const shade = (k: number) => (ink ? k : 0);
  const cargo = useMemo(() => packCargo(stack, box.id), [stack, box.id]);

  const door = (side: "left" | "right", s: DoorShapes) => (
    <g data-door={side}>
      <path data-part="leaf" d={s.leaf} strokeWidth={1.6} className={`${paint} ${line}`} />
      <path data-part="shade" d={s.leaf} className="fill-ink" opacity={s.inner && ink ? 0.2 : 0} />
      <path data-part="ridges" d={s.ridges} strokeWidth={1} className={ridge} opacity={ridgeOpacity} />
      <path data-part="bars" d={s.bars} strokeWidth={3.2} className={bar} />
      <path data-part="keepers" d={s.keepers} strokeWidth={2.6} className={bar} />
      <path data-part="handles" d={s.handles} strokeWidth={2.6} className={bar} />
      <path data-part="seal" d={s.seal} strokeWidth={3} className={line} />
    </g>
  );

  const stencilFill = box.dark && ink ? "fill-paper" : "fill-ink";
  return (
    <>
      <svg ref={svg} aria-hidden="true" focusable="false" viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="xMidYMid meet" fill="none" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-full overflow-visible">
        {ink ? <path d={INTERIOR.shadow} className="fill-ink" opacity={0.14} /> : null}
        {/* inside: ceiling, walls, back, the planked floor */}
        <path d={INTERIOR.ceiling} className={paint} />
        <path d={INTERIOR.ceiling} className="fill-ink" opacity={shade(0.3)} />
        <path d={INTERIOR.left} className={paint} />
        <path d={INTERIOR.left} className="fill-ink" opacity={shade(0.16)} />
        <path d={INTERIOR.right} className={paint} />
        <path d={INTERIOR.right} className="fill-ink" opacity={shade(0.07)} />
        <path d={INTERIOR.back} className={paint} />
        <path d={INTERIOR.back} className="fill-ink" opacity={shade(0.4)} />
        <path d={INTERIOR.floor} className={ink ? "fill-paper-2" : "fill-none"} />
        <path d={INTERIOR.planks} strokeWidth={1} className={ink ? "stroke-line-strong" : "stroke-pencil"} />
        <path d={INTERIOR.joints} strokeWidth={1} className={ink ? "stroke-line-strong" : "stroke-pencil"} />
        <path d={INTERIOR.ridgesL} strokeWidth={1} className={ridge} opacity={ridgeOpacity} />
        <path d={INTERIOR.ridgesR} strokeWidth={1} className={ridge} opacity={ridgeOpacity} />
        <path d={INTERIOR.ridgesC} strokeWidth={1} className={ridge} opacity={ridgeOpacity * 0.8} />
        <path d={`${INTERIOR.left}${INTERIOR.right}${INTERIOR.ceiling}${INTERIOR.floor}`} strokeWidth={1.2} className={line} />
        <path d={INTERIOR.back} strokeWidth={1.2} className={line} />
        {/* the cargo: other goods behind, the stack's stencilled crates in front */}
        {cargo.map((c, i) => (
          <g key={i} data-crate={c.label ? "" : undefined}>
            {c.side ? <path d={c.side} strokeWidth={1} className={`${ink ? (c.label ? "fill-line-strong" : "fill-line-strong") : "fill-none"} ${line}`} /> : null}
            {c.top ? <path d={c.top} strokeWidth={1} className={`${ink ? "fill-card" : "fill-none"} ${line}`} /> : null}
            <path d={c.front} strokeWidth={1.2} className={`${ink ? (c.label ? "fill-paper-2" : "fill-line") : "fill-none"} ${line}`} />
            <path d={c.marks} strokeWidth={c.label ? 1 : 2.4} className={c.label ? line : ink ? "stroke-graphite" : "stroke-pencil"} opacity={c.label ? 0.45 : 0.55} />
            {c.text && c.label ? (
              <text x={c.text.x} y={c.text.y} textAnchor="middle" className={`type-micro ${ink ? "fill-ink" : "fill-graphite"}`} style={{ fontSize: c.text.size, fontWeight: 700, letterSpacing: "0.05em" }}>
                {c.label.toUpperCase()}
              </text>
            ) : null}
          </g>
        ))}
        {/* the door end: its frame, corner castings and hinges */}
        <path d={INTERIOR.frame} fillRule="evenodd" strokeWidth={1.8} className={`${paint} ${line}`} />
        {ink ? <path d={INTERIOR.frame} fillRule="evenodd" className="fill-ink" opacity={0.12} /> : null}
        <path d={INTERIOR.castings} className={ink ? "fill-ink" : "fill-graphite"} />
        <path d={INTERIOR.hinges} className={ink ? "fill-ink" : "fill-graphite"} />
        {/* the doors */}
        {door("left", OPEN_L)}
        {door("right", OPEN_R)}
        {/* stencils on the shut doors (only seen while they are shut) */}
        <g className={stencilFill}>
          {box.lines.map((t, k) => (
            <text key={k} data-stencil="" x={(OPENING.x0 + 300) / 2} y={190 + k * 22} textAnchor="middle" opacity={0} className="type-micro" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.08em" }}>
              {t}
            </text>
          ))}
          <text data-stencil="" x={(OPENING.x1 + 300) / 2} y={96} textAnchor="middle" opacity={0} className="type-micro" style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.06em" }}>
            {box.code}
          </text>
        </g>
      </svg>
    </>
  );
}

/** A crate of cargo: a stencilled box with its top and side showing. */
export function Crate({ label }: { label: string }) {
  return (
    <span
      data-crate=""
      className="type-micro relative inline-block border-[1.5px] border-ink bg-paper-2 px-2 py-1 font-semibold whitespace-nowrap text-ink uppercase shadow-[2px_-2px_0_0_var(--color-card),3.5px_-3.5px_0_0_var(--color-ink)]"
      style={{ letterSpacing: "0.06em" }}
    >
      {label}
    </span>
  );
}
