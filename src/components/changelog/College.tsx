"use client";

/**
 * The college (05 Experience, the init card: Bachelor of Engineering, KVG College of Engineering,
 * 2021 — 2025). Decoration: aria-hidden; the card carries the degree, the college and the grade.
 *
 * THE MOMENT: when the panel's top reaches 80% of the screen, the college front draws itself in
 * pencil and is inked (steps, columns, pediment, the door), the four years run along the line
 * under it (2021 to 2025, lime as they pass), and at 2025 a graduation cap is tossed up into the
 * air, leaving a dotted flight path (~3.5s, once). A click or a tap tosses it again. Reduced
 * motion: the finished picture, the cap in the air. Sketch mode: the pencil drawing. The markup
 * is the finished picture.
 */
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { useReducedMotion } from "@/lib/motion/media";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { roughPolyline, roughRect, type Point } from "@/components/sketch/rough";

const W = 280;
const H = 168;
const f = (n: number) => Math.round(n * 10) / 10;
const rect = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;

// ---- the college front ---------------------------------------------------------------------------
type Part = { d: string; pencil: string; fill: string };
const part = (x: number, y: number, w: number, h: number, fill: string, seed: string): Part => ({
  d: rect(x, y, w, h),
  pencil: roughRect(x, y, w, h, { seed: `college-${seed}`, roughness: 0.7, passes: 1 }),
  fill,
});

const STEPS = [part(62, 132, 156, 6, "fill-paper-2", "s1"), part(68, 126, 144, 6, "fill-paper-2", "s2"), part(74, 120, 132, 6, "fill-paper-2", "s3")];
const COLS = [86, 107.6, 129.2, 150.8, 172.4, 194];
const SHAFTS = COLS.map((c, i) => part(c - 4, 71, 8, 49, "fill-card", `c${i}`));
const CAPITALS = COLS.map((c) => rect(c - 6, 68, 12, 3) + rect(c - 6, 118, 12, 2)).join("");
const BAND = part(70, 58, 140, 10, "fill-card", "band");
const ROOF: Point[] = [[66, 58], [140, 29], [214, 58]];
const ROOF_D = `M66 58L140 29L214 58Z`;
const TYMPANUM = `M86 54L140 36L194 54Z`;
const DOOR = `M133.5 120V104a6.5 6.5 0 0 1 13 0V120Z`;

// ---- the four years ------------------------------------------------------------------------------
const LINE_Y = 151;
const X0 = 34;
const X1 = 246;
const YEARS = [0, 1, 2, 3, 4].map((i) => X0 + ((X1 - X0) * i) / 4);

// ---- the cap: tossed up from 2025, beside the college, frozen high in the air --------------------
const FROM: Point = [X1, LINE_Y - 8];
const CTRL: Point = [262, 66];
const TO: Point = [233, 32];
const TILT = -14;
const flight = (t: number): Point => {
  const u = 1 - t;
  return [u * u * FROM[0] + 2 * u * t * CTRL[0] + t * t * TO[0], u * u * FROM[1] + 2 * u * t * CTRL[1] + t * t * TO[1]];
};
const capAt = (t: number, spin: number) => {
  const [x, y] = flight(t);
  return `translate(${f(x)} ${f(y)}) rotate(${f(spin)}) scale(${f(0.5 + 0.5 * t)})`;
};
const CAP_REST = `translate(${TO[0]} ${TO[1]}) rotate(${TILT})`;
/** The flight path, dotted, between the 2025 mark and the cap (t of each dot). */
const TRAIL = [0.16, 0.26, 0.36, 0.46, 0.56, 0.66, 0.76].map((t) => ({ t, p: flight(t) }));
const SPARKS = [-58, -90, -122].map((deg) => {
  const a = (deg * Math.PI) / 180;
  const p = (r: number) => `${f(TO[0] + Math.cos(a) * r)} ${f(TO[1] - 2 + Math.sin(a) * r)}`;
  return `M${p(19)}L${p(25)}`;
});

export function College() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const still = reduced || sketch;
  const rested = useRef(false);

  const { contextSafe } = useGSAP(
    () => {
      const box = host.current;
      if (!box || still) return;
      const r = box.getBoundingClientRect();
      if (r.bottom < 0) {
        rested.current = true;
        return;
      }
      const all = (sel: string) => Array.from(box.querySelectorAll<SVGElement>(sel));
      const pencil = all("[data-pencil]");
      const ink = all("[data-ink]");
      // hidden from JS only
      gsap.set([...pencil, ...ink, ...all("[data-progress]"), ...all("[data-trail]")], { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(pencil, { opacity: 1 });
      gsap.set([...all("[data-fill]"), ...all("[data-fade]"), ...all("[data-tick]"), ...all("[data-head]"), ...all("[data-cap]"), ...all("[data-dot]")], { opacity: 0 });

      const play = () => {
        const tl = gsap.timeline({ onComplete: () => void (rested.current = true) });
        tl.to(pencil, { strokeDashoffset: 0, duration: 0.5, ease: EASE.pen, stagger: 0.035 }, 0);
        tl.to(ink, { strokeDashoffset: 0, duration: 0.45, ease: EASE.pen, stagger: 0.025 }, 0.45);
        tl.to(pencil, { opacity: 0, duration: 0.4, ease: EASE.arrive }, 0.8);
        tl.to(all("[data-fill]"), { opacity: 1, duration: 0.35, ease: EASE.arrive }, 0.7);
        tl.to(all("[data-fade]"), { opacity: 1, duration: 0.3, ease: EASE.arrive }, 0.85);
        // the four years: a lime line runs 2021 -> 2025, each year ticks as it passes
        const years = 1.25;
        const head = all("[data-head]");
        const go = { x: X0 };
        tl.set(head, { opacity: 1 }, 1.1);
        tl.to(all("[data-progress]"), { strokeDashoffset: 0, duration: years, ease: EASE.none }, 1.1);
        tl.to(go, { x: X1, duration: years, ease: EASE.none, onUpdate: () => head.forEach((h) => h.setAttribute("cx", String(f(go.x)))) }, 1.1);
        all("[data-tick]").forEach((tick, i) => tl.fromTo(tick, { opacity: 0, scaleY: 0.2, transformOrigin: "50% 50%" }, { opacity: 1, scaleY: 1, duration: 0.2, ease: EASE.arrive }, 1.1 + (years * i) / 4));
        toss(tl, 1.1 + years + 0.05);
      };
      if (r.top < window.innerHeight * 0.8) play();
      else ScrollTrigger.create({ trigger: box, start: () => safeStart(box, "top 80%"), once: true, onEnter: play });
    },
    { scope: host, dependencies: [still], revertOnUpdate: true },
  );

  /** The cap flies from the door to the top of its flight, spinning; its trail and sparks draw. */
  function toss(tl: gsap.core.Timeline, at: number) {
    const box = host.current;
    if (!box) return;
    const cap = box.querySelector<SVGGElement>("[data-cap]");
    const trail = Array.from(box.querySelectorAll<SVGElement>("[data-trail]"));
    const dots = Array.from(box.querySelectorAll<SVGElement>("[data-dot]"));
    if (!cap) return;
    const dur = 0.8;
    const fly = { t: 0 };
    const put = () => cap.setAttribute("transform", capAt(fly.t, TILT - 540 * (1 - fly.t)));
    tl.set(trail, { strokeDasharray: 1, strokeDashoffset: 1 }, at);
    tl.set(dots, { opacity: 0 }, at);
    tl.set(cap, { opacity: 1 }, at);
    // the flight eases out (fast off the line, slow at the top); each dot lands as the cap passes it
    tl.fromTo(fly, { t: 0 }, { t: 1, duration: dur, ease: EASE.arrive, onStart: put, onUpdate: put, onComplete: () => cap.setAttribute("transform", CAP_REST) }, at);
    const arrive = gsap.parseEase(EASE.arrive);
    TRAIL.forEach(({ t }, i) => {
      // the time at which the eased flight reaches t (invert the ease numerically)
      let lo = 0;
      let hi = 1;
      for (let k = 0; k < 18; k++) {
        const m = (lo + hi) / 2;
        if (arrive(m) < t) lo = m;
        else hi = m;
      }
      tl.to(dots[i], { opacity: 1, duration: 0.12, ease: EASE.arrive }, at + lo * dur);
    });
    tl.to(trail, { strokeDashoffset: 0, duration: 0.28, ease: EASE.pen, stagger: 0.04 }, at + dur - 0.2);
  }

  const again = contextSafe(() => {
    if (still || !rested.current) return;
    rested.current = false;
    const tl = gsap.timeline({ onComplete: () => void (rested.current = true) });
    toss(tl, 0);
  });

  const ink = !sketch;
  return (
    <div ref={host} className="absolute inset-0" onClick={again} data-cursor={still ? undefined : "lime"} data-cursor-label={still ? undefined : "Toss the cap"}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-full overflow-visible">
        {/* the college front: fills, pencil, then ink */}
        {ink ? (
          <g data-fill="">
            {STEPS.map((p, i) => <path key={`sf${i}`} d={p.d} className={p.fill} />)}
            <path d={ROOF_D} className="fill-card" />
            <path d={BAND.d} className={BAND.fill} />
            {SHAFTS.map((p, i) => <path key={`cf${i}`} d={p.d} className={p.fill} />)}
            <path d={CAPITALS} className="fill-card" />
            <path d={DOOR} className="fill-ink" />
          </g>
        ) : null}
        <g className="stroke-graphite" strokeWidth={1.2} opacity={sketch ? 1 : undefined}>
          {[...STEPS, BAND, ...SHAFTS].map((p, i) => (
            <path key={`p${i}`} data-pencil="" d={p.pencil} pathLength={1} opacity={sketch ? 1 : 0} />
          ))}
          <path data-pencil="" d={roughPolyline(ROOF, { seed: "college-roof", close: true, roughness: 0.7 })} pathLength={1} opacity={sketch ? 1 : 0} />
          {sketch ? <path d={DOOR} /> : null}
        </g>
        {ink ? (
          <g className="stroke-ink" strokeWidth={1.4}>
            {[...STEPS, BAND, ...SHAFTS].map((p, i) => (
              <path key={`i${i}`} data-ink="" d={p.d} pathLength={1} />
            ))}
            <path data-ink="" d={ROOF_D} pathLength={1} />
            <path data-fade="" d={TYMPANUM} strokeWidth={1} />
            <path data-fade="" d={CAPITALS} strokeWidth={1.1} />
            <circle data-fade="" cx={140} cy={47} r={4.2} strokeWidth={1.2} className="fill-lime" />
          </g>
        ) : null}

        {/* the four years */}
        <path data-fade="" d={`M${X0} ${LINE_Y}H${X1}`} strokeWidth={1.4} className={ink ? "stroke-line-strong" : "stroke-graphite"} />
        {ink ? <path data-progress="" d={`M${X0} ${LINE_Y}H${X1}`} pathLength={1} strokeWidth={3} className="stroke-lime" /> : null}
        {YEARS.map((x, i) => (
          <path key={`t${i}`} data-tick="" d={`M${f(x)} ${LINE_Y - 4}v8`} strokeWidth={1.4} className={ink ? "stroke-ink" : "stroke-graphite"} />
        ))}
        {ink ? <circle data-head="" cx={X1} cy={LINE_Y} r={4.2} strokeWidth={1.4} className="fill-lime stroke-ink" /> : null}
        <text data-fade="" x={X0} y={H - 2} textAnchor="middle" className="type-micro fill-graphite" style={{ fontSize: 13 }}>
          2021
        </text>
        <text data-fade="" x={X1} y={H - 2} textAnchor="middle" className={`type-micro ${ink ? "fill-ink" : "fill-graphite"}`} style={{ fontSize: 13 }}>
          2025
        </text>

        {/* the cap, tossed */}
        {TRAIL.map(({ p }, i) => (
          <circle key={`tr${i}`} data-dot="" cx={f(p[0])} cy={f(p[1])} r={1.5} className={ink ? "fill-graphite" : "fill-pencil"} />
        ))}
        {SPARKS.map((d, i) => (
          <path key={`sp${i}`} data-trail="" d={d} pathLength={1} strokeWidth={1.6} className={ink ? "stroke-ink" : "stroke-graphite"} />
        ))}
        <g data-cap="" transform={CAP_REST}>
          <path d="M-12 3V12Q0 17.5 12 12V3Z" strokeWidth={1.2} className={ink ? "fill-ink stroke-ink" : "stroke-graphite"} />
          <path d="M-23 0L0 -8.5L23 0L0 8.5Z" strokeWidth={1.2} className={ink ? "fill-ink stroke-ink" : "stroke-graphite"} />
          <path d="M0 0L17 2.5V13" strokeWidth={1.5} className={ink ? "stroke-lime" : "stroke-graphite"} />
          <path d="M15 13h4v6.5h-4Z" strokeWidth={1} className={ink ? "fill-lime stroke-ink" : "stroke-graphite"} />
          <circle cx={0} cy={0} r={1.8} className={ink ? "fill-lime" : "fill-graphite"} />
        </g>
      </svg>
    </div>
  );
}
