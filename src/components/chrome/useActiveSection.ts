"use client";

import { useEffect } from "react";
import { SECTION_IDS, type SectionId } from "@/lib/sections";
import { stage } from "@/lib/stores/stage";

/**
 * Tracks which home section sits under the reading line (40% down the viewport) and writes it to
 * stage.activeSection (the header highlights its link). Only runs on the home page.
 */
export function useActiveSection(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      stage.set({ activeSection: null });
      return;
    }
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        // the LAST section in document order whose box crosses the reading line
        let current: SectionId | null = null;
        for (const id of SECTION_IDS) if (visible.get(id)) current = id;
        stage.set({ activeSection: current === "top" ? null : current });
      },
      { rootMargin: "-40% 0px -59% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [enabled]);
}
