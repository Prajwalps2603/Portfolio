import type { ElementType, ReactNode } from "react";

type TagProps = {
  children: ReactNode;
  /** outline (default) · lime · blue · tangerine (soft washes, ink text) · ink. */
  tone?: "outline" | "lime" | "blue" | "tangerine" | "ink";
  /** Uppercase + tracking (short category words only). Default natural case (stack names). */
  caps?: boolean;
  as?: ElementType;
  className?: string;
};

/**
 * A small mono pill for stack items and categories ("Spring Boot", "AI PLATFORM"). Not a button:
 * if it is clickable, use <Pill size="sm" variant="ghost"> instead.
 *
 *   <ul className="flex flex-wrap gap-2">{stack.map((s) => <Tag as="li" key={s}>{s}</Tag>)}</ul>
 */
export function Tag({ children, tone = "outline", caps = false, as: El = "span", className }: TagProps) {
  return <El className={`tag tag-${tone}${caps ? " tag-caps" : ""}${className ? ` ${className}` : ""}`}>{children}</El>;
}
