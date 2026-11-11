"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { isReducedMotion } from "@/lib/motion/preferences";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { NAV_SECTIONS } from "@/lib/sections";
import { routes } from "@/lib/routes";
import { stage, useStage } from "@/lib/stores/stage";
import { profile } from "@/content";
import { TransitionLink } from "@/components/transition";
import { ExternalLink, Led } from "@/components/ui";
import { ArrowRight, Close, Mail, Menu as MenuIcon, SocialIcon } from "@/components/icons";
import { TrigIndicator } from "./TrigIndicator";

const PANEL_ID = "site-menu";

/** Toggle button for the mobile menu (shown below 861px). */
export function MenuButton({ className }: { className?: string }) {
  const open = useStage((s) => s.menuOpen);
  return (
    <button
      type="button"
      data-menu-toggle=""
      aria-expanded={open}
      aria-controls={PANEL_ID}
      onClick={() => stage.set({ menuOpen: !open })}
      className={`type-label -mr-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 font-semibold ${className ?? ""}`}
    >
      <span>{open ? "Close" : "Menu"}</span>
      {open ? <Close size={18} /> : <MenuIcon size={18} />}
    </button>
  );
}

/**
 * Full-screen menu below the top bar. Opens with a scan: the panel is revealed top to bottom by
 * a clip-path with a bone beam on its edge, then the links rise (40ms stagger). Closes faster.
 * Focus is trapped (toggle + panel), Esc closes and returns focus to the toggle, the rest of
 * the page is inert and scrolling is locked while open.
 */
export function MobileMenu({ home }: { home: boolean }) {
  const open = useStage((s) => s.menuOpen);
  const active = useStage((s) => s.activeSection);
  const panelRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const { lock, scrollTo } = useSmoothScroll();
  const api = useRef({ lock, scrollTo });
  api.current = { lock, scrollTo };

  useEffect(() => {
    const panel = panelRef.current;
    const beam = beamRef.current;
    if (!panel || !beam) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>("[data-menu-item]"));
    const toggle = document.querySelector<HTMLElement>("[data-menu-toggle]");
    gsap.killTweensOf([panel, beam, ...items]);

    if (!open) {
      if (panel.hidden) return;
      if (isReducedMotion()) {
        panel.hidden = true;
        return;
      }
      gsap.to(panel, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: DUR.exit,
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
    const outside = Array.from(document.body.children).filter(
      (el) => !el.contains(panel) && el.tagName !== "SCRIPT",
    ) as HTMLElement[];
    outside.forEach((el) => el.setAttribute("inert", ""));

    if (isReducedMotion()) {
      gsap.set(panel, { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: "none" });
    } else {
      gsap.set(panel, { autoAlpha: 1 });
      gsap
        .timeline()
        .fromTo(panel, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.wipe, ease: EASE.out }, 0)
        .fromTo(beam, { y: 0, opacity: 1 }, { y: () => panel.offsetHeight - 2, duration: DUR.wipe, ease: EASE.out }, 0)
        .to(beam, { opacity: 0, duration: 0.15 }, DUR.wipe - 0.1)
        .from(items, { y: 16, autoAlpha: 0, duration: DUR.panel, ease: EASE.panel, stagger: STAGGER.chrome + 0.005 }, 0.12);
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
      const focusables = [
        ...(toggle ? [toggle] : []),
        ...Array.from(panel.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")),
      ];
      if (!focusables.length) return;
      const i = focusables.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? focusables.length - 1 : i - 1) : i === focusables.length - 1 ? 0 : i + 1;
      e.preventDefault();
      focusables[next]?.focus();
    };
    const mq = window.matchMedia("(min-width: 861px)");
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

  const close = () => stage.set({ menuOpen: false });
  const goToSection = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    close();
    // Wait for the scroll lock and inert to lift, then travel.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        api.current.scrollTo(`#${id}`, { focus: true });
        history.replaceState(history.state, "", `#${id}`);
      }),
    );
  };

  const email = profile.socials.find((s) => s.kind === "email")?.href ?? `mailto:${profile.email}`;

  return (
    <div
      ref={panelRef}
      id={PANEL_ID}
      hidden
      data-surface="screen"
      data-scroll="manual"
      className="fixed inset-x-0 top-(--bar) bottom-0 z-(--z-menu) flex flex-col overflow-y-auto bg-graphite text-bone md:hidden"
    >
      <div ref={beamRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-bone opacity-0 shadow-[0_0_12px_1px_color-mix(in_srgb,var(--color-bone)_50%,transparent)]" />
      <nav aria-label="Menu" className="px-margin pt-6">
        <ul>
          {NAV_SECTIONS.map((s) => {
            const current = active === s.id;
            const cls =
              "group flex min-h-16 items-center justify-between gap-4 border-b border-graticule py-3 type-display text-[clamp(2.25rem,11vw,3.5rem)] leading-none";
            const inner = (
              <>
                <span>{s.nav}</span>
                {current ? (
                  <span className="type-label inline-flex items-center gap-2 text-muted">
                    <Led state="on" /> Here
                  </span>
                ) : (
                  <ArrowRight size={22} className="text-dim transition-transform duration-200 ease-panel group-hover:translate-x-1 group-active:translate-x-1" />
                )}
              </>
            );
            return (
              <li key={s.id} data-menu-item="">
                {home ? (
                  <a href={`#${s.id}`} onClick={goToSection(s.id)} className={cls} aria-current={current ? "location" : undefined}>
                    {inner}
                  </a>
                ) : (
                  <TransitionLink href={routes.section(s.id)} className={cls} onClick={close} aria-current={current ? "page" : undefined}>
                    {inner}
                  </TransitionLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto px-margin pt-10 pb-8">
        <div data-menu-item="" className="flex flex-wrap gap-2.5">
          <a href={email} className="btn btn-solid flex-1" data-cta="menu-email">
            <Mail /> Email
          </a>
          <ExternalLink href={profile.resume.href} className="btn flex-1" hint="PDF on Google Drive, opens in a new tab">
            {profile.resume.label}
          </ExternalLink>
        </div>
        <ul data-menu-item="" className="mt-6 grid grid-cols-2 gap-x-4 border-t border-graticule pt-2" aria-label="Elsewhere">
          {profile.socials.map((s) => (
            <li key={s.kind}>
              <ExternalLink href={s.href} arrow={false} className="type-label flex min-h-11 items-center gap-2.5 text-muted transition-colors duration-200 hover:text-bone">
                <SocialIcon kind={s.kind} size={16} />
                {s.label}
              </ExternalLink>
            </li>
          ))}
        </ul>
        <p data-menu-item="" className="type-label mt-5 flex items-center justify-between gap-4 text-dim">
          <TrigIndicator className="inline-flex text-bone" />
          <span>{profile.location}</span>
        </p>
      </div>
    </div>
  );
}
