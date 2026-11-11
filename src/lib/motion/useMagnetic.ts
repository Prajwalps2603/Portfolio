"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "./gsap";
import { EASE } from "./eases";
import { prefersReducedMotion } from "./media";

type MagneticOptions = {
  /** How far (0..1 of the distance to the pointer) the element follows. */
  strength?: number;
  /** Optional inner element (e.g. the label) that moves further for a layered, parallax feel. */
  innerRef?: RefObject<HTMLElement | null>;
  innerStrength?: number;
};

/**
 * Magnetic hover: the element eases toward the pointer while hovered and settles back on leave
 * (expo out, no bounce). Use on a FEW primary pills only (<Pill magnetic>), never on lists.
 * No-ops on touch devices and with reduced motion.
 */
export function useMagnetic<T extends HTMLElement>(ref: RefObject<T | null>, options: MagneticOptions = {}) {
  const { strength = 0.25, innerRef, innerStrength = 0.5 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || prefersReducedMotion()) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
    const inner = innerRef?.current ?? null;
    const ixTo = inner ? gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3.out" }) : null;
    const iyTo = inner ? gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3.out" }) : null;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      ixTo?.(dx * strength * innerStrength);
      iyTo?.(dy * strength * innerStrength);
    };
    const leave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: EASE.arrive });
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.6, ease: EASE.arrive });
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(el);
      if (inner) gsap.killTweensOf(inner);
    };
  }, [ref, innerRef, strength, innerStrength]);
}
