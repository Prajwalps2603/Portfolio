"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { onIdle } from "@/lib/idle";
import { useCompact } from "@/lib/motion/media";
import { stage, useStage } from "@/lib/stores/stage";
import { Close, Menu as MenuIcon } from "@/components/icons";
import { MENU_PANEL_ID as PANEL_ID } from "./menuIds";

/** The panel is its own chunk (./MobileMenuPanel): desktops never fetch it, phones on idle. */
const loadPanel = () => import("./MobileMenuPanel");
/** Until it arrives, an empty hidden twin keeps the toggle's aria-controls pointing at something. */
const Placeholder = () => <div id={PANEL_ID} hidden />;
const Panel = dynamic(loadPanel, { ssr: false, loading: Placeholder });
const warmPanel = () => void loadPanel().catch(() => {});

/** Toggle for the mobile menu (shown below 900px). */
export function MenuButton({ className }: { className?: string }) {
  const open = useStage((s) => s.menuOpen);
  return (
    <button
      type="button"
      data-menu-toggle=""
      data-qa="menu-toggle"
      aria-expanded={open}
      aria-controls={PANEL_ID}
      onClick={() => stage.set({ menuOpen: !open })}
      onPointerDown={warmPanel}
      onFocus={warmPanel}
      className={`pill pill-outline pill-sm gap-2 max-[479.98px]:w-11 max-[479.98px]:px-0${className ? ` ${className}` : ""}`}
    >
      {/* below 480px the word goes (still the accessible name) so the header's controls fit */}
      <span className="max-[479.98px]:sr-only">{open ? "Close" : "Menu"}</span>
      {open ? <Close /> : <MenuIcon />}
    </button>
  );
}

/**
 * Full-screen paper menu (below 900px): see ./MobileMenuPanel. On first load only this shell
 * ships; the panel loads when the browser is idle on compact screens, or the moment the menu is
 * asked for (the toggle warms it on press and focus), whichever comes first.
 */
export function MobileMenu({ home }: { home: boolean }) {
  const open = useStage((s) => s.menuOpen);
  const compact = useCompact();
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    if (wanted) return;
    if (open) {
      setWanted(true);
      return;
    }
    if (compact) return onIdle(() => setWanted(true));
  }, [open, compact, wanted]);
  return wanted ? <Panel home={home} /> : <Placeholder />;
}
