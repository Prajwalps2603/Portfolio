"use client";

import type Lenis from "lenis";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useFinePointer, useReducedMotion } from "./media";
import { useLite } from "@/lib/perf";
import { emitScroll } from "@/lib/stores/stage";
import { normalizePath } from "@/lib/routes";

type ScrollTarget = string | number | HTMLElement;
type ScrollOptions = {
  /** Extra offset in px (negative = stop above the target). */
  offset?: number;
  /** Jump without animation. */
  immediate?: boolean;
  /** Seconds (default 1.2). */
  duration?: number;
  /** Scroll even while locked (route transitions restoring position). */
  force?: boolean;
  /** After scrolling, move keyboard focus to the target (default true for element targets from links). */
  focus?: boolean;
};
type ScrollApi = {
  /** Smoothly scroll to a selector, element or y-offset (instant with reduced motion). */
  scrollTo: (target: ScrollTarget, options?: ScrollOptions) => void;
  /** Lock scrolling (open overlays). Ref-counted by callers: always pair lock(true) with lock(false). */
  lock: (locked: boolean) => void;
  lenis: Lenis | null;
};

const ScrollContext = createContext<ScrollApi | null>(null);

/** Expo-out, the arrival curve (matches --ease-expo). */
const expoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

function resolveTarget(target: ScrollTarget): HTMLElement | null {
  if (typeof target === "number") return null;
  if (typeof target !== "string") return target;
  if (target === "#" || target === "#top") return null;
  try {
    return document.querySelector<HTMLElement>(target);
  } catch {
    return null;
  }
}

function focusTarget(el: HTMLElement) {
  if (!el.matches("a[href],button,input,select,textarea,[tabindex]")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

/**
 * Lenis smooth scrolling driven by GSAP's ticker so ScrollTrigger and Lenis share one clock.
 * - Wheel only (touch keeps native momentum: syncTouch off), so it only exists where there is a
 *   wheel: fine pointers. Touch screens scroll natively, and scrollTo() uses the browser's own
 *   smooth scroll there. Lenis is its own chunk, fetched after hydration (off the first load).
 * - Disabled entirely with reduced motion (native scrolling, instant jumps).
 * - Publishes every scroll frame to the stage scroll bus (onScroll in lib/stores/stage).
 * - Handles same-page anchor links (<a href="#work">, <Link href="/#work"> on home) app-wide:
 *   smooth scroll, update the hash without a history entry, move focus to the target.
 *   "#top" and "#main" scroll to 0. Opt out with data-scroll="manual" on an ancestor.
 * - lock(true/false) (ref-counted) stops scrolling for overlays (the mobile menu).
 * - Refreshes ScrollTrigger after fonts load and whenever the document height changes.
 *
 *   const { scrollTo, lock } = useSmoothScroll();
 *   scrollTo("#work");               // smooth (instant with reduced motion)
 *   scrollTo(el, { offset: -24 });
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  // lite mode (a weak graphics card): native scrolling, which the compositor keeps smooth
  const lite = useLite();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lockCount = useRef(0);

  useEffect(() => {
    if (reduced) {
      setLenis(null);
      return;
    }
    // One clock, never smoothed over a long frame: Lenis, ScrollTrigger and every timeline stay
    // on real time (the opening's failsafe counts real time too). On every device with motion.
    gsap.ticker.lagSmoothing(0);
    if (!fine || lite) {
      setLenis(null);
      return;
    }
    let cancelled = false;
    let dispose = () => {};
    import("lenis")
      .then(({ default: LenisCtor }) => {
        if (cancelled) return;
        const instance = new LenisCtor({
          autoRaf: false,
          lerp: 0.1,
          smoothWheel: true,
          syncTouch: false,
          wheelMultiplier: 1,
        });
        instance.on("scroll", (l: Lenis) => {
          ScrollTrigger.update();
          emitScroll(l.scroll, l.limit, l.velocity);
        });
        const tick = (time: number) => instance.raf(time * 1000);
        gsap.ticker.add(tick);
        setLenis(instance);
        if (lockCount.current > 0) instance.stop();
        dispose = () => {
          gsap.ticker.remove(tick);
          instance.destroy();
        };
      })
      .catch(() => {
        // no chunk (offline): native scrolling, which is what touch screens get anyway
      });
    return () => {
      cancelled = true;
      dispose();
      setLenis(null);
    };
  }, [reduced, fine, lite]);

  // Native scroll publishing (reduced motion, or before Lenis exists).
  useEffect(() => {
    if (lenis) return;
    let lastY = window.scrollY;
    const onNative = () => {
      const y = window.scrollY;
      emitScroll(y, document.documentElement.scrollHeight - window.innerHeight, y - lastY);
      lastY = y;
    };
    onNative();
    window.addEventListener("scroll", onNative, { passive: true });
    return () => window.removeEventListener("scroll", onNative);
  }, [lenis]);

  const api = useMemo<ScrollApi>(
    () => ({
      lenis,
      scrollTo(target, options = {}) {
        const el = resolveTarget(target);
        const top = typeof target === "number" ? target : el ? el.getBoundingClientRect().top + window.scrollY : 0;
        if (lenis) {
          // Lenis caches the page height (debounced 250ms). After a route change the cached
          // limit is the previous page's, which would clamp the jump: re-measure first.
          lenis.resize();
          lenis.scrollTo(el ?? top, {
            offset: options.offset ?? 0,
            immediate: options.immediate,
            force: options.force,
            duration: options.duration ?? 1.2,
            easing: expoOut,
            lock: !options.immediate,
          });
        } else {
          // Touch screens (no Lenis): the browser's own smooth scroll; instant when reduced / asked.
          const instant = options.immediate || reduced;
          window.scrollTo({ top: top + (options.offset ?? 0), behavior: instant ? "auto" : "smooth" });
        }
        if (el && options.focus) focusTarget(el);
      },
      lock(locked) {
        lockCount.current = Math.max(0, lockCount.current + (locked ? 1 : -1));
        const isLocked = lockCount.current > 0;
        if (lenis) {
          if (isLocked) lenis.stop();
          else lenis.start();
        }
        document.documentElement.style.overflow = isLocked ? "hidden" : "";
      },
    }),
    [lenis, reduced],
  );

  // Same-page anchors, app-wide. Capture phase so it runs before next/link's own click handler.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      if (a.closest('[data-scroll="manual"]')) return; // the element handles its own scrolling
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash || url.hash === "#") return;
      if (normalizePath(url.pathname) !== normalizePath(window.location.pathname)) return;
      const hash = decodeURIComponent(url.hash);
      const isTop = hash === "#main" || hash === "#top";
      const el = isTop && hash !== "#main" ? null : resolveTarget(hash);
      if (!isTop && !el) return;
      e.preventDefault();
      if (isTop && hash !== "#main") api.scrollTo(0);
      else if (el) api.scrollTo(el, { immediate: a.dataset.skip !== undefined });
      if (el) focusTarget(el);
      else focusTarget(document.getElementById("main") ?? document.body);
      history.replaceState(history.state, "", url.hash);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [api]);

  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  // Keep ScrollTrigger measurements honest: after fonts load and whenever the page height changes.
  // A refresh measures from the top and puts the scroll back, which cancels a NATIVE smooth scroll
  // still in flight (touch momentum, a smooth anchor jump on a phone) and stops it short. Without
  // Lenis it therefore waits for the scroll to settle: 150ms without a scroll event, at most 1.5s.
  useEffect(() => {
    let t = 0;
    let lastH = document.documentElement.scrollHeight;
    let lastScroll = -Infinity;
    let since = 0;
    const onScroll = () => {
      lastScroll = performance.now();
    };
    const run = () => {
      const now = performance.now();
      const quiet = now - lastScroll;
      if (!lenisRef.current && quiet < 150 && now - since < 1500) {
        t = window.setTimeout(run, 160 - quiet);
        return;
      }
      ScrollTrigger.refresh();
    };
    const refresh = () => {
      window.clearTimeout(t);
      since = performance.now();
      t = window.setTimeout(run, 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.fonts?.ready.then(refresh).catch(() => {});
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) > 1) {
        lastH = h;
        refresh();
      }
    });
    ro.observe(document.body);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}

export function useSmoothScroll(): ScrollApi {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used inside <SmoothScroll>");
  return ctx;
}
