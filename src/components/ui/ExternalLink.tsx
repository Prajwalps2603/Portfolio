import type { AnchorHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "@/components/icons";

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> & {
  href: string;
  children: ReactNode;
  /** Show the authored arrow-up-right after the label (default true). */
  arrow?: boolean;
  /** Screen-reader hint appended to the accessible name. Default "opens in a new tab". */
  hint?: string;
};

/**
 * Every text link that leaves the site: new tab, rel="noopener noreferrer", and announced as such.
 * Style with className (e.g. "link" for in-text links). Button-like external links: <Pill href>.
 */
export function ExternalLink({ href, children, arrow = true, hint = "opens in a new tab", className, ...rest }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
      {arrow ? <ArrowUpRight className="ml-[0.15em] inline-block size-[0.9em] align-[-0.05em]" /> : null}
      <span className="sr-only"> ({hint})</span>
    </a>
  );
}
