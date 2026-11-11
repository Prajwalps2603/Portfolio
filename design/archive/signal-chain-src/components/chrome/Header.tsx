"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { profile } from "@/content";
import { SECTIONS, type SectionId } from "@/lib/sections";
import { datasheetSlug, isHomePath } from "@/lib/routes";
import { onScroll, stage, useStage, type Surface } from "@/lib/stores/stage";
import { TransitionLink } from "@/components/transition";
import { ExternalLink } from "@/components/ui";
import { RecordNav } from "./RecordNav";
import { TrigIndicator } from "./TrigIndicator";
import { MenuButton, MobileMenu } from "./MobileMenu";

/** "Prajwal M P" -> "P.M.P" (derived, never hard-coded). */
const initials = profile.name
  .split(/\s+/)
  .filter(Boolean)
  .map((w) => w[0]!.toUpperCase())
  .join(".");

/**
 * Persistent chrome: a fixed bar with the monogram and a stage readout (which part of the signal
 * chain is under the reading line: Source, Signal, Systems... / Datasheet / No signal; the role
 * itself is already the hero's subject, so the bar does not repeat it), the record-view nav, the trigger
 * status and the résumé. It is a bezel: it swaps graphite <-> bone (350ms) when a bone sheet
 * passes under it. It also publishes stage.surface and stage.activeSection for everyone else.
 */
export function Header() {
  const pathname = usePathname();
  const home = isHomePath(pathname);
  const surface = useStage((s) => s.surface);
  const menuOpen = useStage((s) => s.menuOpen);
  const activeSection = useStage((s) => s.activeSection);
  const stageName = home
    ? (SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0]!).stage
    : datasheetSlug(pathname)
      ? "Datasheet"
      : "No signal";
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = header.offsetHeight / 2;
      let under: Surface = "screen";
      // Innermost material under the bar's midline wins (document order = outer before inner).
      document.querySelectorAll<HTMLElement>("#main [data-surface]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) under = el.dataset.surface === "sheet" ? "sheet" : "screen";
      });
      let active: SectionId | null = null;
      if (home) {
        const line = window.innerHeight * 0.45;
        for (const s of SECTIONS) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top <= line) active = s.id;
        }
      } else if (/\/work\/[^/]+/.test(pathname)) {
        active = "work";
      }
      stage.set({ surface: under, activeSection: active });
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    queue();
    const unsub = onScroll(queue);
    window.addEventListener("resize", queue);
    const late = window.setTimeout(queue, 400); // after the page's own layout settles
    return () => {
      unsub();
      window.removeEventListener("resize", queue);
      window.clearTimeout(late);
      cancelAnimationFrame(raf);
    };
  }, [home, pathname]);

  const brandClass = "inline-flex min-h-11 items-center justify-self-start font-mono [font-stretch:87.5%] uppercase";
  const brandInner = (
    <span className="flex items-baseline gap-3">
      <b className="text-readout font-bold tracking-[0.12em]">{initials}</b>
      <span className="type-label hidden opacity-75 sm:inline">{stageName}</span>
    </span>
  );
  const brandLabel = `${profile.name}, ${profile.title}: back to the top`;

  return (
    <header
      ref={headerRef}
      data-surface={menuOpen ? "screen" : surface}
      className="fixed inset-x-0 top-0 z-(--z-header) h-(--bar) border-b border-graticule bg-graphite text-bone transition-[background-color,color,border-color] duration-(--dur-surface) ease-panel data-[surface=sheet]:border-rule data-[surface=sheet]:bg-bone data-[surface=sheet]:text-ink"
    >
      <div className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-margin md:grid-cols-[1fr_auto_1fr] md:gap-6">
        {home ? (
          <a href="#source" className={brandClass} aria-label={brandLabel}>
            {brandInner}
          </a>
        ) : (
          <TransitionLink href="/" className={brandClass} aria-label={brandLabel}>
            {brandInner}
          </TransitionLink>
        )}

        <RecordNav home={home} />

        <div className="flex items-center gap-6 justify-self-end">
          <TrigIndicator className="hidden md:inline-flex" />
          <ExternalLink href={profile.resume.href} className="link-mono hidden md:inline-flex" hint="PDF on Google Drive, opens in a new tab">
            {profile.resume.label}
          </ExternalLink>
          <MenuButton className="md:hidden" />
        </div>
      </div>
      <MobileMenu home={home} />
    </header>
  );
}
