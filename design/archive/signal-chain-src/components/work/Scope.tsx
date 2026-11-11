"use client";

import { useRef } from "react";
import type { Connection } from "@/content/projects";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { ChannelMark, Led } from "@/components/ui";
import { channel } from "@/lib/channels";
import { SCOPE_H, SCOPE_W, tracePath } from "./traffic";
import { LAYER_OF_CHANNEL } from "./layers";

type Props = {
  conns: Connection[];
  /** Connection clipped on each channel (null = free). */
  pins: (string | null)[];
  /** Connection under the pointer: shown on its channel until the pointer leaves. */
  preview: string | null;
  /** Changes when the what-if changes, so the traces re-trigger. */
  signature: string;
  /** Taps on an already-pinned connection, per channel: each one replays the sweep. */
  ping?: number[];
  /** Unpin the connection on a channel (the explicit Release control). */
  onRelease?: (channel: 1 | 2 | 3 | 4) => void;
};

/** Faint 8px graticule behind a trace, the way the screen of a bench scope is ruled. */
const GRATICULE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(color-mix(in srgb, var(--color-graticule) 70%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-graticule) 70%, transparent) 1px, transparent 1px)",
  backgroundSize: "8px 8px",
};

/**
 * The four-channel scope of the bench: one trace per layer, showing the SHAPE of the traffic
 * on the connection clipped to it (request/response pair, server push, pipeline stages...).
 * Kinds of traffic, not measured data: the caption says so. A trace is re-triggered (drawn
 * left to right at constant speed) whenever a probe is clipped or the what-if changes.
 * Reduced motion: traces swap instantly.
 */
export function Scope({ conns, pins, preview, signature, ping = [0, 0, 0, 0], onRelease }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const byId = (id: string | null) => conns.find((c) => c.id === id) ?? null;
  const pv = byId(preview);

  const rows = ([1, 2, 3, 4] as const).map((ch) => {
    const shown = pv && pv.channel === ch ? pv : byId(pins[ch - 1]);
    return { ch, conn: shown, previewing: !!pv && pv.channel === ch };
  });
  const keys = rows.map((r, i) => `${r.conn?.id ?? "-"}:${r.conn?.shape ?? ""}:${r.conn?.idle ? 1 : 0}:${r.conn?.label ?? ""}:${ping[i] ?? 0}`);
  const triggered = rows.some((r) => r.conn && !r.conn.idle);
  const prev = useRef<string[]>(keys);

  // A newly clipped probe (or a what-if) re-triggers its trace: the beam sweeps left to right at constant speed.
  useGSAP(
    () => {
      const before = prev.current;
      prev.current = keys;
      if (reduced || !root.current) return;
      const svgs = gsap.utils.toArray<SVGSVGElement>("[data-scope-svg]", root.current);
      svgs.forEach((el, i) => {
        if (before[i] === keys[i] || el.dataset.flat === "1") return;
        gsap.fromTo(el, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.55, ease: EASE.none, clearProps: "clipPath" });
      });
    },
    { scope: root, dependencies: [keys.join("||"), reduced] },
  );

  const readout = rows
    .filter((r) => r.conn)
    .map((r) => `Channel ${r.ch}: ${r.conn!.label}, ${r.conn!.protocol}, ${r.conn!.idle ? "idle in this mode" : r.conn!.kind}`)
    .join(". ");

  return (
    <div ref={root} className="mt-6 border-t border-graticule pt-4">
      <div className="flex items-center justify-between gap-4">
        <p className="type-label text-muted">Scope: traffic shape</p>
        <p className="type-readout flex items-center gap-2 text-muted" aria-hidden="true">
          <Led state={triggered ? "on" : "off"} color={triggered ? "var(--color-bone)" : undefined} size={6} />
          {triggered ? "Trig’d" : "Auto"}
        </p>
      </div>
      <ol className="mt-3 grid gap-y-1">
        {rows.map(({ ch, conn, previewing }) => {
          const c = channel(ch);
          const idle = !conn || !!conn.idle;
          return (
            <li key={ch} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-center gap-x-4 max-sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] max-sm:gap-x-3">
              <p className="flex min-w-0 items-start gap-2">
                <ChannelMark ch={ch} size={16} className="mt-[3px]" />
                <span className="min-w-0">
                  <span className={`type-readout block truncate ${conn ? "text-bone" : "text-dim"}`}>
                    {conn ? conn.label : `No traffic on ${LAYER_OF_CHANNEL[ch].toLowerCase()}`}
                  </span>
                  {conn ? (
                    <span className="type-readout flex min-w-0 items-center gap-x-3 text-muted">
                      <span className="min-w-0 truncate max-sm:sr-only">
                        {conn.idle ? "idle in this mode" : conn.kind}
                        {previewing ? " (preview)" : ""}
                      </span>
                      {onRelease && pins[ch - 1] === conn.id && !previewing ? (
                        <button
                          type="button"
                          onClick={() => onRelease(ch)}
                          aria-label={`Release the probe on channel ${ch}: ${conn.label}`}
                          data-cursor-label="Release probe"
                          className="relative flex-none text-bone underline decoration-graticule-strong underline-offset-4 transition-colors duration-200 ease-panel after:absolute after:-inset-x-2 after:-inset-y-3.5 hover:decoration-bone active:text-muted"
                        >
                          Release
                        </button>
                      ) : null}
                    </span>
                  ) : null}
                </span>
              </p>
              <svg
                aria-hidden="true"
                data-scope-svg=""
                data-flat={idle ? "1" : "0"}
                viewBox={`0 0 ${SCOPE_W} ${SCOPE_H}`}
                preserveAspectRatio="none"
                className="h-9 w-full"
                style={GRATICULE}
                fill="none"
              >
                <path d={`M0 ${SCOPE_H - 9}H${SCOPE_W}`} stroke="var(--color-graticule-strong)" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray="2 4" />
                <path
                  d={tracePath(conn?.shape ?? "reqres", idle)}
                  stroke={c.color}
                  strokeWidth={1.75}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={idle ? 0.5 : 1}
                />
              </svg>
            </li>
          );
        })}
        <li aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-x-4 max-sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] max-sm:gap-x-3">
          <span className="type-readout text-muted max-sm:hidden">Time base</span>
          <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 w-full" fill="none">
            {Array.from({ length: 11 }, (_, k) => (
              <path
                key={k}
                d={`M${k * 10} 0V${k % 5 === 0 ? 6 : 3}`}
                stroke="var(--color-graticule-strong)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </li>
      </ol>
      <p className="sr-only" aria-live="polite">
        {readout}
      </p>
    </div>
  );
}
