"use client";

/**
 * A role's figure in the changelog: the small diagram in the card's panel (./figures.ts says what
 * each one shows). Decoration, aria-hidden: the card's text carries every fact.
 *
 * THE MOMENT (MOTION.md §4, Experience): when the panel's top reaches 80% of the screen the
 * figure draws itself in pencil, the ink traces over it and it fills (sketch -> ship, ~1s), then
 * its story plays once (~2.5-3s; packets in the diagram grammar: lime request, blue data,
 * tangerine response) and it rests, finished. Under 5s, so it needs no pause control. A click or a
 * tap replays it (the cursor reads "Replay"; a small replay mark shows once it has played).
 * Figures already scrolled past are simply finished. Reduced motion: the finished figure, no
 * replay. Sketch mode: the pencil drawing.
 *
 * It measures its panel and lays the figure out for that box (1 unit = 1 CSS px, so the labels
 * stay 11-12px at any size); a resize redraws it, finished.
 */
import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { Replay } from "@/components/icons";
import { along, buildFigure, type FigureId, type Fill, type Packet, type Scene, type Shape, type Tone } from "./figures";

type Point = readonly [number, number];

const STROKE: Record<Tone, string> = {
  ink: "stroke-ink",
  graphite: "stroke-graphite",
  pencil: "stroke-pencil",
  blue: "stroke-blue",
  lime: "stroke-lime",
  tangerine: "stroke-tangerine",
  line: "stroke-line",
};
const FILL: Record<Fill, string> = {
  card: "fill-card",
  paper: "fill-paper",
  "paper-2": "fill-paper-2",
  line: "fill-line",
  pencil: "fill-pencil",
  lime: "fill-lime",
  "lime-soft": "fill-lime-soft",
  blue: "fill-blue",
  "blue-soft": "fill-blue-soft",
  tangerine: "fill-tangerine",
  "tangerine-soft": "fill-tangerine-soft",
  ink: "fill-ink",
};
/** Text colours (the -deep twins are the readable ones on paper). */
const TEXT: Record<Tone, string> = {
  ink: "fill-ink",
  graphite: "fill-graphite",
  pencil: "fill-graphite",
  blue: "fill-blue-deep",
  lime: "fill-lime-deep",
  tangerine: "fill-tangerine-deep",
  line: "fill-graphite",
};
const PACKET: Record<Packet["kind"], string> = { request: "fill-lime", data: "fill-blue", response: "fill-tangerine" };

// ---------------------------------------------------------------------------------------------
// timeline tools
// ---------------------------------------------------------------------------------------------

type Els = SVGElement[];
type Tools = {
  /** Parts named k. */
  q: (...ks: string[]) => Els;
  /** Parts whose name starts with p. */
  qp: (p: string) => Els;
  /** A node's ink outline. */
  node: (...ks: string[]) => Els;
  packet: (k: string) => { el: SVGCircleElement | null; track: Point[] };
};

function tools(svg: SVGSVGElement, scene: Scene): Tools {
  const all = (sel: string) => Array.from(svg.querySelectorAll<SVGElement>(sel));
  return {
    q: (...ks) => ks.flatMap((k) => all(`[data-k="${k}"]`)),
    qp: (p) => all(`[data-k^="${p}"]`),
    node: (...ks) => ks.flatMap((k) => all(`[data-ink][data-node="${k}"]`)),
    packet: (k) => ({
      el: svg.querySelector<SVGCircleElement>(`[data-packet="${k}"]`),
      track: (scene.packets.find((p) => p.k === k)?.track ?? []) as Point[],
    }),
  };
}

type TL = gsap.core.Timeline;

function pop(tl: TL, els: Els, at: number, stagger = 0, origin?: Point) {
  if (!els.length) return;
  // one origin for a part drawn in several paths; smoothOrigin off, or GSAP shifts it to compensate
  const o = origin ? { svgOrigin: `${origin[0]} ${origin[1]}`, smoothOrigin: false } : { transformOrigin: "50% 50%" };
  tl.fromTo(els, { opacity: 0, scale: 0.3, ...o }, { opacity: 1, scale: 1, duration: DUR.ui, ease: EASE.arrive, stagger, ...o }, at);
}

function fade(tl: TL, els: Els, at: number, to = 1) {
  if (els.length) tl.to(els, { opacity: to, duration: 0.3, ease: EASE.arrive }, at);
}

/** An ink pulse on a node's outline as a packet reaches it. */
function pulse(tl: TL, els: Els, at: number) {
  if (!els.length) return;
  tl.to(els, { strokeWidth: 3, duration: 0.1, ease: EASE.arrive }, at).to(els, { strokeWidth: 1.5, duration: 0.35, ease: EASE.arrive }, at + 0.1);
}

function flash(tl: TL, els: Els, at: number, hold = 0.1) {
  if (!els.length) return;
  tl.to(els, { opacity: 0.95, duration: 0.1, ease: EASE.arrive }, at).to(els, { opacity: 0, duration: 0.35, ease: EASE.exit }, at + 0.1 + hold);
}

/** A packet runs its track (or back along it). */
function run(tl: TL, { el, track }: { el: SVGCircleElement | null; track: Point[] }, at: number, dur: number, back = false, ease: string = EASE.pen) {
  if (!el || track.length < 2) return;
  const o = { t: 0 };
  const put = () => {
    const p = along(track, back ? 1 - o.t : o.t);
    el.setAttribute("cx", String(Math.round(p[0] * 10) / 10));
    el.setAttribute("cy", String(Math.round(p[1] * 10) / 10));
  };
  tl.set(el, { opacity: 1 }, at);
  tl.to(o, { t: 1, duration: dur, ease, onStart: put, onUpdate: put }, at);
  tl.set(el, { opacity: 0 }, at + dur);
}

/** Strokes that draw on later (fits, curves, branches) start undrawn. */
function undrawn(els: Els) {
  if (els.length) gsap.set(els, { strokeDasharray: 1, strokeDashoffset: 1 });
}

function drawIn(tl: TL, els: Els, at: number, dur: number) {
  if (!els.length) return;
  tl.set(els, { opacity: 1 }, at);
  tl.to(els, { strokeDashoffset: 0, duration: dur, ease: EASE.pen }, at);
}

// ---------------------------------------------------------------------------------------------
// the hidden state, the drawing, and each figure's story
// ---------------------------------------------------------------------------------------------

/** Everything the timeline reveals, hidden (from JS only; the markup is the finished figure). */
function hide(svg: SVGSVGElement, scene: Scene) {
  const all = (sel: string) => Array.from(svg.querySelectorAll<SVGElement>(sel));
  const t = tools(svg, scene);
  gsap.set(all("[data-pencil]"), { strokeDasharray: 1, strokeDashoffset: 1, opacity: 1 });
  gsap.set(all("[data-ink]"), { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(all("[data-ink-dash], [data-fill], [data-fade], [data-story], [data-packet]"), { opacity: 0 });
  if (scene.id === "ml") {
    undrawn(t.q("fit", "curve"));
    const res = scene.marks.res as number[][];
    t.qp("res-").forEach((el, i) => res[i] && el.setAttribute("d", `M${res[i][0]} ${res[i][1]}V${res[i][2]}`));
  }
  if (scene.id === "java") undrawn(t.q("branch", "merge"));
}

/** Pencil draws, the ink traces it, the pencil lifts, the parts fill, the labels land. */
function drawBase(tl: TL, svg: SVGSVGElement): number {
  const all = (sel: string) => Array.from(svg.querySelectorAll<SVGElement>(sel));
  const pencil = all("[data-pencil]");
  const ink = all("[data-ink]");
  const spread = (n: number, total: number) => (n > 1 ? total / (n - 1) : 0);
  if (pencil.length) tl.to(pencil, { strokeDashoffset: 0, duration: 0.5, ease: EASE.pen, stagger: spread(pencil.length, 0.4) }, 0);
  if (ink.length) tl.to(ink, { strokeDashoffset: 0, duration: 0.42, ease: EASE.pen, stagger: spread(ink.length, 0.3) }, 0.5);
  fade(tl, all("[data-ink-dash]"), 0.6);
  if (pencil.length) tl.to(pencil, { opacity: 0, duration: 0.45, ease: EASE.arrive }, 0.72);
  fade(tl, all("[data-fill]"), 0.62);
  const fades = all("[data-fade]");
  if (fades.length) tl.to(fades, { opacity: 1, duration: 0.35, ease: EASE.arrive, stagger: spread(fades.length, 0.2) }, 0.72);
  return 1.05;
}

type Story = (tl: TL, t: Tools, s: Scene, at: number) => void;

/** Requests reach EC2 through network security; EC2 uses RDS and S3; a threat is stopped; a scan ticks each part. */
const cloud: Story = (tl, t, s, at) => {
  const m = s.marks;
  pop(tl, t.q("dot-ec2", "dot-rds", "dot-s3"), at, 0.09);
  let c = at + 0.35;
  run(tl, t.packet("req"), c, 0.55);
  flash(tl, t.q("shield-flash"), c + 0.16, 0);
  pulse(tl, t.node("ec2"), c + 0.5);
  c += 0.6;
  run(tl, t.packet("to-rds"), c, 0.45);
  run(tl, t.packet("to-s3"), c, 0.45);
  pulse(tl, t.node("rds", "s3"), c + 0.42);
  c += 0.5;
  run(tl, t.packet("to-rds"), c, 0.4, true);
  run(tl, t.packet("to-s3"), c, 0.4, true);
  pulse(tl, t.node("ec2"), c + 0.38);
  c += 0.45;
  run(tl, t.packet("resp"), c, 0.5);

  // the threat flies at the shield and is knocked back
  const bug = t.q("bug");
  const rest = m.bugAt as Point;
  const from = m.bugFrom as Point;
  const hit = m.bugHit as Point;
  const turn = (Math.atan2(hit[1] - from[1], hit[0] - from[0]) * 180) / Math.PI + 90;
  // body and legs turn about one point (set once; smoothOrigin off, or GSAP offsets the rest)
  tl.set(bug, { opacity: 1, x: from[0], y: from[1], rotation: turn, svgOrigin: `${rest[0]} ${rest[1]}`, smoothOrigin: false }, c - 0.2);
  tl.to(bug, { x: hit[0], y: hit[1], duration: 0.5, ease: EASE.pen }, c - 0.2);
  flash(tl, t.q("shield-flash"), c + 0.28);
  pulse(tl, t.node("shield"), c + 0.28);
  tl.to(bug, { x: 0, y: 0, rotation: 0, duration: 0.45, ease: EASE.arrive }, c + 0.3);
  pop(tl, t.q("bug-x"), c + 0.5);
  fade(tl, t.q("blocked"), c + 0.55);

  // the vulnerability scan
  c += 0.8;
  const scan = t.q("scan");
  const sweep = 0.8;
  tl.set(scan, { opacity: 1, y: 0 }, c);
  tl.to(scan, { y: m.scan as number, duration: sweep, ease: EASE.none }, c);
  (m.okAt as number[]).forEach((f, i) => pop(tl, t.q(["ok-ec2", "ok-rds", "ok-s3"][i]), c + f * sweep));
  tl.to(scan, { opacity: 0, duration: DUR.exit, ease: EASE.exit }, c + sweep);
};

/** eda, preprocess, train, evaluate, tune: the run ticks down the log while the chart does each step. */
const ml: Story = (tl, t, s, at) => {
  const rows = s.marks.rows as number[];
  const res = s.marks.res as number[][];
  const band = t.q("band");
  const pts = t.qp("pt-");
  const outs = t.qp("out-");
  const resEls = t.qp("res-");
  const fit = t.q("fit");
  const curve = t.q("curve");
  fade(tl, t.qp("pend-"), at - 0.3);
  const step = (i: number, when: number) => {
    if (i === 0) {
      tl.set(band, { opacity: 1, y: 0, scaleX: 0, transformOrigin: "0% 50%" }, when);
      tl.to(band, { scaleX: 1, duration: 0.3, ease: EASE.pen }, when);
    } else {
      tl.to(band, { y: rows[i] - rows[0], duration: 0.25, ease: EASE.arrive }, when);
    }
  };
  const done = (i: number, when: number) => {
    tl.to(t.q(`pend-${i}`), { opacity: 0, duration: 0.12, ease: EASE.exit }, when);
    pop(tl, t.q(`done-${i}`), when);
  };
  let c = at;
  // 01 eda: the data lands
  step(0, c);
  pop(tl, [...pts, ...outs], c + 0.15, 0.025);
  done(0, c + 0.6);
  c += 0.75;
  // 02 preprocess: the outliers are struck out
  step(1, c);
  pop(tl, t.qp("outx-"), c + 0.12, 0.1);
  fade(tl, outs, c + 0.25, 0.3);
  done(1, c + 0.42);
  c += 0.55;
  // 03 train: a first, straight fit
  step(2, c);
  drawIn(tl, fit, c + 0.08, 0.45);
  done(2, c + 0.48);
  c += 0.6;
  // 04 evaluate: how far off it is
  step(3, c);
  if (resEls.length) tl.to(resEls, { opacity: 1, duration: 0.2, ease: EASE.arrive, stagger: 0.02 }, c + 0.08);
  done(3, c + 0.45);
  c += 0.6;
  // 05 tune: the curve pulls the errors in, and that is the model
  step(4, c);
  fade(tl, fit, c + 0.1, 0.35);
  drawIn(tl, curve, c + 0.1, 0.6);
  resEls.forEach((el, i) => res[i] && tl.to(el, { attr: { d: `M${res[i][0]} ${res[i][1]}V${res[i][3]}` }, duration: 0.6, ease: EASE.pen }, c + 0.1));
  pop(tl, t.q("model"), c + 0.68);
  if (resEls.length) tl.to(resEls, { opacity: 0, duration: 0.3, ease: EASE.exit }, c + 0.85);
  done(4, c + 0.78);
  tl.to(band, { opacity: 0, duration: 0.3, ease: EASE.exit }, c + 1.0);
};

/** A pull request is reviewed and merged; then a request runs the stack and comes back. */
const java: Story = (tl, t, s, at) => {
  const cys = s.marks.cys as number[];
  let c = at;
  pop(tl, t.q("fork"), c);
  drawIn(tl, t.q("branch"), c, 0.5);
  pop(tl, t.q("c-0"), c + 0.25);
  pop(tl, t.q("c-1"), c + 0.42);
  fade(tl, t.q("pr"), c + 0.3);
  pop(tl, t.q("review"), c + 0.68, 0, s.marks.review as Point);
  drawIn(tl, t.q("merge"), c + 0.95, 0.3);
  pop(tl, t.q("merged"), c + 1.2, 0, s.marks.merged as Point);
  fade(tl, t.q("merged-l"), c + 1.25);
  c += 1.45;
  const layers = ["react", "spring", "hibernate", "mysql"];
  const down = 0.95;
  run(tl, t.packet("req"), c, down, false, EASE.none);
  layers.forEach((k, i) => pulse(tl, t.node(k), c + ((cys[i] - cys[0]) / (cys[3] - cys[0])) * down));
  c += down + 0.05;
  const up = 0.55;
  run(tl, t.packet("data"), c, up, false, EASE.none);
  pulse(tl, t.node("hibernate"), c + ((cys[3] - cys[2]) / (cys[3] - cys[1])) * up);
  pulse(tl, t.node("spring"), c + up);
  c += up + 0.05;
  run(tl, t.packet("resp"), c, 0.35, false, EASE.none);
  pulse(tl, t.node("react"), c + 0.35);
};

/** A new row lands in the sheet, Apps Script and the API feed the app, it fills on both screens, live. */
const ops: Story = (tl, t, s, at) => {
  const row = t.q("row");
  tl.set(row, { opacity: 1, scaleX: 0, transformOrigin: "0% 50%" }, at);
  tl.to(row, { scaleX: 1, duration: 0.35, ease: EASE.pen }, at);
  flash(tl, t.q("apps-flash"), at + 0.25, 0.45);
  run(tl, t.packet("sync"), at + 0.3, 0.6);
  pulse(tl, t.node("apps"), at + 0.42);
  run(tl, t.packet("req"), at + 0.5, 0.5);
  pulse(tl, t.node("api"), at + 0.62);
  pulse(tl, t.node("mongo"), at + 0.98);
  run(tl, t.packet("data"), at + 1.05, 0.5);
  pulse(tl, t.node("api"), at + 1.2);
  const rows = [...t.q("wrow", "wrow-s", "wrow-b"), ...t.qp("wrow-").filter((el) => /^wrow-\d/.test(el.dataset.k ?? ""))];
  if (rows.length) tl.fromTo(rows, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.3, ease: EASE.arrive, stagger: 0.07 }, at + 1.45);
  pop(tl, t.qp("pcard-"), at + 1.7, 0.07);
  pulse(tl, t.node("win", "phone"), at + 1.62);
  pop(tl, t.q("live"), at + 2.1);
};

const STORIES: Record<FigureId, Story> = { cloud, ml, java, ops };

function play(svg: SVGSVGElement, scene: Scene, onDone: () => void): TL {
  const tl = gsap.timeline({ onComplete: onDone });
  const at = drawBase(tl, svg);
  STORIES[scene.id](tl, tools(svg, scene), scene, at);
  return tl;
}

// ---------------------------------------------------------------------------------------------
// the component
// ---------------------------------------------------------------------------------------------

export function RoleFigure({ id, sketch, reduced }: { id: FigureId; sketch: boolean; reduced: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const timeline = useRef<TL | null>(null);
  const played = useRef(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [rested, setRested] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const read = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scene = useMemo(() => (size ? buildFigure(id, size.w, size.h) : null), [id, size]);
  const still = sketch || reduced;

  const { contextSafe } = useGSAP(
    () => {
      const el = svg.current;
      const box = host.current;
      if (!scene || !el || !box || still || played.current) return;
      const finish = () => {
        played.current = true;
        setRested(true);
      };
      const r = box.getBoundingClientRect();
      if (r.bottom < 0) {
        finish();
        return;
      }
      hide(el, scene);
      const start = () => {
        if (!timeline.current) timeline.current = play(el, scene, finish);
      };
      if (r.top < window.innerHeight * 0.8) start();
      else ScrollTrigger.create({ trigger: box, start: () => safeStart(box, "top 80%"), once: true, onEnter: start });
      // a redraw (resize) reverts this run; the next one starts clean
      return () => {
        timeline.current = null;
      };
    },
    { dependencies: [scene, still], revertOnUpdate: true },
  );

  const replay = contextSafe(() => {
    const el = svg.current;
    if (!scene || !el || still) return;
    timeline.current?.kill();
    setRested(false);
    hide(el, scene);
    timeline.current = play(el, scene, () => {
      played.current = true;
      setRested(true);
    });
  });

  const canReplay = !still && scene !== null;
  return (
    <div
      ref={host}
      data-sketch-skip=""
      data-qa="role-figure"
      data-figure={id}
      data-rested={rested ? "true" : "false"}
      className="group absolute inset-0"
      onClick={canReplay ? replay : undefined}
      data-cursor={canReplay ? "blue" : undefined}
      data-cursor-label={canReplay ? "Replay" : undefined}
    >
      {scene ? <Figure ref={svg} scene={scene} sketch={sketch} /> : null}
      {canReplay ? (
        <span
          className={`pointer-events-none absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-paper text-graphite opacity-0 transition-opacity duration-(--dur-ui) ${rested ? "fine:group-hover:opacity-100" : ""}`}
        >
          <Replay size={13} />
        </span>
      ) : null}
    </div>
  );
}

function Figure({ scene, sketch, ref }: { scene: Scene; sketch: boolean; ref: Ref<SVGSVGElement> }) {
  const { w, h, fs } = scene;
  const ink = !sketch;
  const stroke = (sh: Shape) => (sketch ? "stroke-graphite" : STROKE[sh.tone ?? "ink"]);
  const fill = (sh: Shape) => (sh.fill ? (sketch ? (sh.width === 0 ? "fill-graphite" : "fill-none") : FILL[sh.fill]) : "fill-none");
  const restOf = (sh: Shape) => (sh.gone ? 0 : sh.rest);
  /** A part that is not a node or a wire: a pictogram, something inside a node, a story part. */
  const part = (sh: Shape, key: string, story: boolean) => (
    <path
      key={key}
      d={sh.d}
      pathLength={1}
      data-k={sh.k}
      data-story={story ? "" : undefined}
      data-fade={story ? undefined : ""}
      strokeWidth={sh.width ?? 1.5}
      className={`${fill(sh)} ${sh.width === 0 ? "" : stroke(sh)}`}
      opacity={sketch && sh.gone ? 0 : restOf(sh)}
    />
  );

  return (
    <svg ref={ref} aria-hidden="true" focusable="false" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 overflow-visible">
      {ink ? scene.under.map((sh, i) => part(sh, `u${i}`, true)) : null}

      {scene.wires.map((sh, i) =>
        sh.pencil ? <path key={`wp${i}`} data-pencil="" d={sh.pencil} pathLength={1} strokeWidth={1.25} className="stroke-graphite" opacity={sketch ? 1 : 0} /> : null,
      )}
      {ink
        ? scene.wires.map((sh, i) =>
            sh.dash ? (
              <path key={`wi${i}`} data-ink-dash="" d={sh.d} strokeWidth={sh.width ?? 1.5} strokeDasharray="4 5" className={stroke(sh)} />
            ) : (
              <path key={`wi${i}`} data-ink="" d={sh.d} pathLength={1} strokeWidth={sh.width ?? 1.5} className={stroke(sh)} />
            ),
          )
        : null}

      {ink
        ? scene.packets.map((p) => (
            <circle key={p.k} data-packet={p.k} cx={p.track[0][0]} cy={p.track[0][1]} r={4.2} strokeWidth={1.2} className={`stroke-ink ${PACKET[p.kind]}`} opacity={0} />
          ))
        : null}

      {ink ? scene.nodes.map((sh, i) => <path key={`nf${i}`} data-fill="" data-node={sh.k} d={sh.d} className={FILL[sh.fill ?? "card"]} />) : null}
      {ink ? scene.inside.map((sh, i) => part(sh, `in${i}`, sh.k !== undefined)) : null}
      {scene.nodes.map((sh, i) =>
        sh.pencil ? <path key={`np${i}`} data-pencil="" d={sh.pencil} pathLength={1} strokeWidth={1.25} className="stroke-graphite" opacity={sketch ? 1 : 0} /> : null,
      )}
      {ink ? scene.nodes.map((sh, i) => <path key={`ni${i}`} data-ink="" data-node={sh.k} d={sh.d} pathLength={1} strokeWidth={1.5} className={stroke(sh)} />) : null}

      {scene.icons.map((sh, i) => part(sh, `ic${i}`, false))}
      {scene.over.map((sh, i) => part(sh, `ov${i}`, true))}

      {scene.labels.map((l, i) => (
        <text
          key={`t${i}`}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor ?? "start"}
          data-k={l.k}
          data-story={l.k ? "" : undefined}
          data-fade={l.k ? undefined : ""}
          className={`type-micro ${sketch ? "fill-graphite" : TEXT[l.tone ?? "ink"]}`}
          style={{ fontSize: fs }}
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}
