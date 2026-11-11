"use client";

/**
 * Single place where GSAP plugins and the named eases are registered. Import GSAP from here,
 * never from "gsap" directly, so plugins and CustomEases exist exactly once on the client.
 *
 *   import { gsap, ScrollTrigger, SplitText, CustomEase, useGSAP } from "@/lib/motion/gsap";
 *   import { EASE, DUR } from "@/lib/motion/eases";
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { CURVES } from "./eases";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  for (const [name, path] of Object.entries(CURVES)) {
    if (!gsap.parseEase(name)) CustomEase.create(name, path);
  }
  // Arrivals default to exponential ease-out; anything else must be chosen on purpose.
  gsap.defaults({ ease: "expo.out", duration: 0.6 });
  // Lenis drives scrolling; let ScrollTrigger ignore mobile address-bar resizes.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, CustomEase, useGSAP };
