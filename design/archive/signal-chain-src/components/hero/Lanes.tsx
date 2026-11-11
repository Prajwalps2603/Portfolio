"use client";

import { skillGroups } from "@/content";
import { CHANNELS, channelForLayer, type Channel } from "@/lib/channels";
import { ChannelMark } from "@/components/ui";
import css from "./hero.module.css";

/** The tech that sits on each lane, straight from the skills content (no ratings, no counts). */
function techFor(ch: Channel): string[] {
  const group = skillGroups.find((g) => channelForLayer(g.layer)?.id === ch.id);
  return group ? group.skills.map((s) => s.name) : [];
}

const LANES = CHANNELS.map((ch) => ({ ch, tech: techFor(ch) }));

type LanesProps = {
  /** Index of the open lane (0..3 channels, 4 = Σ), -1 for none. */
  open: number;
  onFocusLane: (i: number) => void;
  onBlurLane: (i: number) => void;
  onToggleLane: (i: number) => void;
};

/** On portrait, the last two lanes open upward so their panel never runs into the status row. */
const OPENS_UP = new Set([3, 4]);

/**
 * The lane legend: five rows that the scene draws its traces through (CH1-CH4 + Σ). Each chip
 * is a real button: hover (via the hero probe), focus or tap opens the layer's tech list.
 * The rows are measured by useScopeLayout, so the traces follow the DOM, never the reverse.
 *
 * Phones (< 600px): the chip is the 44px channel square alone, so the traces stay visible
 * across the width; the layer name moves into the panel (it is still the button's name).
 * While a lane is open the whole list rises above the status row and the trigger handle.
 */
export function Lanes({ open, onFocusLane, onBlurLane, onToggleLane }: LanesProps) {
  return (
    <ul
      aria-label="What I build, layer by layer"
      className={`pointer-events-none absolute inset-x-0 top-[max(56%,calc(var(--bar)+23rem))] bottom-[11.5%] grid grid-rows-5 portrait:top-[60%] portrait:bottom-[14%] max-[600px]:portrait:top-[55%] max-[600px]:portrait:bottom-[11%] sm:portrait:top-[50%] sm:portrait:bottom-[12%] ${open >= 0 ? "z-(--z-raised)" : "z-(--z-content)"}`}
    >
      {LANES.map(({ ch, tech }, i) => {
        const isOpen = open === i;
        const panelId = `lane-${ch.key}`;
        const sigma = ch.id === "sigma";
        const up = OPENS_UP.has(i);
        return (
          <li key={ch.key} data-lane={i} className="relative" style={{ ["--c" as string]: ch.color }}>
            <div className={`absolute top-1/2 left-(--margin) flex -translate-y-1/2 items-stretch ${isOpen ? "z-(--z-raised)" : ""}`}>
              <span data-boot="" className="pointer-events-auto block">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  data-cursor-label={sigma ? "Probe: the sum" : `Probe: ${ch.label.toLowerCase()} layer`}
                  onFocus={() => onFocusLane(i)}
                  onBlur={() => onBlurLane(i)}
                  onClick={() => onToggleLane(i)}
                  className="flex min-h-[30px] items-center gap-2.5 border border-graticule bg-graphite py-1.5 pr-2.5 pl-1.5 text-bone transition-[border-color,background-color] duration-(--dur-chip) ease-panel hover:border-(--c) aria-expanded:border-(--c) aria-expanded:bg-graphite coarse:min-h-11 coarse:pr-3 coarse:pl-2 max-[600px]:size-11 max-[600px]:justify-center max-[600px]:p-0"
                >
                  <ChannelMark ch={ch.id} size={20} />
                  <span className="type-label whitespace-nowrap max-[600px]:sr-only">{ch.label}</span>
                </button>
              </span>
              <p
                id={panelId}
                data-open={isOpen}
                data-up={up}
                className={`${css.panel} type-readout pointer-events-auto absolute top-0 left-full flex min-h-full w-max max-w-[min(104ch,calc(100vw-2*var(--margin)-15rem))] items-center border border-(--c) bg-graphite px-3 py-1.5 text-muted portrait:left-0 portrait:max-w-[calc(100vw-2*var(--margin)-0.5rem)] ${up ? "portrait:top-auto portrait:bottom-full portrait:mb-1" : "portrait:top-full portrait:mt-1"} max-[600px]:min-h-11`}
              >
                <span>
                  {/* Phones: the chip is mark-only, so the layer name leads the panel. */}
                  <span aria-hidden="true" className="type-label mr-2.5 hidden font-bold text-bone max-[600px]:inline">
                    {ch.label}
                  </span>
                  {sigma ? (
                    <>
                      <span className="text-bone">= 1 + 2 + 3 + 4</span>, delivered with {tech.join(" · ")}
                    </>
                  ) : (
                    tech.join(" · ")
                  )}
                </span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
