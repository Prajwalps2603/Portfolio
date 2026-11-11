"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useFinePointer, useReducedMotion } from "@/lib/motion/media";
import { subscribePointer } from "@/lib/motion/pointer";
import { onScroll, stage } from "@/lib/stores/stage";
import { registerProbe, type ProbeRect } from "./probe";

/**
 * THE PROBE. The native cursor stays everywhere except inside instrument screens
 * ([data-instrument]: the hero scope, the bench), where on fine pointers it becomes a 22px
 * crosshair with a 6px gap that tracks the pointer 1:1 (no easing, no trail) in difference blend.
 * Over [data-cursor-label] targets four 9px corner brackets fly to the box +5px (220ms,
 * power3.out) with an 11px mono readout naming the action.
 *
 * Keyboard parity: when a labelled target inside an instrument takes :focus-visible, the same
 * brackets and readout seat on it (no crosshair: there is no pointer to mark) and follow it while
 * the page scrolls. The next pointer move hands the probe back to the pointer. The brackets sit
 * outside the element's own focus ring and never replace it.
 *
 * Not rendered on coarse pointers or with reduced motion (the native cursor remains).
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  if (!fine || reduced) return null;
  return <Probe />;
}

const PAD = 5;
/** Around a focus-visible target: clear of the 2px ring at 3px offset (ends at 5px) by 4px. */
const PAD_FOCUS = 9;
const BR = 9;

/** Brackets never sit on a focus ring: step out past it when the target shows one. */
function padFor(el: Element): number {
  return el.matches(":focus-visible") || !!el.querySelector(":focus-visible") ? PAD_FOCUS : PAD;
}

function labelOf(el: Element): string {
  return el.getAttribute("data-cursor-label") ?? el.getAttribute("data-probe") ?? "";
}

function Probe() {
  const rootRef = useRef<HTMLDivElement>(null);
  const xhRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);
  const brRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const xh = xhRef.current;
    const read = readRef.current;
    const brs = brRefs.current.filter((b): b is HTMLElement => !!b);
    if (!root || !xh || !read || brs.length !== 4) return;

    const html = document.documentElement;
    html.classList.add("probe-on");

    let mx = -100;
    let my = -100;
    let inZone = false;
    let domTarget: Element | null = null;
    let domLabel = "";
    let virtual: { rect: ProbeRect; label: string } | null = null;

    const show = (on: boolean) => root.classList.toggle("is-on", on);
    /** The element the brackets are seated on by keyboard focus (not the pointer), if any. */
    let focusEl: Element | null = null;
    const setFocusMode = (on: boolean) => root.classList.toggle("is-focus", on);

    function snap(r: ProbeRect, text: string, pad = PAD) {
      const pts: [number, number][] = [
        [r.left - pad, r.top - pad],
        [r.right + pad - BR, r.top - pad],
        [r.left - pad, r.bottom + pad - BR],
        [r.right + pad - BR, r.bottom + pad - BR],
      ];
      brs.forEach((b, i) =>
        gsap.to(b, { x: pts[i][0], y: pts[i][1], opacity: 1, duration: DUR.probe, ease: EASE.probe, overwrite: true }),
      );
      if (read!.textContent !== text) read!.textContent = text;
      // Readout under the box, or above it near the bottom edge; kept inside the viewport.
      const below = r.bottom + pad + 8;
      const y = below + 18 > window.innerHeight ? r.top - pad - 22 : below;
      const w = read!.offsetWidth || 120;
      const x = Math.min(Math.max(8, r.left - pad), window.innerWidth - w - 8);
      gsap.to(read, { x, y, duration: DUR.probe, ease: EASE.probe, overwrite: true });
      root!.classList.toggle("has-read", text.length > 0);
    }

    function release() {
      brs.forEach((b) =>
        gsap.to(b, { x: mx - 4, y: my - 4, opacity: 0, duration: 0.18, ease: EASE.probe, overwrite: true }),
      );
      root!.classList.remove("has-read");
    }

    /** Decide zone + target for whatever is under the pointer (on move, and on scroll with a still pointer). */
    function evaluate(target: Element | null) {
      const zone =
        !!target?.closest("[data-instrument]") &&
        !target?.closest('[data-cursor="native"]') &&
        stage.get().transition === "idle";
      if (zone !== inZone) {
        inZone = zone;
        show(zone);
      }
      if (!inZone) {
        if (domTarget || virtual) {
          domTarget = null;
          virtual = null;
          release();
        }
        return;
      }
      if (virtual) return;
      const t = target?.closest("[data-cursor-label],[data-probe]") ?? null;
      const label = t ? labelOf(t) : "";
      if (t !== domTarget || label !== domLabel) {
        domTarget = t;
        domLabel = label;
        if (t) snap(t.getBoundingClientRect(), label, padFor(t));
        else release();
      } else if (t) {
        snap(t.getBoundingClientRect(), label, padFor(t)); // same target, but it moved under us
      }
    }

    let seen = false;
    const unsubPointer = subscribePointer(
      (p, e) => {
        if (e.pointerType === "touch") return;
        if (focusEl) {
          focusEl = null;
          setFocusMode(false);
          domTarget = null; // let evaluate() re-snap to whatever is under the pointer
        }
        seen = true;
        mx = p.x;
        my = p.y;
        xh.style.transform = `translate3d(${mx}px, ${my}px, 0)`; // 1:1, no easing
        evaluate(e.target instanceof Element ? e.target : null);
      },
      () => {
        seen = false;
        inZone = false;
        show(false);
      },
    );

    // The page scrolls under a still pointer: re-check what is under it (zone and box).
    const unsubScroll = onScroll(() => {
      if (focusEl) {
        snap(focusEl.getBoundingClientRect(), labelOf(focusEl), PAD_FOCUS);
        return;
      }
      if (!seen) return;
      if (virtual) return;
      evaluate(document.elementFromPoint(mx, my));
    });

    const unregister = registerProbe({
      at(rect, label) {
        virtual = { rect, label };
        snap(rect, label);
      },
      release() {
        if (!virtual) return;
        virtual = null;
        domTarget = null;
        domLabel = "";
        release();
      },
    });

    // Keyboard focus: seat the brackets on a focused, labelled instrument target.
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const t = el?.closest("[data-cursor-label],[data-probe]") ?? null;
      const ok =
        !!el &&
        !!t &&
        el.matches(":focus-visible") &&
        !!t.closest("[data-instrument]") &&
        stage.get().transition === "idle";
      if (!ok) {
        if (focusEl) {
          focusEl = null;
          setFocusMode(false);
          domTarget = null;
          release();
        }
        return;
      }
      focusEl = t;
      domTarget = t;
      domLabel = labelOf(t);
      virtual = null;
      setFocusMode(true);
      snap(t.getBoundingClientRect(), domLabel, PAD_FOCUS);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!focusEl) return;
      // Focus moving to another element is handled by its focusin (re-seat or let go);
      // here only focus leaving for nothing (window blur, removed element).
      if (e.relatedTarget) return;
      focusEl = null;
      setFocusMode(false);
      domTarget = null;
      release();
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    const unsubStage = stage.subscribe(() => {
      if (stage.get().transition !== "idle") {
        if (inZone) {
          inZone = false;
          show(false);
        }
        if (focusEl) {
          focusEl = null;
          setFocusMode(false);
          release();
        }
      }
    });

    return () => {
      unsubPointer();
      unsubScroll();
      unregister();
      unsubStage();
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      gsap.killTweensOf([...brs, read]);
      html.classList.remove("probe-on");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="group pointer-events-none fixed top-0 left-0 z-(--z-cursor) h-0 w-0 text-bone opacity-0 mix-blend-difference transition-opacity duration-150 [&.is-focus]:opacity-100 [&.is-on]:opacity-100"
    >
      {/* Crosshair: 22px arms with a 6px gap at the hotspot. */}
      <div ref={xhRef} className="absolute top-0 left-0 will-change-transform group-[.is-focus]:invisible">
        <i className="absolute top-[-0.5px] left-[-11px] h-px w-[22px] bg-[linear-gradient(90deg,currentColor_0_8px,transparent_8px_14px,currentColor_14px)]" />
        <i className="absolute top-[-11px] left-[-0.5px] h-[22px] w-px bg-[linear-gradient(currentColor_0_8px,transparent_8px_14px,currentColor_14px)]" />
      </div>
      {(["tl", "tr", "bl", "br"] as const).map((corner, i) => (
        <i
          key={corner}
          ref={(el) => {
            brRefs.current[i] = el;
          }}
          className={`absolute top-0 left-0 h-[9px] w-[9px] border-0 border-solid border-current opacity-0 will-change-transform ${
            corner === "tl"
              ? "border-t-[1.5px] border-l-[1.5px]"
              : corner === "tr"
                ? "border-t-[1.5px] border-r-[1.5px]"
                : corner === "bl"
                  ? "border-b-[1.5px] border-l-[1.5px]"
                  : "border-r-[1.5px] border-b-[1.5px]"
          }`}
        />
      ))}
      <span
        ref={readRef}
        className="type-label absolute top-0 left-0 font-semibold whitespace-nowrap opacity-0 transition-opacity duration-150 will-change-transform group-[.has-read]:opacity-100"
      />
    </div>
  );
}
