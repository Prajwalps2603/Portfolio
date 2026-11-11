"use client";

/**
 * The award's medal (05 Experience, the 1st-place card): a medal on a lime-striped ribbon, hung
 * in the card's panel. Decoration: aria-hidden (the card says "1st Place").
 *
 * THE MOMENT: when the panel's top reaches 80% of the screen the medal is let go from the side
 * and swings on its ribbon to rest (a damped pendulum about the ribbon's top, ~2s), then a glint
 * crosses the disc and a few shine strokes draw beside it. Hover (fine pointers) nudges it; a
 * click or a tap swings it again. Reduced motion: hanging still. Sketch mode: the pencil drawing.
 * The markup is the medal at rest (no JS: it simply hangs there).
 */
import { useId, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { useReducedMotion } from "@/lib/motion/media";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { roughCircle, roughPolyline, type Point } from "@/components/sketch/rough";

const W = 240;
const H = 184;
/** The ribbon's top (it runs off the panel's top edge): the pendulum's pivot. */
const PIVOT: Point = [120, -8];
/** The disc. */
const C: Point = [120, 132];
const RIM = 40; // the rosette (scalloped rim), +6 at its bumps
const DISC = 31;

const f = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Point) => `${f(p[0])} ${f(p[1])}`;
const polar = (r: number, deg: number): Point => [C[0] + Math.cos((deg * Math.PI) / 180) * r, C[1] + Math.sin((deg * Math.PI) / 180) * r];

/** A scalloped rosette: n bumps bulging `bump` past radius r. */
function rosette(r: number, n: number, bump: number): string {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const p = polar(r, (i / n) * 360 - 90);
    if (i === 0) {
      d += `M${pt(p)}`;
      continue;
    }
    d += `Q${pt(polar(r + bump * 2, ((i - 0.5) / n) * 360 - 90))} ${pt(p)}`;
  }
  return `${d}Z`;
}

const circle = (c: Point, r: number) => `M${f(c[0] - r)} ${f(c[1])}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

// the two straps of the ribbon meet at the ring, crossing into a V
const STRAP_L: Point[] = [[86, -10], [109, -10], [127, 86], [112, 86]];
const STRAP_R: Point[] = [[131, -10], [154, -10], [128, 86], [113, 86]];
const mid = (q: Point[]): [Point, Point] => [
  [(q[0][0] + q[1][0]) / 2, q[0][1]],
  [(q[2][0] + q[3][0]) / 2, q[2][1] - 2],
];
const RING: Point = [120, C[1] - RIM - 6];
const RIM_D = rosette(RIM, 18, 3.2);
/** Shine strokes either side of the medal, short rays at rest. */
const SHINE = [196, 180, 164, -16, 0, 16].map((deg) => `M${pt(polar(54, deg))}L${pt(polar(deg % 180 === 0 ? 68 : 63, deg))}`);

export function Medal() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const clip = `medal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const still = reduced || sketch;
  const rested = useRef(false);

  const { contextSafe } = useGSAP(
    () => {
      const box = host.current;
      if (!box || still) return;
      const medal = box.querySelector<SVGGElement>("[data-medal]");
      const glint = box.querySelector<SVGElement>("[data-glint]");
      const shine = Array.from(box.querySelectorAll<SVGElement>("[data-shine]"));
      if (!medal || !glint) return;
      gsap.set(medal, { svgOrigin: pt(PIVOT), smoothOrigin: false });
      const r = box.getBoundingClientRect();
      if (r.bottom < 0) {
        rested.current = true;
        return;
      }
      // hidden from JS only: the medal is not hung yet, its shine undrawn
      gsap.set(medal, { opacity: 0, rotation: -34 });
      gsap.set(shine, { strokeDasharray: 1, strokeDashoffset: 1 });
      const hang = () => {
        const tl = gsap.timeline({ onComplete: () => void (rested.current = true) });
        tl.to(medal, { opacity: 1, duration: 0.18, ease: EASE.arrive }, 0);
        swingFrom(tl, medal, -34, 0);
        const end = tl.duration();
        tl.fromTo(glint, { opacity: 0.9, x: -44, y: -44 }, { x: 44, y: 44, duration: 0.6, ease: EASE.pen }, end - 0.55);
        tl.set(glint, { opacity: 0 }, ">");
        tl.to(shine, { strokeDashoffset: 0, duration: 0.3, ease: EASE.pen, stagger: 0.05 }, end - 0.3);
      };
      if (r.top < window.innerHeight * 0.8) hang();
      else ScrollTrigger.create({ trigger: box, start: () => safeStart(box, "top 80%"), once: true, onEnter: hang });
    },
    { scope: host, dependencies: [still], revertOnUpdate: true },
  );

  /** Swing it again (hover: a nudge; click or tap: a push). */
  const push = contextSafe((amount: number) => {
    const medal = host.current?.querySelector<SVGGElement>("[data-medal]");
    if (!medal || still || !rested.current) return;
    gsap.killTweensOf(medal, "rotation");
    swingFrom(gsap.timeline(), medal, amount, 0);
  });

  return (
    <div
      ref={host}
      className="absolute inset-0"
      onPointerEnter={(e) => e.pointerType === "mouse" && push(9)}
      onClick={() => push(-20)}
      data-cursor={still ? undefined : "lime"}
      data-cursor-label={still ? undefined : "Swing it"}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <clipPath id={clip}>
            <circle cx={C[0]} cy={C[1]} r={DISC} />
          </clipPath>
        </defs>
        {/* shine strokes, at rest beside the medal */}
        {SHINE.map((d, i) => (
          <path key={i} data-shine="" d={d} pathLength={1} strokeWidth={1.8} className={sketch ? "stroke-graphite" : "stroke-ink"} />
        ))}
        <g data-medal="">
          {sketch ? (
            <>
              <path d={roughPolyline(STRAP_R, { seed: "medal-r", close: true, roughness: 0.8 })} strokeWidth={1.3} className="stroke-graphite" />
              <path d={roughPolyline(STRAP_L, { seed: "medal-l", close: true, roughness: 0.8 })} strokeWidth={1.3} className="stroke-graphite" />
              <path d={roughCircle(RING[0], RING[1], 5.5, { seed: "medal-ring" })} strokeWidth={1.3} className="stroke-graphite" />
              <path d={roughCircle(C[0], C[1], RIM + 3, { seed: "medal-rim" })} strokeWidth={1.3} className="stroke-graphite" />
              <path d={roughCircle(C[0], C[1], DISC, { seed: "medal-disc" })} strokeWidth={1.3} className="stroke-graphite" />
            </>
          ) : (
            <>
              {[STRAP_R, STRAP_L].map((q, i) => (
                <g key={i}>
                  <path d={`M${q.map(pt).join("L")}Z`} strokeWidth={1.6} className="fill-card stroke-ink" />
                  <path d={`M${pt(mid(q)[0])}L${pt(mid(q)[1])}`} strokeWidth={6} strokeLinecap="butt" className="stroke-lime" />
                </g>
              ))}
              <circle cx={RING[0]} cy={RING[1]} r={5.5} strokeWidth={2} className="stroke-ink" />
              <path d={RIM_D} strokeWidth={1.6} className="fill-card stroke-ink" />
              <circle cx={C[0]} cy={C[1]} r={DISC} strokeWidth={2} className="fill-lime stroke-ink" />
              <circle cx={C[0]} cy={C[1]} r={DISC - 6} strokeWidth={1} className="stroke-ink" opacity={0.55} />
              <g clipPath={`url(#${clip})`}>
                <path data-glint="" d={`M${pt([C[0] - 34, C[1] + 34])}L${pt([C[0] + 34, C[1] - 34])}`} strokeWidth={7} className="stroke-card" opacity={0} />
              </g>
            </>
          )}
          <text x={C[0]} y={C[1] + 9} textAnchor="middle" className={`font-display ${sketch ? "fill-graphite" : "fill-ink"}`} style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.03em" }}>
            1<tspan style={{ fontSize: 15 }} dy={-9}>
              st
            </tspan>
          </text>
        </g>
      </svg>
    </div>
  );
}

/** A damped pendulum from `from` degrees: equal half-swings, the amplitude halving each time. */
function swingFrom(tl: gsap.core.Timeline, el: Element, from: number, at: number) {
  const half = 0.42;
  let a = from;
  tl.set(el, { rotation: from }, at);
  let t = at;
  while (Math.abs(a) > 1.2) {
    a = -a * 0.5;
    tl.to(el, { rotation: a, duration: half, ease: EASE.pen }, t);
    t += half;
  }
  tl.to(el, { rotation: 0, duration: half * 0.8, ease: EASE.pen }, t);
}
