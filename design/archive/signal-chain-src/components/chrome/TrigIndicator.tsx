"use client";

import { useStage } from "@/lib/stores/stage";
import { Led } from "@/components/ui";

/**
 * Top-bar trigger status. TRIG'D (steady) while the hero is locked; AUTO (2Hz blink) while
 * the trigger is dragged off the signal or the opening is free-running. Driven by
 * stage.trigger, which only the hero writes. Decorative: the hero's trigger slider carries the
 * state for assistive tech (aria-valuetext "Locked" / "Untriggered").
 * [data-boot]: hidden during the opening until the intro reveals the chrome.
 */
export function TrigIndicator({ className }: { className?: string }) {
  const trigger = useStage((s) => s.trigger);
  const locked = trigger === "locked";
  return (
    <span
      aria-hidden="true"
      data-boot=""
      data-trig-indicator=""
      className={`type-label items-center gap-2 font-semibold ${className ?? ""}`}
    >
      <Led state={locked ? "on" : "blink"} />
      <span className="min-w-[6.5ch]">{locked ? "Trig’d" : "Auto"}</span>
    </span>
  );
}
