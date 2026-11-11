"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/sections";
import { isHomePath, normalizePath, routes } from "@/lib/routes";
import { onScroll, stage, useStage } from "@/lib/stores/stage";
import { profile } from "@/content";
import { TransitionLink } from "@/components/transition";
import { PaletteTrigger } from "@/components/palette";
import { LiveDot, Pill } from "@/components/ui";
import { roughUnderline } from "@/components/sketch/rough";
import { MenuButton, MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";
import { SketchToggle } from "./SketchToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useActiveSection } from "./useActiveSection";

const WORDMARK_LINE = roughUnderline(2, 6, 116, { seed: "wordmark", style: "swash" });

/** "Prajwal M P" + the live dot. Hover / focus draws a tangerine pencil swash under the name. */
function Wordmark({ home }: { home: boolean }) {
  const cls = "group relative inline-flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-pill pr-1";
  const content = (
    <>
      <span className="relative font-display text-[1.375rem] leading-none font-bold tracking-[-0.03em] max-[359.98px]:text-[1.1875rem]">
        {profile.name}
        <svg aria-hidden="true" viewBox="0 0 130 16" className="absolute -bottom-3 left-0 h-4 w-[110%] overflow-visible text-tangerine">
          <path
            d={WORDMARK_LINE}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--dur-swipe) ease-pen group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0] reduced:transition-none"
          />
        </svg>
      </span>
      <LiveDot pulse />
    </>
  );
  if (home) {
    return (
      <a href="#top" className={cls} aria-label={`${profile.name}, back to top`}>
        {content}
      </a>
    );
  }
  return (
    <TransitionLink href={routes.home} label="home" className={cls} aria-label={`${profile.name}, home`}>
      {content}
    </TransitionLink>
  );
}

/**
 * The header on every page: wordmark + live dot · Work · Stack · Experience · About · Contact ·
 * Repos (a page of its own: /repos) (lime highlighter underline on hover, focus and the active
 * section or page) · Résumé (outline) and
 * Let's talk (ink). Transparent over the hero, translucent paper with a blur once scrolled.
 * Below 900px: wordmark + the menu button (full-screen paper menu).
 * data-boot: hidden while the opening plays; the Intro reveals it (or the failsafe does).
 */
export function Header() {
  const pathname = usePathname();
  const home = isHomePath(pathname);
  const onRepos = normalizePath(pathname) === "/repos";
  useActiveSection(home);
  const active = useStage((s) => s.activeSection);
  const menuOpen = useStage((s) => s.menuOpen);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const check = (y: number) => setScrolled(y > 8);
    // Native scroll too: Lenis does not report the browser's own jumps (deep links, restored scroll).
    const onNative = () => check(window.scrollY);
    onNative();
    const raf = requestAnimationFrame(onNative);
    window.addEventListener("scroll", onNative, { passive: true });
    const off = onScroll((s) => check(s.y));
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onNative);
      off();
    };
  }, []);

  useEffect(() => {
    stage.set({ menuOpen: false });
  }, [pathname]);

  const contactHref = home ? "#contact" : routes.section("contact");

  return (
    <header data-boot="" className="fixed inset-x-0 top-0 z-(--z-header)">
      <MobileMenu home={home} />
      <div className="relative z-10 h-(--header-h)">
        <div
          aria-hidden="true"
          className={`absolute inset-0 border-b bg-paper/[0.97] transition-[opacity,border-color] duration-(--dur-ui) ease-arrive ${scrolled && !menuOpen ? "border-line opacity-100" : "border-transparent opacity-0"}`}
        />
        <div className="wrap relative flex h-full items-center gap-3 max-[359.98px]:gap-2 lg:gap-6">
          <Wordmark home={home} />
          <nav aria-label="Primary" className="ml-auto hidden md:block">
            <ul className="flex items-center gap-0.5">
              {NAV_SECTIONS.map((s) => (
                <li key={s.id}>
                  <NavLink id={s.id} home={home} current={home && active === s.id} className="group relative isolate inline-flex min-h-11 items-center rounded-chip px-2 type-ui text-ink lg:px-3">
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2 top-[54%] -z-10 h-[0.58em] origin-right scale-x-0 rounded-[2px] bg-lime transition-transform duration-(--dur-ui) ease-pen group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100 group-aria-[current=location]:origin-left group-aria-[current=location]:scale-x-100"
                    />
                    {s.nav}
                  </NavLink>
                </li>
              ))}
              <li>
                <TransitionLink href={routes.repos} label="repos" aria-current={onRepos ? "page" : undefined} className="group relative isolate inline-flex min-h-11 items-center rounded-chip px-2 type-ui text-ink lg:px-3">
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 top-[54%] -z-10 h-[0.58em] origin-right scale-x-0 rounded-[2px] bg-lime transition-transform duration-(--dur-ui) ease-pen group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100 group-aria-[current=page]:origin-left group-aria-[current=page]:scale-x-100"
                  />
                  Repos
                </TransitionLink>
              </li>
            </ul>
          </nav>
          {/* The actions: sketch mode, the palette (contract 6: just before the desktop actions),
              Résumé + Let's talk (Let's talk from 1200px: below that "Contact" in the nav is the
              same link and the row would overflow), and the menu below 900px. Phones (his ask,
              2026-11-10 "fix the mobile view": the row ran off the right edge at 320-375px and at
              400-430px): under 400px the palette moves into the menu ("Open the terminal") and the
              buttons sit closer; under 360px the wordmark is a size smaller; the menu button shows
              its word from 480px. Every button stays 44px. */}
          <div className="flex shrink-0 items-center gap-2 max-[399.98px]:gap-1.5 max-md:ml-auto">
            <ThemeToggle />
            <SketchToggle />
            <PaletteTrigger className="max-[399.98px]:hidden" />
            <div className="hidden items-center gap-2 md:flex">
              {/* The Prajwal Times (the résumé as a newspaper, /resume) took Résumé's place; "Times"
                  alone where the row is tight */}
              <Pill href={routes.resume} label="The Prajwal Times" variant="outline" size="sm" icon={null} iconBefore={<svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M2.5 3.5h9v9a1 1 0 0 0 1 1h-9a1 1 0 0 1-1-1zM11.5 6h2v6.5a1 1 0 0 1-2 0M4.5 6h5M4.5 8.5h5M4.5 11h3" /></svg>} data-qa="header-times">
                <span className="max-xl:hidden">Prajwal&nbsp;</span>Times
              </Pill>
              <Pill href={contactHref} size="sm" label="home" icon={null} className="max-lg:hidden">
                Let&apos;s talk
              </Pill>
            </div>
            <MenuButton className="md:hidden" />
          </div>
        </div>
      </div>
    </header>
  );
}
