"use client";

/**
 * The port drawing for "Also shipped" (geometry in ./scene.ts, containers in ./model.ts).
 * Decoration: aria-hidden; the yard list and the opened container below carry every fact, and a
 * click on a container only selects its tab.
 *
 * THE LOOP (a clock; it needs no scrolling): while the port is on screen the crane works the
 * ship, container by container: the trolley runs out over the yard, the spreader drops, locks on,
 * hoists, carries the container along the boom and sets it in its slot on the ship (2.4s a
 * container). With all nine aboard the SHIPPED stamp lands on the hull and the funnel puffs; the
 * ship rests, then the crane unloads it the same way, rests empty, and loads it again (about 48s a
 * round). The sea rolls all the while. It runs through the play gate (only on screen, only in a
 * visible tab, resuming where it stopped) and stops with `paused` (the visible pause control).
 * Reduced motion: the loaded ship, stamped, still. Sketch mode: the pencil drawing, loaded.
 *
 * THE SHIP FLOATS (his ask: "when the crane drops the container into the ship, the ship needs a
 * movement, because the container has weight and it is in water"). A small spring model: the ship
 * heaves and pitches about the middle of its waterline, riding the drawn waves. Each container set
 * down pushes it down and tips it toward where the box landed, then it bobs back and settles, and
 * ripples run out from the hull; lifting one off makes it rise. Loaded, it sits a little lower in
 * the water. The containers aboard, the SHIPPED stamp and the mooring lines move with it, and the
 * crane sets each box down on the moving deck (and picks it up from there).
 */
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { gsap } from "@/lib/motion/gsap";
import { usePlayGate } from "@/components/diagram/playGate";
import { EASE } from "@/lib/motion/eases";
import { ShippedStamp, stampIn } from "@/components/sketch/stamp";
import type { Box, BoxTone } from "./model";
import {
  COUNT,
  layoutPort,
  seaPath,
  stateAt,
  surfaceAt,
  swellPath,
  type PortLayout,
  type PortState,
} from "./scene";

const FILL: Record<BoxTone, string> = {
  "blue-soft": "fill-blue-soft",
  ink: "fill-ink",
  card: "fill-card",
  graphite: "fill-graphite",
  "paper-2": "fill-paper-2",
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const rect = (x: number, y: number, w: number, h: number) =>
  `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;

/** The round: load the ship (a container every PER seconds), rest full, unload, rest empty. */
const PER = 2.4;
const LOAD = COUNT * PER;
const FULL = 3.4;
const EMPTY = 1.6;
const ROUND = LOAD + FULL + LOAD + EMPTY;

/** The crane's progress at t seconds of work (0 = all in the yard, 1 = all aboard). */
function progressAt(t: number): number {
  const u = ((t % ROUND) + ROUND) % ROUND;
  if (u < LOAD) return u / LOAD;
  if (u < LOAD + FULL) return 1;
  if (u < 2 * LOAD + FULL) return 1 - (u - LOAD - FULL) / LOAD;
  return 0;
}

/* ---- the float ------------------------------------------------------------------------------ */
const DEG = Math.PI / 180;
const ease = (t: number) => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
};
/** h: heave (px, down), a: pitch (degrees, clockwise), their speeds; aboard: containers on the ship
 *  last frame; age: seconds since a box landed or left (the ripples); kick: how hard */
type Float = {
  h: number;
  vh: number;
  a: number;
  va: number;
  aboard: number;
  age: number;
  kick: number;
};
/** how many containers are on the ship in this state */
const aboardOf = (s: PortState) =>
  s.i + (s.q >= 0.86 && s.carrying !== s.i ? 1 : 0);
/** where the ship rests with n aboard: lower the more it carries, trimmed toward its load */
function restOf(L: PortLayout, n: number) {
  const half = (L.float.x1 - L.float.x0) / 2;
  let trim = 0;
  for (let j = 0; j < n; j++)
    trim += (L.ship[j][0] + L.cw / 2 - L.float.px) / half;
  return { h: n * L.ch * 0.012, a: (trim / COUNT) * 2.4 };
}
/** one step of the float: a landing (or a lift) kicks it, then springs pull it to rest on the waves */
function floatStep(
  L: PortLayout,
  f: Float,
  s: PortState,
  dt: number,
  t: number,
) {
  const n = aboardOf(s);
  if (f.aboard < 0) f.aboard = n;
  if (n !== f.aboard) {
    const landed = n > f.aboard;
    const j = landed ? n - 1 : n;
    const half = (L.float.x1 - L.float.x0) / 2;
    const off = (L.ship[j][0] + L.cw / 2 - L.float.px) / half;
    const k = landed ? 1 : -0.7;
    f.vh += k * L.ch * 1.05;
    f.va += k * 9 * off;
    f.age = 0;
    f.kick = landed ? 1 : 0.6;
    f.aboard = n;
  }
  const rest = restOf(L, n);
  const phase = t * 0.9;
  const { x0, x1 } = L.float;
  let sum = 0;
  for (let k = 0; k <= 4; k++)
    sum += surfaceAt(L, x0 + ((x1 - x0) * k) / 4, phase);
  const xb = x0 + (x1 - x0) * 0.2;
  const xs = x1 - (x1 - x0) * 0.2;
  const th = rest.h + (sum / 5) * 0.8 + Math.sin(t * 0.7) * L.ch * 0.02;
  const ta =
    rest.a +
    (Math.atan2(surfaceAt(L, xs, phase) - surfaceAt(L, xb, phase), xs - xb) /
      DEG) *
      0.8 +
    Math.sin(t * 0.53 + 1) * 0.18;
  const step = dt / 3;
  for (let k = 0; k < 3; k++) {
    f.vh += (-42 * (f.h - th) - 2.9 * f.vh) * step;
    f.h += f.vh * step;
    f.va += (-27 * (f.a - ta) - 2.6 * f.va) * step;
    f.a += f.va * step;
  }
  f.h = Math.max(-0.3 * L.ch, Math.min(0.3 * L.ch, f.h));
  f.a = Math.max(-3, Math.min(3, f.a));
  f.age += dt;
}

/** Is the ship resting full (stamped) at t? */
function fullAt(t: number): boolean {
  const u = ((t % ROUND) + ROUND) % ROUND;
  return u >= LOAD && u < LOAD + FULL;
}

export function PortScene({
  boxes,
  selected,
  onPick,
  reduced,
  sketch,
  paused,
}: {
  boxes: Box[];
  selected: number;
  onPick: (i: number) => void;
  reduced: boolean;
  sketch: boolean;
  paused: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const still = reduced || sketch;
  const live = usePlayGate(host, { threshold: 0.2 });

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

  const L = useMemo(
    () =>
      size && size.w > 120 && size.h > 100 ? layoutPort(size.w, size.h) : null,
    [size],
  );

  // the moving parts, written straight to the DOM every frame
  const trolley = useRef<SVGGElement>(null);
  const spreader = useRef<SVGGElement>(null);
  const ropes = useRef<SVGPathElement>(null);
  const sea = useRef<SVGPathElement>(null);
  const swellA = useRef<SVGPathElement>(null);
  const swellB = useRef<SVGPathElement>(null);
  const boxEls = useRef<(SVGGElement | null)[]>([]);
  const stamp = useRef<HTMLSpanElement>(null);
  const puff = useRef<SVGGElement>(null);
  const ship = useRef<SVGGElement>(null);
  const moor = useRef<SVGPathElement>(null);
  const stampWrap = useRef<HTMLDivElement>(null);
  const fl = useRef<Float>({
    h: 0,
    vh: 0,
    a: 0,
    va: 0,
    aboard: -1,
    age: 99,
    kick: 0,
  });
  const clock = useRef(0);
  const stamped = useRef(false);

  const apply = (layout: PortLayout, s: PortState, motion: boolean) => {
    // the ship: heave and pitch about the middle of its waterline (none when still)
    const f = fl.current;
    const h = motion ? f.h : 0;
    const a = motion ? f.a : 0;
    const { px, py } = layout.float;
    const shipT = `translate(0 ${r1(h)}) rotate(${a.toFixed(3)} ${px} ${py})`;
    ship.current?.setAttribute("transform", shipT);
    if (stampWrap.current)
      stampWrap.current.style.transform = `translate(0px, ${r1(h)}px) rotate(${a.toFixed(3)}deg)`;
    // the crane sets each box down on the moving deck (and lifts it from there): while the
    // spreader is at the ship it follows the deck's rise and fall under that slot
    let follow = 0;
    if (motion) {
      const q = s.q;
      const w =
        q >= 0.72 && q < 0.86
          ? ease((q - 0.72) / 0.14)
          : q >= 0.86 && q < 0.9
            ? 1
            : q >= 0.9
              ? 1 - ease((q - 0.9) / 0.1)
              : 0;
      const at = layout.ship[s.i][0] + layout.cw / 2;
      follow = w * (h + (at - px) * Math.tan(a * DEG));
    }
    const spY = s.spreaderY + follow;
    trolley.current?.setAttribute(
      "transform",
      `translate(${r1(s.trolleyX)} 0)`,
    );
    spreader.current?.setAttribute(
      "transform",
      `translate(${r1(s.trolleyX)} ${r1(spY)})`,
    );
    const top = layout.boomBottom + layout.trolleyH;
    const bottom = spY - layout.spreaderH - layout.headH;
    const x = s.trolleyX;
    const k = layout.cw;
    ropes.current?.setAttribute(
      "d",
      `M${r1(x - 0.13 * k)} ${r1(top)}L${r1(x - 0.09 * k)} ${r1(bottom)}M${r1(x - 0.05 * k)} ${r1(top)}L${r1(x - 0.03 * k)} ${r1(bottom)}M${r1(x + 0.05 * k)} ${r1(top)}L${r1(x + 0.03 * k)} ${r1(bottom)}M${r1(x + 0.13 * k)} ${r1(top)}L${r1(x + 0.09 * k)} ${r1(bottom)}`,
    );
    // the containers: aboard they ride with the ship; on the hook they follow the spreader
    s.boxes.forEach((b, j) => {
      const el = boxEls.current[j];
      if (!el) return;
      const aboard =
        j < s.i || (j === s.i && s.q >= 0.86 && s.carrying !== s.i);
      if (motion && aboard)
        el.setAttribute(
          "transform",
          `${shipT} translate(${r1(b[0])} ${r1(b[1])})`,
        );
      else
        el.setAttribute(
          "transform",
          `translate(${r1(b[0])} ${r1(b[1] + (j === s.carrying ? follow : 0))})`,
        );
    });
    // the mooring lines: from the quay's bollards to the moving ship, sagging between
    if (moor.current) {
      const ca = Math.cos(a * DEG);
      const sa = Math.sin(a * DEG);
      let d = "";
      for (const [fx, fy, cx, cy, tx, ty] of layout.ropes) {
        const X = px + (tx - px) * ca - (ty - py) * sa;
        const Y = py + (tx - px) * sa + (ty - py) * ca + h;
        d += `M${r1(fx)} ${r1(fy)}Q${r1((fx + X) / 2 + (cx - (fx + tx) / 2))} ${r1(cy + h * 0.5)} ${r1(X)} ${r1(Y)}`;
      }
      moor.current.setAttribute("d", d);
    }
  };

  const roll = (layout: PortLayout, t: number, motion = true) => {
    const phase = t * 0.9;
    // a landing sends ripples out from the hull's ends (and sloshes along it), dying away
    const f = fl.current;
    let bump: ((x: number) => number) | undefined;
    if (motion && f.age < 2.6) {
      const S = layout.ch * 0.09 * f.kick * Math.exp(-f.age * 1.5);
      const { x0, x1 } = layout.float;
      const age = f.age;
      bump = (x: number) => {
        const d =
          x < x0 ? x0 - x : x > x1 ? x - x1 : Math.min(x - x0, x1 - x) * 0.6;
        return S * Math.exp(-d / 55) * Math.sin(d * 0.14 - age * 9);
      };
    }
    sea.current?.setAttribute("d", seaPath(layout, phase, bump));
    swellA.current?.setAttribute("d", swellPath(layout, phase, 0.35, bump));
    swellB.current?.setAttribute(
      "d",
      swellPath(layout, phase + 1.4, 0.7, bump),
    );
  };

  /** The ship is full: the stamp lands and the funnel puffs. Unloading lifts it off again. */
  const mark = (full: boolean) => {
    if (full === stamped.current || !stamp.current) return;
    stamped.current = full;
    if (!full) {
      gsap.to(stamp.current, { autoAlpha: 0, duration: 0.3, ease: EASE.exit });
      return;
    }
    stampIn(stamp.current, { tilt: -8 });
    const puffs = puff.current ? Array.from(puff.current.children) : [];
    if (puffs.length) {
      gsap.fromTo(
        puffs,
        { opacity: 0.9, y: 0, scale: 0.5, transformOrigin: "50% 50%" },
        {
          opacity: 0,
          y: -22,
          scale: 1.6,
          duration: 1.1,
          ease: EASE.arrive,
          stagger: 0.16,
        },
      );
    }
  };

  // place everything for the current layout and moment (a resize redraws in place)
  useLayoutEffect(() => {
    if (!L) return;
    const p = still ? 1 : progressAt(clock.current);
    apply(L, stateAt(L, p), !still);
    roll(L, clock.current, !still);
    if (stamp.current)
      gsap.set(stamp.current, { autoAlpha: still || stamped.current ? 1 : 0 });
  });

  // the clock: the crane works while the port is on screen and nobody has paused it
  useEffect(() => {
    if (!L || still || !live || paused) return;
    let raf = 0;
    let last = 0;
    // (re)starting: count what is aboard without a kick
    fl.current.aboard = -1;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      clock.current += dt;
      const s = stateAt(L, progressAt(clock.current));
      floatStep(L, fl.current, s, dt, clock.current);
      apply(L, s, true);
      roll(L, clock.current);
      mark(fullAt(clock.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [L, still, live, paused]);

  return (
    <div
      ref={host}
      className="absolute inset-0"
      data-qa="port-scene"
      data-ready={L ? "true" : "false"}
    >
      {L ? (
        <Drawing
          L={L}
          boxes={boxes}
          selected={selected}
          onPick={onPick}
          sketch={sketch}
          refs={{
            trolley,
            spreader,
            ropes,
            sea,
            swellA,
            swellB,
            boxEls,
            puff,
            ship,
            moor,
          }}
        />
      ) : null}
      {L ? (
        <div
          ref={stampWrap}
          className="pointer-events-none absolute inset-0"
          style={{ transformOrigin: `${L.float.px}px ${L.float.py}px` }}
        >
          <ShippedStamp
            ref={stamp}
            size="sm"
            decorative
            tilt={-8}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: L.stampAt[0], top: L.stampAt[1] }}
          />
        </div>
      ) : null}
    </div>
  );
}

type Refs = {
  trolley: RefObject<SVGGElement | null>;
  spreader: RefObject<SVGGElement | null>;
  ropes: RefObject<SVGPathElement | null>;
  sea: RefObject<SVGPathElement | null>;
  swellA: RefObject<SVGPathElement | null>;
  swellB: RefObject<SVGPathElement | null>;
  boxEls: RefObject<(SVGGElement | null)[]>;
  puff: RefObject<SVGGElement | null>;
  ship: RefObject<SVGGElement | null>;
  moor: RefObject<SVGPathElement | null>;
};

function Drawing({
  L,
  boxes,
  selected,
  onPick,
  sketch,
  refs,
}: {
  L: PortLayout;
  boxes: Box[];
  selected: number;
  onPick: (i: number) => void;
  sketch: boolean;
  refs: Refs;
}) {
  const P = L.paths;
  const ink = !sketch;
  const line = ink ? "stroke-ink" : "stroke-graphite";
  const thin = ink ? "stroke-graphite" : "stroke-pencil";
  const fill = (cls: string) => (ink ? cls : "fill-none");
  const solid = (cls: string) => (ink ? cls : "fill-graphite");
  const paint = fill("fill-lime");
  const { cw, ch } = L;
  const hullClip = `port-hull-${Math.round(L.W)}-${Math.round(L.H)}`;

  // one container's parts, drawn at its own origin
  const ridgeEvery = cw / 10;
  let ridges = "";
  for (let k = 1; k < 10; k++)
    ridges += `M${r1(k * ridgeEvery)} ${r1(ch * 0.14)}V${r1(ch * 0.86)}`;
  const cs = Math.max(1.6, 0.08 * ch);
  const castings =
    rect(0, 0, cs, cs) +
    rect(cw - cs, 0, cs, cs) +
    rect(0, ch - cs, cs, cs) +
    rect(cw - cs, ch - cs, cs, cs);
  const fs = 11;
  const numFs = L.names ? 10 : Math.max(8, Math.min(10, ch * 0.5));

  // the trolley and its cab, at x = 0 (moved by the frame loop)
  const tb = L.boomBottom;
  const tH = L.trolleyH;
  const cabW = 0.3 * cw;
  const cabH = Math.max(7, 0.5 * ch);
  const cabX = 0.08 * cw;
  const cabY = tb + tH - 1;
  const opR = Math.max(1.4, 0.045 * cw);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={L.W}
      height={L.H}
      viewBox={`0 0 ${L.W} ${L.H}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute inset-0 overflow-hidden"
    >
      <defs>
        <clipPath id={hullClip}>
          <path d={P.hull} />
        </clipPath>
      </defs>

      {/* the sky and the horizon */}
      <path
        d={P.clouds}
        strokeWidth={1.2}
        className={`${fill("fill-paper")} stroke-pencil`}
      />
      <path
        d={P.skyline}
        strokeWidth={1}
        className={`${fill("fill-paper")} stroke-pencil`}
      />
      <path d={P.gulls} strokeWidth={1.3} className={thin} />
      <path
        d={P.backStacks}
        strokeWidth={1}
        className={`${fill("fill-paper")} stroke-pencil`}
      />
      <path d={P.backRidges} strokeWidth={0.8} className="stroke-line-strong" />

      {/* the crane's structure, behind what it carries */}
      <path d={P.stays} strokeWidth={0.9} className={thin} />
      <path d={P.aframe} strokeWidth={1.3} className={`${paint} ${line}`} />
      <path
        d={P.apexCap}
        strokeWidth={1.2}
        className={`${solid("fill-ink")} ${line}`}
      />
      <path
        d={P.apexLight}
        className={ink ? "fill-tangerine" : "fill-graphite"}
      />
      <path d={P.houseRoof} className={solid("fill-ink")} />
      <path
        d={P.house}
        strokeWidth={1.3}
        className={`${fill("fill-card")} ${line}`}
      />
      {ink ? <path d={P.houseBand} className="fill-lime" /> : null}
      <path d={P.houseLouvers} strokeWidth={1} className={line} />
      <path d={P.boomRail} strokeWidth={1} className={thin} />
      <path d={P.boom} strokeWidth={1.4} className={`${paint} ${line}`} />
      <path
        d={P.boomPanels}
        strokeWidth={0.9}
        className={line}
        opacity={0.55}
      />
      <path d={P.festoon} strokeWidth={1} className={thin} />
      <path d={P.floods} className={solid("fill-ink")} />
      <path d={P.braces} strokeWidth={1} className={`${paint} ${line}`} />
      <path d={P.stairs} strokeWidth={1} className={line} />
      <path d={P.legs} strokeWidth={1.4} className={`${paint} ${line}`} />
      <path d={P.legPanels} strokeWidth={0.9} className={line} opacity={0.5} />
      <path d={P.sill} strokeWidth={1.2} className={`${paint} ${line}`} />

      {/* the quay */}
      <path d={P.quay} className={fill("fill-paper-2")} />
      <path d={P.capping} strokeWidth={1} className={thin} />
      <path d={P.quayEdge} strokeWidth={2} className={line} />
      <path d={P.ladder} strokeWidth={0.9} className={thin} />
      <path d={P.rails} className={solid("fill-ink")} />
      <path
        d={P.bogies}
        strokeWidth={1.2}
        className={`${solid("fill-ink")} ${line}`}
      />
      <path
        d={P.wheels}
        strokeWidth={1}
        className={`${fill("fill-graphite")} ${line}`}
      />
      <path d={P.bollards} className={solid("fill-ink")} />

      {/* the ship (one group: it floats) */}
      <g ref={refs.ship}>
        <path
          d={P.hull}
          strokeWidth={1.4}
          className={`${solid("fill-ink")} ${line}`}
        />
        {ink ? (
          <g clipPath={`url(#${hullClip})`}>
            <path d={P.bootTop} className="fill-tangerine" />
          </g>
        ) : null}
        <path
          d={P.sheer}
          strokeWidth={1.6}
          className={ink ? "stroke-paper" : "stroke-paper"}
        />
        <path
          d={P.anchor}
          strokeWidth={1.2}
          className={ink ? "stroke-paper" : "stroke-paper"}
        />
        <path
          d={P.plimsoll}
          strokeWidth={1.1}
          className={ink ? "stroke-paper" : "stroke-paper"}
        />
        <path
          d={P.drafts}
          strokeWidth={1.1}
          className={ink ? "stroke-paper" : "stroke-paper"}
        />
        {L.hullName ? (
          <text
            x={L.hullName.x}
            y={L.hullName.y}
            className="type-micro fill-paper"
            style={{
              fontSize: L.hullName.size,
              letterSpacing: "0.16em",
              fontWeight: 600,
            }}
          >
            MV SHIPPED
          </text>
        ) : null}
        <path d={P.fcRail} strokeWidth={1} className={line} />
        <path d={P.foremast} strokeWidth={1.2} className={line} />
        <path
          d={P.hatch}
          strokeWidth={1}
          className={`${solid("fill-graphite")} ${line}`}
        />
        <path
          d={P.hatchRibs}
          strokeWidth={0.8}
          className={ink ? "stroke-ink" : "stroke-pencil"}
        />
        <path d={P.ramp} strokeWidth={1.2} className={line} />
        <path
          d={P.lifeboat}
          strokeWidth={1.2}
          className={`${fill("fill-tangerine")} ${line}`}
        />
        <path
          d={P.funnel}
          strokeWidth={1.3}
          className={`${solid("fill-ink")} ${line}`}
        />
        {ink ? <path d={P.funnelBand} className="fill-tangerine" /> : null}
        {ink ? <path d={P.funnelDisc} className="fill-lime" /> : null}
        <path
          d={P.block}
          strokeWidth={1.4}
          className={`${fill("fill-card")} ${line}`}
        />
        <path d={P.blockDecks} strokeWidth={0.9} className={thin} />
        <path d={P.blockWindows} className={solid("fill-ink")} />
        <path
          d={P.wings}
          strokeWidth={1.2}
          className={`${fill("fill-card")} ${line}`}
        />
        <path
          d={P.bridge}
          strokeWidth={1.4}
          className={`${fill("fill-card")} ${line}`}
        />
        <path d={P.bridgeBand} className={solid("fill-ink")} />
        <path
          d={P.bridgeMullions}
          strokeWidth={1}
          className={ink ? "stroke-paper" : "stroke-paper"}
        />
        <path d={P.mast} strokeWidth={1.2} className={line} />
        <g ref={refs.puff}>
          {[0, 1, 2].map((k) => (
            <circle
              key={k}
              cx={r1(L.funnelTop[0] + k * 3)}
              cy={r1(L.funnelTop[1] - 4)}
              r={Math.max(2.5, 0.09 * cw)}
              className={ink ? "fill-paper-2 stroke-graphite" : "stroke-pencil"}
              strokeWidth={1}
              opacity={0}
            />
          ))}
        </g>
      </g>

      {/* the water, over the hull's lower part; it rolls all the while */}
      {ink ? (
        <>
          <path
            ref={refs.sea}
            strokeWidth={1.4}
            className="fill-blue-soft stroke-blue"
          />
          <path
            ref={refs.swellA}
            strokeWidth={1}
            className="stroke-blue"
            opacity={0.45}
          />
          <path
            ref={refs.swellB}
            strokeWidth={1}
            className="stroke-blue"
            opacity={0.3}
          />
        </>
      ) : (
        <path ref={refs.sea} strokeWidth={1.3} className="stroke-graphite" />
      )}
      <path d={P.fenders} className={solid("fill-ink")} />
      <path
        ref={refs.moor}
        d={P.moorings}
        strokeWidth={1.2}
        className={ink ? "stroke-graphite" : "stroke-pencil"}
      />

      {/* the containers */}
      {boxes.map((b, i) => (
        <g
          key={b.id}
          ref={(el) => {
            refs.boxEls.current[i] = el;
          }}
          data-box={b.no}
          data-cursor="lime"
          data-cursor-label="Open"
          className="cursor-pointer"
          onClick={() => onPick(i)}
        >
          <g className="transition-transform duration-(--dur-ui) ease-arrive fine:hover:-translate-y-[3px] reduced:transition-none">
            <path
              d={rect(0, 0, cw, ch)}
              strokeWidth={1.3}
              className={`${ink ? FILL[b.tone] : "fill-paper"} ${line}`}
            />
            <path
              d={ridges}
              strokeWidth={1}
              className={
                ink
                  ? b.dark
                    ? "stroke-ash"
                    : "stroke-line-strong"
                  : "stroke-pencil"
              }
            />
            <path
              d={castings}
              className={
                ink ? (b.dark ? "fill-fog" : "fill-ink") : "fill-graphite"
              }
            />
            {b.live && ink ? (
              <path
                d={rect(cw - cs - 0.1 * cw, ch * 0.3, 0.07 * cw, ch * 0.4)}
                className="fill-tangerine"
              />
            ) : null}
            {L.numbers ? (
              <text
                x={r1(cs + 2.5)}
                y={r1(cs + numFs * 0.95)}
                className={`type-micro ${ink && b.dark ? "fill-paper" : "fill-ink"}`}
                style={{ fontSize: numFs }}
              >
                {b.no}
              </text>
            ) : null}
            {L.names
              ? b.lines.map((t, k) => (
                  <text
                    key={k}
                    x={r1(cw / 2)}
                    y={r1(
                      ch / 2 +
                        fs * 0.36 +
                        (k - (b.lines.length - 1) / 2) * fs * 1.05 +
                        (b.lines.length === 1 ? ch * 0.08 : ch * 0.06),
                    )}
                    textAnchor="middle"
                    className={`type-micro ${ink && b.dark ? "fill-paper" : "fill-ink"}`}
                    style={{
                      fontSize: fs,
                      letterSpacing: "0.06em",
                      fontWeight: 600,
                    }}
                  >
                    {t}
                  </text>
                ))
              : null}
            {i === selected ? (
              <path
                d={rect(-2.5, -2.5, cw + 5, ch + 5)}
                strokeWidth={2.6}
                className={ink ? "stroke-lime" : "stroke-ink"}
              />
            ) : null}
          </g>
        </g>
      ))}

      {/* the trolley with the operator's cab, the hoist ropes, the headblock and the spreader */}
      <g ref={refs.trolley}>
        <path
          d={rect(-0.34 * cw, tb - 1, 0.68 * cw, tH)}
          strokeWidth={1.3}
          className={`${solid("fill-ink")} ${line}`}
        />
        {ink ? (
          <path
            d={rect(
              -0.34 * cw,
              tb + tH * 0.62,
              0.68 * cw,
              Math.max(1.5, tH * 0.16),
            )}
            className="fill-lime"
          />
        ) : null}
        <path
          d={rect(cabX, cabY, cabW, cabH)}
          strokeWidth={1.2}
          className={`${fill("fill-card")} ${line}`}
        />
        <path
          d={rect(
            cabX + cabW * 0.14,
            cabY + cabH * 0.3,
            cabW * 0.72,
            cabH * 0.56,
          )}
          className={fill("fill-blue-soft")}
          strokeWidth={0.8}
        />
        <path
          d={
            `M${r1(cabX + cabW * 0.5 - opR)} ${r1(cabY + cabH * 0.55)}a${r1(opR)} ${r1(opR)} 0 1 0 ${r1(2 * opR)} 0a${r1(opR)} ${r1(opR)} 0 1 0 ${r1(-2 * opR)} 0Z` +
            `M${r1(cabX + cabW * 0.5 - opR * 2)} ${r1(cabY + cabH * 0.86)}Q${r1(cabX + cabW * 0.5)} ${r1(cabY + cabH * 0.55)} ${r1(cabX + cabW * 0.5 + opR * 2)} ${r1(cabY + cabH * 0.86)}Z`
          }
          className={solid("fill-ink")}
        />
      </g>
      <path ref={refs.ropes} strokeWidth={0.9} className={line} />
      <g ref={refs.spreader}>
        <path
          d={rect(-0.15 * cw, -L.spreaderH - L.headH, 0.3 * cw, L.headH)}
          strokeWidth={1.1}
          className={`${solid("fill-ink")} ${line}`}
        />
        <path
          d={rect(-0.53 * cw, -L.spreaderH, 1.06 * cw, L.spreaderH)}
          strokeWidth={1.2}
          className={`${fill("fill-graphite")} ${line}`}
        />
        <path
          d={
            rect(
              -0.53 * cw,
              -L.spreaderH,
              Math.max(3, 0.08 * cw),
              L.spreaderH,
            ) +
            rect(
              0.53 * cw - Math.max(3, 0.08 * cw),
              -L.spreaderH,
              Math.max(3, 0.08 * cw),
              L.spreaderH,
            )
          }
          className={fill("fill-lime")}
        />
        <path
          d={`M${r1(-0.53 * cw)} 0l${r1(-0.03 * cw)} ${r1(Math.max(3, 0.12 * ch))}M${r1(0.53 * cw)} 0l${r1(0.03 * cw)} ${r1(Math.max(3, 0.12 * ch))}`}
          strokeWidth={1.4}
          className={line}
        />
      </g>
    </svg>
  );
}

export { COUNT };
