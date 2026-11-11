"use client";

import { useEffect, useState, type RefObject } from "react";

type InViewOptions = {
  /** IntersectionObserver rootMargin, e.g. "200px 0px" to start a little before entering. */
  rootMargin?: string;
  threshold?: number | number[];
  /** Stop observing after the first time it enters (default false). */
  once?: boolean;
};

/**
 * Is the element on screen? For pausing loops/canvases offscreen and lazy-mounting heavy parts.
 * Server and first render return false.
 *
 *   const inView = useInView(ref, { rootMargin: "200px 0px" });
 */
export function useInView(ref: RefObject<Element | null>, { rootMargin = "0px", threshold = 0, once = false }: InViewOptions = {}): boolean {
  const [inView, setInView] = useState(false);
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : String(threshold);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = !!entry?.isIntersecting;
        setInView(on);
        if (on && once) io.disconnect();
      },
      { rootMargin, threshold: thresholdKey.split(",").map(Number) },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, thresholdKey, once]);
  return inView;
}
