"use client";

import type { ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { gsap } from "@/lib/motion/gsap";

/**
 * DEV-ONLY MINI-UI LAB (never in production builds: guarded by NODE_ENV, inert unless asked).
 * Renders every template side by side over any page that has a MiniUI, for visual QA:
 *
 *   window.__MINIUI_LAB__ = { width: 560, state: "ship", pairs: true };
 *   window.dispatchEvent(new Event("miniui:lab"));          // apply / update
 *   window.__MINIUI_LAB__ = undefined; dispatch again        // remove
 *
 * Screenshot it with `--selector "[data-miniui-lab]"`.
 */

type LabConfig = {
  /** Width of each MiniUI in px. Default 560. */
  width?: number;
  state?: "sketch" | "ship";
  size?: "sm" | "md" | "lg";
  projects?: string[];
  /** Render each project twice: sketch beside ship. */
  pairs?: boolean;
  /** Columns (default: 2 with pairs, else 3). */
  cols?: number;
  stamp?: boolean;
  /** GSAP global time scale while the lab is open (0.2 = five times slower, for filmstrips). */
  slow?: number;
};

type LabMiniUI = ComponentType<{ projectId: string; state?: "sketch" | "ship"; size?: "sm" | "md" | "lg"; stamp?: boolean }>;

declare global {
  interface Window {
    __MINIUI_LAB__?: LabConfig;
    __miniuiLab?: { root: Root | null; host: HTMLElement | null; MiniUI: LabMiniUI | null; listening: boolean; projects: readonly string[] };
  }
}

function LabGrid({ MiniUI, cfg, projects }: { MiniUI: LabMiniUI; cfg: LabConfig; projects: readonly string[] }) {
  const width = cfg.width ?? 560;
  const list = cfg.projects ?? projects;
  const cols = cfg.cols ?? (cfg.pairs ? 2 : 3);
  const items = cfg.pairs ? list.flatMap((id) => [{ id, state: "sketch" as const }, { id, state: "ship" as const }]) : list.map((id) => ({ id, state: cfg.state ?? ("ship" as const) }));
  return (
    <div data-miniui-lab="" className="absolute top-0 left-0 z-(--z-skip) w-max min-w-full bg-paper p-8">
      <div className="grid gap-x-8 gap-y-10" style={{ gridTemplateColumns: `repeat(${cols}, ${width}px)` }}>
        {items.map((it, i) => (
          <div key={cfg.pairs ? `${it.id}-${it.state}` : it.id} className="flex flex-col gap-2">
            <p className="type-mono text-graphite">
              {it.id} · {width}px · {it.state} · {cfg.size ?? "md"}
            </p>
            <MiniUI projectId={it.id} state={it.state} size={cfg.size ?? "md"} stamp={cfg.stamp ?? false} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function startLab(MiniUI: LabMiniUI, projects: readonly string[]) {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return;
  const lab = (window.__miniuiLab ??= { root: null, host: null, MiniUI: null, listening: false, projects });
  lab.MiniUI = MiniUI;
  lab.projects = projects;
  const sync = () => {
    const cfg = window.__MINIUI_LAB__;
    gsap.globalTimeline.timeScale(cfg?.slow ?? 1);
    if (!cfg) {
      lab.root?.unmount();
      lab.host?.remove();
      lab.root = null;
      lab.host = null;
      return;
    }
    if (!lab.root || !lab.host) {
      lab.host = document.createElement("div");
      lab.host.id = "miniui-lab-host";
      document.body.appendChild(lab.host);
      lab.root = createRoot(lab.host);
    }
    if (lab.MiniUI) lab.root.render(<LabGrid MiniUI={lab.MiniUI} cfg={{ ...cfg }} projects={lab.projects} />);
  };
  if (!lab.listening) {
    lab.listening = true;
    window.addEventListener("miniui:lab", sync);
  }
  window.setTimeout(sync, 0);
}
