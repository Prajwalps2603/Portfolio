import type { ElementType, ReactNode } from "react";

const DOT = { lime: "bg-lime", blue: "bg-blue", tangerine: "bg-tangerine", ink: "bg-ink", pencil: "bg-pencil" } as const;

type LabelProps = {
  children: ReactNode;
  /** A small highlighter square before the text. */
  dot?: keyof typeof DOT;
  as?: ElementType;
  className?: string;
};

/**
 * A short mono label (12px, uppercase, tracked): metadata that carries information (a file name,
 * a status, a date range). MAX ONE per section, 1-3 words, and never as a decorative kicker
 * stacked above every heading.
 *
 *   <Label dot="tangerine">Now</Label>
 */
export function Label({ children, dot, as: Tag = "p", className }: LabelProps) {
  return (
    <Tag className={`label type-label${className ? ` ${className}` : ""}`}>
      {dot ? <span aria-hidden="true" className={`label-dot ${DOT[dot]}`} /> : null}
      {children}
    </Tag>
  );
}
