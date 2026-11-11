"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { isReducedMotion } from "@/lib/motion/preferences";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { BOOT_FAILSAFE_MS, FROM_SHEET_KEY, bootMode, finishBoot } from "@/lib/motion/boot";
import { stage, type Arrival } from "@/lib/stores/stage";
import { datasheetSlug, normalizePath, withBasePath } from "@/lib/routes";

/**
 * Route transitions for Signal Chain (home <-> /work/[slug]/), one fixed curtain for the app.
 *
 *  Budget: input is blocked only during OUT (<= ~0.4s); OUT + IN stays at or under 0.9s.
 *
 *  1. Screen -> sheet (home -> datasheet), OUT ~0.37s: the origin rectangle (the bench panel)
 *     expands to the viewport (clip-path, 260ms, wipe ease) while a bone sheet wipes left -> right
 *     behind a 2px bone beam (240ms, starting halfway through the expansion); the route changes
 *     under the curtain; the bone curtain is dropped (the datasheet is bone too) and the page runs
 *     its own in-timeline (usePageArrival) with input already live.
 *  2. Sheet -> screen (datasheet -> home), OUT 0.27s + IN 0.45s: graphite wipes right -> left
 *     behind the beam (expo out: it arrives at once and settles onto the left edge); lands on the hash (default #work) with the intro
 *     suppressed; the curtain then keeps travelling left and uncovers home (expo out) with
 *     pointer events already released. stage.returnFrom (set before the route commits, so the
 *     bench sees it on mount) names the system to re-acquire, and "#work" lands on that system's
 *     entry ([data-system]) at the bench's reading line when the bench marks its entries.
 *  3. Skippable: a second click on any transition link or Esc fast-forwards the OUT timeline (the
 *     route changes at once); Esc also finishes the IN wipe. Back/forward during OUT aborts the
 *     curtain (the browser already moved).
 *  4. Back/forward, direct loads, modified clicks: no curtain. Never blocks navigation: a stalled
 *     route change falls back to a hard navigation after 4s.
 *  Reduced motion: a plain crossfade through the destination's material (150ms out, 150ms in,
 *  opacity only, nothing moves).
 */

export type TransitionKind = "to-sheet" | "to-screen";

export type NavigateOptions = {
  /** Default: decided from the destination (/work/* -> to-sheet, / -> to-screen). */
  kind?: TransitionKind;
  /** Element whose rectangle expands to the viewport (screen -> sheet). Optional. */
  origin?: HTMLElement | null;
};

type TransitionApi = {
  /** Play the transition and navigate. Returns false when it declined (caller navigates plainly). */
  navigate: (href: string, options?: NavigateOptions) => boolean;
};

const TransitionContext = createContext<TransitionApi | null>(null);

const STALL_MS = 4000;

type Pending = { kind: TransitionKind; fade: boolean; path: string; hash: string; from: string; stall: number };

function decideKind(from: string, to: string): TransitionKind | null {
  const toPath = normalizePath(to);
  const fromPath = normalizePath(from);
  if (toPath === fromPath) return null;
  if (datasheetSlug(toPath)) return "to-sheet";
  if (toPath === "/") return "to-screen";
  return null;
}

/**
 * Where "/#work" lands when coming back from a datasheet: that system's bench entry
 * ([data-system="<slug>"], placed at the reading line so the bench's scroll sync agrees),
 * else the section itself.
 */
function landing(hash: string, fromSlug: string | null): { el: HTMLElement | null; offset: number } {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (id === "work" && fromSlug) {
    const sys = document.querySelector<HTMLElement>(`[data-system="${CSS.escape(fromSlug)}"]`);
    if (sys) return { el: sys, offset: -Math.round(window.innerHeight * 0.2) };
  }
  return { el: id ? document.getElementById(id) : null, offset: 0 };
}

function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { scrollTo, lock } = useSmoothScroll();
  const curtainRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);

  const pending = useRef<Pending | null>(null);
  /** The running OUT timeline (curtain falling) and IN tween (curtain leaving); null when idle. */
  const outTl = useRef<gsap.core.Timeline | null>(null);
  const inTween = useRef<gsap.core.Tween | null>(null);
  const historyNav = useRef(false);
  const firstPath = useRef(true);
  const scrollApi = useRef({ scrollTo, lock });
  scrollApi.current = { scrollTo, lock };

  // ---- curtain helpers -------------------------------------------------------------------
  const resetCurtain = useCallback(() => {
    const els = [curtainRef.current, screenRef.current, frameRef.current, sheetRef.current, beamRef.current];
    outTl.current?.kill();
    outTl.current = null;
    inTween.current?.kill();
    inTween.current = null;
    gsap.killTweensOf(els);
    if (curtainRef.current) gsap.set(curtainRef.current, { autoAlpha: 0, pointerEvents: "none" });
    if (screenRef.current) gsap.set(screenRef.current, { clipPath: "inset(0% 0% 0% 100%)", opacity: 1 });
    if (frameRef.current) gsap.set(frameRef.current, { opacity: 0 });
    if (sheetRef.current) gsap.set(sheetRef.current, { clipPath: "inset(0% 100% 0% 0%)", opacity: 1 });
    if (beamRef.current) gsap.set(beamRef.current, { opacity: 0, x: 0 });
  }, []);

  const finish = useCallback(() => {
    resetCurtain();
    stage.set({ transition: "idle" });
  }, [resetCurtain]);

  // ---- boot runtime: pages without an intro still reach intro "done"; failsafe for all ------
  useEffect(() => {
    if (bootMode() === "none") finishBoot();
    const t = window.setTimeout(finishBoot, Math.max(0, BOOT_FAILSAFE_MS - performance.now()));
    return () => window.clearTimeout(t);
  }, []);

  // ---- history and bfcache --------------------------------------------------------------
  useEffect(() => {
    const onPop = () => {
      historyNav.current = true;
      if (outTl.current) {
        // Back/forward while the curtain is falling: the browser already moved, so abort the
        // curtain instead of pushing the old destination on top of that choice.
        finish();
        return;
      }
      if (pending.current) {
        window.clearTimeout(pending.current.stall);
        pending.current = null;
        finish();
      }
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) finish();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pageshow", onShow);
    };
  }, [finish]);

  // ---- skip: Esc fast-forwards whichever part of the curtain is running -----------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (outTl.current) outTl.current.progress(1);
      else if (inTween.current) inTween.current.progress(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    resetCurtain();
  }, [resetCurtain]);

  // ---- arrival: runs when the pathname changes ------------------------------------------
  useEffect(() => {
    const here = normalizePath(pathname);
    if (firstPath.current) {
      firstPath.current = false;
      stage.set({ arrival: "load", arrivalPath: here });
      return;
    }
    const p = pending.current;
    if (!p || normalizePath(p.path) !== here) {
      const arrival: Arrival = historyNav.current ? "history" : "plain";
      historyNav.current = false;
      stage.set({ arrival, arrivalPath: here, transition: "idle" });
      return;
    }
    historyNav.current = false;
    window.clearTimeout(p.stall);
    pending.current = null;
    let cancelled = false;

    (async () => {
      // Let the new page commit and run its layout effects (hidden in-timeline states) first.
      await nextFrame();
      await nextFrame();
      if (cancelled) return;
      const { scrollTo: go } = scrollApi.current;
      // IN: input is live at once; the curtain only finishes leaving.
      if (curtainRef.current) gsap.set(curtainRef.current, { pointerEvents: "none" });
      if (p.fade) {
        // Reduced motion: crossfade out of the destination's material. Nothing moves.
        const land = p.kind === "to-screen" ? landing(p.hash, datasheetSlug(p.from)) : { el: null, offset: 0 };
        go(land.el ?? 0, { immediate: true, force: true, offset: land.offset });
        stage.set({ arrival: "plain", arrivalPath: here, transition: "entering" });
        document.getElementById("main")?.focus({ preventScroll: true });
        inTween.current = gsap.to(curtainRef.current, {
          autoAlpha: 0,
          duration: DUR.curtainFade,
          ease: EASE.none,
          onComplete: finish,
        });
        return;
      }
      if (p.kind === "to-sheet") {
        go(0, { immediate: true, force: true });
        stage.set({ arrival: "curtain", arrivalPath: here, transition: "entering" });
        await nextFrame();
        if (cancelled) return;
        // The datasheet is bone like the curtain: drop it and let the page sample its title in.
        finish();
        const main = document.getElementById("main");
        main?.focus({ preventScroll: true });
      } else {
        // "/#work" lands on the bench; a bare "/" (brand, "Return to source") lands at the top.
        const { el: target, offset } = landing(p.hash, datasheetSlug(p.from));
        if (target) go(target, { immediate: true, force: true, offset });
        else go(0, { immediate: true, force: true });
        stage.set({ arrival: "curtain", arrivalPath: here, transition: "entering" });
        if (target) {
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
        await nextFrame();
        if (cancelled) return;
        // The graphite curtain keeps travelling the way it came (right -> left) and uncovers home.
        inTween.current = gsap.to(screenRef.current, {
          clipPath: "inset(0% 100% 0% 0%)",
          duration: DUR.curtainLift,
          ease: EASE.out,
          onComplete: finish,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, finish]);

  // ---- navigate --------------------------------------------------------------------------
  const navigate = useCallback<TransitionApi["navigate"]>(
    (href, options = {}) => {
      if (typeof window === "undefined") return false;
      if (stage.get().transition !== "idle") {
        // A second click mid-curtain means "hurry": fast-forward to the route change.
        if (outTl.current) outTl.current.progress(1);
        return true;
      }
      const url = new URL(href, window.location.href);
      const from = window.location.pathname;
      const kind = options.kind ?? decideKind(from, url.pathname);
      if (!kind) return false;
      const fade = isReducedMotion();
      const curtain = curtainRef.current;
      const screen = screenRef.current;
      const frame = frameRef.current;
      const sheet = sheetRef.current;
      const beam = beamRef.current;
      if (!curtain || !screen || !frame || !sheet || !beam) return false;

      stage.set({ transition: "leaving", menuOpen: false });
      const appHref = `${normalizePath(url.pathname)}${normalizePath(url.pathname) === "/" ? "" : "/"}${url.search}${url.hash}`;
      const go = () => {
        if (kind === "to-screen") {
          // Set before the route commits: the bench reads it once, on mount, to re-acquire this system.
          stage.set({ returnFrom: datasheetSlug(from) });
          try {
            sessionStorage.setItem(FROM_SHEET_KEY, "1");
          } catch {
            // ignore
          }
        }
        const stall = window.setTimeout(() => {
          // The route never arrived: do a hard navigation instead of holding the curtain.
          window.location.assign(withBasePath(appHref));
        }, STALL_MS);
        outTl.current = null;
        pending.current = { kind, fade, path: url.pathname, hash: url.hash, from, stall };
        router.push(appHref, { scroll: false });
      };

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      gsap.set(curtain, { autoAlpha: 1, pointerEvents: "auto" });
      const tl = gsap.timeline({ onComplete: go });
      outTl.current = tl;

      if (fade) {
        // Reduced motion: the destination's material fades in over the page. No wipe, no beam.
        const layer = kind === "to-sheet" ? sheet : screen;
        tl.set(layer, { clipPath: "inset(0% 0% 0% 0%)", opacity: 0 }).to(layer, {
          opacity: 1,
          duration: DUR.curtainFade,
          ease: EASE.none,
        });
      } else if (kind === "to-sheet") {
        const r = options.origin?.getBoundingClientRect();
        if (r && r.width > 0 && r.height > 0) {
          const inset = {
            t: Math.max(0, r.top),
            r: Math.max(0, vw - r.right),
            b: Math.max(0, vh - r.bottom),
            l: Math.max(0, r.left),
          };
          const p = { k: 0 };
          const apply = () => {
            const k = 1 - p.k;
            const ins = `${inset.t * k}px ${inset.r * k}px ${inset.b * k}px ${inset.l * k}px`;
            screen.style.clipPath = `inset(${ins})`;
            frame.style.inset = `${inset.t * k}px ${inset.r * k}px ${inset.b * k}px ${inset.l * k}px`;
          };
          apply();
          tl.set(frame, { opacity: 1 })
            .to(p, { k: 1, duration: DUR.curtainExpand, ease: EASE.wipe, onUpdate: apply })
            .set(frame, { opacity: 0 });
        } else {
          tl.set(screen, { clipPath: "inset(0% 0% 0% 0%)" });
        }
        // The sheet starts while the panel is still opening: one continuous gesture, not two.
        const at = tl.duration() > 0 ? `-=${DUR.curtainExpand / 2}` : 0;
        tl.set(beam, { x: 0, opacity: 1 }, at)
          .fromTo(sheet, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.curtainWipe, ease: EASE.wipe }, "<")
          .fromTo(beam, { x: 0 }, { x: vw - 2, duration: DUR.curtainWipe, ease: EASE.wipe }, "<")
          .set(beam, { opacity: 0 });
      } else {
        tl.set(beam, { x: vw - 2, opacity: 1 })
          .fromTo(screen, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.curtainReturn, ease: EASE.out })
          .fromTo(beam, { x: vw - 2 }, { x: 0, duration: DUR.curtainReturn, ease: EASE.out }, "<")
          .set(beam, { opacity: 0 });
      }
      return true;
    },
    [router],
  );

  const api = useMemo<TransitionApi>(() => ({ navigate }), [navigate]);

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div
        ref={curtainRef}
        aria-hidden="true"
        className="pointer-events-none invisible fixed inset-0 z-(--z-curtain) opacity-0"
      >
        <div ref={screenRef} className="absolute inset-0 bg-graphite [clip-path:inset(0%_0%_0%_100%)]" />
        <div ref={frameRef} className="absolute inset-0 border border-graticule-strong opacity-0" />
        <div ref={sheetRef} className="absolute inset-0 bg-bone [clip-path:inset(0%_100%_0%_0%)]" />
        <div
          ref={beamRef}
          className="absolute inset-y-0 left-0 w-[2px] bg-bone opacity-0 shadow-[0_0_14px_2px_color-mix(in_srgb,var(--color-bone)_55%,transparent)] will-change-transform"
        />
      </div>
    </TransitionContext.Provider>
  );
}

export function usePageTransition(): TransitionApi {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("usePageTransition must be used inside <TransitionProvider>");
  return ctx;
}
