"use client";

/**
 * THE SUBMARINE (inside the iceberg's SVG, under the rows): a small research sub cruising the gap
 * between the Data and AI rows, nose toward the ice. It moves with the scroll (no clock, no loop):
 * it comes in from the right edge as that gap rises into view and has crossed most of the rows by
 * the time the gap leaves the top; it bobs a little, its propeller turns, it trails bubbles. As it
 * comes into view its lights come on (portholes and a headlamp beam) with one quick flicker, and
 * they go off again if you scroll back above it.
 * Reduced motion: parked in its lane, lights on. Sketch mode: parked, drawn in pencil.
 */
import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import type { IcebergDrawing } from "./iceberg";

type Lane = IcebergDrawing["sub"];

const SVG = "http://www.w3.org/2000/svg";
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The hull's outline, nose to the left (local units; the lane's scale sizes it). */
const HULL = "M-60 -21C-75 -21 -82 -11 -82 0C-82 12 -74 21 -60 21L52 15C62 14 68 8 68 0C68 -8 62 -14 52 -15Z";
const SAIL = "M-22 -19L-17 -38Q-16 -41 -12 -41L9 -41Q13 -41 13 -37L15 -19Z";
const FINS = "M50 -14L63 -26L69 -25L62 -9ZM50 14L63 26L69 25L62 9Z";
const PORTS = [-38, -15, 8];

export function Submarine({ lane, rootRef, still, sketch }: { lane: Lane; rootRef: RefObject<HTMLDivElement | null>; still: boolean; sketch: boolean }) {
  const body = useRef<SVGGElement>(null);
  const blades = useRef<SVGEllipseElement>(null);
  const lights = useRef<SVGGElement>(null);
  const fx = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    let lit: boolean | null = null;
    let lastTop = Number.NaN;
    let travel = 0;
    let flicker: gsap.core.Timeline | null = null;

    const setLights = (on: boolean, animate: boolean) => {
      const el = lights.current;
      if (!el) return;
      flicker?.kill();
      if (!animate) {
        gsap.set(el, { opacity: on ? 1 : 0 });
        return;
      }
      // switched on: one quick flicker (two dips), then steady; switched off: a short fade
      flicker = on
        ? gsap.timeline().set(el, { opacity: 1 }, 0).set(el, { opacity: 0.12 }, 0.08).set(el, { opacity: 1 }, 0.16).set(el, { opacity: 0.35 }, 0.24).to(el, { opacity: 1, duration: 0.2, ease: EASE.arrive }, 0.3)
        : gsap.timeline().to(el, { opacity: 0, duration: 0.25, ease: EASE.exit });
    };

    const bubble = (x: number, y: number) => {
      const layer = fx.current;
      if (!layer || layer.childElementCount > 14) return;
      const c = document.createElementNS(SVG, "circle");
      c.setAttribute("cx", String(x));
      c.setAttribute("cy", String(y));
      c.setAttribute("r", String((1.2 + Math.random() * 1.8) * lane.s * 1.4));
      c.setAttribute("class", "fill-none stroke-fog");
      c.setAttribute("stroke-width", "1");
      layer.appendChild(c);
      const d = 1.2 + Math.random() * 0.8;
      gsap.to(c, { attr: { cy: y - 40 - Math.random() * 40 }, duration: d, ease: EASE.none, onComplete: () => c.remove() });
      gsap.to(c, { attr: { cx: x + 10 + Math.random() * 18 }, duration: d, ease: EASE.arrive });
      gsap.to(c, { opacity: 0, duration: 0.4, delay: d - 0.4, ease: EASE.exit });
    };

    const frame = () => {
      raf = 0;
      const vh = window.innerHeight;
      const top = root.getBoundingClientRect().top;
      const vy = top + lane.y; // the lane in the viewport
      const p = still ? 0.55 : clamp(1 - vy / vh);
      const x = lerp(lane.xFrom, lane.xTo, p);
      const bob = still ? 0 : Math.sin(p * 11) * 4 * lane.s;
      const tilt = still ? 0 : Math.cos(p * 11) * 1.4;
      body.current?.setAttribute("transform", `translate(${x.toFixed(1)} ${(lane.y + bob).toFixed(1)}) rotate(${tilt.toFixed(2)}) scale(${lane.s})`);
      if (!still) blades.current?.setAttribute("ry", (2 + 9 * Math.abs(Math.sin(window.scrollY * 0.05))).toFixed(1));
      const on = still || vy < vh * 0.86;
      if (on !== lit) {
        setLights(on, !still && lit !== null);
        lit = on;
      }
      if (!still && !Number.isNaN(lastTop)) {
        travel += Math.abs(top - lastTop);
        if (travel > 40 && vy > -40 && vy < vh + 40) {
          travel = 0;
          bubble(x + 72 * lane.s, lane.y + bob);
        }
      }
      lastTop = top;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frame();
    if (still) return () => cancelAnimationFrame(raf);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
      flicker?.kill();
      fx.current?.replaceChildren();
    };
  }, [lane, rootRef, still]);

  const line = sketch ? "fill-none stroke-graphite" : "stroke-ink";
  return (
    <>
      <g ref={body} data-qa="stack-sub" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
        {/* the lit parts sit in their own group: off, they show the dark portholes underneath */}
        <path d={SAIL} className={sketch ? line : `fill-card ${line}`} />
        <path d="M5 -41V-54H-3" fill="none" className={sketch ? line : "stroke-fog"} strokeWidth={2.2} />
        <path d={HULL} className={sketch ? line : `fill-card ${line}`} />
        <path d="M-70 -7H50" fill="none" className={sketch ? "stroke-pencil" : "stroke-line-strong"} strokeWidth={1} />
        <path d={FINS} className={sketch ? line : `fill-fog ${line}`} />
        <circle cx={72} cy={0} r={3.2} className={sketch ? line : `fill-fog ${line}`} />
        <ellipse ref={blades} cx={75} cy={0} rx={2.6} ry={9} className={sketch ? line : `fill-fog ${line}`} />
        {PORTS.map((px) => (
          <circle key={px} cx={px} cy={-2} r={5.6} className={sketch ? line : `fill-ink-2 ${line}`} />
        ))}
        {sketch ? null : (
          <g ref={lights}>
            <path d="M-77 7L-310 -20L-310 46Z" className="fill-lime" opacity={0.14} />
            {PORTS.map((px) => (
              <circle key={px} cx={px} cy={-2} r={5.6} className="fill-lime stroke-ink" />
            ))}
            <circle cx={-77} cy={7} r={3.4} className="fill-lime stroke-ink" strokeWidth={1.2} />
          </g>
        )}
      </g>
      <g ref={fx} />
    </>
  );
}
