"use client";

import { useEffect, useRef } from "react";
import { NAV_SECTIONS, SECTIONS } from "@/lib/sections";
import { routes } from "@/lib/routes";
import { onScroll, scroll, useStage } from "@/lib/stores/stage";
import { TransitionLink } from "@/components/transition";

/**
 * The record view: a miniature scope record of the whole page. Ticks mark where each section
 * starts, a bracket shows the visible window and slides with scroll, and the plain-language
 * section links sit under their ticks. On other pages the links lead back to home sections
 * and spread evenly (their sections are not on this page).
 */
export function RecordNav({ home }: { home: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const ticksRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const active = useStage((s) => s.activeSection);

  useEffect(() => {
    const track = trackRef.current;
    const ticks = ticksRef.current;
    const win = winRef.current;
    const list = listRef.current;
    if (!track || !ticks || !win || !list) return;

    let total = 1;
    const update = () => {
      win.style.left = `${Math.min(100, (scroll.y / total) * 100)}%`;
      win.style.width = `${Math.max(2, (window.innerHeight / total) * 100)}%`;
    };

    const layout = () => {
      total = Math.max(1, document.documentElement.scrollHeight);
      // Ticks: every page section that exists here (home sections, or the datasheet's own).
      const marks = home
        ? SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el)
        : Array.from(document.querySelectorAll<HTMLElement>("#main section[id], #main [data-record-tick]"));
      ticks.replaceChildren(
        ...marks.map((el) => {
          const t = document.createElement("i");
          t.className = "absolute top-px bottom-px w-px bg-current opacity-55";
          t.style.left = `${((el.getBoundingClientRect().top + window.scrollY) / total) * 100}%`;
          return t;
        }),
      );
      // Labels under their ticks, nudged apart so they never collide.
      const W = track.offsetWidth;
      const items = Array.from(list.children) as HTMLElement[];
      const gap = 18;
      const placed = items.map((li, i) => {
        const id = NAV_SECTIONS[i]?.id;
        const el = home && id ? document.getElementById(id) : null;
        const frac = el ? (el.getBoundingClientRect().top + window.scrollY) / total : (i + 1) / (items.length + 1);
        const w = li.offsetWidth;
        return { li, w, c: Math.min(Math.max(frac * W, w / 2), W - w / 2) };
      });
      for (let i = 1; i < placed.length; i++) {
        const prev = placed[i - 1];
        const min = prev.c + prev.w / 2 + gap + placed[i].w / 2;
        if (placed[i].c < min) placed[i].c = min;
      }
      for (let i = placed.length - 1; i >= 0; i--) {
        const maxC = i === placed.length - 1 ? W - placed[i].w / 2 : placed[i + 1].c - placed[i + 1].w / 2 - gap - placed[i].w / 2;
        if (placed[i].c > maxC) placed[i].c = maxC;
      }
      placed.forEach(({ li, c }) => {
        li.style.left = `${c}px`;
      });
      update();
    };

    let t = 0;
    const relayout = () => {
      window.clearTimeout(t);
      t = window.setTimeout(layout, 120);
    };
    layout();
    const unsub = onScroll(update);
    const ro = new ResizeObserver(relayout);
    ro.observe(document.body);
    ro.observe(track);
    document.fonts?.ready.then(layout).catch(() => {});
    window.addEventListener("load", layout);
    return () => {
      unsub();
      ro.disconnect();
      window.clearTimeout(t);
      window.removeEventListener("load", layout);
    };
  }, [home]);

  return (
    <div className="relative w-full max-w-[160px] justify-self-center pt-1 md:w-[min(420px,36vw)] md:max-w-none">
      <div
        ref={trackRef}
        aria-hidden="true"
        className="relative h-2.5 border-x border-current opacity-90 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-current before:opacity-35"
      >
        <div ref={ticksRef} className="absolute inset-0" />
        <i
          ref={winRef}
          className="absolute -top-[3px] -bottom-[3px] left-0 w-[10%] border-x border-y-2 border-current will-change-[left,width]"
        />
      </div>
      <nav aria-label="Sections" className="hidden md:block">
      <ol ref={listRef} className="relative mt-[3px] h-[22px]">
        {NAV_SECTIONS.map((s) => {
          const current = active === s.id;
          const cls = `type-label block py-1 whitespace-nowrap transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 coarse:py-3 ${
            current ? "opacity-100" : "opacity-65"
          }`;
          return (
            <li key={s.id} className="absolute top-0 -translate-x-1/2">
              {home ? (
                <a href={`#${s.id}`} className={cls} aria-current={current ? "location" : undefined}>
                  {s.nav}
                </a>
              ) : (
                <TransitionLink href={routes.section(s.id)} className={cls} aria-current={current ? "page" : undefined}>
                  {s.nav}
                </TransitionLink>
              )}
            </li>
          );
        })}
      </ol>
      </nav>
    </div>
  );
}
