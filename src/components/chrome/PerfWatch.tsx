"use client";

import { useEffect } from "react";
import { watchFrames } from "@/lib/perf";
import { useFinePointer, useReducedMotion } from "@/lib/motion/media";

/**
 * The frame watch (src/lib/perf.ts): on a mouse with full motion, the first ~1.5s of scrolling is
 * timed; a machine that cannot hold ~40 fps switches to lite mode (and remembers it).
 */
export function PerfWatch() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!fine || reduced) return;
    return watchFrames();
  }, [fine, reduced]);
  return null;
}
