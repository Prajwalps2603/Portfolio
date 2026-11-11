import type { AnchorHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "@/components/icons";

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> & {
  href: string;
  children: ReactNode;
  /** Show the authored arrow-up-right after the label (default true). */
  arrow?: boolean;
  /** Screen-reader hint appended to the accessible name. */
  hint?: string;
};

/**
 * Every link that leaves the site. Opens in a new tab with rel="noopener noreferrer" and tells
 * assistive tech so ("opens in a new tab"). Style it with className (link-mono, btn, ...).
 */
export function ExternalLink({ href, children, arrow = true, hint = "opens in a new tab", className, ...rest }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
      {arrow ? <ArrowUpRight /> : null}
      <span className="sr-only"> ({hint})</span>
    </a>
  );
}
