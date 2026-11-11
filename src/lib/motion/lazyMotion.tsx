"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "motion/react";

/**
 * Motion (`motion/react`) for React state swaps, without its full weight on first load.
 * Wrap a swap in <MotionLite> and use the `m` components (`import * as m from "motion/react-m"`)
 * with AnimatePresence: the animation features load in a separate chunk the first time one of
 * these mounts (strict: a full `motion.*` component inside throws, so the weight cannot creep back).
 * Until the features arrive (a few ms after hydration) a swap is simply instant.
 */
const loadFeatures = () => import("./motionFeatures").then((mod) => mod.default);

export function MotionLite({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
