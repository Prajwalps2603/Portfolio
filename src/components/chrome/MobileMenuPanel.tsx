"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { isReducedMotion } from "@/lib/motion/preferences";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { NAV_SECTIONS, type SectionId } from "@/lib/sections";
import { routes } from "@/lib/routes";
import { stage, useStage } from "@/lib/stores/stage";
import { experience, profile } from "@/content";
import { LiveDot, Pill } from "@/components/ui";
import { ArrowRight, SocialIcon, Terminal } from "@/components/icons";
import { openPalette } from "@/components/palette";
import { NavLink } from "./NavLink";
import { TransitionLink } from "@/components/transition";
import { MENU_PANEL_ID as PANEL_ID } from "./menuIds";

/** Each menu link has its own highlighter (rotating through the three accents). */
const ACCENTS = ["bg-lime", "bg-blue-soft", "bg-tangerine-soft"] as const;

/**
 * Full-screen paper menu (below 900px). Opens with a clip reveal from the top and the links
 * rising in (expo out); closes faster. Focus is trapped (toggle + panel), Esc closes and returns
 * focus to the toggle, the rest of the page is inert and scrolling is locked while open.
 * Tapping a link swipes its own highlighter behind it first (220ms), then travels.
 */
export default function MobileMenuPanel({ home }: { home: boolean }) {
  const open = useStage((s) => s.menuOpen);
  const active = useStage((s) => s.activeSection);
  const [tapped, setTapped] = useState<SectionId | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { lock, scrollTo } = useSmoothScroll();
  const api = useRef({ lock, scrollTo });
  useEffect(() => {
    api.current = { lock, scrollTo };
  }, [lock, scrollTo]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>("[data-menu-item]"));
    const toggle = document.querySelector<HTMLElement>("[data-menu-toggle]");
    gsap.killTweensOf([panel, ...items]);

    if (!open) {
      if (panel.hidden) return;
      if (isReducedMotion()) {
        panel.hidden = true;
        return;
      }
      gsap.to(panel, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: DUR.exit + 0.06,
        ease: EASE.exit,
        onComplete: () => {
          panel.hidden = true;
        },
      });
      return;
    }

    // ---- open
    panel.hidden = false;
    api.current.lock(true);
    const header = panel.closest("header");
    const outside = Array.from(document.body.children).filter((el) => el !== header && !el.contains(panel) && el.tagName !== "SCRIPT") as HTMLElement[];
    outside.forEach((el) => el.setAttribute("inert", ""));

    if (isReducedMotion()) {
      gsap.set(panel, { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: DUR.feedback, ease: EASE.none });
    } else {
      gsap.set(panel, { autoAlpha: 1 });
      gsap
        .timeline()
        .fromTo(panel, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: EASE.arrive }, 0)
        // opacity, not autoAlpha: the links must stay focusable while they rise (focus lands on
        // the first one in the next frame, before its turn in the stagger).
        .from(items, { y: 28, opacity: 0, duration: 0.6, ease: EASE.arrive, stagger: STAGGER.items }, 0.08);
    }
    const first = panel.querySelector<HTMLElement>("a[href],button");
    requestAnimationFrame(() => first?.focus({ preventScroll: true }));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stage.set({ menuOpen: false });
        toggle?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = [...(toggle ? [toggle] : []), ...Array.from(panel.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"))];
      if (!focusables.length) return;
      const i = focusables.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? focusables.length - 1 : i - 1) : i === focusables.length - 1 ? 0 : i + 1;
      e.preventDefault();
      focusables[next]?.focus();
    };
    const mq = window.matchMedia("(min-width: 900px)");
    const onWide = () => {
      if (mq.matches) stage.set({ menuOpen: false });
    };
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);

    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
      outside.forEach((el) => el.removeAttribute("inert"));
      api.current.lock(false);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setTapped(null);
  }, [open]);

  const goToSection = (id: SectionId) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!home) {
      setTapped(id);
      return; // TransitionLink travels (and closes the menu)
    }
    e.preventDefault();
    setTapped(id);
    const travel = () => {
      stage.set({ menuOpen: false });
      // Wait for the scroll lock and inert to lift, then travel.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          api.current.scrollTo(`#${id}`, { focus: true });
          history.replaceState(history.state, "", `#${id}`);
        }),
      );
    };
    if (isReducedMotion()) travel();
    else window.setTimeout(travel, DUR.ui * 1000);
  };

  const current = experience.find((x) => x.current);

  return (
    <div
      ref={panelRef}
      id={PANEL_ID}
      hidden
      data-qa="menu-panel"
      data-tone="paper"
      data-scroll="manual"
      data-lenis-prevent=""
      className="paper-dots fixed inset-0 z-0 flex flex-col overflow-y-auto bg-paper pt-(--header-h) md:hidden"
    >
      <nav aria-label="Menu" className="wrap pt-4">
        <ul>
          {NAV_SECTIONS.map((s, i) => {
            const isCurrent = home && active === s.id;
            const lit = isCurrent || tapped === s.id;
            return (
              <li key={s.id} data-menu-item="">
                <NavLink
                  id={s.id}
                  home={home}
                  current={isCurrent}
                  onClick={goToSection(s.id)}
                  className="group flex min-h-[72px] items-center justify-between gap-4 border-b border-line py-3"
                >
                  <span className="relative isolate font-display text-[clamp(2.5rem,11vw,3.75rem)] leading-none font-bold tracking-[-0.035em]">
                    <span
                      aria-hidden="true"
                      className={`absolute -inset-x-2 top-[0.32em] bottom-[0.02em] -z-10 ${ACCENTS[i % 3]} transition-transform duration-(--dur-ui) ease-pen ${lit ? "origin-left scale-x-100" : "origin-right scale-x-0 group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100"}`}
                    />
                    {s.nav}
                  </span>
                  <ArrowRight size={24} className="shrink-0 text-graphite transition-transform duration-(--dur-ui) ease-arrive group-hover:translate-x-1" />
                </NavLink>
              </li>
            );
          })}
          <li data-menu-item="">
            <TransitionLink href={routes.repos} label="repos" className="group flex min-h-[72px] items-center justify-between gap-4 border-b border-line py-3">
              <span className="relative isolate font-display text-[clamp(2.5rem,11vw,3.75rem)] leading-none font-bold tracking-[-0.035em]">
                <span
                  aria-hidden="true"
                  className={`absolute -inset-x-2 top-[0.32em] bottom-[0.02em] -z-10 ${ACCENTS[NAV_SECTIONS.length % 3]} origin-right scale-x-0 transition-transform duration-(--dur-ui) ease-pen group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100`}
                />
                Repos
              </span>
              <ArrowRight size={24} className="shrink-0 text-graphite transition-transform duration-(--dur-ui) ease-arrive group-hover:translate-x-1" />
            </TransitionLink>
          </li>
        </ul>
      </nav>

      <div className="wrap mt-auto pt-10 pb-8">
        <div data-menu-item="" className="flex flex-wrap gap-2.5">
          <Pill href={home ? "#contact" : routes.section("contact")} label="home" className="flex-1" onClick={home ? goToSection("contact") : undefined}>
            Let&apos;s talk
          </Pill>
          <Pill href={routes.resume} label="The Prajwal Times" variant="outline" className="flex-1" icon={null} iconBefore={<svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M2.5 3.5h9v9a1 1 0 0 0 1 1h-9a1 1 0 0 1-1-1zM11.5 6h2v6.5a1 1 0 0 1-2 0M4.5 6h5M4.5 8.5h5M4.5 11h3" /></svg>}>
            Prajwal Times
          </Pill>
        </div>
        {/* the command palette (its header button steps aside under 400px, so it lives here too) */}
        <button
          type="button"
          data-menu-item=""
          data-qa="menu-terminal"
          onClick={() => {
            stage.set({ menuOpen: false });
            // wait for the scroll lock and inert to lift (as the section links do), then open it
            requestAnimationFrame(() => requestAnimationFrame(() => openPalette()));
          }}
          className="type-ui mt-4 flex min-h-11 items-center gap-2.5 text-graphite transition-colors duration-(--dur-feedback) hover:text-ink"
        >
          <Terminal size={18} />
          Open the terminal
        </button>
        <ul data-menu-item="" className="mt-4 grid grid-cols-2 gap-x-4 border-t border-line pt-2" aria-label="Elsewhere">
          {profile.socials.map((s) => (
            <li key={s.kind}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="type-ui flex min-h-11 items-center gap-2.5 text-graphite transition-colors duration-(--dur-feedback) hover:text-ink"
              >
                <SocialIcon kind={s.kind} size={18} />
                {s.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        {current ? (
          <p data-menu-item="" className="type-small mt-5 flex items-center gap-2.5 text-graphite">
            <LiveDot />
            <span>
              Now: {current.role} at {current.company}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
