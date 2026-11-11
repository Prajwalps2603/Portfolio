"use client";

import { usePathname } from "next/navigation";
import { useStage, type Arrival } from "@/lib/stores/stage";
import { normalizePath } from "@/lib/routes";

/**
 * For destination pages (case studies): how did we get here, and may the arrival start?
 *
 * - arrival: "load" (direct load / refresh), "sheet" (the page sheet played), "history"
 *            (back/forward), "plain" (any other client navigation, reduced motion).
 * - ready:   true once the sheet has covered the screen and this page owns it.
 *
 *   const { arrival, ready } = usePageArrival();
 *   const enter = ready && (arrival === "sheet" || arrival === "load");
 *   <MiniUI projectId={id} autoplay={enter} />
 */
export function usePageArrival(): { arrival: Arrival; ready: boolean } {
  const pathname = usePathname();
  const arrival = useStage((s) => s.arrival);
  const arrivalPath = useStage((s) => s.arrivalPath);
  const transition = useStage((s) => s.transition);
  const current = arrivalPath === normalizePath(pathname);
  return { arrival: current ? arrival : "plain", ready: current && transition !== "leaving" };
}
