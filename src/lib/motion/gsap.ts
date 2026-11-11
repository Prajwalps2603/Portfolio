"use client";

/**
 * The ONE place GSAP is set up. Import GSAP from here, never from "gsap" directly, so plugins and
 * the named eases exist exactly once on the client.
 *
 *   import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
 *   import { EASE, DUR, STAGGER } from "@/lib/motion/eases";
 *
 * In React always use useGSAP({ scope }) (auto-reverts tweens and ScrollTriggers on unmount,
 * StrictMode-safe). Set hidden states from JS (gsap.set / from) so content is visible without JS.
 *
 * First-load weight: only ScrollTrigger (+ useGSAP) is registered here. SplitText and CustomEase
 * are re-exported but NOT registered: registering is what pulls a plugin into every page's first
 * load, and Turbopack drops an unused re-export. A module that needs one registers it where it is
 * used (idempotent), and the plugin then ships only in that module's chunk:
 *
 *   import { gsap, SplitText } from "@/lib/motion/gsap";
 *   gsap.registerPlugin(SplitText);
 *
 * The named "pen" ease is a native cubic-bezier (`cubicBezier` in ./eases), not a CustomEase.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BEZIERS, cubicBezier } from "./eases";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  for (const [name, [x1, y1, x2, y2]] of Object.entries(BEZIERS)) {
    gsap.registerEase(name, cubicBezier(x1, y1, x2, y2));
  }
  // Arrivals default to exponential ease-out; anything else must be chosen on purpose.
  gsap.defaults({ ease: "expo.out", duration: 0.6 });
  // Lenis drives wheel scrolling; ignore mobile address-bar resizes.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };
// Re-exported only (see above): register at the point of use.
export { SplitText } from "gsap/SplitText";
export { CustomEase } from "gsap/CustomEase";
