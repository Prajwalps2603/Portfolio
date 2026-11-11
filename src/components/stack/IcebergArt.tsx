"use client";

/**
 * The iceberg drawing: aria-hidden decoration (every fact is in the DOM beside it). It measures the
 * dive (the art column, each layer row and its heading, the waterline, the seabed), draws
 * ./iceberg from those numbers and redraws whenever the dive resizes (a card opening, fonts, the
 * viewport), so the ice always lines up with the rows.
 *
 * THE DIVE, the section's authored moment (MOTION.md §4): when a layer row reaches the bottom fifth
 * of the screen, its slice of the ice draws itself in pencil, the ink line traces over it, the
 * pencil fades back to construction lines, the slice fills, and the layer's tools surface. The
 * waterline draws with the tip; the seabed and the languages land last. Rows already passed are
 * shown finished; rows on screen when it mounts draw at once.
 * Reduced motion: the finished drawing. Sketch mode: the pencil drawing, no ink, no fills.
 *
 * Paint order (no z-index numbers): this SVG comes last in the dive and is not raised, so it sits
 * over the sea's ink background, and under the rows (`z-(--z-raised)`).
 */
import { useEffect, useRef, useState, type RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { Diver } from "./Diver";
import { Submarine } from "./Submarine";
import { drawIceberg, drawSurface, type DrawMode, type IcebergDrawing, type IcebergInput, type LayerBox } from "./iceberg";

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Reads the dive's layout, relative to its top-left corner. */
function readLayout(root: HTMLElement): IcebergInput | null {
  const r = root.getBoundingClientRect();
  const col = root.querySelector<HTMLElement>("[data-art-col]");
  const sea = root.querySelector<HTMLElement>("[data-sea]");
  const bed = root.querySelector<HTMLElement>("[data-seabed]");
  const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-layer]"));
  if (!col || !sea || !bed || rows.length < 2 || r.width === 0) return null;
  const c = col.getBoundingClientRect();
  const layers: LayerBox[] = rows.map((el) => {
    const b = el.getBoundingClientRect();
    const h = (el.querySelector("h3") ?? el).getBoundingClientRect();
    const tools = (el.querySelector("ul") ?? el).getBoundingClientRect();
    return {
      id: el.dataset.layer ?? "",
      top: r1(b.top - r.top),
      bottom: r1(b.bottom - r.top),
      contentBottom: r1(tools.bottom - r.top),
      headX: r1(h.left - r.left),
      headY: r1(h.top + h.height / 2 - r.top),
    };
  });
  return {
    // the art column is beside the rows from 900px; below, it is the tip's own full-width band
    mode: c.width > r.width * 0.6 ? "back" : "side",
    width: r1(r.width),
    height: r1(r.height),
    colX: r1(c.left - r.left),
    colW: r1(c.width),
    colTop: r1(c.top - r.top),
    waterY: r1(sea.getBoundingClientRect().top - r.top),
    layers,
    bedY: r1(bed.getBoundingClientRect().top - r.top),
  };
}

type Drawn = { art: IcebergDrawing; mode: DrawMode; w: number; h: number };

export function IcebergArt({ rootRef, sketch, reduced }: { rootRef: RefObject<HTMLDivElement | null>; sketch: boolean; reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState<Drawn | null>(null);
  /** Rows whose dive has played (or were shown finished): never replayed. */
  const shipped = useRef(new Set<string>());
  /** The sea surface's paths: rolled by the scroll (imperatively, outside React). */
  const sea = {
    back: useRef<SVGPathElement>(null),
    fill: useRef<SVGPathElement>(null),
    sub1: useRef<SVGPathElement>(null),
    sub2: useRef<SVGPathElement>(null),
    foam: useRef<SVGPathElement>(null),
    line: useRef<SVGPathElement>(null),
  };

  // ---- measure, and redraw on every resize ----------------------------------------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    let last = "";
    const measure = () => {
      raf = 0;
      const input = readLayout(root);
      if (!input) return;
      const key = JSON.stringify(input);
      if (key === last) return;
      last = key;
      setDrawn({ art: drawIceberg(input), mode: input.mode, w: input.width, h: input.height });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    void document.fonts?.ready.then(schedule);
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);

  // ---- the waves roll with the scroll (and rest when it rests: no loop runs on its own) ----------
  useEffect(() => {
    if (!drawn || sketch) return;
    const root = rootRef.current;
    const waterY = drawn.art.diver.waterY;
    let raf = 0;
    const roll = () => {
      raf = 0;
      const r = root?.getBoundingClientRect();
      if (r && (r.top + waterY > window.innerHeight * 2 || r.top + waterY < -window.innerHeight)) return;
      const sf = drawSurface(drawn.w, waterY, drawn.mode, reduced ? 0 : window.scrollY * 0.0032);
      sea.back.current?.setAttribute("d", sf.back);
      sea.fill.current?.setAttribute("d", sf.fill);
      sea.sub1.current?.setAttribute("d", sf.sub1);
      sea.sub2.current?.setAttribute("d", sf.sub2);
      sea.foam.current?.setAttribute("d", sf.foam);
      sea.line.current?.setAttribute("d", sf.ink);
    };
    roll();
    if (reduced) return;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(roll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // the refs are stable; `sea` is a fresh object each render but holds the same ref objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawn, sketch, reduced, rootRef]);

  // ---- the dive --------------------------------------------------------------------------------
  const ready = drawn !== null;
  useGSAP(
    () => {
      const svg = svgRef.current;
      const root = rootRef.current;
      if (!ready || !svg || !root) return;
      const layerGroups = Array.from(svg.querySelectorAll<SVGGElement>("[data-art-layer]"));
      const surface = svg.querySelector<SVGGElement>("[data-art-surface]");
      const bed = svg.querySelector<SVGGElement>("[data-art-bed]");
      const bedRow = root.querySelector<HTMLElement>("[data-seabed]");
      const all = [...layerGroups.map((g) => g.dataset.artLayer ?? ""), "bed"];
      // Sketch mode and reduced motion show the finished picture; what they show stays shipped.
      if (sketch || reduced) {
        all.forEach((id) => shipped.current.add(id));
        return;
      }

      const toolsIn = (row: Element | null) => (row ? Array.from(row.querySelectorAll<HTMLElement>("[data-qa=stack-tool]")) : []);
      const all$ = (g: Element, sel: string) => Array.from(g.querySelectorAll<SVGElement>(sel));

      /** The hidden state, from JS only: strokes undrawn, fills and dots out, tools sunk. */
      const hide = (groups: (Element | null)[], items: HTMLElement[]) => {
        for (const g of groups) {
          if (!g) continue;
          const strokes = all$(g, "[data-pencil] path, [data-ink] path");
          const fades = all$(g, "[data-fill], [data-dot], [data-fade]");
          if (strokes.length) gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
          if (fades.length) gsap.set(fades, { opacity: 0 });
        }
        if (items.length) gsap.set(items, { opacity: 0, y: 8 });
      };

      /** Pencil draws, ink traces over it, pencil fades to construction lines, the slice fills. */
      const drawPart = (tl: gsap.core.Timeline, g: Element | null, at: number) => {
        if (!g) return;
        const pencil = all$(g, "[data-pencil] path");
        const ink = all$(g, "[data-ink] path");
        const hands = all$(g, "[data-pencil]");
        const fills = all$(g, "[data-fill], [data-fade]");
        const dots = all$(g, "[data-dot]");
        if (!pencil.length && !ink.length) return;
        tl.set([...pencil, ...ink], { strokeDasharray: 1 }, at);
        if (hands.length) tl.set(hands, { opacity: 1 }, at);
        if (pencil.length) tl.fromTo(pencil, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: DUR.draw, ease: EASE.pen, stagger: STAGGER.strokes }, at);
        if (ink.length) {
          // ink traces the pencil; a part with no pencil pass (the waterline) is inked directly
          tl.fromTo(ink, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: DUR.compile, ease: EASE.pen, stagger: STAGGER.strokes }, pencil.length ? ">-0.3" : at);
          if (hands.length) tl.to(hands, { opacity: 0.5, duration: DUR.compile, ease: EASE.arrive }, "<");
        }
        if (fills.length) tl.fromTo(fills, { opacity: 0 }, { opacity: 1, duration: DUR.fade, ease: EASE.arrive }, "<0.1");
        if (dots.length) tl.fromTo(dots, { opacity: 0 }, { opacity: 1, duration: DUR.ui, ease: EASE.arrive }, "<");
      };

      const play = (id: string, groups: (Element | null)[], items: HTMLElement[], rise: number) => {
        const tl = gsap.timeline({
          onComplete: () => {
            shipped.current.add(id);
            groups.forEach((g) => g?.setAttribute("data-shipped", "true"));
          },
        });
        groups.forEach((g, i) => drawPart(tl, g, i === 0 ? 0 : 0.2));
        if (items.length) tl.fromTo(items, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: DUR.fade, ease: EASE.arrive, stagger: STAGGER.items, clearProps: "opacity,transform" }, "<");
      };

      /** Rows passed: finished. On screen now: draw at once. Below: wait for the bottom fifth. */
      const arm = (id: string, row: HTMLElement | null, groups: (Element | null)[], rise: number) => {
        if (!row || shipped.current.has(id)) return;
        const items = toolsIn(row);
        const box = row.getBoundingClientRect();
        if (box.bottom < 0) {
          shipped.current.add(id);
          return;
        }
        if (box.top < window.innerHeight * 0.82) {
          hide(groups, []);
          play(id, groups, [], rise);
          return;
        }
        hide(groups, items);
        ScrollTrigger.create({
          trigger: row,
          start: () => safeStart(row, "top 82%"),
          once: true,
          onEnter: () => play(id, groups, items, rise),
        });
      };

      layerGroups.forEach((g, i) => {
        const id = g.dataset.artLayer ?? "";
        const row = root.querySelector<HTMLElement>(`[data-layer="${id}"]`);
        // the waterline draws with the tip
        arm(id, row, i === 0 ? [surface, g] : [g], 8);
      });
      arm("bed", bedRow, [bed], 14);
    },
    { dependencies: [ready, sketch, reduced], revertOnUpdate: true },
  );

  if (!drawn) {
    return <svg ref={svgRef} aria-hidden="true" focusable="false" data-qa="stack-art" data-ready="false" className="pointer-events-none absolute inset-0 size-full" />;
  }
  const { art, mode, w, h } = drawn;
  const ink = !sketch;
  // Behind the rows (narrow screens) the submerged ice is quieter, so it never competes with text.
  const back = mode === "back";
  const seaOutline = back ? "stroke-ash" : "stroke-fog";
  const seaRidge = back ? "stroke-seam" : "stroke-ash";

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      data-qa="stack-art"
      data-ready="true"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      {/* the sea surface (drawn before the ice, so the tip stands in front of it): a distant swell
          behind, the front water over the sea's straight edge, whitecaps on the tall crests, two
          quiet lines under the surface, and the waterline. Rolled by the scroll. */}
      <g data-art-surface>
        {ink ? <path ref={sea.back} d={art.surface.back} strokeWidth={1.1} className="stroke-pencil" opacity={0.6} /> : null}
        {ink ? <path ref={sea.fill} d={art.surface.fill} className="fill-ink" /> : null}
        {ink ? (
          <g data-fade>
            <path ref={sea.sub1} d={art.surface.sub1} strokeWidth={1} className="stroke-fog" opacity={0.24} />
            <path ref={sea.sub2} d={art.surface.sub2} strokeWidth={1} className="stroke-fog" opacity={0.13} />
            <path ref={sea.foam} d={art.surface.foam} strokeWidth={1.3} className="stroke-paper" opacity={0.8} />
          </g>
        ) : (
          <g data-pencil className="stroke-graphite">
            <path d={art.surface.pencil} strokeWidth={1.3} pathLength={1} />
          </g>
        )}
        {ink ? (
          <g data-ink className="stroke-ink">
            <path ref={sea.line} d={art.surface.ink} strokeWidth={1.6} pathLength={1} />
          </g>
        ) : null}
      </g>

      {art.layers.map((l) => (
        <g key={l.id} data-art-layer={l.id}>
          {ink ? <path data-fill d={l.fill} className={l.above ? "fill-card" : "fill-ink-2"} /> : null}
          <g data-pencil className={ink ? `${l.above ? "stroke-pencil" : "stroke-ash"} opacity-50` : "stroke-graphite"}>
            <path d={l.outline.pencil} strokeWidth={1.4} pathLength={1} />
            {l.seam ? <path d={l.seam.pencil} strokeWidth={1.1} pathLength={1} /> : null}
            <path d={l.ridges.pencil} strokeWidth={1.1} pathLength={1} />
            <path d={l.hatch} strokeWidth={0.9} pathLength={1} className={ink ? undefined : "stroke-pencil"} />
            {l.leader ? <path d={l.leader.pencil} strokeWidth={1.1} pathLength={1} /> : null}
          </g>
          {ink ? (
            <g data-ink>
              <path d={l.outline.ink} strokeWidth={1.6} pathLength={1} className={l.above ? "stroke-ink" : seaOutline} />
              <path d={l.ridges.ink} strokeWidth={1.1} pathLength={1} className={l.above ? "stroke-graphite" : seaRidge} />
              {l.seam ? <path d={l.seam.ink} strokeWidth={1.2} pathLength={1} className={seaRidge} /> : null}
              {l.leader ? <path d={l.leader.ink} strokeWidth={1.1} pathLength={1} className={l.above ? "stroke-graphite" : "stroke-ash"} /> : null}
            </g>
          ) : null}
          {ink && l.leader ? <circle data-dot cx={l.leader.dot[0]} cy={l.leader.dot[1]} r={3} className={l.above ? "fill-ink" : "fill-fog"} /> : null}
        </g>
      ))}

      <g data-art-bed>
        <g data-pencil className={ink ? "stroke-ash opacity-50" : "stroke-graphite"}>
          <path d={art.bed.pencil} strokeWidth={1.3} pathLength={1} />
        </g>
        {ink ? (
          <g data-ink>
            <path d={art.bed.ink} strokeWidth={1.6} pathLength={1} className="stroke-fog" />
            <path d={art.bed.ground} strokeWidth={1.1} pathLength={1} className="stroke-ash" />
          </g>
        ) : null}
      </g>

      <Submarine lane={art.sub} rootRef={rootRef} still={reduced || sketch} sketch={sketch} />
      <Diver track={art.diver} rootRef={rootRef} still={reduced || sketch} sketch={sketch} />
    </svg>
  );
}
