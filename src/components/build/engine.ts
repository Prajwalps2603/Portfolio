"use client";

/**
 * THE STACK MAP ENGINE (client only; StackMap imports it lazily when the map nears the viewport,
 * so none of this is in the home page's initial JS).
 *
 * React renders the map (window, nodes, labels, stamp) and lights the nodes. This module owns the
 * two SVG layers inside the canvas:
 *   under (below the nodes): highlighter bands, the hand-drawn wires, the request origin, packets
 *   over  (above the nodes): ports, and the sketch twins of the nodes (rough boxes + scribbles)
 * and the motion: the arrival (sketch draws, compiles, the first full journey, the SHIPPED
 * stamp), the packets, the bands that trace a lit path, and sketch mode.
 *
 * Diagram grammar: wires are rough graphite strokes, ink when lit; packets are small pills with an
 * ink rim, in fixed colours (lime = a request going in, blue = data moving between services,
 * tangerine = the result coming back); 1-3 per path. Animates transform, opacity, `d` (the
 * compile tightening) and stroke-dashoffset only. One gsap.ticker callback, running only while
 * the map is on screen, the tab is visible, motion is allowed and the visitor has not paused it.
 */
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { arrowGeometry, hashSeed, roughCircle, roughRect, scribble, tight } from "@/components/sketch/rough";
import { drawOn, hideStrokes, showStrokes } from "@/components/sketch/draw";
import { stampIn } from "@/components/sketch/stamp";
import { NODE_ORDER, edgeKey, type Accent, type Graph, type MapView, type NodeId } from "./graph";

export type EngineState = { graph: Graph; view: MapView; playing: boolean; reduced: boolean; sketch: boolean };

export type MapEngine = {
  setView(v: MapView): void;
  setPlaying(p: boolean): void;
  setReduced(r: boolean): void;
  setSketch(s: boolean): void;
  destroy(): void;
};

// ---------------------------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------------------------

/** px/s at rest: calm. A lit path runs ACTIVE times faster. The first journey runs at BOOT. */
const SPEED = 42;
const ACTIVE = 3.2;
const BOOT = 300;
/** Seconds a packet spends inside a node (divided by the speed multiplier). */
const DWELL = 0.5;
const MAX_REQUESTS = 2;
const DIM = 0.35;
const BAND_WIDTH = 12;
/** The highlighter traces a lit path in this long (all wires together). */
const BAND_TIME = 0.55;
const SAMPLES = 32;

const NS = "http://www.w3.org/2000/svg";

// Literal class strings (Tailwind reads them from this file).
const BAND: Record<Accent, string> = { lime: "stroke-lime", blue: "stroke-blue-soft", tangerine: "stroke-tangerine-soft" };
const PACKET: Record<Accent, string> = { lime: "fill-lime", blue: "fill-blue", tangerine: "fill-tangerine" };
const WIRE_BASE = "transition-[color,opacity] duration-(--dur-ui) ease-arrive";
const WIRE_TONE = { idle: "text-graphite", lit: "text-ink", sketch: "text-pencil" } as const;
const PORT_TONE = { idle: "fill-card stroke-graphite", lit: "fill-ink stroke-ink" } as const;
const CLIP_HIDDEN = "inset(-40% 100% -40% -8%)";
const CLIP_SHOWN = "inset(-40% 0% -40% -8%)";

// ---------------------------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------------------------

type Pt = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };
type Curve = { p: [Pt, Pt, Pt, Pt]; len: number; lut: Float64Array };

const fx = (n: number) => (Math.round(n * 10) / 10).toString();
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const centre = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** Layout box relative to `root` through the offset chain (transforms ignored on purpose). */
function boxIn(el: HTMLElement, root: HTMLElement): Box | null {
  if (!el.offsetParent) return null;
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    const p = n.offsetParent as HTMLElement | null;
    if (!p) return null;
    if (p !== root) {
      x += p.clientLeft;
      y += p.clientTop;
    }
    n = p;
  }
  return n === root ? { x, y, w: el.offsetWidth, h: el.offsetHeight } : null;
}

/** Where a wire leaves a box toward `to`: the border along the centre line, kept off the corners. */
function anchor(b: Box, to: Pt): Pt {
  const c = centre(b);
  const dx = to.x - c.x;
  const dy = to.y - c.y;
  const tx = dx === 0 ? Infinity : b.w / 2 / Math.abs(dx);
  const ty = dy === 0 ? Infinity : b.h / 2 / Math.abs(dy);
  if (tx < ty) return { x: dx > 0 ? b.x + b.w : b.x, y: clamp(c.y + dy * tx, b.y + b.h * 0.25, b.y + b.h * 0.75) };
  return { x: clamp(c.x + dx * ty, b.x + b.w * 0.2, b.x + b.w * 0.8), y: dy > 0 ? b.y + b.h : b.y };
}

/** The tight twin of arrowGeometry (same bend maths, no jitter): the curve packets ride. */
function bent(a: Pt, b: Pt, bend: number): [Pt, Pt, Pt, Pt] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const qx = (a.x + b.x) / 2 + (-dy / len) * bend * len;
  const qy = (a.y + b.y) / 2 + (dx / len) * bend * len;
  return [a, { x: a.x + (2 / 3) * (qx - a.x), y: a.y + (2 / 3) * (qy - a.y) }, { x: b.x + (2 / 3) * (qx - b.x), y: b.y + (2 / 3) * (qy - b.y) }, b];
}

function at(p: Curve["p"], t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x, y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y };
}

function tangent(p: Curve["p"], t: number): Pt {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p[1].x - p[0].x) + 6 * u * t * (p[2].x - p[1].x) + 3 * t * t * (p[3].x - p[2].x),
    y: 3 * u * u * (p[1].y - p[0].y) + 6 * u * t * (p[2].y - p[1].y) + 3 * t * t * (p[3].y - p[2].y),
  };
}

function curve(p: Curve["p"]): Curve {
  const lut = new Float64Array(SAMPLES + 1);
  let prev = p[0];
  for (let i = 1; i <= SAMPLES; i++) {
    const q = at(p, i / SAMPLES);
    lut[i] = lut[i - 1] + Math.hypot(q.x - prev.x, q.y - prev.y);
    prev = q;
  }
  return { p, len: Math.max(1, lut[SAMPLES]), lut };
}

/** Point + heading at a fraction of the curve's LENGTH (constant speed). */
function sample(c: Curve, f: number): { x: number; y: number; deg: number } {
  const target = clamp(f, 0, 1) * c.len;
  let i = 0;
  while (i < SAMPLES - 1 && c.lut[i + 1] < target) i++;
  const seg = c.lut[i + 1] - c.lut[i] || 1;
  const t = (i + (target - c.lut[i]) / seg) / SAMPLES;
  const pt = at(c.p, t);
  const tg = tangent(c.p, t);
  return { x: pt.x, y: pt.y, deg: (Math.atan2(tg.y, tg.x) * 180) / Math.PI };
}

const cubicD = (p: Curve["p"]) => `M${fx(p[0].x)} ${fx(p[0].y)}C${fx(p[1].x)} ${fx(p[1].y)} ${fx(p[2].x)} ${fx(p[2].y)} ${fx(p[3].x)} ${fx(p[3].y)}`;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

// ---------------------------------------------------------------------------------------------
// Packets
// ---------------------------------------------------------------------------------------------

type Seg = { k: "wire"; key: string; rev: boolean; color: Accent } | { k: "dwell"; mul: number };

type Packet = {
  g: SVGGElement;
  pill: SVGRectElement;
  segs: Seg[];
  i: number;
  /** 0..1 through the current segment. */
  u: number;
  boot: boolean;
  loop: boolean;
  role: "request" | "shuttle" | "boot";
  alpha: number;
  dying: boolean;
  color: Accent | null;
  onEnd?: () => void;
};

const rank = (n: NodeId) => NODE_ORDER.indexOf(n);
const wire = (from: NodeId, to: NodeId, color: Accent): Seg => ({ k: "wire", key: edgeKey(from, to), rev: rank(from) > rank(to), color });
const STUB = "origin>interface";

/** A request walks `fwd` (lime) and its result comes home along `back` (tangerine). */
function requestSegs(fwd: NodeId[], back: NodeId[]): Seg[] {
  const segs: Seg[] = [];
  const entry = fwd[0] === "interface";
  if (entry) segs.push({ k: "wire", key: STUB, rev: false, color: "lime" });
  segs.push({ k: "dwell", mul: fwd.length === 1 ? 2.4 : 1 });
  for (let i = 1; i < fwd.length; i++) {
    segs.push(wire(fwd[i - 1], fwd[i], "lime"));
    segs.push({ k: "dwell", mul: i === fwd.length - 1 ? 2.4 : 1 });
  }
  for (let i = 1; i < back.length; i++) {
    segs.push(wire(back[i - 1], back[i], "tangerine"));
    segs.push({ k: "dwell", mul: 1 });
  }
  if (entry && back[back.length - 1] === "interface") segs.push({ k: "wire", key: STUB, rev: true, color: "tangerine" });
  // home: it fades into the origin mark instead of popping
  segs.push({ k: "dwell", mul: 0.5 });
  return segs;
}

/** Data moving back and forth between two services. */
function shuttleSegs(key: string): Seg[] {
  const [a, b] = key.split(">") as [NodeId, NodeId];
  return [wire(a, b, "blue"), { k: "dwell", mul: 1.2 }, wire(b, a, "blue"), { k: "dwell", mul: 1.2 }];
}

// ---------------------------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------------------------

type Wire = {
  key: string;
  a: NodeId | null;
  b: NodeId;
  g: SVGGElement;
  rough: SVGPathElement;
  band: SVGPathElement;
  ports: SVGCircleElement[];
  curve: Curve | null;
  state: "idle" | "lit" | "dim";
  /** The band's accent while lit (null = no band). */
  banded: Accent | null;
};

type Phase = "pending" | "arriving" | "boot" | "live";

export function mountMap(root: HTMLElement, init: EngineState): MapEngine {
  const canvas = root.querySelector<HTMLElement>("[data-canvas]");
  const under = root.querySelector<SVGSVGElement>("svg[data-under]");
  const over = root.querySelector<SVGSVGElement>("svg[data-over]");
  const noop: MapEngine = { setView() {}, setPlaying() {}, setReduced() {}, setSketch() {}, destroy() {} };
  if (!canvas || !under || !over) return noop;

  const nodeEl = new Map<NodeId, HTMLElement>();
  root.querySelectorAll<HTMLElement>("[data-node]").forEach((el) => nodeEl.set(el.dataset.node as NodeId, el));
  const originEl = root.querySelector<HTMLElement>("[data-origin]");
  const stampEl = root.querySelector<HTMLElement>("[data-stamp]");
  const crisp = (id: NodeId) => Array.from(nodeEl.get(id)?.querySelectorAll<HTMLElement>("[data-crisp]") ?? []);
  const skLabel = (id: NodeId) => nodeEl.get(id)?.querySelector<HTMLElement>("[data-sk-label]") ?? null;
  const allCrisp = () => NODE_ORDER.flatMap(crisp);
  const allLabels = () => NODE_ORDER.map(skLabel).filter((x): x is HTMLElement => !!x);

  let view = init.view;
  let playing = init.playing;
  let reduced = init.reduced;
  let sketch = init.sketch;
  let inView = false;
  /** Last intersection ratio of the canvas (the arrival waits for 30%). */
  let ratio = 0;
  let geoReady = false;
  let phase: Phase = "live";
  let ticking = false;
  let destroyed = false;

  // ---- SVG skeleton ---------------------------------------------------------------------------
  const gBands = svg("g", { class: "mix-blend-multiply" });
  const gWires = svg("g");
  const gOrigin = svg("g", { class: `${WIRE_BASE} text-graphite` });
  const gPackets = svg("g");
  under.append(gBands, gWires, gOrigin, gPackets);
  const gPorts = svg("g", { class: "transition-opacity duration-(--dur-ui) ease-arrive group-data-[mode=sketch]/map:opacity-0" });
  const gSketch = svg("g", { class: "opacity-0 group-data-[mode=sketch]/map:opacity-100" });
  over.append(gPorts, gSketch);

  const originRing = svg("path", { "data-stroke": "", fill: "none", stroke: "currentColor", "stroke-width": 1.5, "stroke-linecap": "round" });
  const originDot = svg("circle", { r: 4, class: "fill-ink" });
  gOrigin.append(originRing, originDot);

  const makeWire = (key: string, a: NodeId | null, b: NodeId): Wire => {
    const g = svg("g", { class: `${WIRE_BASE} ${WIRE_TONE.idle}` });
    const rough = svg("path", { "data-stroke": "", fill: "none", stroke: "currentColor", "stroke-width": 1.5, "stroke-linecap": "round", "stroke-linejoin": "round" });
    g.append(rough);
    gWires.append(g);
    const band = svg("path", { fill: "none", "stroke-width": BAND_WIDTH, "stroke-linecap": "round", class: BAND.lime });
    band.style.opacity = "0";
    gBands.append(band);
    const ports = (a ? [0, 1] : [1]).map(() => {
      const c = svg("circle", { r: 3.25, "stroke-width": 1.25, class: `${PORT_TONE.idle} transition-[fill,stroke,opacity] duration-(--dur-ui)` });
      gPorts.append(c);
      return c;
    });
    return { key, a, b, g, rough, band, ports, curve: null, state: "idle", banded: null };
  };
  const { edges, idle: IDLE_ROUTE, back: RETURN_ROUTE } = init.graph;
  const wires = new Map<string, Wire>();
  wires.set(STUB, makeWire(STUB, null, "interface"));
  for (const [a, b] of edges) wires.set(edgeKey(a, b), makeWire(edgeKey(a, b), a, b));

  /** A node's sketch twin. `g` holds its box and scribbles: it recedes (opacity) when the node is
   *  off the lit path; the tweens below only ever touch the box, the scribbles and gSketch. */
  type NodeSketch = { g: SVGGElement; rect: SVGPathElement; scribbles: SVGPathElement[]; rough: string; tight: string };
  const sketches = new Map<NodeId, NodeSketch>();
  for (const id of NODE_ORDER) {
    const g = svg("g", { class: "transition-opacity duration-(--dur-ui) ease-arrive" });
    const rect = svg("path", { "data-stroke": "", fill: "none", stroke: "currentColor", "stroke-width": 1.5, "stroke-linecap": "round", "stroke-linejoin": "round", class: "text-ink/80" });
    g.append(rect);
    gSketch.append(g);
    sketches.set(id, { g, rect, scribbles: [], rough: "", tight: "" });
  }

  // ---- measuring ------------------------------------------------------------------------------
  function measure() {
    if (destroyed) return;
    const boxes = new Map<NodeId, Box>();
    for (const [id, el] of nodeEl) {
      const b = boxIn(el, canvas!);
      if (b && b.w > 0) boxes.set(id, b);
    }
    if (boxes.size < NODE_ORDER.length) {
      geoReady = false;
      updateRunning();
      return;
    }
    const W = canvas!.clientWidth;
    const H = canvas!.clientHeight;
    for (const s of [under!, over!]) s.setAttribute("viewBox", `0 0 ${W} ${H}`);

    // nodes' sketch twins: a rough box and a scribble where each technology will be
    for (const id of NODE_ORDER) {
      const b = boxes.get(id)!;
      const sk = sketches.get(id)!;
      const o = { seed: `map-${id}`, radius: 14, passes: 2 as const };
      sk.rough = roughRect(b.x + 0.75, b.y + 0.75, b.w - 1.5, b.h - 1.5, o);
      sk.tight = roughRect(b.x + 0.75, b.y + 0.75, b.w - 1.5, b.h - 1.5, tight(o));
      sk.rect.setAttribute("d", sk.rough);
      sk.scribbles.forEach((p) => p.remove());
      sk.scribbles = [];
      nodeEl.get(id)!.querySelectorAll<HTMLElement>("[data-tech]").forEach((t, i) => {
        const tb = boxIn(t, canvas!);
        if (!tb || tb.w < 4) return;
        const p = svg("path", {
          "data-stroke": "",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": 1.3,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: "text-pencil",
          d: scribble(tb.x, tb.y + tb.h * 0.28, Math.max(8, tb.w * 0.9), tb.h * 0.44, { seed: `map-${id}-tech-${i}`, density: 0.9 }),
        });
        sk.g.append(p);
        sk.scribbles.push(p);
      });
    }

    // wires between nodes
    for (const w of wires.values()) {
      let p: Curve["p"];
      const B = boxes.get(w.b)!;
      if (w.a) {
        const A = boxes.get(w.a)!;
        const pa = anchor(A, centre(B));
        const pb = anchor(B, centre(A));
        const diagonal = Math.min(Math.abs(pb.x - pa.x), Math.abs(pb.y - pa.y)) > 16;
        const bend = (diagonal ? 0.16 : 0.05) * (hashSeed(w.key) % 2 ? 1 : -1);
        p = bent(pa, pb, bend);
        w.rough.setAttribute(
          "d",
          arrowGeometry([pa.x, pa.y], [pb.x, pb.y], { seed: `map-${w.key}`, bend, roughness: 1 }).shaft +
            arrowGeometry([pa.x, pa.y], [pb.x, pb.y], { seed: `map-${w.key}-2`, bend: bend * 0.8, roughness: 1.4 }).shaft,
        );
        w.ports[0].setAttribute("cx", fx(pa.x));
        w.ports[0].setAttribute("cy", fx(pa.y));
        w.ports[1].setAttribute("cx", fx(pb.x));
        w.ports[1].setAttribute("cy", fx(pb.y));
      } else {
        // the entry: requests drop in from the origin mark above Interface
        const ob = originEl ? boxIn(originEl, canvas!) : null;
        const o: Pt = ob ? { x: ob.x + ob.w / 2, y: ob.y + ob.h / 2 } : { x: B.x + B.w * 0.25, y: Math.max(8, B.y - 40) };
        const end: Pt = { x: clamp(o.x, B.x + B.w * 0.2, B.x + B.w * 0.8), y: B.y };
        const start: Pt = { x: o.x, y: o.y + 8 };
        p = bent(start, end, 0.04);
        w.rough.setAttribute("d", arrowGeometry([start.x, start.y], [end.x, end.y], { seed: "map-entry", bend: 0.04, roughness: 0.8 }).shaft);
        w.ports[0].setAttribute("cx", fx(end.x));
        w.ports[0].setAttribute("cy", fx(end.y));
        originRing.setAttribute("d", roughCircle(o.x, o.y, 7.5, { seed: "map-origin", passes: 1 }));
        originDot.setAttribute("cx", fx(o.x));
        originDot.setAttribute("cy", fx(o.y));
      }
      w.curve = curve(p);
      w.band.setAttribute("d", cubicD(p));
      // a band that is already drawn stays whole at its new length
      if (w.banded && !gsap.isTweening(w.band)) {
        w.band.style.strokeDasharray = "";
        w.band.style.strokeDashoffset = "";
      }
    }
    const first = !geoReady;
    geoReady = true;
    // a path lit before the geometry existed gets its highlighter now
    if (first && view.kind === "path" && [...wires.values()].every((w) => !w.banded)) light();
    if (phase === "pending") {
      hideStrokes(drawTargets());
      if (ratio >= 0.3) arrive();
    }
    if (phase === "live" && !sketch && !reduced && !packets.length) plan();
    updateRunning();
  }

  /** Pen order: the origin, the entry, then each node followed by the wires leaving it. */
  function drawTargets(): Element[] {
    const out: Element[] = [originRing, wires.get(STUB)!.rough];
    for (const id of NODE_ORDER) {
      const sk = sketches.get(id)!;
      out.push(sk.rect, ...sk.scribbles);
      for (const w of wires.values()) if (w.a === id) out.push(w.rough);
    }
    return out;
  }

  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(measure);
  });
  ro.observe(canvas);
  nodeEl.forEach((el) => ro.observe(el));

  // ---- mode (ship | sketch) -------------------------------------------------------------------
  function setMode(m: "ship" | "sketch") {
    root.dataset.mode = m;
    for (const w of wires.values()) paintWire(w);
    gOrigin.setAttribute("class", `${WIRE_BASE} ${m === "sketch" ? WIRE_TONE.sketch : WIRE_TONE.idle}`);
  }

  let modeTl: gsap.core.Timeline | null = null;
  let stampTl: gsap.core.Timeline | null = null;
  const killMode = () => {
    modeTl?.kill();
    modeTl = null;
  };
  const sketchEls = () => NODE_ORDER.flatMap((id) => [sketches.get(id)!.rect, ...sketches.get(id)!.scribbles]);

  /** Strokes tighten into the crisp nodes (the MiniUI move): <= 0.6s, canonical order. */
  function compile(onDone: () => void) {
    killMode();
    const crisps = allCrisp();
    const labels = allLabels();
    gsap.set(crisps, { opacity: 0 });
    gsap.set(labels, { opacity: 1, clipPath: CLIP_SHOWN });
    gsap.set(gSketch, { opacity: 1 });
    setMode("ship");
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set([...crisps, ...labels, gSketch, ...sketchEls()], { clearProps: "opacity,transform,clipPath" });
        for (const sk of sketches.values()) sk.rect.setAttribute("d", sk.rough);
        showStrokes(drawTargets());
        modeTl = null;
        onDone();
      },
    });
    NODE_ORDER.forEach((id, i) => {
      const sk = sketches.get(id)!;
      const t0 = i * 0.045;
      tl.to(sk.rect, { attr: { d: sk.tight }, duration: 0.22, ease: EASE.pen }, t0);
      if (sk.scribbles.length) tl.to(sk.scribbles, { opacity: 0, duration: DUR.feedback, ease: EASE.exit }, t0);
      const l = skLabel(id);
      if (l) tl.to(l, { opacity: 0, y: -3, duration: 0.12, ease: EASE.exit }, t0 + 0.04);
      tl.to(sk.rect, { opacity: 0, duration: DUR.exit, ease: EASE.exit }, t0 + 0.14);
      tl.fromTo(crisp(id), { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: DUR.ui, ease: EASE.arrive }, t0 + 0.08);
    });
    modeTl = tl;
  }

  /** Back to the idea: the crisp nodes fade, the pencil boxes loosen, the handwriting returns. */
  function decompile() {
    killMode();
    const crisps = allCrisp();
    const labels = allLabels();
    const rects = NODE_ORDER.map((id) => sketches.get(id)!.rect);
    const scribbles = NODE_ORDER.flatMap((id) => sketches.get(id)!.scribbles);
    showStrokes(drawTargets());
    gsap.set(gSketch, { opacity: 1 });
    rects.forEach((r, i) => r.setAttribute("d", sketches.get(NODE_ORDER[i])!.tight));
    gsap.set([...rects, ...scribbles], { opacity: 0 });
    gsap.set(labels, { opacity: 0, clipPath: CLIP_SHOWN });
    gsap.set(crisps, { opacity: 1 });
    setMode("sketch");
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set([...crisps, ...labels, gSketch, ...sketchEls()], { clearProps: "opacity,transform,clipPath" });
        for (const sk of sketches.values()) sk.rect.setAttribute("d", sk.rough);
        modeTl = null;
      },
    });
    tl.to(crisps, { opacity: 0, duration: DUR.exit, ease: EASE.exit, stagger: 0.02 }, 0);
    rects.forEach((r, i) => {
      tl.to(r, { opacity: 1, duration: 0.12, ease: EASE.arrive }, 0.04 + i * 0.03);
      tl.to(r, { attr: { d: sketches.get(NODE_ORDER[i])!.rough }, duration: 0.24, ease: EASE.pen }, 0.08 + i * 0.03);
    });
    tl.to(scribbles, { opacity: 1, duration: DUR.ui, ease: EASE.arrive, stagger: 0.01 }, 0.16);
    tl.to(labels, { opacity: 1, duration: DUR.ui, ease: EASE.arrive, stagger: STAGGER.items }, 0.12);
    if (stampEl) tl.to(stampEl, { autoAlpha: 0, duration: DUR.exit, ease: EASE.exit }, 0);
    modeTl = tl;
  }

  function landStamp() {
    if (!stampEl || sketch || destroyed) return;
    stampTl?.kill();
    stampTl = reduced ? null : stampIn(stampEl, { impact: nodeEl.get("deploy") ?? null });
    if (reduced) gsap.set(stampEl, { clearProps: "opacity,visibility,transform" });
  }

  // ---- arrival --------------------------------------------------------------------------------
  function arrive() {
    if (phase !== "pending" || !geoReady) return;
    phase = "arriving";
    killMode();
    const tl = gsap.timeline();
    tl.add(drawOn(drawTargets(), { duration: DUR.draw }), 0);
    allLabels().forEach((l, i) => tl.fromTo(l, { clipPath: CLIP_HIDDEN }, { clipPath: CLIP_SHOWN, duration: 0.34, ease: EASE.pen }, 0.12 + i * STAGGER.strokes));
    tl.call(() => compile(startBoot), [], DUR.draw + 0.18);
    modeTl = tl;
  }

  // ---- packets --------------------------------------------------------------------------------
  const packets: Packet[] = [];
  let mul = 1;
  let mulTarget = 1;
  let spawnClock = 0;
  let spawnEvery = 8;
  let plannedKey = "";
  let request: { fwd: NodeId[]; back: NodeId[] } | null = null;

  function makePacket(segs: Seg[], role: Packet["role"], onEnd?: () => void): Packet {
    const g = svg("g");
    const pill = svg("rect", { x: -6.5, y: -3.5, width: 13, height: 7, rx: 3.5, "stroke-width": 1.25, class: `stroke-ink ${PACKET.lime}` });
    g.append(pill);
    g.style.opacity = "0";
    gPackets.append(g);
    const p: Packet = { g, pill, segs, i: 0, u: 0, boot: role === "boot", loop: role === "shuttle", role, alpha: 0, dying: false, color: null, onEnd };
    packets.push(p);
    return p;
  }

  function dropPacket(p: Packet) {
    p.g.remove();
    const i = packets.indexOf(p);
    if (i >= 0) packets.splice(i, 1);
  }

  /** What should be flowing for the current view. */
  function plan() {
    if (phase !== "live" || sketch || reduced || !geoReady) return;
    const key = viewKeyOf(view);
    if (key === plannedKey && packets.some((p) => !p.dying && !p.boot)) return;
    plannedKey = key;
    for (const p of packets) if (!p.boot) p.dying = true;
    const shuttles: string[] = [];
    if (view.kind === "idle") {
      request = { fwd: IDLE_ROUTE, back: RETURN_ROUTE };
      if (wires.has(edgeKey("data", "automation"))) shuttles.push(edgeKey("data", "automation"));
      mulTarget = 1;
    } else if (view.kind === "path") {
      const r = view.path.route;
      request = { fwd: r, back: [...r].reverse() };
      if (r.length >= 3) shuttles.push(edgeKey(r[r.length - 2], r[r.length - 1]));
      mulTarget = ACTIVE;
    } else {
      request = null;
      for (const w of wires.values()) if (w.a && (w.a === view.node || w.b === view.node) && shuttles.length < 3) shuttles.push(w.key);
      mulTarget = ACTIVE;
    }
    for (const k of shuttles) {
      const s = makePacket(shuttleSegs(k), "shuttle");
      // stagger the shuttles so they never move in lockstep
      s.u = (hashSeed(k) % 100) / 100;
    }
    spawnEvery = request ? roundTrip(request) / MAX_REQUESTS : 8;
    spawnClock = spawnEvery; // the first request leaves at once
  }

  /** Seconds for one request there and back at the target speed. */
  function roundTrip(r: { fwd: NodeId[]; back: NodeId[] }): number {
    const segs = requestSegs(r.fwd, r.back);
    let s = 0;
    for (const g of segs) {
      if (g.k === "dwell") s += (DWELL * g.mul) / mulTarget;
      else s += (wires.get(g.key)?.curve?.len ?? 0) / (SPEED * mulTarget);
    }
    return Math.max(2.4, s);
  }

  function startBoot() {
    phase = "boot";
    const segs: Seg[] = [{ k: "wire", key: STUB, rev: false, color: "lime" }, { k: "dwell", mul: 0.3 }];
    for (let i = 1; i < IDLE_ROUTE.length; i++) {
      segs.push(wire(IDLE_ROUTE[i - 1], IDLE_ROUTE[i], "lime"));
      segs.push({ k: "dwell", mul: 0.3 });
    }
    if (reduced || sketch) {
      phase = "live";
      landStamp();
      return;
    }
    makePacket(segs, "boot", () => {
      phase = "live";
      landStamp();
      plan();
    });
    updateRunning();
  }

  function litFactor(key: string | null): number {
    if (view.kind === "idle" || !key) return 1;
    return wires.get(key)?.state === "lit" ? 1 : DIM;
  }

  function step(p: Packet, dt: number) {
    let budget = dt;
    let guard = 0;
    while (budget > 0 && p.i < p.segs.length && guard++ < 24) {
      const s = p.segs[p.i];
      let dur: number;
      if (s.k === "dwell") dur = p.boot ? DWELL * s.mul * 0.5 : (DWELL * s.mul) / mul;
      else {
        const c = wires.get(s.key)?.curve;
        dur = c ? c.len / (p.boot ? BOOT : SPEED * mul) : 0;
      }
      const left = (1 - p.u) * dur;
      if (dur <= 0 || budget >= left) {
        budget -= Math.max(0, left);
        p.u = 0;
        p.i++;
        if (p.i >= p.segs.length && p.loop) p.i = 0;
      } else {
        p.u += budget / dur;
        budget = 0;
      }
    }
  }

  function render(p: Packet, dt: number) {
    const s = p.segs[Math.min(p.i, p.segs.length - 1)];
    let target = 0;
    if (s && s.k === "wire" && p.i < p.segs.length) {
      const c = wires.get(s.key)?.curve;
      if (c) {
        const pt = sample(c, s.rev ? 1 - p.u : p.u);
        p.g.setAttribute("transform", `translate(${fx(pt.x)} ${fx(pt.y)}) rotate(${fx(s.rev ? pt.deg + 180 : pt.deg)})`);
        target = p.boot ? 1 : litFactor(s.key);
      }
      if (p.color !== s.color) {
        p.color = s.color;
        p.pill.setAttribute("class", `stroke-ink ${PACKET[s.color]}`);
      }
    }
    if (p.dying) target = 0;
    p.alpha += (target - p.alpha) * Math.min(1, dt / 0.08);
    p.g.style.opacity = p.alpha.toFixed(3);
  }

  function tick(_time: number, deltaMs: number) {
    const dt = Math.min(64, deltaMs) / 1000;
    mul += (mulTarget - mul) * (1 - Math.exp(-dt / 0.35));
    for (const p of [...packets]) {
      if (!p.dying) step(p, dt);
      render(p, dt);
      if ((p.dying && p.alpha < 0.02) || (!p.loop && p.i >= p.segs.length && !p.dying)) {
        if (!p.dying) p.onEnd?.();
        dropPacket(p);
      }
    }
    if (phase === "live" && request) {
      spawnClock += dt;
      const live = packets.filter((p) => p.role === "request" && !p.dying).length;
      if (live < MAX_REQUESTS && spawnClock >= spawnEvery) {
        spawnClock = 0;
        makePacket(requestSegs(request.fwd, request.back), "request");
      }
    }
  }

  function updateRunning() {
    const run = !destroyed && !reduced && !sketch && playing && inView && !document.hidden && geoReady && (phase === "boot" || phase === "live");
    if (run && !ticking) {
      gsap.ticker.add(tick);
      ticking = true;
    } else if (!run && ticking) {
      gsap.ticker.remove(tick);
      ticking = false;
    }
  }

  function clearPackets() {
    for (const p of [...packets]) {
      if (p.boot) continue;
      dropPacket(p);
    }
    plannedKey = "";
    request = null;
  }

  // ---- lighting -------------------------------------------------------------------------------
  function paintWire(w: Wire) {
    const tone = w.state === "lit" ? WIRE_TONE.lit : root.dataset.mode === "sketch" ? WIRE_TONE.sketch : WIRE_TONE.idle;
    w.g.setAttribute("class", `${WIRE_BASE} ${tone}`);
    w.g.style.opacity = w.state === "dim" ? String(DIM) : "1";
    for (const c of w.ports) {
      c.setAttribute("class", `${w.state === "lit" ? PORT_TONE.lit : PORT_TONE.idle} transition-[fill,stroke,opacity] duration-(--dur-ui)`);
      c.style.opacity = w.state === "dim" ? String(DIM) : "1";
    }
  }

  function light() {
    const lit: string[] = [];
    let accent: Accent | null = null;
    if (view.kind === "path") {
      const r = view.path.route;
      if (r[0] === "interface") lit.push(STUB);
      for (let i = 1; i < r.length; i++) lit.push(edgeKey(r[i - 1], r[i]));
      accent = view.path.accent;
    } else if (view.kind === "node") {
      const id = view.node;
      if (id === "interface") lit.push(STUB);
      for (const w of wires.values()) if (w.a && (w.a === id || w.b === id)) lit.push(w.key);
    }
    const active = view.kind !== "idle";
    for (const w of wires.values()) {
      w.state = lit.includes(w.key) ? "lit" : active ? "dim" : "idle";
      paintWire(w);
    }
    gOrigin.style.opacity = active && !lit.includes(STUB) ? String(DIM) : "1";
    // the layers off the lit path: their pencil twins recede with their wires (sketch mode). The
    // node buttons carry the state (StackMap's data-state, already committed when this runs);
    // their words are coloured there, never faded.
    for (const [id, sk] of sketches) sk.g.style.opacity = nodeEl.get(id)?.dataset.state === "dim" ? String(DIM) : "1";

    // the highlighter traces the lit path, start to end, in the row's colour
    const same = accent !== null && lit.every((k) => wires.get(k)?.banded === accent) && [...wires.values()].every((w) => !w.banded || lit.includes(w.key));
    if (same) return;
    // Idempotent: every band that should not show is driven to 0 on EVERY pass (a fade cut short
    // by a quick second change must never leave a band stranded half-visible).
    for (const w of wires.values()) {
      gsap.killTweensOf(w.band);
      if (accent && lit.includes(w.key)) continue;
      w.banded = null;
      if (reduced) w.band.style.opacity = "0";
      else if (Number(gsap.getProperty(w.band, "opacity")) > 0) gsap.to(w.band, { opacity: 0, duration: DUR.exit, ease: EASE.exit });
    }
    if (!accent) return;
    const total = lit.reduce((s, k) => s + (wires.get(k)?.curve?.len ?? 0), 0) || 1;
    let t = 0;
    for (const k of lit) {
      const w = wires.get(k);
      if (!w?.curve) continue;
      w.banded = accent;
      w.band.setAttribute("class", BAND[accent]);
      const len = w.curve.len;
      if (reduced) {
        w.band.style.strokeDasharray = "";
        w.band.style.strokeDashoffset = "";
        w.band.style.opacity = "1";
        continue;
      }
      const d = (BAND_TIME * len) / total;
      gsap.fromTo(
        w.band,
        { strokeDasharray: `${len + 2} ${len + 2}`, strokeDashoffset: len + 2, opacity: 1 },
        {
          strokeDashoffset: 0,
          duration: Math.max(0.08, d),
          delay: t,
          ease: lit.length === 1 ? EASE.pen : EASE.none,
          onComplete: () => {
            w.band.style.strokeDasharray = "";
            w.band.style.strokeDashoffset = "";
          },
        },
      );
      t += d;
    }
  }

  // ---- visibility -----------------------------------------------------------------------------
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e) return;
      inView = e.isIntersecting;
      ratio = e.isIntersecting ? e.intersectionRatio : 0;
      if (phase === "pending" && ratio >= 0.3) arrive();
      updateRunning();
    },
    { threshold: [0, 0.3] },
  );
  io.observe(canvas);
  const onVisibility = () => updateRunning();
  document.addEventListener("visibilitychange", onVisibility);

  // ---- start ----------------------------------------------------------------------------------
  // Decide the phase BEFORE the first measure (measure plans packets when the phase is live).
  const rect = canvas.getBoundingClientRect();
  const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
  if (reduced) setMode(sketch ? "sketch" : "ship");
  else if (sketch) {
    setMode("sketch");
    if (stampEl) gsap.set(stampEl, { autoAlpha: 0 });
  } else if (!onScreen) {
    // Waiting off screen: the map is a blank page that draws itself when it scrolls in.
    phase = "pending";
    setMode("sketch");
    gsap.set(allLabels(), { clipPath: CLIP_HIDDEN });
    if (stampEl) gsap.set(stampEl, { autoAlpha: 0 });
  } else setMode("ship");
  measure(); // hides the strokes while pending; plans the packets when live
  light();
  plan();
  updateRunning();

  function viewKeyOf(v: MapView) {
    return v.kind === "idle" ? "idle" : v.kind === "path" ? `path:${v.path.id}` : `node:${v.node}`;
  }

  return {
    setView(v) {
      view = v;
      light();
      if (phase === "live") plan();
      else mulTarget = v.kind === "idle" ? 1 : ACTIVE;
    },
    setPlaying(p) {
      playing = p;
      updateRunning();
    },
    setReduced(r) {
      if (r === reduced) return;
      reduced = r;
      if (r) {
        killMode();
        stampTl?.kill();
        clearPackets();
        for (const p of [...packets]) dropPacket(p);
        gsap.set([...allCrisp(), ...allLabels(), gSketch, ...sketchEls()], { clearProps: "opacity,transform,clipPath" });
        if (stampEl) gsap.set(stampEl, { clearProps: "opacity,visibility,transform" });
        for (const sk of sketches.values()) sk.rect.setAttribute("d", sk.rough);
        showStrokes(drawTargets());
        phase = "live";
        setMode(sketch ? "sketch" : "ship");
      } else plan();
      light();
      updateRunning();
    },
    setSketch(s) {
      if (s === sketch) return;
      sketch = s;
      if (reduced) {
        setMode(s ? "sketch" : "ship");
        updateRunning();
        return;
      }
      if (s) {
        clearPackets();
        for (const p of [...packets]) dropPacket(p);
        if (phase === "pending" || phase === "arriving") gsap.set(allLabels(), { clearProps: "clipPath" });
        phase = "live";
        stampTl?.kill();
        decompile();
      } else {
        phase = "arriving";
        compile(() => {
          phase = "live";
          landStamp();
          plan();
          updateRunning();
        });
      }
      updateRunning();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (ticking) gsap.ticker.remove(tick);
      ticking = false;
      killMode();
      stampTl?.kill();
      for (const w of wires.values()) gsap.killTweensOf(w.band);
      const touched = [...allCrisp(), ...allLabels()];
      gsap.killTweensOf(touched);
      gsap.set(touched, { clearProps: "opacity,transform,clipPath" });
      if (stampEl) {
        gsap.killTweensOf(stampEl);
        gsap.set(stampEl, { clearProps: "opacity,visibility,transform" });
      }
      under.replaceChildren();
      over.replaceChildren();
      delete root.dataset.mode;
    },
  };
}
