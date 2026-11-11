"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui";
import { Eye } from "@/components/icons";

/** How long the tip confirms a tap on touch screens (as the header's sketch toggle does). */
const FLASH_MS = 1600;

/**
 * THE X-RAY: the stage's keyboard and touch twin of the hover lens. Pressed, the window shows its
 * sketch (the idea under the shipped UI) until it is pressed again and ships (compile + stamp).
 *
 * An eye, not a pencil: the header's pencil is sketch mode for the whole site, this looks
 * through one window. Constant name "X-ray the sketch" with aria-pressed. A short Caveat tip (the
 * header tip's twin) names it on hover and keyboard focus, says what a press will do next, and
 * confirms a tap on touch screens. Disabled while the whole site is a sketch (nothing to x-ray).
 */
export function XrayToggle({ pressed, disabled, onToggle }: { pressed: boolean; disabled: boolean; onToggle: () => void }) {
  const pointer = useRef("mouse");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(false), FLASH_MS);
    return () => window.clearTimeout(t);
  }, [flash]);

  const onClick = () => {
    // a finger has no hover: confirm a tap that turns the x-ray on (turning it off lands the stamp)
    setFlash(pointer.current !== "mouse" && !pressed);
    pointer.current = "mouse";
    onToggle();
  };

  return (
    <span data-qa="hero-xray-wrap" data-flash={flash ? "" : undefined} className="group/xray relative inline-flex">
      <IconButton
        size="sm"
        label={disabled ? "X-ray the sketch (the whole site is already a sketch)" : "X-ray the sketch"}
        aria-pressed={pressed}
        disabled={disabled}
        icon={<Eye />}
        data-qa="hero-xray"
        onPointerDown={(e) => {
          pointer.current = e.pointerType;
        }}
        onClick={onClick}
        className="peer"
      />
      {/* The header tip's twin (.sk-tip): hand-cut corners, Caveat, a slight tilt, below the button.
          In after a beat on hover, at once on keyboard focus; out faster than in. */}
      <span
        aria-hidden="true"
        data-qa="hero-xray-tip"
        className="type-hand-sm pointer-events-none absolute top-[calc(100%+10px)] right-[-6px] z-(--z-raised) -translate-y-1 rotate-[-2deg] rounded-[6px_9px_7px_10px] border border-line-strong bg-card px-[11px] pt-[3px] pb-[5px] font-bold whitespace-nowrap text-ink opacity-0 shadow-lift transition-[opacity,translate] duration-(--dur-exit) ease-exit group-data-flash/xray:translate-y-0 group-data-flash/xray:opacity-100 group-data-flash/xray:duration-(--dur-ui) group-data-flash/xray:ease-arrive peer-hover:translate-y-0 peer-hover:opacity-100 peer-hover:delay-(--dur-tap) peer-hover:duration-(--dur-ui) peer-hover:ease-arrive peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100 peer-focus-visible:delay-0 peer-focus-visible:duration-(--dur-ui) peer-focus-visible:ease-arrive reduced:translate-none"
      >
        {pressed ? (flash ? "x-ray on" : "ship it again") : "x-ray the sketch"}
      </span>
    </span>
  );
}
