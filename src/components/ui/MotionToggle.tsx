"use client";

import { setMotionPreference, useMotionPreference } from "@/lib/motion/preferences";

/**
 * "Motion: on / off" switch (WCAG 2.2.2 pause mechanism for the whole site). Overrides the OS
 * setting and persists. Off = the reduced-motion experience everywhere (no opening, no cycling,
 * no lens, no tilt, no scrub, no smooth scroll, 2D keyboard, static background).
 * The footer places it; it adapts to ink sections automatically.
 */
export function MotionToggle({ className }: { className?: string }) {
  const { reduced } = useMotionPreference();
  const on = !reduced;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setMotionPreference(on ? "reduced" : "full")}
      className={`group type-label inline-flex min-h-11 items-center gap-3 rounded-pill px-1 text-graphite transition-colors duration-(--dur-feedback) hocus:text-ink on-ink:text-fog on-ink:hocus:text-paper${className ? ` ${className}` : ""}`}
    >
      <span>Motion</span>
      <span
        aria-hidden="true"
        data-sketch-skip=""
        className={`relative inline-flex h-5 w-9 items-center rounded-pill border-[1.5px] transition-colors duration-(--dur-ui) sketch:bg-transparent ${on ? "border-ink bg-ink on-ink:border-lime on-ink:bg-lime sketch:border-ink/80" : "border-line-strong bg-transparent on-ink:border-ash"}`}
      >
        <span
          className={`absolute top-1/2 size-3 -translate-y-1/2 rounded-full transition-[left,background-color] duration-(--dur-ui) ease-arrive ${on ? "left-[18px] bg-lime on-ink:bg-ink" : "left-[3px] bg-pencil"}`}
        />
      </span>
      {/* fixed width so the switch never shifts between On / Off: 3 glyphs + type-label's 0.1em tracking each */}
      <span className="w-[calc(3ch+0.3em)] text-left">{on ? "On" : "Off"}</span>
    </button>
  );
}
