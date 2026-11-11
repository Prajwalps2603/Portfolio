"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/content";
import type { Connection } from "@/content/projects";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { useLoopsAllowed } from "@/lib/motion/preferences";
import { useReducedMotion } from "@/lib/motion/media";
import { ChannelMark } from "@/components/ui";
import { boardRows, rowLabel, rowOf, scopeChannel, type ResolvedSystem } from "./system";

type Box = { x: number; y: number; w: number; h: number };
type Geom = { w: number; h: number; nodes: Record<string, Box> };

type Props = {
  project: Project;
  system: ResolvedSystem;
  /** Connections that are probed / selected: drawn at full strength, with a signal running. */
  lit: ReadonlySet<string>;
  /** Dim every connection that is not lit (bench: always; datasheet: only once a stage is chosen). */
  dimOthers: boolean;
  /** "screen" for the graphite bench, "sheet" for the bone datasheet. */
  surface?: "screen" | "sheet";
  /** Print the protocol on each wire (datasheet). */
  labels?: boolean;
  /** Draw the copper in when the board scrolls into view. */
  drawIn?: boolean;
  /** Accessible description of what the board shows (the chips are decorative). */
  description: string;
};

const R = 5; // corner radius of the copper
const LANE_STEP = 9;
const LANE_STEP_LABELLED = 20;

/** Rounded orthogonal polyline. */
function roundedPath(pts: [number, number][]) {
  const p = pts.filter((q, i) => i === 0 || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 0.5);
  if (p.length < 2) return "";
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1];
    const b = p[i];
    const c = p[i + 1];
    const la = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const lc = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const r = Math.min(R, la / 2, lc / 2);
    const p1 = [b[0] + ((a[0] - b[0]) / la) * r, b[1] + ((a[1] - b[1]) / la) * r];
    const p2 = [b[0] + ((c[0] - b[0]) / lc) * r, b[1] + ((c[1] - b[1]) / lc) * r];
    d += `L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}Q${b[0].toFixed(1)} ${b[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const last = p[p.length - 1];
  return `${d}L${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
}

type Wire = {
  id: string;
  d: string;
  head: string;
  label: { x: number; y: number; len: number } | null;
  conn: Connection;
};

/**
 * The board of one system, drawn from its typed record. Chips (the parts) are DOM, so their
 * text stays crisp and at least 11px at every width; the copper is an SVG laid over them,
 * routed from measured chip positions: down through the gap between layers, or round the right
 * rail when it has to skip a layer. Probed wires run at full strength with a signal travelling
 * at constant speed (signals do not ease).
 *
 * On the graphite bench the chips are packages (bezel body, leads along the long edges) seated
 * on the FR4 slab that Board draws around this graph; on the bone datasheet they stay flat.
 *
 * Animation hooks (set by Bench): [data-chip] seats. This component draws its own copper.
 */
export function BoardGraph({ project, system, lit, dimOthers, surface = "screen", labels = false, drawIn = true, description }: Props) {
  const layers = useMemo(() => boardRows(project), [project]);
  // A "line" is one visual row of chips. When the layers do not fit the width, every chip gets its own line.
  const [stacked, setStacked] = useState(false);
  const stackedAt = useRef(0);
  // Stacked boards seat two chips per line on the bench (one per line on the bone datasheet).
  const per = surface === "sheet" ? 1 : 2;
  const rows = useMemo(
    () =>
      stacked
        ? layers.flatMap((r) =>
            Array.from({ length: Math.ceil(r.items.length / per) }, (_, k) => ({ ch: r.ch, label: rowLabel(r), items: r.items.slice(k * per, k * per + per), first: k === 0 })),
          )
        : layers.map((r) => ({ ch: r.ch, label: rowLabel(r), items: r.items, first: true })),
    [layers, stacked, per],
  );
  // Silkscreen reference designators, in board order (screen surface only).
  const refdes = useMemo(() => {
    const m: Record<string, string> = {};
    let n = 0;
    layers.forEach((r) => r.items.forEach((it) => (m[it] ??= `U${++n}`)));
    return m;
  }, [layers]);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [geom, setGeom] = useState<Geom | null>(null);
  const loops = useLoopsAllowed();
  const reduced = useReducedMotion();
  const sheet = surface === "sheet";

  const { conns } = system;

  // Layout facts known without measuring: which gap each wire crosses, and how tall each gap must be.
  const plan = useMemo(() => {
    const gapLanes: string[][] = rows.map(() => []);
    const info: Record<string, { ra: number; rb: number; gapA: number; gapB: number; far: boolean; u?: "below" | "above" }> = {};
    let farCount = 0;
    for (const c of conns) {
      const ra = rowOf(rows, c.from);
      const rb = rowOf(rows, c.to);
      if (ra < 0 || rb < 0) continue;
      const down = rb > ra;
      const gapA = down ? ra : ra - 1;
      const gapB = down ? rb - 1 : rb;
      const far = Math.abs(rb - ra) > 1;
      if (far) farCount += 1;
      info[c.id] = { ra, rb, gapA, gapB, far };
      if (ra === rb) {
        // Same layer but not neighbours: a straight wire would cross the chips between, so loop under (or over) the row.
        const items = rows[ra].items;
        if (Math.abs(items.indexOf(c.from) - items.indexOf(c.to)) > 1) {
          const below = ra < rows.length - 1;
          info[c.id].u = below ? "below" : "above";
          gapLanes[below ? ra : ra - 1]?.push(c.id);
        }
        continue;
      }
      gapLanes[gapA].push(c.id);
      if (far) gapLanes[gapB].push(c.id);
    }
    const step = labels ? LANE_STEP_LABELLED : LANE_STEP;
    const gapH = gapLanes.map((l) => Math.max(labels ? 44 : stacked ? 18 : 34, (l.length + 1) * step));
    return { gapLanes, info, gapH, farCount };
  }, [rows, conns, labels, stacked]);

  // Measure the chips (offset geometry ignores GSAP transforms, so a chip mid-seat is still measured in place).
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      if (!el.offsetWidth) return;
      const nodes: Record<string, Box> = {};
      el.querySelectorAll<HTMLElement>("[data-node]").forEach((n) => {
        nodes[n.dataset.node ?? ""] = { x: n.offsetLeft, y: n.offsetTop, w: n.offsetWidth, h: n.offsetHeight };
      });
      // Chips of one layer on different lines: the layers do not fit, so stack every chip on its own line.
      if (!stacked) {
        const wrapped = layers.some((r) => {
          const ys = r.items.map((it) => nodes[it]?.y ?? 0);
          return Math.max(...ys) - Math.min(...ys) > 4;
        });
        if (wrapped) {
          stackedAt.current = el.offsetWidth;
          setStacked(true);
          return;
        }
      } else if (el.offsetWidth > stackedAt.current + 24) {
        setStacked(false);
        return;
      }
      setGeom((prev) => {
        const next = { w: el.offsetWidth, h: el.offsetHeight, nodes };
        return prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.querySelectorAll("[data-node]").forEach((n) => ro.observe(n));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [rows, layers, stacked, system]);

  const wires = useMemo<Wire[]>(() => {
    if (!geom) return [];
    const { nodes } = geom;
    const rowTop: number[] = [];
    const rowBottom: number[] = [];
    rows.forEach((r, i) => {
      const bs = r.items.map((it) => nodes[it]).filter(Boolean);
      rowTop[i] = Math.min(...bs.map((b) => b.y));
      rowBottom[i] = Math.max(...bs.map((b) => b.y + b.h));
    });

    // Ports: spread the wires that leave or enter the same side of one chip.
    const portCount: Record<string, string[]> = {};
    const side = (c: Connection) => {
      const i = plan.info[c.id];
      if (!i) return null;
      if (i.u) return i.u === "below" ? { a: "b", b: "b" } : { a: "t", b: "t" };
      if (i.ra === i.rb) {
        const a = nodes[c.from];
        const b = nodes[c.to];
        const aLeft = a.x + a.w / 2 < b.x + b.w / 2;
        return { a: aLeft ? "r" : "l", b: aLeft ? "l" : "r" };
      }
      return i.rb > i.ra ? { a: "b", b: "t" } : { a: "t", b: "b" };
    };
    for (const c of conns) {
      if (!nodes[c.from] || !nodes[c.to]) continue;
      const s = side(c);
      if (!s) continue;
      (portCount[`${c.from}|${s.a}`] ??= []).push(c.id);
      (portCount[`${c.to}|${s.b}`] ??= []).push(c.id);
    }
    const port = (node: string, sd: string, id: string): [number, number] => {
      const b = nodes[node];
      const list = portCount[`${node}|${sd}`] ?? [id];
      const k = list.indexOf(id);
      const spread = Math.min(9, (sd === "t" || sd === "b" ? b.w : b.h) / (list.length + 1));
      const off = (k - (list.length - 1) / 2) * spread;
      if (sd === "b") return [b.x + b.w / 2 + off, b.y + b.h];
      if (sd === "t") return [b.x + b.w / 2 + off, b.y];
      if (sd === "r") return [b.x + b.w, b.y + b.h / 2 + off];
      return [b.x, b.y + b.h / 2 + off];
    };
    const laneY = (gap: number, id: string) => {
      const lanes = plan.gapLanes[gap];
      const k = lanes.indexOf(id);
      const top = rowBottom[gap];
      const span = rowTop[gap + 1] - top;
      return top + ((k + 1) * span) / (lanes.length + 1);
    };

    let farIndex = 0;
    const out: Wire[] = [];
    for (const c of conns) {
      const i = plan.info[c.id];
      const s = side(c);
      if (!i || !s || !nodes[c.from] || !nodes[c.to]) continue;
      const A = port(c.from, s.a, c.id);
      const B = port(c.to, s.b, c.id);
      let pts: [number, number][];
      let longest: { x: number; y: number; len: number } | null = null;
      if (i.u) {
        const y = laneY(i.u === "below" ? i.ra : i.ra - 1, c.id);
        pts = [A, [A[0], y], [B[0], y], B];
      } else if (i.ra === i.rb) {
        if (Math.abs(A[1] - B[1]) < 2) pts = [A, [B[0], A[1]]];
        else {
          const mx = (A[0] + B[0]) / 2;
          pts = [A, [mx, A[1]], [mx, B[1]], B];
        }
      } else if (!i.far) {
        const y = laneY(i.gapA, c.id);
        pts = [A, [A[0], y], [B[0], y], B];
      } else {
        const yA = laneY(i.gapA, c.id);
        const yB = laneY(i.gapB, c.id);
        const rail = geom.w - 7 - farIndex * 7;
        farIndex += 1;
        pts = [A, [A[0], yA], [rail, yA], [rail, yB], [B[0], yB], B];
      }
      // Label on the longest horizontal run.
      let best = -1;
      for (let k = 1; k < pts.length; k++) {
        const len = Math.abs(pts[k][0] - pts[k - 1][0]);
        if (Math.abs(pts[k][1] - pts[k - 1][1]) < 1 && len > best) {
          best = len;
          longest = { x: (pts[k][0] + pts[k - 1][0]) / 2, y: pts[k][1], len };
        }
      }
      // Arrowhead at the end, along the last segment.
      const e = pts[pts.length - 1];
      const p = pts[pts.length - 2];
      const dx = Math.sign(e[0] - p[0]);
      const dy = Math.sign(e[1] - p[1]);
      const head =
        dx !== 0
          ? `M${e[0] - dx * 6} ${e[1] - 3.5}L${e[0]} ${e[1]}L${e[0] - dx * 6} ${e[1] + 3.5}Z`
          : `M${e[0] - 3.5} ${e[1] - dy * 6}L${e[0]} ${e[1]}L${e[0] + 3.5} ${e[1] - dy * 6}Z`;
      out.push({ id: c.id, d: roundedPath(pts), head, label: longest, conn: c });
    }
    return out;
  }, [geom, rows, conns, plan]);

  // Copper draws in once, at constant speed, when the board arrives.
  const ready = wires.length > 0;
  useGSAP(
    () => {
      const root = svg.current;
      if (!root || !ready || !drawIn || reduced) return;
      const paths = gsap.utils.toArray<SVGPathElement>("[data-wire]", root);
      const heads = gsap.utils.toArray<SVGPathElement>("[data-head]", root);
      gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(heads, { autoAlpha: 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: wrap.current, start: "top 90%", once: true } });
      tl.to(paths, { strokeDashoffset: 0, duration: 0.7, ease: EASE.none, stagger: 0.07, delay: 0.25, clearProps: "strokeDasharray,strokeDashoffset" }, 0);
      tl.to(heads, { autoAlpha: 1, duration: 0.2, ease: EASE.panel, stagger: 0.07, clearProps: "opacity,visibility" }, 0.7);
    },
    { scope: svg, dependencies: [ready, drawIn, reduced], revertOnUpdate: true },
  );

  // Signals on the lit wires: constant-speed dashes, paused off screen and when Signals are paused.
  useGSAP(
    () => {
      const root = svg.current;
      if (!root || !loops || !wires.length) return;
      const dashes = gsap.utils.toArray<SVGPathElement>("[data-signal]", root);
      if (!dashes.length) return;
      const tween = gsap.to(dashes, { strokeDashoffset: -22, duration: 1.1, ease: EASE.none, repeat: -1 });
      const st = ScrollTrigger.create({
        trigger: wrap.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => tween.paused(!self.isActive),
      });
      tween.paused(!st.isActive);
    },
    { scope: svg, dependencies: [loops, wires, lit], revertOnUpdate: true },
  );

  const colour = (c: Connection) => {
    const ch = scopeChannel(c.channel);
    return sheet ? ch.ink : ch.color;
  };
  const litNodes = new Set<string>();
  conns.forEach((c) => {
    if (lit.has(c.id)) {
      litNodes.add(c.from);
      litNodes.add(c.to);
    }
  });

  return (
    <div
      ref={wrap}
      className="relative"
      style={{ paddingRight: plan.farCount ? 8 + plan.farCount * 7 : 0 }}
      role="img"
      aria-label={description}
    >
      <ol aria-hidden="true">
        {rows.map((r, i) => (
          <li
            key={r.items.join("|")}
            className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-x-3 sm:grid-cols-[128px_minmax(0,1fr)]"
            style={{ marginTop: i === 0 ? 0 : plan.gapH[i - 1] }}
          >
            <p className={`type-label flex items-center gap-2 pt-[7px] ${sheet ? "text-ink" : "text-bone"}`}>
              {r.first ? (
                <>
                  <ChannelMark ch={r.ch.id} surface={sheet ? "sheet" : "screen"} />
                  <span className="max-sm:sr-only">{r.label}</span>
                </>
              ) : null}
            </p>
            <ul className={stacked && !sheet ? "grid grid-cols-2 gap-2" : `flex flex-wrap ${sheet ? "gap-x-10 gap-y-3" : "gap-2"}`}>
              {r.items.map((item) => (
                <li
                  key={item}
                  data-chip=""
                  data-node={item}
                  className={`type-readout min-w-0 border px-2.5 py-1.5 break-words transition-colors duration-200 ease-panel ${
                    sheet ? "bg-bone text-ink" : "text-bone"
                  } ${litNodes.has(item) ? (sheet ? "bg-bone-shade" : "bg-graticule") : sheet ? "" : "bg-bezel"}`}
                  style={{ borderColor: sheet ? r.ch.ink : r.ch.color }}
                >
                  {sheet ? null : (
                    <span aria-hidden="true" className="mr-1.5 text-dim max-sm:hidden">
                      {refdes[item]}
                    </span>
                  )}
                  {system.nodeLabel(item)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <svg
        ref={svg}
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute top-0 left-0 overflow-visible"
        width={geom?.w ?? 0}
        height={geom?.h ?? 0}
        fill="none"
      >
        {sheet || !geom
          ? null
          : Object.values(geom.nodes).map((b) => {
              // Package leads along the long edges: the chips read as parts seated on the board.
              const n = Math.max(3, Math.min(8, Math.round(b.w / 16)));
              const step = (b.w - 16) / (n - 1);
              return (
                <g key={`${b.x}:${b.y}`} fill="var(--color-graticule-strong)">
                  {Array.from({ length: n }, (_, k) => (
                    <g key={k}>
                      <rect x={b.x + 8 + k * step - 1.5} y={b.y - 3} width={3} height={3} />
                      <rect x={b.x + 8 + k * step - 1.5} y={b.y + b.h} width={3} height={3} />
                    </g>
                  ))}
                </g>
              );
            })}
        {wires.map((w) => {
          const on = lit.has(w.id);
          const dim = dimOthers && !on;
          const col = colour(w.conn);
          return (
            <g key={w.id} style={{ transition: "opacity 200ms cubic-bezier(0.16,1,0.3,1)" }} opacity={w.conn.idle ? 0.4 : dim ? (sheet ? 0.28 : 0.42) : 1}>
              <path
                data-wire=""
                d={w.d}
                stroke={col}
                strokeWidth={on ? 2.25 : sheet ? 1.5 : 1.25}
                strokeDasharray={w.conn.idle ? "3 4" : undefined}
                strokeLinejoin="round"
              />
              <path data-head="" d={w.head} fill={col} />
              {on && loops && !w.conn.idle ? (
                <path
                  data-signal=""
                  d={w.d}
                  stroke={sheet ? "var(--color-ink)" : "var(--color-bone)"}
                  strokeWidth={2.25}
                  strokeDasharray="2 20"
                  strokeLinecap="butt"
                />
              ) : null}
            </g>
          );
        })}
        {labels
          ? wires.map((w) => {
              if (!w.label || w.conn.protocol === "in-process" || w.label.len <= w.conn.protocol.length * 6.8 + 12) return null;
              return (
                <text
                  key={`l-${w.id}`}
                  x={Math.min(Math.max(w.label.x, 70), (geom?.w ?? 0) - 70)}
                  y={w.label.y - 5}
                  textAnchor="middle"
                  className="type-readout"
                  fill={colour(w.conn)}
                  stroke="var(--color-bone)"
                  strokeWidth={4}
                  paintOrder="stroke"
                  style={{ fontSize: 11 }}
                >
                  {w.conn.protocol}
                </text>
              );
            })
          : null}
      </svg>
    </div>
  );
}
