"use client";

import { useSyncExternalStore } from "react";
import { Terminal } from "@/components/icons";
import { openPalette } from "@/components/palette";

const noop = () => () => {};

/**
 * The footer's cue for the command palette / mini terminal (contract 6): a quiet button that
 * opens it. Keyboards see the shortcut (Ctrl K or Cmd K, and "/"); touch screens just get the
 * invitation. Hidden without JavaScript (the palette needs it).
 */
export function PaletteHint({ className }: { className?: string }) {
  const mac = useSyncExternalStore(
    noop,
    () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent),
    () => false,
  );
  const kbd = "type-micro inline-flex min-h-6 items-center rounded-chip border border-line-strong bg-card px-1.5 text-ink";
  return (
    <button
      type="button"
      data-qa="footer-palette-hint"
      onClick={() => openPalette()}
      className={`group hidden min-h-11 items-center gap-2 rounded-pill pr-2 type-small text-graphite transition-colors duration-(--dur-feedback) hocus:text-ink [.js_&]:inline-flex ${className ?? ""}`}
    >
      <Terminal size={16} className="shrink-0 text-ink" />
      <span className="hidden items-center gap-1.5 fine:inline-flex">
        Press <kbd className={kbd}>{mac ? "⌘K" : "Ctrl K"}</kbd> or <kbd className={kbd}>/</kbd> for the terminal
      </span>
      <span className="fine:hidden">Open the terminal</span>
    </button>
  );
}
