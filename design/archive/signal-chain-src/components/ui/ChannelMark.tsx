import type { CSSProperties } from "react";
import { channel, type ChannelId } from "@/lib/channels";

type ChannelMarkProps = {
  ch: ChannelId;
  /** "screen" (default): filled square in the channel colour with graphite figure.
   *  "sheet": filled square in the channel ink colour with bone figure (datasheets, History). */
  surface?: "screen" | "sheet";
  size?: number;
  className?: string;
};

/**
 * The channel square: "1", "2", "3", "4" or "Σ" in a filled square. Pair it with the layer's
 * text label: colour is never the only cue. Decorative (aria-hidden) because the label next
 * to it says the same thing.
 *
 *   <span className="inline-flex items-center gap-2"><ChannelMark ch={2} /> Services</span>
 */
export function ChannelMark({ ch, surface = "screen", size = 18, className }: ChannelMarkProps) {
  const c = channel(ch);
  const style: CSSProperties = {
    width: size,
    height: size,
    background: surface === "sheet" ? c.ink : c.color,
    color: surface === "sheet" ? "var(--color-bone)" : "var(--color-graphite)",
  };
  return (
    <span
      aria-hidden="true"
      className={`inline-grid flex-none place-items-center font-mono text-label leading-none font-bold [font-stretch:87.5%] ${className ?? ""}`}
      style={style}
    >
      {c.mark}
    </span>
  );
}
