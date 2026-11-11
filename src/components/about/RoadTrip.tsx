"use client";

/**
 * KEPT, NOT MOUNTED: Prajwal chose the first design back ("i need first design", 2026-11-07), so
 * ./index.tsx renders ./RoadMap.tsx. To bring this back, render <RoadTrip /> from "./RoadTrip" in
 * its place and run docs/handoff/tools/verify-road.mjs (and verify-readme.mjs's road checks).
 *
 * "The road so far" (About), as a road trip. A window onto a side-on journey (./tripArt): a
 * Karnataka bus, luggage roped to its roof, drives his route (src/content/profile.ts) through the
 * years: Malnad's misty hills, areca palms and the school at Koppa in the morning; down the Ghats
 * past the warning board, a waterfall, the hairpins and monkeys on the painted parapet at noon;
 * Sullia's coconut palms and the college in the afternoon; the highway's pylons in the golden hour;
 * Bengaluru at night (the metro crossing its viaduct, autos, streetlamps, the office tower's lit
 * windows). Four parallax layers follow the bus; the sun climbs and sets, the moon and stars come
 * out. Under the window, a signpost: one arrow board per stop holding the facts (the schooling, the
 * degree and the award, the current role), and a mynah that hops to the board of the stop the bus
 * has reached. The window is decoration (aria-hidden); the boards are the content, always readable.
 *
 * THE TRIP (a clock; no scrolling needed): when the window's top reaches 75% of the screen the bus
 * leaves Koppa, stops at Sullia (its board lights, the bird hops) and parks at Bengaluru; ~12.5s,
 * so a visible pause control (Pause / Play / Drive it again), and it only runs on screen in a
 * visible tab (the play gate). Reduced motion, sketch mode (a pencil drawing) and no JS: parked in
 * Bengaluru at night, every board lit, the bird on the last one (the markup).
 */
import { useEffect, useRef, useState } from "react";
import { certifications, education, profile } from "@/content";
import { IconButton, LiveDot } from "@/components/ui";
import { Pause, Play, Replay } from "@/components/icons";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { useReducedMotion } from "@/lib/motion/media";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { usePlayGate } from "@/components/diagram/playGate";
import { BUS, FAR, FRONT, H, METRO_Y, MID, NEAR, PAR, ROAD, SKY, STOP_X, W, WHEEL, WHEEL_R, WHEELS, camAt, dusk, sunAt } from "./tripArt";

/* ---- the facts (the boards) ---- */
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

const STOPS: Stop[] = profile.route.map((r, i) => {
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

/** Each board's colours: lit (the bus has been there) and its accent edge. */
const BOARD = [
  { edge: "bg-lime", face: "bg-lime-soft", badge: "bg-lime" },
  { edge: "bg-blue", face: "bg-blue-soft", badge: "bg-blue text-paper" },
  { edge: "bg-tangerine", face: "bg-tangerine-soft", badge: "bg-tangerine" },
];
const ARROW = "polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)";
const ARROW_IN = "polygon(0 0, calc(100% - 19px) 0, calc(100% - 1px) 50%, calc(100% - 19px) 100%, 0 100%)";

/* ---- the drive ---- */
const START = STOP_X[0];
const END = STOP_X[2];
const r1 = (n: number) => Math.round(n * 10) / 10;
const metroAt = (x: number) => 1960 - Math.max(0, x - 1350) * 0.9;

/** Everything the drive moves, for the bus at `x` (the markup is this at END). */
function frame(x: number) {
  const cam = camAt(x);
  const { night, gold } = dusk(x);
  const spin = (((x - START) / WHEEL_R) * 180) / Math.PI;
  return {
    far: `translate(${r1(-cam * PAR.far)} 0)`,
    mid: `translate(${r1(-cam * PAR.mid)} 0)`,
    near: `translate(${r1(-cam)} 0)`,
    front: `translate(${r1(-cam * PAR.front)} 0)`,
    bus: `translate(${r1(x)} ${ROAD.wheels})`,
    wheels: WHEELS.map((wx) => `translate(${wx} ${-WHEEL_R}) rotate(${r1(spin % 360)})`),
    metro: `translate(${r1(metroAt(x))} ${METRO_Y})`,
    sun: sunAt(x),
    night,
    gold,
  };
}
const FINAL = frame(END);

type Phase = "waiting" | "driving" | "done";

export function RoadTrip() {
  const host = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const still = reduced || sketch;
  const live = usePlayGate(win, { threshold: 0.2 });
  const [phase, setPhase] = useState<Phase>("done");
  const [paused, setPaused] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const restart = useRef<(() => void) | null>(null);

  useGSAP(
    () => {
      const box = host.current;
      const view = win.current;
      if (!box || !view || still) return;
      const one = <T extends Element>(s: string) => box.querySelector<T>(s);
      const el = {
        far: one<SVGGElement>("[data-layer='far']"),
        mid: one<SVGGElement>("[data-layer='mid']"),
        near: one<SVGGElement>("[data-layer='near']"),
        front: one<SVGGElement>("[data-layer='front']"),
        lights: one<SVGGElement>("[data-layer='lights']"),
        bus: one<SVGGElement>("[data-bus]"),
        busLit: one<SVGGElement>("[data-bus-lit]"),
        bob: one<SVGGElement>("[data-bob]"),
        wheels: Array.from(box.querySelectorAll<SVGGElement>("[data-wheel]")),
        puffs: Array.from(box.querySelectorAll<SVGCircleElement>("[data-puff]")),
        metro: Array.from(box.querySelectorAll<SVGGElement>("[data-metro]")),
        sun: one<SVGCircleElement>("[data-sun]"),
        night: one<SVGRectElement>("[data-night]"),
        gold: one<SVGRectElement>("[data-gold]"),
        stars: one<SVGGElement>("[data-stars]"),
        boards: Array.from(box.querySelectorAll<HTMLElement>("[data-board]")),
        bird: one<HTMLElement>("[data-bird]"),
      };
      if (!el.far || !el.mid || !el.near || !el.front || !el.lights || !el.bus || !el.busLit || !el.bob || !el.sun || !el.night || !el.gold || !el.stars || !el.bird) return;
      const set = (n: Element | null, a: string, v: string) => n?.setAttribute(a, v);

      let lastX = START;
      let lastT = 0;
      /** Draw the bus at `x` (moving: the body bobs, the exhaust puffs). */
      const draw = (x: number, moving: boolean) => {
        const fr = frame(x);
        set(el.far, "transform", fr.far);
        set(el.mid, "transform", fr.mid);
        set(el.near, "transform", fr.near);
        set(el.front, "transform", fr.front);
        set(el.lights, "transform", fr.near);
        set(el.lights, "opacity", r1(fr.night * 100) / 100 + "");
        set(el.bus, "transform", fr.bus);
        set(el.busLit, "transform", fr.bus);
        el.wheels.forEach((w, i) => set(w, "transform", fr.wheels[i]));
        el.metro.forEach((m) => set(m, "transform", fr.metro));
        set(el.sun, "cx", r1(fr.sun[0]) + "");
        set(el.sun, "cy", r1(fr.sun[1]) + "");
        set(el.night, "opacity", (r1(fr.night * 66) / 100).toFixed(2));
        set(el.gold, "opacity", (r1(fr.gold * 45) / 100).toFixed(2));
        set(el.stars, "opacity", fr.night.toFixed(2));
        const t = performance.now() / 1000;
        const bob = moving ? Math.sin(t * 19) * 0.7 : 0;
        set(el.bob, "transform", `translate(0 ${r1(bob)})`);
        el.puffs.forEach((p, k) => {
          const ph = (t * 1.3 + k / 3) % 1;
          set(p, "cx", r1(-8 - ph * 26) + "");
          set(p, "cy", r1(-9 - ph * 12) + "");
          set(p, "r", r1(2 + ph * 4.5) + "");
          set(p, "opacity", moving ? ((1 - ph) * 0.55).toFixed(2) : "0");
        });
      };

      /** The bird and the boards: stop `i` reached. */
      const hopTo = (i: number, instant = false) => {
        el.boards.forEach((b, k) => b.setAttribute("data-lit", k <= i ? "1" : "0"));
        const last = el.boards[el.boards.length - 1];
        const target = el.boards[i];
        if (!target || !last) return;
        const dy = target.offsetTop - last.offsetTop;
        if (instant) gsap.set(el.bird, { x: 0, y: dy });
        else {
          gsap
            .timeline()
            .to(el.bird, { y: `-=${18}`, duration: 0.18, ease: EASE.exit })
            .to(el.bird, { y: dy, duration: 0.42, ease: EASE.arrive });
        }
      };

      const proxy = { x: START };
      const t = gsap.timeline({
        paused: true,
        onUpdate: () => {
          const now = performance.now();
          const moving = Math.abs(proxy.x - lastX) > 0.05 || now - lastT < 60;
          if (Math.abs(proxy.x - lastX) > 0.05) lastT = now;
          lastX = proxy.x;
          draw(proxy.x, moving);
        },
        onComplete: () => {
          draw(END, false);
          setPhase("done");
        },
      });
      t.to(proxy, { x: STOP_X[1], duration: 5.2, ease: EASE.pen }, 0.6)
        .call(() => hopTo(1), undefined, ">")
        .to(proxy, { x: END, duration: 5.6, ease: EASE.pen }, ">+1.1")
        .call(() => hopTo(2), undefined, ">");
      tl.current = t;

      const ready = () => {
        proxy.x = START;
        lastX = START;
        draw(START, false);
        hopTo(0, true);
      };
      restart.current = () => {
        ready();
        t.restart().pause();
        setPaused(false);
        setPhase("driving");
      };

      const r = view.getBoundingClientRect();
      if (r.bottom < 0) {
        // already scrolled past: it has arrived
        setPhase("done");
      } else {
        ready();
        setPhase("waiting");
        if (r.top < window.innerHeight * 0.75) setPhase("driving");
        else ScrollTrigger.create({ trigger: view, start: () => safeStart(view, "top 75%"), once: true, onEnter: () => setPhase("driving") });
      }
      return () => {
        tl.current = null;
        restart.current = null;
        // back to the markup: parked at Bengaluru, every board lit, the bird on the last one
        draw(END, false);
        el.boards.forEach((b) => b.setAttribute("data-lit", "1"));
        gsap.set(el.bird, { clearProps: "transform" });
      };
    },
    { scope: host, dependencies: [still], revertOnUpdate: true },
  );

  // play only while driving, on screen, in a visible tab, and not paused
  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (phase === "driving" && live && !paused) t.play();
    else t.pause();
  }, [phase, live, paused, still]);

  const control = () => {
    if (phase === "done") restart.current?.();
    else setPaused((p) => !p);
  };

  const ink = !sketch;
  const pen = (a: string, b = "fill-none stroke-graphite") => (ink ? a : b);
  const F = FINAL;

  return (
    <div ref={host} data-qa="roadtrip" data-phase={still ? "done" : phase}>
      <h3 id="road-title" className="type-h4">
        The road so far
      </h3>

      {/* the window */}
      <div ref={win} className="relative mt-4 overflow-hidden rounded-[18px] border border-line-strong bg-card">
        <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round" className="block h-auto w-full">
          {/* the sky, the sun */}
          {ink ? <rect width={W} height={H} className="fill-blue-soft" /> : null}
          <circle data-sun="" cx={r1(F.sun[0])} cy={r1(F.sun[1])} r={15} strokeWidth={1.4} className={pen("fill-tangerine stroke-ink")} />

          {/* FAR: the ranges, the Ghats' peak, the city's skyline, clouds */}
          <g data-layer="far" transform={F.far}>
            <path d={FAR.clouds} strokeWidth={1} className={pen("fill-card stroke-line-strong", "stroke-pencil")} />
            <path d={FAR.city} strokeWidth={1} className={pen("fill-line-strong stroke-pencil", "stroke-pencil")} />
            <path d={FAR.hills} strokeWidth={1.2} className={pen("fill-line stroke-pencil", "stroke-pencil")} />
          </g>

          {/* MID: green hills, the waterfall and the hairpins, mist, palms, the middle towers */}
          <g data-layer="mid" transform={F.mid}>
            <path d={MID.towers} strokeWidth={1} className={pen("fill-paper-2 stroke-graphite")} />
            <path d={MID.towerWins} className={pen("fill-graphite", "fill-pencil")} opacity={0.5} />
            <path d={MID.hills} strokeWidth={1.3} className={pen("fill-lime-soft stroke-graphite")} />
            <path d={MID.hairpins} strokeWidth={4.5} className={pen("stroke-graphite", "stroke-pencil")} />
            <path d={MID.hairpins} strokeWidth={2.4} className={pen("stroke-card", "stroke-paper")} />
            <path d={MID.fall} strokeWidth={1} className={pen("fill-card stroke-graphite")} />
            <path d={MID.flow} strokeWidth={1} className={pen("stroke-blue", "stroke-pencil")} opacity={0.7} />
            <path d={MID.pool} strokeWidth={1} className={pen("fill-blue-soft stroke-graphite")} />
            <path d={MID.palms} strokeWidth={1.4} className={pen("stroke-graphite", "stroke-pencil")} />
            <path d={MID.tufts} strokeWidth={1.6} className={pen("stroke-graphite", "stroke-pencil")} />
            {ink ? <path d={MID.mist} className="fill-card" opacity={0.65} /> : null}
          </g>

          {/* NEAR: the road and everything along it */}
          <g data-layer="near" transform={F.near}>
            <path d={NEAR.verge} className={pen("fill-lime-soft", "")} />
            {/* Koppa */}
            <path d={NEAR.palms} strokeWidth={2} className={pen("stroke-ink", "stroke-graphite")} />
            <path d={NEAR.tufts} strokeWidth={2.2} className={pen("stroke-ink", "stroke-graphite")} />
            <path d={NEAR.school.roof} strokeWidth={1.5} className={pen("fill-tangerine stroke-ink")} />
            <path d={NEAR.school.tiles} strokeWidth={0.8} className={pen("stroke-ink", "stroke-pencil")} opacity={0.6} />
            <path d={NEAR.school.body} strokeWidth={1.5} className={pen("fill-card stroke-ink")} />
            <path d={NEAR.school.windows} strokeWidth={1} className={pen("fill-blue-soft stroke-ink")} />
            <path d={NEAR.school.door} className={pen("fill-ink", "stroke-graphite")} />
            <path d={NEAR.school.board} strokeWidth={1.2} className={pen("fill-ink stroke-ink")} />
            <text x={NEAR.school.boardText[0]} y={NEAR.school.boardText[1]} textAnchor="middle" className={`type-micro ${ink ? "fill-lime" : "fill-graphite"}`} style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.03em" }}>
              SCHOOL · PU COLLEGE
            </text>
            <Shelter s={NEAR.koppaShelter} ink={ink} />
            <Milestone m={NEAR.koppaStone} ink={ink} dome="fill-lime" place="KOPPA" year="2009" />
            <path d={NEAR.house.roof} strokeWidth={1.4} className={pen("fill-tangerine stroke-ink")} />
            <path d={NEAR.house.body} strokeWidth={1.4} className={pen("fill-card stroke-ink")} />
            <path d={NEAR.house.door + NEAR.house.window} className={pen("fill-ink", "stroke-graphite")} />
            <path d={NEAR.bushes} strokeWidth={1.2} className={pen("fill-lime stroke-ink")} />

            {/* the Ghats */}
            <path d={NEAR.jungleTrunks} strokeWidth={1.2} className={pen("fill-graphite stroke-ink")} />
            <path d={NEAR.jungle} strokeWidth={1.3} className={pen("fill-lime stroke-ink")} />
            <path d={NEAR.ghatPost} strokeWidth={3} className={pen("stroke-ink", "stroke-graphite")} />
            <path d={NEAR.ghatBoard} strokeWidth={2} className={pen("fill-card stroke-tangerine", "stroke-graphite")} />
            <text x={581} y={206} textAnchor="middle" className={`type-micro ${ink ? "fill-ink" : "fill-graphite"}`} style={{ fontSize: 7, fontWeight: 700 }}>
              GHAT SECTION
            </text>
            <text x={581} y={214.5} textAnchor="middle" className={`type-micro ${ink ? "fill-ink" : "fill-graphite"}`} style={{ fontSize: 6 }}>
              drive slowly
            </text>
            <path d={NEAR.parapetWhite} strokeWidth={0.8} className={pen("fill-card stroke-ink")} />
            <path d={NEAR.parapetInk} className={pen("fill-ink", "stroke-graphite")} />
            <path d={NEAR.monkeys} strokeWidth={1.2} className={pen("fill-graphite stroke-ink")} />

            {/* Sullia */}
            <path d={NEAR.college.body} strokeWidth={1.5} className={pen("fill-card stroke-ink")} />
            <path d={NEAR.college.floors} strokeWidth={1} className={pen("stroke-ink", "stroke-pencil")} />
            <path d={NEAR.college.windows} strokeWidth={1} className={pen("fill-blue-soft stroke-ink")} />
            <path d={NEAR.college.portico} strokeWidth={1.6} className={pen("fill-paper-2 stroke-ink")} />
            <path d={NEAR.college.steps} strokeWidth={1} className={pen("fill-paper-2 stroke-ink")} />
            <path d={NEAR.college.board} strokeWidth={1.2} className={pen("fill-blue stroke-ink")} />
            <text x={NEAR.college.boardText[0]} y={NEAR.college.boardText[1]} textAnchor="middle" className={`type-micro ${ink ? "fill-paper" : "fill-graphite"}`} style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.06em" }}>
              KVG COLLEGE OF ENGINEERING
            </text>
            <path d={NEAR.coconuts} strokeWidth={1.2} className={pen("fill-graphite stroke-ink")} />
            <path d={NEAR.fronds} strokeWidth={2.6} className={pen("stroke-lime", "stroke-graphite")} />
            <path d={NEAR.fronds} strokeWidth={0.8} className={pen("stroke-ink", "stroke-pencil")} />
            <path d={NEAR.nuts} className={pen("fill-ink", "stroke-graphite")} />
            <Shelter s={NEAR.sulliaShelter} ink={ink} />
            <Milestone m={NEAR.sulliaStone} ink={ink} dome="fill-blue" place="SULLIA" year="2021" />

            {/* the highway */}
            <path d={NEAR.wires} strokeWidth={0.8} className={pen("stroke-graphite", "stroke-pencil")} />
            <path d={NEAR.pylons} strokeWidth={1.2} className={pen("stroke-graphite", "stroke-pencil")} />
            <path d={NEAR.sign.post} strokeWidth={3} className={pen("stroke-ink", "stroke-graphite")} />
            <path d={NEAR.sign.board} strokeWidth={1.4} className={pen("fill-blue stroke-ink")} />
            <text x={NEAR.sign.text[0]} y={NEAR.sign.text[1]} textAnchor="middle" className={`type-micro ${ink ? "fill-paper" : "fill-graphite"}`} style={{ fontSize: 7, fontWeight: 700 }}>
              BENGALURU →
            </text>

            {/* Bengaluru */}
            <path d={NEAR.tower.body + NEAR.tower.crown} strokeWidth={1.5} className={pen("fill-paper-2 stroke-ink")} />
            <path d={NEAR.towerWins} className={pen("fill-blue-soft", "fill-pencil")} />
            <path d={NEAR.shops} strokeWidth={1.4} className={pen("fill-card stroke-ink")} />
            <path d={NEAR.shopBoards} strokeWidth={1} className={pen("fill-tangerine-soft stroke-ink")} />
            <path d={NEAR.shutters} strokeWidth={0.9} className={pen("stroke-ink", "stroke-pencil")} />
            <path d={NEAR.viaduct.pillars + NEAR.viaduct.caps} strokeWidth={1.3} className={pen("fill-paper-2 stroke-ink")} />
            <g data-metro="" transform={F.metro}>
              <path d={NEAR.metro.cars} strokeWidth={1.3} className={pen("fill-card stroke-ink")} />
              <path d={NEAR.metro.stripe} className={pen("fill-blue", "")} />
              <path d={NEAR.metro.windows} className={pen("fill-ink", "stroke-graphite")} />
            </g>
            <path d={NEAR.viaduct.deck} strokeWidth={1.4} className={pen("fill-paper-2 stroke-ink")} />
            {NEAR.lamps.map((l, i) => (
              <path key={i} d={l.pole} strokeWidth={2.2} className={pen("stroke-graphite")} />
            ))}
            <path d={NEAR.lampHeads} className={pen("fill-ink", "stroke-graphite")} />
            <Milestone m={NEAR.blrStone} ink={ink} dome="fill-tangerine" place="BENGALURU" year="2025" />

            {/* the road */}
            <path d={NEAR.kerbWhite} className={pen("fill-card", "")} />
            <path d={NEAR.kerbInk} className={pen("fill-ink", "")} />
            <path d={NEAR.road} className={pen("fill-graphite", "stroke-graphite")} />
            <path d={NEAR.dashes} className={pen("fill-card", "fill-pencil")} />
            <path d={NEAR.near} className={pen("fill-lime-soft", "")} />
            {NEAR.autos.map((a, i) => (
              <g key={i}>
                <path d={a.canopy} strokeWidth={1.3} className={pen("fill-ink stroke-ink")} />
                <path d={a.body} strokeWidth={1.3} className={pen("fill-lime stroke-ink")} />
                <path d={a.wheels} className={pen("fill-ink", "stroke-graphite")} />
              </g>
            ))}

            {/* the bus */}
            <g data-bus="" transform={F.bus}>
              <g data-bob="">
                <path d={BUS.rails} strokeWidth={1.3} className={pen("stroke-ink", "stroke-graphite")} />
                {BUS.bags.map((b, i) => (
                  <path key={i} d={b} strokeWidth={1} className={pen(`${["fill-blue", "fill-lime-soft", "fill-tangerine-soft", "fill-fog", "fill-lime"][i]} stroke-ink`)} />
                ))}
                <path d={BUS.ropes} strokeWidth={0.8} className={pen("stroke-ink", "stroke-pencil")} />
                <path d={BUS.body} strokeWidth={1.6} className={pen("fill-tangerine stroke-ink")} />
                <path d={BUS.band} className={pen("fill-card", "")} />
                <path d={BUS.panes} className={pen("fill-ink", "stroke-graphite")} />
                <path d={BUS.heads} className={pen("fill-fog", "stroke-pencil")} />
                <path d={BUS.door} strokeWidth={1.2} className={pen("fill-ink-2 stroke-ink")} />
                <path d={BUS.doorGlass} className={pen("fill-blue-soft", "")} opacity={0.55} />
                <path d={BUS.screen} className={pen("fill-ink", "stroke-graphite")} />
                <path d={BUS.driver} className={pen("fill-fog", "stroke-pencil")} />
                <path d={BUS.stripes} className={pen("fill-lime", "")} />
                <path d={BUS.skirt} className={pen("fill-ink", "")} />
                <path d={BUS.board} className={pen("fill-ink", "stroke-graphite")} />
                <path d={BUS.boardDots} className={pen("fill-lime", "")} />
                <path d={BUS.headlight} className={pen("fill-card", "stroke-graphite")} />
                <path d={BUS.tail} className={pen("fill-tangerine-deep", "stroke-graphite")} />
                <path d={BUS.mirror} strokeWidth={1.4} className={pen("stroke-ink", "stroke-graphite")} />
                <path d={BUS.bumper} className={pen("fill-ink", "stroke-graphite")} />
                <path d={BUS.arches} className={pen("fill-ink-2", "")} />
                <path d={BUS.exhaust} className={pen("fill-ink", "")} />
              </g>
              {WHEELS.map((wx, i) => (
                <g key={wx} data-wheel="" transform={F.wheels[i]}>
                  <path d={WHEEL.tyre} strokeWidth={1.2} className={pen("fill-ink stroke-ink")} />
                  <path d={WHEEL.rim} className={pen("fill-fog", "stroke-graphite")} />
                  <path d={WHEEL.hub} className={pen("fill-ink", "fill-graphite")} />
                </g>
              ))}
              {ink ? [0, 1, 2].map((k) => <circle key={k} data-puff="" cx={-8} cy={-9} r={2} className="fill-line-strong" opacity={0} />) : null}
            </g>
          </g>

          {/* FRONT: grass going by */}
          <g data-layer="front" transform={F.front}>
            <path d={FRONT.grass} strokeWidth={1.6} className={pen("stroke-graphite", "stroke-pencil")} />
          </g>

          {/* the golden hour and the night, then what shines in it */}
          {ink ? (
            <>
              <rect data-gold="" width={W} height={H} className="fill-tangerine-soft" opacity={(r1(F.gold * 45) / 100).toFixed(2)} />
              <rect data-night="" width={W} height={H} className="fill-ink" opacity={(r1(F.night * 66) / 100).toFixed(2)} />
              <g data-stars="" opacity={F.night.toFixed(2)}>
                <path d={SKY.stars} className="fill-paper" />
                <path d={SKY.moon} className="fill-paper" />
                <path d={SKY.bite} className="fill-ink" opacity={0.66} />
              </g>
              <g data-layer="lights" transform={F.near} opacity={F.night}>
                <path d={NEAR.cones} className="fill-lime" opacity={0.14} />
                <path d={NEAR.lampHeads} className="fill-lime" />
                <path d={NEAR.towerLit} className="fill-lime" />
                <g data-metro="" transform={F.metro}>
                  <path d={NEAR.metro.windows} className="fill-lime" />
                </g>
                <g data-bus-lit="" transform={F.bus}>
                  <path d={BUS.beam} className="fill-lime" opacity={0.24} />
                  <path d={BUS.panes} className="fill-lime-soft" />
                  <path d={BUS.heads} className="fill-ink-2" />
                  <path d={BUS.headlight} className="fill-lime" />
                </g>
              </g>
            </>
          ) : null}
        </svg>
        {still ? null : (
          <IconButton
            label={phase === "done" ? "Drive it again" : paused ? "Play the trip" : "Pause the trip"}
            aria-pressed={phase === "done" ? undefined : paused}
            size="sm"
            icon={phase === "done" ? <Replay /> : paused ? <Play /> : <Pause />}
            onClick={control}
            data-qa="roadtrip-control"
            className="absolute top-2.5 right-2.5 bg-card"
          />
        )}
      </div>

      {/* the signpost: a board per stop, the facts */}
      <div className="relative mt-6 pl-8 sm:pl-9">
        <div aria-hidden="true" className="absolute top-[-10px] bottom-[-6px] left-3 w-2.5 rounded-full bg-graphite">
          <span className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full border-2 border-graphite bg-card" />
        </div>
        <ol aria-labelledby="road-title" className="grid gap-3.5">
          {STOPS.map((s, i) => (
            <li key={s.place} data-board={i} data-lit="1" className="group relative">
              {/* the clamp onto the pole */}
              <span aria-hidden="true" className="absolute top-1/2 -left-6 flex h-3 w-7 -translate-y-1/2 items-center justify-around rounded-[3px] bg-ink">
                <span className="size-1 rounded-full bg-fog" />
                <span className="size-1 rounded-full bg-fog" />
              </span>
              <div className={`p-[2.5px] transition-colors duration-500 ${BOARD[i].edge} group-data-[lit=0]:bg-line-strong`} style={{ clipPath: ARROW }}>
                <div className={`py-2.5 pr-9 pl-3.5 transition-colors duration-500 sm:pl-4 ${BOARD[i].face} group-data-[lit=0]:bg-card`} style={{ clipPath: ARROW_IN }}>
                  <p className="flex flex-wrap items-baseline gap-x-2.5">
                    <span aria-hidden="true" className={`type-micro grid size-5 shrink-0 translate-y-[-2px] place-items-center self-center rounded-full font-bold tabular-nums transition-colors duration-500 ${BOARD[i].badge} group-data-[lit=0]:bg-line group-data-[lit=0]:text-ink`}>
                      {i + 1}
                    </span>
                    <span className="font-display text-[1.375rem] leading-none font-extrabold tracking-[-0.01em] uppercase">{s.place}</span>
                    <span className="type-mono text-graphite tabular-nums">{s.years}</span>
                    <span className="sr-only">, {s.region}</span>
                  </p>
                  <p className="type-ui mt-1.5 flex items-center gap-2 font-semibold">
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
              </div>
              {i === STOPS.length - 1 ? <Mynah /> : null}
            </li>
          ))}
        </ol>
        {/* the grass at the pole's foot */}
        <svg aria-hidden="true" viewBox="0 0 40 14" className="absolute -bottom-2 left-0 w-9" fill="none" strokeLinecap="round">
          <path d="M4 14Q6 8 2 3M10 14Q10 6 13 1M16 14Q18 9 22 6M24 14Q24 8 27 4M30 14Q33 9 37 8" strokeWidth={1.6} className="stroke-graphite" />
        </svg>
      </div>
    </div>
  );
}

/** The mynah, perched on the board of the stop the bus has reached (in the markup: the last). */
function Mynah() {
  return (
    <svg data-bird="" aria-hidden="true" viewBox="0 0 36 30" className="pointer-events-none absolute -top-[29px] right-[22%] w-10" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 27l-1 3M20 27l1 3" strokeWidth={1.6} className="stroke-tangerine-deep" />
      <path d="M6 22c-3 1 -6 1 -6 1c3 -3 6 -4 8 -4Z" className="fill-ink" />
      <path d="M8 18c0 -6 5 -10 11 -10c5 0 8 4 8 9c0 6 -5 10 -11 10c-5 0 -8 -4 -8 -9Z" strokeWidth={1.2} className="fill-graphite stroke-ink" />
      <path d="M12 16c3 -1 7 0 9 3c-3 2 -7 2 -9 -3Z" className="fill-card" />
      <path d="M19 9c1 -5 5 -7 9 -6c3 1 4 4 3 7c-1 3 -5 4 -8 3" strokeWidth={1.2} className="fill-ink stroke-ink" />
      <path d="M30 6l6 2l-6 2Z" className="fill-lime" />
      <circle cx={28} cy={7} r={2.2} className="fill-lime" />
      <circle cx={28.3} cy={7} r={0.9} className="fill-ink" />
    </svg>
  );
}

function Shelter({ s, ink }: { s: { posts: string; roof: string; bench: string }; ink: boolean }) {
  return (
    <g>
      <path d={s.posts} strokeWidth={2.4} className={ink ? "stroke-ink" : "stroke-graphite"} />
      <path d={s.bench} strokeWidth={1.2} className={ink ? "fill-paper-2 stroke-ink" : "stroke-graphite"} />
      <path d={s.roof} strokeWidth={1.4} className={ink ? "fill-tangerine stroke-ink" : "stroke-graphite"} />
    </g>
  );
}

function Milestone({ m, ink, dome, place, year }: { m: { stone: string; dome: string; text: readonly [number, number]; year: readonly [number, number] }; ink: boolean; dome: string; place: string; year: string }) {
  return (
    <g>
      <path d={m.stone} strokeWidth={1.3} className={ink ? "fill-card stroke-ink" : "stroke-graphite"} />
      <path d={m.dome} strokeWidth={1.3} className={ink ? `${dome} stroke-ink` : "stroke-graphite"} />
      <text x={m.text[0]} y={m.text[1] - 1} textAnchor="middle" className={`type-micro ${ink ? "fill-ink" : "fill-graphite"}`} style={{ fontSize: place.length > 7 ? 4.6 : 6, fontWeight: 700 }}>
        {place}
      </text>
      <text x={m.year[0]} y={m.year[1]} textAnchor="middle" className={`type-micro ${ink ? "fill-ink" : "fill-graphite"}`} style={{ fontSize: 7, fontWeight: 700 }}>
        {year}
      </text>
    </g>
  );
}
