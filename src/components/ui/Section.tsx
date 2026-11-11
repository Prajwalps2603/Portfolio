import type { ElementType, HTMLAttributes, ReactNode } from "react";
import type { SectionTone } from "@/lib/sections";
import { SketchNote, hasSketchNote } from "./SketchNote";

type SectionProps = Omit<HTMLAttributes<HTMLElement>, "id"> & {
  /** Anchor id (see src/lib/sections.ts). */
  id?: string;
  /** paper (transparent: the dot grid shows) · paper-2 (alternate band) · ink (dark). Default paper. */
  tone?: SectionTone;
  /**
   * Ink only: render as an inset SLAB (rounded 40px, page gutters around it, paper + dots
   * outside), Livora-style. Default false (full-bleed ink).
   */
  slab?: boolean;
  /** Vertical padding: default (--section-y) · compact · none. */
  spacing?: "default" | "compact" | "none";
  /** Skip the .wrap content column (you lay out edge to edge yourself). */
  bleed?: boolean;
  /** id of the section heading (sets aria-labelledby). */
  labelledBy?: string;
  as?: ElementType;
  /** Classes for the inner content column (or the slab). */
  innerClassName?: string;
  /** Force sketch mode's margin note when the section pads its own top (spacing="none" + pt-*). */
  sketchNote?: boolean;
  children: ReactNode;
};

const SPACING = { default: "py-section", compact: "py-[clamp(56px,4vw+32px,104px)]", none: "" } as const;

/**
 * A page section with its material. Sets data-tone ("paper" | "paper-2" | "ink"), which the
 * cursor, the background canvas and the on-ink component styles read.
 *
 *   <Section id="work" tone="paper-2" labelledBy="work-title">...</Section>
 *   <Section id="contact" tone="ink" slab labelledBy="contact-title">...</Section>
 */
export function Section({ id, tone = "paper", slab = false, spacing = "default", bleed = false, labelledBy, as: Tag = "section", className, innerClassName, sketchNote, children, ...rest }: SectionProps) {
  const pad = SPACING[spacing];
  // Sketch mode's margin note (hidden unless html[data-sketch]); only sections with top padding.
  // Its host (the section, or the slab) gets `sk-note-host`: in sketch mode the CSS keeps the
  // note clear of the fixed header and makes room for it above the heading (globals.css).
  const note = (spacing === "default" || sketchNote) && hasSketchNote(id) ? id : null;
  const host = note ? " sk-note-host" : "";
  if (tone === "ink" && slab) {
    return (
      <Tag id={id} data-tone="paper" aria-labelledby={labelledBy} className={`relative py-[clamp(12px,1.6vw,24px)]${className ? ` ${className}` : ""}`} {...rest}>
        <div data-tone="ink" className={`wrap slab-clip relative overflow-hidden rounded-slab bg-ink text-paper ${pad} ${bleed ? "" : "px-[clamp(20px,5vw,80px)]"}${host}${innerClassName ? ` ${innerClassName}` : ""}`}>
          {note ? <SketchNote id={note} slab /> : null}
          {children}
        </div>
      </Tag>
    );
  }
  const toneCls = tone === "ink" ? "bg-ink text-paper" : tone === "paper-2" ? "bg-paper-2 text-ink" : "text-ink";
  return (
    <Tag id={id} data-tone={tone} aria-labelledby={labelledBy} className={`relative ${toneCls} ${pad}${host}${className ? ` ${className}` : ""}`} {...rest}>
      {note ? <SketchNote id={note} /> : null}
      {bleed ? children : <div className={`wrap${innerClassName ? ` ${innerClassName}` : ""}`}>{children}</div>}
    </Tag>
  );
}
