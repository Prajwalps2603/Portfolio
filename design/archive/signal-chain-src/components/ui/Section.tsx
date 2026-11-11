import type { HTMLAttributes, ReactNode } from "react";
import type { SectionId } from "@/lib/sections";

type SectionProps = Omit<HTMLAttributes<HTMLElement>, "id"> & {
  id: SectionId;
  /** Material. Screens are graphite (live signals); sheets are bone (records). */
  surface: "screen" | "sheet";
  /** id of the section's heading (every section is aria-labelledby its h2). */
  labelledBy: string;
  /** Mark the whole section as a probe zone (custom cursor). Prefer marking only the instrument. */
  instrument?: boolean;
  children: ReactNode;
};

/**
 * The home-page section shell: id (anchor contract), material, landmark labelling, and the
 * base colours of its material. Padding and layout are the section's own business.
 */
export function Section({ id, surface, labelledBy, instrument, className, children, ...rest }: SectionProps) {
  return (
    <section
      id={id}
      data-surface={surface}
      data-instrument={instrument ? "" : undefined}
      aria-labelledby={labelledBy}
      className={`relative ${surface === "sheet" ? "bg-bone text-ink" : "bg-graphite text-bone"} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </section>
  );
}
