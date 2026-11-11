"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { education, experience, profile } from "@/content";
import { ExternalLink, Led } from "@/components/ui";
import { ArrowDown } from "@/components/icons";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useFinePointer, useReducedMotion } from "@/lib/motion/media";
import { useLoopsAllowed } from "@/lib/motion/preferences";
import { useMagnetic } from "@/lib/motion/useMagnetic";
import { useParallax } from "@/lib/motion/useParallax";
import { scope, useStage, wakeScope } from "@/lib/stores/stage";
import { Lanes } from "./Lanes";
import { TriggerHandle, type TriggerHandleApi } from "./TriggerHandle";
import { useScopeLayout } from "./useScopeLayout";
import css from "./hero.module.css";

const LOUPE_RADIUS = 48; // a 96px window around the probe

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2025-12" -> "Dec 2025" (from the structured content date, not the display label). */
const monthYear = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1] ?? ""} ${y}`.trim();
};

/** A period as two machine-readable dates joined by an en dash (typographic range). */
function Period({ start, end }: { start: string; end: string | null }) {
  return (
    <span className="tabular-nums">
      <time dateTime={start}>{monthYear(start)}</time>
      {" – "}
      {end ? <time dateTime={end}>{monthYear(end)}</time> : "Present"}
    </span>
  );
}

/**
 * 00 SOURCE. The hero over the scope: who he is (h1: name + role), what he does (the
 * statement), where to go (CTA row), and the five lanes the scene draws through.
 *
 * The section is transparent: <Scene> paints the graticule and traces behind it from
 * `scope.layout` (measured here) and `scope.signal` (tweened by <Intro>, nudged here by the
 * probe, the lanes and the trigger). Everything is real DOM text, visible without JS; the
 * opening hides parts only while html.booting (see src/components/intro).
 */
export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const triggerRef = useRef<TriggerHandleApi>(null);

  const ready = useStage((s) => s.intro) === "done";
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const loops = useLoopsAllowed();

  // ---- lanes: one open at a time (probe hover, focus or tap) ---------------------------------
  const [open, setOpen] = useState(-1);
  const openRef = useRef(-1);
  const latched = useRef(false);
  const setLane = useCallback((i: number) => {
    openRef.current = i;
    setOpen(i);
    if (scope.signal.hover !== i) {
      scope.signal.hover = i;
      wakeScope();
    }
  }, []);
  const onFocusLane = useCallback((i: number) => setLane(i), [setLane]);
  const onBlurLane = useCallback(
    (i: number) => {
      if (openRef.current !== i) return;
      latched.current = false;
      setLane(-1);
    },
    [setLane],
  );
  const onToggleLane = useCallback(
    (i: number) => {
      const on = openRef.current !== i || !latched.current;
      latched.current = on;
      setLane(on ? i : -1);
    },
    [setLane],
  );

  // ---- layout -> scope bus; parallax; one magnetic control ----------------------------------
  const onLayout = useCallback(() => triggerRef.current?.place(), []);
  useScopeLayout(heroRef, onLayout);
  useParallax(copyRef, { speed: -0.07, trigger: heroRef, start: "top top", end: "bottom top" });
  useMagnetic(ctaRef, { strength: 0.22 });

  // ---- the probe: a mouse over the scope excites the traces and picks the nearest lane --------
  const probeOn = ready && fine && !reduced;
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!probeOn || e.pointerType !== "mouse" || !heroRef.current) return;
    const s = scope.signal;
    const L = scope.layout;
    const r = heroRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const dx = x - s.probeX;
    const dy = y - s.probeY;
    s.probeX = x;
    s.probeY = y;
    if (L.quality < 2 && Math.abs(dx) < 400) s.energy = Math.min(1, s.energy + Math.hypot(dx, dy) * 0.0035);
    let near = -1;
    L.lanes.forEach((ly, k) => {
      if (Math.abs(y - ly) < L.laneSpacing * 0.5) near = k;
    });
    if (!latched.current) setLane(near);
    gsap.to(s, { probeVis: near >= 0 ? 1 : 0.35, duration: 0.25, ease: EASE.probe, overwrite: "auto", onUpdate: wakeScope });
    wakeScope();
  };
  const onPointerLeave = (e: PointerEvent<HTMLElement>) => {
    if (!probeOn || e.pointerType !== "mouse") return;
    if (!latched.current) setLane(-1);
    gsap.to(scope.signal, {
      probeVis: 0,
      duration: 0.3,
      ease: EASE.exit,
      overwrite: "auto",
      onUpdate: wakeScope,
      onComplete: () => {
        scope.signal.probeX = -9999;
        scope.signal.probeY = -9999;
      },
    });
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && openRef.current >= 0) {
      latched.current = false;
      setLane(-1);
    }
  };

  // ---- the loupe: sample slices around the probe on the name ---------------------------------
  useEffect(() => {
    const name = nameRef.current;
    if (!name || !probeOn) return;
    const lo = { r: 0 };
    const setR = () => name.style.setProperty("--lr", `${lo.r.toFixed(1)}px`);
    const enter = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      name.classList.add(css.loupe);
      gsap.to(lo, { r: LOUPE_RADIUS, duration: DUR.probe, ease: EASE.probe, overwrite: true, onUpdate: setR });
    };
    const move = (e: globalThis.PointerEvent) => {
      const r = name.getBoundingClientRect();
      name.style.setProperty("--lx", `${(e.clientX - r.left).toFixed(1)}px`);
      name.style.setProperty("--ly", `${(e.clientY - r.top).toFixed(1)}px`);
    };
    const leave = () => {
      gsap.to(lo, {
        r: 0,
        duration: 0.3,
        ease: EASE.exit,
        overwrite: true,
        onUpdate: setR,
        onComplete: () => name.classList.remove(css.loupe),
      });
    };
    name.addEventListener("pointerenter", enter);
    name.addEventListener("pointermove", move);
    name.addEventListener("pointerleave", leave);
    return () => {
      name.removeEventListener("pointerenter", enter);
      name.removeEventListener("pointermove", move);
      name.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(lo);
      name.classList.remove(css.loupe);
      ["--lr", "--lx", "--ly"].forEach((p) => name.style.removeProperty(p));
    };
  }, [probeOn]);


  const current = experience.find((e) => e.current);
  const degree = education[0];

  return (
    <section
      ref={heroRef}
      id="source"
      data-surface="screen"
      data-instrument=""
      aria-labelledby="hero-title"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      className="relative z-(--z-content) h-svh min-h-[660px] overflow-hidden portrait:min-h-[760px] sm:portrait:min-h-[900px]"
    >
      <div
        ref={copyRef}
        data-hero-copy=""
        className="absolute inset-x-(--margin) top-[calc(var(--bar)+clamp(32px,10vh,104px))] z-(--z-content) portrait:top-[calc(var(--bar)+clamp(20px,4.2vh,44px))]"
      >
        <h1 id="hero-title">
          <span
            ref={nameRef}
            data-hero-name=""
            data-boot-sample=""
            data-cursor-label="Sampled signal"
            className="type-name -ml-[0.045em] block w-fit whitespace-nowrap portrait:whitespace-normal"
          >
            <span className="portrait:block">
              {profile.firstName}
              <span data-baseline="" aria-hidden="true" className="inline-block h-0 w-0 align-baseline" />
            </span>{" "}
            <span>{profile.lastName}</span>
          </span>
          <span className="sr-only">, </span>
          <span data-boot-wipe="" className="type-role beam-wipe mt-[clamp(14px,2.6vh,26px)] block w-fit">
            {profile.title}
          </span>
        </h1>

        <div className="mt-[clamp(14px,2.2vh,22px)] md:mt-[calc(var(--text-role)*-0.95)] md:ml-[calc(50%+24px)] md:max-w-[min(560px,calc(50%-24px))]">
          <p data-boot="" className="type-lead max-w-[44ch] text-muted">
            {profile.statement}
          </p>
          {/* Phones: the primary spans the row, the two secondaries share the next one in equal
              columns (a deliberate 1 + 2 grid, never an orphan). From sm up: one row. */}
          <div data-boot="" className="mt-6 grid grid-cols-2 gap-2.5 portrait:mt-5 sm:flex sm:flex-wrap">
            <a
              ref={ctaRef}
              href="#work"
              data-cta="primary"
              className={`btn btn-solid ${css.cta} col-span-2`}
              data-cursor-label="Jump to the bench"
            >
              See the systems <ArrowDown />
            </a>
            <ExternalLink
              href={profile.resume.href}
              data-cta="resume"
              className={`btn ${css.cta}`}
              data-cursor-label="Open résumé"
              hint="PDF on Google Drive, opens in a new tab"
            >
              {profile.resume.label}
            </ExternalLink>
            <a href={`mailto:${profile.email}`} data-cta="email" className={`btn ${css.cta}`} data-cursor-label="Write an email">
              Email
            </a>
          </div>
        </div>
      </div>

      {/* The handle comes first: an open lane list (raised) must paint over it. */}
      <TriggerHandle ref={triggerRef} enabled={ready} />
      <Lanes open={open} onFocusLane={onFocusLane} onBlurLane={onBlurLane} onToggleLane={onToggleLane} />

      <div className="absolute inset-x-(--margin) bottom-[clamp(4px,1.6vh,16px)] z-(--z-content) flex items-center justify-between gap-x-8">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-10 gap-y-1">
          {current ? (
            <p data-boot="" className="type-readout text-bone">
              <b className="type-label mr-3 inline-flex items-center gap-2 font-bold">
                <Led className="-translate-y-px" />
                Now
              </b>
              <span>
                {current.role}, {current.company}, <Period start={current.start} end={current.end} />
              </span>
            </p>
          ) : null}
          {degree ? (
            <p data-boot="" className="type-readout text-muted">
              <b className="type-label mr-3 font-bold text-bone">From</b>
              <span>
                {degree.field}
                <span className="max-sm:hidden">, {degree.institution}</span>
              </span>
            </p>
          ) : null}
        </div>
        <a
          data-boot=""
          href="#signal"
          data-cursor-label="Sweep down"
          className="type-label hidden min-h-11 flex-none items-center gap-2.5 text-muted md:inline-flex no-underline transition-colors duration-(--dur-hover) ease-panel hover:text-bone"
        >
          Sweep
          <span aria-hidden="true" className="relative block h-px w-10 overflow-hidden bg-graticule-strong">
            <span className="absolute inset-0 -translate-x-full animate-sweep bg-bone [animation-delay:3.2s] reduced:animate-none signals-off:[animation-play-state:paused]" />
          </span>
          <span className="sr-only"> to the next section</span>
        </a>
      </div>
    </section>
  );
}
