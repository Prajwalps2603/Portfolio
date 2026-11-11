"use client";

/**
 * THE FIRST DESIGN of "The road so far", mounted again at Prajwal's request ("i need first design",
 * 2026-11-07, after the road trip in ./RoadTrip.tsx, which is kept, not mounted).
 *
 * "The road so far" (About): his route (src/content/profile.ts) on a hand-drawn map
 * (./roadArt.ts), with the schooling, the degree and the work it led to as numbered bus tickets
 * under it (the facts; the map is decoration, aria-hidden).
 *
 * THE MOMENT (a clock; no scrolling needed): when the map's top reaches 78% of the screen, a small
 * tangerine bus sets off from Koppa (ticket 1 is punched), winds down the Ghats to Sullia (the road
 * inks in behind it; ticket 2 is punched), then climbs across the plateau to Bengaluru, where it
 * parks and the pin rings once (ticket 3). About 4.3s, once; under 5s, so no pause control. A
 * click on the map drives it again (the cursor says so). Reduced motion: parked at Bengaluru, the
 * road inked, every ticket punched. Sketch mode: the pencil map, the same.
 */
import { useRef } from "react";
import { certifications, education, profile } from "@/content";
import { LiveDot } from "@/components/ui";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { useReducedMotion } from "@/lib/motion/media";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { BUS, LAND, MAP, ROAD, STOPS } from "./roadArt";

const findEdu = (re: RegExp) => education.find((e) => re.test(e.qualification));
const school = findEdu(/sslc|class x/i);
const pu = findEdu(/pre-university/i);
const degree = findEdu(/^(bachelor|master)/i);
const award = certifications.find((c) => c.kind === "Award");
const dash = (s: string) => s.replace(/\s*[—–-]\s*/g, "–");

type Stop = { place: string; years: string; region: string; title: string; where?: string; lines: { text: string; medal?: boolean }[]; now?: boolean };

/** "Bharath Matha High School" + "Bharath Matha PU College" -> "Bharath Matha High School & PU College". */
function both(a?: string, b?: string): string | undefined {
  if (!a || !b) return a ?? b;
  const wa = a.split(" ");
  const wb = b.split(" ");
  let k = 0;
  while (k < wa.length && k < wb.length && wa[k] === wb[k]) k++;
  return k ? `${a} & ${wb.slice(k).join(" ")}` : `${a} & ${b}`;
}

const STOP_FACTS: Stop[] = profile.route.map((r, i) => {
  const lines: Stop["lines"] = [];
  let where: string | undefined;
  if (i === 0) {
    where = both(school?.institution, pu?.institution);
    if (school) lines.push({ text: `${school.qualification} · ${dash(school.period)} · ${school.grade}` });
    if (pu) lines.push({ text: `${pu.qualification} · ${dash(pu.period)} · ${pu.grade}` });
  } else if (i === 1) {
    if (degree) where = `${degree.institution} · ${degree.grade}`;
    if (award) lines.push({ text: award.title, medal: true });
  } else {
    lines.push({ text: profile.currentFocus.join(" · ") });
  }
  return { place: r.place, years: dash(r.years), region: r.region, title: r.chapter, where, lines, now: i === profile.route.length - 1 };
});

/** Where the bus parks at Bengaluru, a little short of the pin (the markup's resting state). */
const PARK = { x: 381, y: 240, angle: -24 };

export function RoadMap() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const still = reduced || sketch;
  const done = useRef(false);

  const parts = () => {
    const box = host.current;
    if (!box) return null;
    const q = <T extends Element>(s: string) => box.querySelector<T>(s);
    return {
      bus: q<SVGGElement>("[data-bus]"),
      legs: [q<SVGPathElement>("[data-leg='1']"), q<SVGPathElement>("[data-leg='2']")] as const,
      trails: [q<SVGPathElement>("[data-trail='1']"), q<SVGPathElement>("[data-trail='2']")] as const,
      pins: Array.from(box.querySelectorAll<SVGElement>("[data-pin]")),
      ring: q<SVGElement>("[data-ring]"),
      punches: Array.from(box.querySelectorAll<HTMLElement>("[data-punch]")),
    };
  };

  /** Put the bus `l` px along leg `leg`, facing the road. */
  const place = (bus: SVGGElement, leg: SVGPathElement, l: number) => {
    const len = leg.getTotalLength();
    const a = leg.getPointAtLength(Math.max(0, Math.min(len, l)));
    const b = leg.getPointAtLength(Math.max(0, Math.min(len, l + 1)));
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    bus.setAttribute("transform", `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
  };

  const drive = (p: NonNullable<ReturnType<typeof parts>>) => {
    const { bus, legs, trails, pins, ring, punches } = p;
    if (!bus || !legs[0] || !legs[1] || !trails[0] || !trails[1]) return;
    const [l1, l2] = [legs[0].getTotalLength(), legs[1].getTotalLength()];
    const tl = gsap.timeline({ onComplete: () => void (done.current = true) });
    const go = { a: 0, b: 0 };
    gsap.set(trails, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(punches, { scale: 0, autoAlpha: 0 });
    gsap.set(pins.slice(1), { scale: 0.4, autoAlpha: 0, transformOrigin: "50% 50%" });
    if (ring) gsap.set(ring, { autoAlpha: 0 });
    place(bus, legs[0], 0);
    tl.fromTo(bus, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: EASE.arrive }, 0.1);
    tl.to(punches[0] ?? {}, { scale: 1, autoAlpha: 1, duration: 0.26, ease: EASE.arrive }, 0.2);
    tl.to(go, {
      a: 1,
      duration: 1.7,
      ease: EASE.pen,
      onUpdate: () => {
        place(bus, legs[0]!, go.a * l1);
        trails[0]!.style.strokeDashoffset = String(1 - go.a);
      },
    }, 0.25);
    tl.to(pins[1] ?? {}, { scale: 1, autoAlpha: 1, duration: 0.3, ease: EASE.arrive }, 1.9);
    tl.to(punches[1] ?? {}, { scale: 1, autoAlpha: 1, duration: 0.26, ease: EASE.arrive }, 1.95);
    tl.to(go, {
      b: 1,
      duration: 1.9,
      ease: EASE.pen,
      onUpdate: () => {
        place(bus, legs[1]!, go.b * (l2 - 14));
        trails[1]!.style.strokeDashoffset = String(1 - go.b);
      },
    }, 2.3);
    tl.to(pins[2] ?? {}, { scale: 1, autoAlpha: 1, duration: 0.3, ease: EASE.arrive }, 4.05);
    tl.to(punches[2] ?? {}, { scale: 1, autoAlpha: 1, duration: 0.26, ease: EASE.arrive }, 4.1);
    if (ring) tl.fromTo(ring, { autoAlpha: 0.9, scale: 0.4, transformOrigin: "50% 50%" }, { autoAlpha: 0, scale: 2.2, duration: 0.9, ease: EASE.arrive }, 4.1);
    return tl;
  };

  const { contextSafe } = useGSAP(
    () => {
      const box = host.current;
      const p = parts();
      if (!box || !p || still) return;
      const r = box.getBoundingClientRect();
      if (r.bottom < 0) {
        done.current = true;
        return;
      }
      // hidden from JS only: the bus waits at Koppa, the road not travelled, no ticket punched
      gsap.set(p.trails, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(p.punches, { scale: 0, autoAlpha: 0 });
      gsap.set(p.pins.slice(1), { scale: 0.4, autoAlpha: 0, transformOrigin: "50% 50%" });
      if (p.bus) gsap.set(p.bus, { autoAlpha: 0 });
      ScrollTrigger.create({ trigger: box, start: () => safeStart(box, "top 78%"), once: true, onEnter: () => drive(p) });
    },
    { scope: host, dependencies: [still], revertOnUpdate: true },
  );

  const again = contextSafe(() => {
    const p = parts();
    if (!p || still || !done.current) return;
    done.current = false;
    drive(p);
  });

  const ink = !sketch;
  const line = ink ? "stroke-ink" : "stroke-graphite";
  return (
    <div ref={host} data-qa="roadmap">
      <h3 id="road-title" className="type-h4">
        The road so far
      </h3>
      <div
        aria-hidden="true"
        onClick={again}
        data-cursor={still ? undefined : "tangerine"}
        data-cursor-label={still ? undefined : "Drive it again"}
        className="paper-dots relative mt-3 overflow-hidden rounded-panel border border-line bg-paper"
      >
        <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="block h-auto w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* the sea and the coast */}
          <path d={LAND.sea} className={ink ? "fill-blue-soft" : "fill-none"} />
          <path d={LAND.coast} strokeWidth={1.6} className={line} />
          <path d={LAND.waves} strokeWidth={1.1} className={ink ? "stroke-blue" : "stroke-pencil"} />
          <path d={LAND.ship} strokeWidth={1} className={`${ink ? "fill-ink" : "fill-none"} ${line}`} />
          <path d={LAND.shipBoxes} strokeWidth={0.8} className={`${ink ? "fill-lime" : "fill-none"} ${line}`} />
          <path d={LAND.shipHouse} strokeWidth={0.8} className={`${ink ? "fill-card" : "fill-none"} ${line}`} />
          <text x={22} y={150} transform="rotate(-90 22 150)" textAnchor="middle" className={`type-micro ${ink ? "fill-blue-deep" : "fill-graphite"}`} style={{ fontSize: 12, letterSpacing: "0.32em" }}>
            ARABIAN SEA
          </text>

          {/* the plateau: fields, villages, rivers */}
          <path d={LAND.fields} strokeWidth={0.9} className="stroke-pencil" />
          <path d={LAND.villages} className={ink ? "fill-graphite" : "fill-pencil"} />
          <path d={LAND.rivers} strokeWidth={2} className={ink ? "stroke-blue" : "stroke-pencil"} opacity={0.75} />

          {/* the Western Ghats */}
          <path d={LAND.trees} strokeWidth={0.9} className={`${ink ? "fill-lime-soft" : "fill-none"} ${ink ? "stroke-graphite" : "stroke-pencil"}`} />
          <path d={LAND.hills} strokeWidth={1.3} className={ink ? "stroke-graphite" : "stroke-pencil"} />
          <path d={LAND.shade} strokeWidth={1} className="stroke-pencil" />
          <text x={92} y={226} transform="rotate(-78 92 226)" textAnchor="middle" className="type-micro fill-graphite" style={{ fontSize: 12, letterSpacing: "0.3em" }}>
            WESTERN GHATS
          </text>

          {/* the compass */}
          <path d={LAND.compass} strokeWidth={1.2} className={`${ink ? "fill-card" : "fill-none"} ${line}`} />
          <path d={LAND.needle} className={ink ? "fill-tangerine" : "fill-graphite"} />
          <text x={444} y={16} textAnchor="middle" className={`type-micro ${ink ? "fill-ink" : "fill-graphite"}`} style={{ fontSize: 12, fontWeight: 700 }}>
            N
          </text>

          {/* Bengaluru's skyline */}
          <path d={LAND.city} strokeWidth={1.1} className={`${ink ? "fill-card" : "fill-none"} ${line}`} />
          <path d={LAND.windows} className={ink ? "fill-lime" : "fill-pencil"} />

          {/* the road: planned in pencil, inked behind the bus */}
          <path data-leg="1" d={ROAD.leg1} strokeWidth={2} strokeDasharray="3 6" className="stroke-graphite" />
          <path data-leg="2" d={ROAD.leg2} strokeWidth={2} strokeDasharray="3 6" className="stroke-graphite" />
          <path data-trail="1" d={ROAD.leg1} pathLength={1} strokeWidth={3.4} className={ink ? "stroke-tangerine" : "stroke-graphite"} />
          <path data-trail="2" d={ROAD.leg2} pathLength={1} strokeWidth={3.4} className={ink ? "stroke-tangerine" : "stroke-graphite"} />

          {/* the stops */}
          {STOPS.map(([x, y], i) => (
            <g key={i} data-pin={i}>
              <circle cx={x} cy={y} r={i === 2 ? 8 : 7} strokeWidth={2} className={`${ink ? (i === 2 ? "fill-tangerine" : "fill-card") : "fill-paper"} ${line}`} />
              <text x={x} y={y + 4} textAnchor="middle" className={`type-micro ${ink && i === 2 ? "fill-ink" : "fill-ink"}`} style={{ fontSize: 10, fontWeight: 700 }}>
                {i + 1}
              </text>
            </g>
          ))}
          <circle data-ring="" cx={STOPS[2][0]} cy={STOPS[2][1]} r={12} strokeWidth={2} className={ink ? "stroke-tangerine" : "stroke-graphite"} opacity={0} />
          <text x={STOPS[0][0] + 14} y={STOPS[0][1] - 10} className="font-hand fill-ink" style={{ fontSize: 28, fontWeight: 700 }}>
            {profile.route[0]?.place}
          </text>
          <text x={STOPS[1][0] + 15} y={STOPS[1][1] + 8} className="font-hand fill-ink" style={{ fontSize: 28, fontWeight: 700 }}>
            {profile.route[1]?.place}
          </text>
          <text x={STOPS[2][0]} y={STOPS[2][1] + 36} textAnchor="middle" className="font-hand fill-ink" style={{ fontSize: 28, fontWeight: 700 }}>
            {profile.route[2]?.place}
          </text>

          {/* the bus, parked at Bengaluru at rest */}
          <g data-bus="" transform={`translate(${PARK.x} ${PARK.y}) rotate(${PARK.angle})`}>
            <path d={BUS.body} strokeWidth={1.4} className={`${ink ? "fill-tangerine" : "fill-paper"} ${line}`} />
            <path d={BUS.glass} className={ink ? "fill-ink" : "fill-graphite"} />
            <path d={BUS.roof} strokeWidth={0.9} className={`${ink ? "fill-card" : "fill-none"} ${line}`} />
            <path d={BUS.rear} className={ink ? "fill-ink" : "fill-graphite"} />
          </g>
        </svg>
      </div>

      {/* the facts: one ticket per stop */}
      <ol aria-labelledby="road-title" className="mt-4 grid gap-2.5">
        {STOP_FACTS.map((s, i) => (
          <li key={s.place} className="relative grid grid-cols-[auto_minmax(0,1fr)] overflow-hidden rounded-[10px] border border-line bg-card">
            <div className="flex w-12 flex-col items-center justify-center gap-0.5 border-r border-dashed border-line-strong bg-paper-2 py-2 sm:w-14">
              <span className="type-micro text-graphite">STOP</span>
              <span className="type-h4 tabular-nums">{i + 1}</span>
            </div>
            <div className="py-2 pr-9 pl-3.5 sm:pl-4">
              <p className="type-mono text-graphite">
                {s.place} <span aria-hidden="true">·</span> <span className="tabular-nums">{s.years}</span>
                <span className="sr-only">, {s.region}</span>
              </p>
              <p className="type-ui mt-0.5 flex items-center gap-2">
                {s.title}
                {s.now ? <LiveDot size={8} /> : null}
              </p>
              {s.where ? <p className="type-small text-ink">{s.where}</p> : null}
              {s.lines.map((l) => (
                <p key={l.text} className="type-small text-graphite">
                  {l.medal ? (
                    <svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14" className="mr-1.5 inline-block -translate-y-px align-middle">
                      <path d="M3 0h2.4l1 4.4L5.2 6Z M9 0H6.6l-1 4.4L6.8 6Z" className="fill-lime stroke-ink" strokeWidth={0.8} />
                      <circle cx={6} cy={9.4} r={3.8} className="fill-lime stroke-ink" strokeWidth={1} />
                    </svg>
                  ) : null}
                  {l.text}
                </p>
              ))}
            </div>
            {/* the conductor's punch */}
            <span data-punch="" aria-hidden="true" className="absolute top-3 right-3 grid size-4 place-items-center rounded-full border-[1.5px] border-ink bg-paper" />
          </li>
        ))}
      </ol>
    </div>
  );
}
