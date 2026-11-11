"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { isReducedMotion } from "@/lib/motion/preferences";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { BOOT_FAILSAFE_MS, FROM_CASE_KEY, bootMode, finishBoot } from "@/lib/motion/boot";
import { stage, type Arrival } from "@/lib/stores/stage";
import { caseStudySlug, normalizePath, withBasePath } from "@/lib/routes";
import { roughEdge, roughUnderline } from "@/components/sketch/rough";

/**
 * THE PAGE SHEET: route transitions between home and case studies (and the 404).
 *
 * A sheet of the same paper slides across the screen from the left. Its leading and trailing
 * edges are hand-cut (rough, with a pencil line), and it carries a handwritten label of where
 * you are going ("ResumAI", "home"). Sequence:
 *   OUT  the sheet covers the screen left -> right (0.46s, pen). Input is blocked only here.
 *   ---  the route changes under the sheet; scroll lands (top, or the #hash on home).
 *   IN   the sheet keeps travelling right and uncovers the new page (0.56s, expo out). Input is
 *        already live. The new page may run its own arrival (usePageArrival: arrival "sheet").
 * Skippable: Esc or a second click fast-forwards. Back/forward during OUT aborts. A stalled route
 * falls back to a hard navigation after 4s. Reduced motion: NO sheet (instant navigation).
 * Direct loads, back/forward and modified clicks never show the sheet.
 */

export type NavigateOptions = {
  /** Handwritten label on the sheet (the destination's name). Default: derived from the path. */
  label?: string;
};

type TransitionApi = {
  /** Play the sheet and navigate. Returns false when it declined (the caller navigates plainly). */
  navigate: (href: string, options?: NavigateOptions) => boolean;
};

const TransitionContext = createContext<TransitionApi | null>(null);

const STALL_MS = 4000;
/** Width of each hand-cut edge (px). */
const EDGE = 44;

type Pending = { path: string; hash: string; from: string; stall: number };

function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function labelFor(path: string): string {
  const slug = caseStudySlug(path);
  if (slug) return slug.replace(/-/g, " ");
  return "home";
}

/** The two hand-cut edges, generated once (deterministic). viewBox 0 0 EDGE 1000, stretched to the viewport height. */
const LEAD_EDGE = roughEdge(EDGE * 0.5, -10, 1010, { seed: "sheet-lead", amp: 9, step: 52 });
const TRAIL_EDGE = roughEdge(EDGE * 0.5, -10, 1010, { seed: "sheet-trail", amp: 9, step: 52 });
/** Close an edge path into a fill: paper on one side of the cut. */
function edgeFill(edge: string, side: "left" | "right"): string {
  const x = side === "left" ? 0 : EDGE;
  return `${edge}L${x} 1010L${x} -10Z`;
}
const UNDERLINE = roughUnderline(4, 10, 150, { seed: "sheet-label", style: "swash" });

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { scrollTo, lock } = useSmoothScroll();
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<SVGPathElement>(null);

  const pending = useRef<Pending | null>(null);
  const outTl = useRef<gsap.core.Timeline | null>(null);
  const inTween = useRef<gsap.core.Tween | null>(null);
  const historyNav = useRef(false);
  const firstPath = useRef(true);
  const scrollApi = useRef({ scrollTo, lock });
  useEffect(() => {
    scrollApi.current = { scrollTo, lock };
  }, [scrollTo, lock]);

  // ---- sheet helpers ----------------------------------------------------------------------
  const resetSheet = useCallback(() => {
    outTl.current?.kill();
    outTl.current = null;
    inTween.current?.kill();
    inTween.current = null;
    if (rootRef.current) gsap.set(rootRef.current, { autoAlpha: 0, pointerEvents: "none" });
    if (sheetRef.current) gsap.set(sheetRef.current, { xPercent: -100, x: -EDGE * 2 });
  }, []);

  const finish = useCallback(() => {
    resetSheet();
    stage.set({ transition: "idle" });
  }, [resetSheet]);

  // ---- boot: pages without an opening still reach intro "done"; failsafe for all -----------
  useEffect(() => {
    if (bootMode() === "none") finishBoot();
    const t = window.setTimeout(finishBoot, Math.max(0, BOOT_FAILSAFE_MS - performance.now()));
    return () => window.clearTimeout(t);
  }, []);

  // ---- history and bfcache -----------------------------------------------------------------
  useEffect(() => {
    const onPop = () => {
      historyNav.current = true;
      if (outTl.current || pending.current) {
        if (pending.current) window.clearTimeout(pending.current.stall);
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

  // ---- skip: Esc fast-forwards whichever part is running -------------------------------------
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
    resetSheet();
  }, [resetSheet]);

  // ---- arrival: runs when the pathname changes --------------------------------------------
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
      // Let the new page commit and run its layout effects (its own hidden states) first.
      await nextFrame();
      await nextFrame();
      if (cancelled) return;
      const go = scrollApi.current.scrollTo;
      const id = decodeURIComponent(p.hash.replace(/^#/, ""));
      const target = id ? document.getElementById(id) : null;
      if (target) go(target, { immediate: true, force: true });
      else go(0, { immediate: true, force: true });
      stage.set({ arrival: "sheet", arrivalPath: here, transition: "entering" });
      const focusEl = target ?? document.getElementById("main");
      if (focusEl) {
        if (!focusEl.hasAttribute("tabindex")) focusEl.setAttribute("tabindex", "-1");
        focusEl.focus({ preventScroll: true });
      }
      if (rootRef.current) gsap.set(rootRef.current, { pointerEvents: "none" });
      await nextFrame();
      if (cancelled) return;
      // IN: the sheet keeps travelling right and uncovers the page (input already live).
      inTween.current = gsap.to(sheetRef.current, {
        xPercent: 100,
        x: EDGE * 2,
        duration: DUR.sheetOut,
        ease: EASE.arrive,
        onComplete: finish,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, finish]);

  // ---- navigate ------------------------------------------------------------------------------
  const navigate = useCallback<TransitionApi["navigate"]>(
    (href, options = {}) => {
      if (typeof window === "undefined") return false;
      if (stage.get().transition !== "idle") {
        // A second click mid-sheet means "hurry".
        if (outTl.current) outTl.current.progress(1);
        return true;
      }
      if (isReducedMotion()) return false; // instant, plain navigation
      const url = new URL(href, window.location.href);
      const from = window.location.pathname;
      const toPath = normalizePath(url.pathname);
      if (url.origin !== window.location.origin || toPath === normalizePath(from)) return false;
      const root = rootRef.current;
      const sheet = sheetRef.current;
      if (!root || !sheet) return false;

      stage.set({ transition: "leaving", menuOpen: false });
      if (labelRef.current) labelRef.current.textContent = options.label ?? labelFor(toPath);
      const appHref = `${toPath}${toPath === "/" ? "" : "/"}${url.search}${url.hash}`;

      const go = () => {
        const fromSlug = caseStudySlug(from);
        if (toPath === "/" && fromSlug) {
          // Set before the route commits: the work section may pre-select this project once.
          stage.set({ returnFrom: fromSlug });
        }
        const stall = window.setTimeout(() => {
          // The route never arrived: hard navigation instead of holding the sheet.
          if (toPath === "/") {
            try {
              sessionStorage.setItem(FROM_CASE_KEY, "1");
            } catch {
              // ignore
            }
          }
          window.location.assign(withBasePath(appHref));
        }, STALL_MS);
        outTl.current = null;
        pending.current = { path: url.pathname, hash: url.hash, from, stall };
        router.push(appHref, { scroll: false });
      };

      gsap.set(root, { autoAlpha: 1, pointerEvents: "auto" });
      const tl = gsap.timeline({ onComplete: go });
      outTl.current = tl;
      tl.fromTo(sheet, { xPercent: -100, x: -EDGE * 2 }, { xPercent: 0, x: 0, duration: DUR.sheetIn, ease: EASE.pen });
      if (lineRef.current) {
        const len = 180;
        tl.fromTo(lineRef.current, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.32, ease: EASE.pen }, DUR.sheetIn * 0.55);
      }
      return true;
    },
    [router],
  );

  const api = useMemo<TransitionApi>(() => ({ navigate }), [navigate]);

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div ref={rootRef} aria-hidden="true" className="pointer-events-none invisible fixed inset-0 z-(--z-sheet) overflow-hidden opacity-0">
        <div ref={sheetRef} className="absolute inset-y-0 left-0 w-full will-change-transform" style={{ transform: `translateX(calc(-100% - ${EDGE * 2}px))` }}>
          {/* trailing (left) hand-cut edge */}
          <svg className="absolute inset-y-0 h-full text-ink/70" style={{ left: -EDGE + 1, width: EDGE }} viewBox={`0 0 ${EDGE} 1000`} preserveAspectRatio="none">
            <path d={edgeFill(TRAIL_EDGE, "right")} className="fill-paper" />
            <path d={TRAIL_EDGE} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* the paper */}
          <div className="paper-dots absolute inset-0 bg-paper" />
          {/* leading (right) hand-cut edge */}
          <svg className="absolute inset-y-0 h-full text-ink/70" style={{ right: -EDGE + 1, width: EDGE }} viewBox={`0 0 ${EDGE} 1000`} preserveAspectRatio="none">
            <path d={edgeFill(LEAD_EDGE, "left")} className="fill-paper" />
            <path d={LEAD_EDGE} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* where we are going, handwritten */}
          <div className="absolute inset-0 grid place-items-center">
            <span className="relative inline-flex flex-col items-center">
              <span ref={labelRef} className="type-hand-lg text-ink capitalize" />
              <svg width="168" height="22" viewBox="0 0 168 22" className="mt-1 overflow-visible text-tangerine" aria-hidden="true">
                <path ref={lineRef} d={UNDERLINE} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}

export function usePageTransition(): TransitionApi {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("usePageTransition must be used inside <TransitionProvider>");
  return ctx;
}
