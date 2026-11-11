"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "motion/react";
import type { Connection } from "@/content/projects";
import { useReducedMotion } from "@/lib/motion/media";
import { ChannelMark, ExternalLink } from "@/components/ui";
import { channel } from "@/lib/channels";
import type { ResolvedSystem, SysState } from "./system";

/**
 * Readout swap (Motion): the new line arrives from 4px below with expo out (240ms); the old one
 * leaves faster (140ms) with no movement. Reduced motion: an instant swap.
 */
function useSwap() {
  const reduced = useReducedMotion();
  return reduced
    ? { initial: false as const, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, transition: { duration: 0 } }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, transition: { duration: 0.14, ease: [0.55, 0, 1, 0.45] as const } },
        transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
      };
}

type ListProps = {
  title: string;
  conns: Connection[];
  state: SysState;
  onProbe: (id: string) => void;
  onPreview: (id: string | null) => void;
  readme: string;
  /** "pair": always two columns (the instrument panel). "auto": two columns from sm up. */
  columns?: "pair" | "auto";
  /** One line per pin (label only), for the sticky instrument panel. */
  dense?: boolean;
};

/**
 * PINS: every documented connection as a compact button. Pressing one clips a probe on it
 * (aria-pressed): it lights on the board and its traffic shape appears on its scope channel.
 * Pressing one that is already clipped replays its sweep and flashes "Probed"; unclipping is the
 * explicit Release control on the scope row. Hover previews on fine pointers; touch and keyboard
 * use the button.
 */
export function ConnectionList({ title, conns, state, onProbe, onPreview, readme, columns = "auto", dense = false }: ListProps) {
  const probable = conns.filter((c) => c.channel !== "sigma");
  const shown = probable.find((c) => c.id === (state.preview ?? state.last));
  const [flash, setFlash] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swap = useSwap();
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const press = (id: string) => {
    if (state.pins.includes(id)) {
      setFlash(id);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFlash(null), 900);
    }
    onProbe(id);
  };

  return (
    <div>
      <p className="type-label text-muted">
        Connections <span className="sr-only">of {title}</span>
      </p>
      <ul className={`mt-3 grid ${dense ? "gap-1.5" : "gap-2"} ${columns === "pair" ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        {probable.map((c) => {
          const pinned = state.pins.includes(c.id);
          const ch = channel(c.channel);
          return (
            <li key={c.id} className="min-w-0">
              <button
                type="button"
                aria-pressed={pinned}
                onClick={() => press(c.id)}
                onPointerEnter={(e) => e.pointerType === "mouse" && onPreview(c.id)}
                onPointerLeave={() => onPreview(null)}
                data-cursor-label={`Probe: ${c.label}`}
                className={`group grid w-full grid-cols-[16px_minmax(0,1fr)] items-center gap-x-2.5 border px-2.5 ${dense ? "min-h-9 py-1 coarse:min-h-11" : "min-h-11 py-1.5"} text-left transition-[background-color,border-color,transform] duration-200 ease-panel hover:bg-graticule active:scale-[0.985] ${
                  pinned ? "bg-graphite" : "border-graticule-strong"
                }`}
                style={pinned ? { borderColor: ch.color } : undefined}
              >
                <ChannelMark ch={c.channel as 1 | 2 | 3 | 4} size={16} />
                <span className="min-w-0">
                  <span className="type-readout block truncate text-bone">{c.label}</span>
                  <span className={`type-readout truncate text-muted ${dense && flash !== c.id ? "sr-only" : "block"}`} style={flash === c.id ? { color: ch.color } : undefined}>
                    {flash === c.id ? "Probed" : c.idle ? `${c.protocol} / idle` : c.protocol}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="sr-only" aria-live="polite">
        {flash ? `Probed: ${probable.find((c) => c.id === flash)?.label ?? ""}` : ""}
      </p>
      <div className="mt-3 min-h-[3em]" aria-live="polite">
        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait" initial={false}>
            {shown ? (
              <m.p key={shown.id} {...swap} className="type-small max-w-[58ch] text-muted">
                <span className="type-readout text-bone">{shown.label}.</span> {shown.note}{" "}
                <ExternalLink href={readme} className="link-mono" hint="opens the README in a new tab">
                  {shown.source}
                </ExternalLink>
              </m.p>
            ) : null}
          </AnimatePresence>
        </LazyMotion>
      </div>
    </div>
  );
}

type WhatIfProps = {
  system: ResolvedSystem;
  value: number;
  onChange: (i: number) => void;
  /**
   * "always": the effect line is printed for every branch (phones, inside the probe drawer).
   * "changed": the base case needs no caption (the board is the base case); the effect line opens
   * under the switch once another branch is chosen (desktop entries, where height is paced).
   */
  effect?: "always" | "changed";
};

/**
 * WHAT IF: one README-backed branch of the system, as a native radio group set as a segmented
 * switch (the question is the legend). Changing it re-routes the board and the scope; the effect
 * line swaps with Motion (expo out in, faster out; instant with reduced motion).
 */
export function WhatIfControl({ system, value, onChange, effect = "always" }: WhatIfProps) {
  const name = useId();
  const swap = useSwap();
  const reduced = useReducedMotion();
  const showEffect = effect === "always" || value !== 0;
  const { whatIf } = system.record;
  return (
    <fieldset className="min-w-0">
      <legend className="type-lead text-bone">{whatIf.question}</legend>
      <div className={`mt-3 ${whatIf.options.length > 2 ? "grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] pr-px pb-px" : "flex flex-wrap"}`}>
        {whatIf.options.map((o, i) => (
          <label key={o.id} className="relative -mr-px -mb-px cursor-pointer">
            <input
              type="radio"
              name={name}
              checked={i === value}
              onChange={() => onChange(i)}
              className="peer absolute inset-0 size-full cursor-pointer opacity-0"
              data-cursor-label={`Switch: ${o.label}`}
            />
            <span className="type-readout relative flex h-full min-h-11 items-center gap-2.5 border border-graticule-strong px-3.5 py-2 text-muted transition-colors duration-200 ease-panel peer-checked:z-[1] peer-checked:border-bone peer-checked:bg-bone peer-checked:text-graphite peer-hover:text-bone peer-checked:peer-hover:text-graphite peer-active:bg-graticule peer-checked:peer-active:bg-muted peer-focus-visible:z-[2] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-bone">
              <span aria-hidden="true" className="size-1.5 flex-none border border-current" style={i === value ? { background: "currentColor" } : undefined} />
              {o.label}
            </span>
          </label>
        ))}
      </div>
      <div aria-live="polite">
        <LazyMotion features={domAnimation}>
          <AnimatePresence initial={false}>
            {showEffect ? (
              <m.div
                key="effect"
                className="overflow-hidden"
                initial={reduced ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduced ? { height: 0, opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0, transition: { duration: 0.18, ease: [0.55, 0, 1, 0.45] } }}
                transition={reduced ? { duration: 0 } : { duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <m.p key={system.option.id} {...swap} className="type-small max-w-[58ch] pt-3 text-muted">
                    {system.option.effect}{" "}
                    <ExternalLink href={system.record.readme} className="link-mono" hint="opens the README in a new tab">
                      {whatIf.source}
                    </ExternalLink>
                  </m.p>
                </AnimatePresence>
              </m.div>
            ) : null}
          </AnimatePresence>
        </LazyMotion>
      </div>
    </fieldset>
  );
}
