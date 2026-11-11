"use client";

import { useRef, type KeyboardEvent } from "react";
import { AppWindowIcon, Diagram } from "@/components/icons";
import type { WorkView } from "./viewStore";

/**
 * "Interface | Architecture": a compact segmented control (a radio group). Arrow keys / Home /
 * End move the choice, one tab stop, the global blue focus ring; the chosen side sits on a blue
 * thumb (blue = interaction) that slides over (instant with reduced motion). JS-only: hidden
 * without JS (no dead controls). `onIntent` fires on hover / focus (warm the lazy diagram).
 * - `inline`: the pinned stage's one switch, a crisp card above the window.
 * - `quiet`: a stacked card's own switch (there is one per card): no fill, no shadow, a hairline
 *   and a shorter body, so six of them down a page stay quiet; on touch each option's hit area
 *   still reaches 44px (a transparent extension above and below, inside the control's padding).
 */

const OPTIONS: { value: WorkView; text: string }[] = [
  { value: "interface", text: "Interface" },
  { value: "architecture", text: "Architecture" },
];

const SURFACE = {
  inline: "bg-card shadow-card",
  quiet: "bg-transparent",
} as const;

const OPTION = {
  inline: "h-9 px-3.5 coarse:h-11",
  quiet: "h-8 px-3 coarse:before:absolute coarse:before:inset-x-0 coarse:before:-inset-y-1.5 coarse:before:content-['']",
} as const;

export function ViewSwitch({
  value,
  onChange,
  onIntent,
  label,
  qa,
  variant = "inline",
  className,
}: {
  value: WorkView;
  onChange: (v: WorkView) => void;
  onIntent?: () => void;
  /** Accessible name of the group. */
  label: string;
  /** data-qa prefix: the group gets `qa`, each option `${qa}-interface` / `${qa}-architecture`. */
  qa: string;
  variant?: "inline" | "quiet";
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const at = Math.max(0, OPTIONS.findIndex((o) => o.value === value));

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % OPTIONS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + OPTIONS.length) % OPTIONS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = OPTIONS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(OPTIONS[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-qa={qa}
      data-value={value}
      className={`relative hidden grid-cols-2 rounded-pill border border-line-strong p-1 ${SURFACE[variant]} [.js_&]:inline-grid ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-pill bg-blue transition-transform duration-(--dur-ui) ease-arrive reduced:transition-none"
        style={{ transform: `translateX(${at * 100}%)` }}
      />
      {OPTIONS.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            data-qa={`${qa}-${o.value}`}
            data-cursor={on ? "native" : "blue"}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            onPointerEnter={onIntent}
            onFocus={onIntent}
            className={`relative inline-flex ${OPTION[variant]} items-center justify-center gap-1.5 rounded-pill font-sans text-mono font-semibold whitespace-nowrap transition-colors duration-(--dur-feedback) ease-arrive sketch:font-hand sketch:text-hand-sm ${on ? "text-paper" : "text-graphite hover:text-ink"}`}
          >
            {o.value === "interface" ? <AppWindowIcon size={16} className="shrink-0" /> : <Diagram size={16} className="shrink-0" />}
            {o.text}
          </button>
        );
      })}
    </div>
  );
}
