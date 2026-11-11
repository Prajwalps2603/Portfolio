"use client";

import { usePathname } from "next/navigation";
import { useStage, type Arrival } from "@/lib/stores/stage";
import { normalizePath } from "@/lib/routes";

/**
 * For destination pages: how did we get here, and may the in-timeline start?
 *
 * - arrival: "load" (direct load / refresh), "curtain" (a TransitionLink played the curtain),
 *            "history" (back/forward), "plain" (any other client navigation, reduced motion).
 * - ready:   true once the curtain has finished covering and this page owns the screen.
 *
 * Datasheet pattern (screen -> sheet):
 *   const { arrival, ready } = usePageArrival();
 *   const enter = ready && arrival === "curtain";
 *   <SampledText as="h1" play={enter} ... />
 *   useGSAP(() => { if (!enter || reduced) return; gsap.from("[data-rise]", { y: 18, autoAlpha: 0,
 *     duration: DUR.wipe, ease: EASE.out, stagger: STAGGER.sheet }); }, { scope, dependencies: [enter, reduced] });
 *
 * Direct loads and back/forward get no curtain and no sampling (at most a 200ms fade).
 */
export function usePageArrival(): { arrival: Arrival; ready: boolean } {
  const pathname = usePathname();
  const arrival = useStage((s) => s.arrival);
  const arrivalPath = useStage((s) => s.arrivalPath);
  const transition = useStage((s) => s.transition);
  const current = arrivalPath === normalizePath(pathname);
  return { arrival: current ? arrival : "plain", ready: current && transition !== "leaving" };
}
