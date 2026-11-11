"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useReducedMotion } from "./media";
import { emitScroll } from "@/lib/stores/stage";
import { normalizePath } from "@/lib/routes";

type ScrollTarget = string | number | HTMLElement;
type ScrollOptions = {
  /** Extra offset in px (negative = stop above the target). */
  offset?: number;
  /** Jump without animation. */
  immediate?: boolean;
  /** Seconds (default 1.2, the record-view jump). */
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
 * - Wheel only (touch keeps native momentum: syncTouch off).
 * - Disabled entirely with reduced motion (native scrolling).
 * - Publishes every scroll frame to the stage scroll bus (onScroll in lib/stores/stage).
 * - Handles same-page anchor links (<a href="#work">, <Link href="/#work"> on home) app-wide:
 *   smooth scroll, update the hash without a history entry, move focus to the target.
 * - Refreshes ScrollTrigger after fonts load and whenever the document height changes.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lockCount = useRef(0);

  useEffect(() => {
    if (reduced) {
      setLenis(null);
      return;
    }
    const instance = new Lenis({
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
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);
    if (lockCount.current > 0) instance.stop();
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

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
          window.scrollTo({ top: top + (options.offset ?? 0), behavior: "auto" });
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
    [lenis],
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
      const isTop = hash === "#source" || hash === "#main" || hash === "#top";
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

  // Keep ScrollTrigger measurements honest: after fonts load and whenever the page height changes.
  useEffect(() => {
    let t = 0;
    let lastH = document.documentElement.scrollHeight;
    const refresh = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 160);
    };
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
    };
  }, []);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}

export function useSmoothScroll(): ScrollApi {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used inside <SmoothScroll>");
  return ctx;
}
