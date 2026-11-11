"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Terminal } from "@/components/icons";
import { isTypingTarget, openPalette, registerTrigger, togglePalette, usePaletteState } from "./store";

/**
 * COMMAND PALETTE (contract 6). Opens with Ctrl/Cmd+K or "/" (never while typing in a field),
 * from the header trigger, or from anywhere with openPalette(query?).
 *
 * This file is the tiny always-loaded shell: the key listener, the trigger and the store.
 * The panel, the fuzzy search and every command live in ./Body, loaded on first open
 * (or on trigger hover / focus / touch, to hide the latency).
 */
export { openPalette };

const loadBody = () => import("./Body");
const Body = dynamic(loadBody, { ssr: false });

export function CommandPalette() {
  const { open } = usePaletteState();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open) setLoaded(true);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
        return;
      }
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return loaded ? <Body /> : null;
}

const noopSubscribe = () => () => {};
function useIsMac(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}

export function PaletteTrigger({ className }: { className?: string }) {
  const mac = useIsMac();
  const ref = useCallback((el: HTMLButtonElement | null) => registerTrigger(el), []);
  const warm = () => void loadBody();
  return (
    <button
      ref={ref}
      type="button"
      data-qa="palette-trigger"
      aria-haspopup="dialog"
      aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
      aria-label="Open command palette"
      onClick={() => openPalette()}
      onPointerEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      className={`group inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-line-strong bg-card/70 text-ink transition-[background-color,border-color,transform] duration-(--dur-feedback) ease-arrive hover:border-ink hover:bg-lime-soft active:scale-95 min-[1440px]:w-auto min-[1440px]:gap-2.5 min-[1440px]:pr-2 min-[1440px]:pl-3.5 ${className ?? ""}`}
    >
      <Terminal size={18} />
      <kbd className="type-micro hidden min-h-7 items-center rounded-chip border border-line-strong bg-paper px-2 text-ink min-[1440px]:inline-flex">
        {mac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
