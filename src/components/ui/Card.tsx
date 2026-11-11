import type { ElementType, HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  /** Lift on hover (translate -4px + shadow-lift). Use when the whole card is one link or action. */
  interactive?: boolean;
  /** Inner padding: none | sm (20px) | md (24 -> 32px) | lg (32 -> 44px). Default md. */
  padding?: "none" | "sm" | "md" | "lg";
  /** Inside an ink section cards turn ink-2 automatically; "paper" keeps the paper card there. */
  tone?: "auto" | "paper";
  children: ReactNode;
};

const PAD = { none: "", sm: "p-5", md: "p-6 sm:p-8", lg: "p-8 sm:p-11" } as const;

/**
 * The crisp "ship" surface: card background, 1px line border, 28px radius, the soft card shadow.
 * Never nest cards; inside a card use an inner panel: "rounded-panel border border-line bg-paper".
 */
export function Card({ as: Tag = "div", interactive = false, padding = "md", tone = "auto", className, children, ...rest }: CardProps) {
  return (
    <Tag className={`card${interactive ? " card-interactive" : ""}${tone === "paper" ? " card-paper" : ""} ${PAD[padding]}${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </Tag>
  );
}
