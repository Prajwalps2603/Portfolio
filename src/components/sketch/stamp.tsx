"use client";

import type { CSSProperties, Ref } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";

/**
 * THE SHIPPED STAMP: tangerine rubber stamp with an ink frame and an authored check.
 * It lands with the snap ease (back.out 1.4), the ONLY bounce on the site. Relabelled, it also
 * stamps the certificates (CERTIFIED, 1ST PLACE). Ink text on tangerine (6.8:1); never white on
 * tangerine.
 *
 *   const stampRef = useRef<HTMLSpanElement>(null);
 *   <ShippedStamp ref={stampRef} size="md" className="absolute right-4 bottom-4" />
 *   tl.add(stampIn(stampRef.current!, { impact: windowEl }), 2.0);
 *
 * Hide it before its moment with gsap.set(el, { autoAlpha: 0 }) (or hideStamp(el)), from JS only.
 */

type StampProps = {
  size?: "sm" | "md" | "lg";
  /** Visible label (uppercase via CSS). Default "Shipped". */
  label?: string;
  /** Resting tilt in degrees. Default -7. */
  tilt?: number;
  className?: string;
  style?: CSSProperties;
  /** Hide from assistive tech when the same status is stated elsewhere. */
  decorative?: boolean;
  ref?: Ref<HTMLSpanElement>;
};

export function ShippedStamp({ size = "md", label = "Shipped", tilt = -7, className, style, decorative = false, ref }: StampProps) {
  return (
    <span
      ref={ref}
      data-stamp=""
      aria-hidden={decorative || undefined}
      className={`stamp stamp-${size}${className ? ` ${className}` : ""}`}
      style={{ "--stamp-tilt": `${tilt}deg`, ...style } as CSSProperties}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="stamp-check" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 12.8 9.6 17.6 19.5 6.6" />
      </svg>
      <span>{label}</span>
    </span>
  );
}

/** Hide a stamp until its moment (call from JS, never CSS). */
export function hideStamp(el: Element | null) {
  if (el) gsap.set(el, { autoAlpha: 0 });
}

/**
 * Land the stamp: from big, rotated and transparent to its resting tilt (snap ease, 0.42s).
 * `impact` (optional) gets a 2px press as the stamp hits (e.g. the app window).
 */
export function stampIn(el: Element, { impact, delay = 0, tilt = -7 }: { impact?: Element | null; delay?: number; tilt?: number } = {}) {
  const tl = gsap.timeline({ delay });
  tl.fromTo(
    el,
    { autoAlpha: 0, scale: 1.9, rotation: tilt - 10 },
    { autoAlpha: 1, scale: 1, rotation: tilt, duration: DUR.stamp, ease: EASE.snap, transformOrigin: "50% 50%" },
  );
  if (impact) tl.fromTo(impact, { y: 0 }, { y: 2, duration: 0.07, ease: EASE.exit, yoyo: true, repeat: 1, clearProps: "y" }, DUR.stamp * 0.42);
  return tl;
}
