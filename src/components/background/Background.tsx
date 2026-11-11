"use client";

import dynamic from "next/dynamic";
import { useFinePointer, useReducedMotion } from "@/lib/motion/media";
import { useLite } from "@/lib/perf";

const PaperGridCanvas = dynamic(() => import("./PaperGridCanvas"), { ssr: false });

/**
 * The interactive paper background. The static dot grid is pure CSS (the html background in
 * globals.css) and is what touch devices, reduced motion and no-JS get. On fine pointers with
 * full motion, a tiny lazily-loaded 2D canvas adds the pointer lens on top of the same lattice.
 */
export function Background() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const lite = useLite();
  if (!fine || reduced || lite) return null;
  return <PaperGridCanvas />;
}
