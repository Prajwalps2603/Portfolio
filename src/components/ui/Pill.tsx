"use client";

import { useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { useMagnetic } from "@/lib/motion/useMagnetic";
import { TransitionLink } from "@/components/transition";
import { ArrowUpRight } from "@/components/icons";

export type PillVariant = "primary" | "outline" | "lime" | "ghost";
export type PillSize = "sm" | "md" | "lg";
export type PillNudge = "up-right" | "right" | "down" | "none";

type PillBase = {
  /**
   * primary: ink with paper text (inside an ink section it becomes lime with ink text, automatically).
   * outline: ink outline (paper outline on ink). lime: lime with ink text. ghost: text only.
   */
  variant?: PillVariant;
  /** sm 40px (44 on touch) · md 48px · lg 60px. */
  size?: PillSize;
  /** The pill follows the pointer a little (fine pointers, full motion). Primary CTAs only. */
  magnetic?: boolean;
  /** Trailing icon. External links default to ArrowUpRight; pass null to remove it. */
  icon?: ReactNode;
  /** Leading icon (e.g. <Mail />). */
  iconBefore?: ReactNode;
  /** How the trailing icon moves on hover. Default: "up-right" for external links, "right" otherwise. */
  nudge?: PillNudge;
  className?: string;
  children: ReactNode;
};

type PillLinkProps = PillBase &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children"> & {
    /** Internal path ("/work/x/", "/#work") -> page sheet; "#id" / "mailto:" -> plain link; http(s) -> new tab. */
    href: string;
    /** Force (true) or prevent (false) new-tab behaviour. Default: true for http(s). */
    external?: boolean;
    /** Screen-reader hint for external links. Default "opens in a new tab". */
    hint?: string;
    /** Page-sheet label for internal routes (e.g. the project's shortTitle). */
    label?: string;
  };

type PillButtonProps = PillBase & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

export type PillProps = PillLinkProps | PillButtonProps;

const isExternalHref = (href: string) => /^(https?:)?\/\//.test(href);

/**
 * THE PILL: every button-like action. Hover / keyboard focus sweeps a highlighter fill in from
 * the left (pen ease) and out to the right; press scales to 0.97. Disabled: `disabled` on
 * buttons, aria-disabled="true" on links.
 *
 *   <Pill href={routes.section("work")} icon={<ArrowDown />} nudge="down">See my work</Pill>
 *   <Pill href={profile.resume.href} variant="outline" hint="PDF on Google Drive, opens in a new tab">Résumé</Pill>
 *   <Pill onClick={onCopy} variant="outline" size="sm" iconBefore={<Copy />}>Copy</Pill>
 */
export function Pill(props: PillProps) {
  const { variant = "primary", size = "md", magnetic = false, icon, iconBefore, nudge, className, children } = props;
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const none = useRef<HTMLElement>(null);
  useMagnetic(magnetic ? ref : none, { innerRef: inner });
  const cls = `pill pill-${variant}${size !== "md" ? ` pill-${size}` : ""}${className ? ` ${className}` : ""}`;

  if (props.href !== undefined) {
    const {
      href,
      external,
      hint = "opens in a new tab",
      label,
      variant: _v,
      size: _s,
      magnetic: _m,
      icon: _i,
      iconBefore: _ib,
      nudge: _n,
      className: _c,
      children: _ch,
      ...rest
    } = props;
    const ext = external ?? isExternalHref(href);
    const trailing = icon === undefined ? (ext ? <ArrowUpRight /> : null) : icon;
    const content = (
      <span ref={inner} className="inline-flex items-center gap-[inherit]">
        {iconBefore}
        <span>{children}</span>
        {trailing ? (
          <span data-nudge={nudge ?? (ext ? "up-right" : "right")} className="inline-flex">
            {trailing}
          </span>
        ) : null}
        {ext ? <span className="sr-only"> ({hint})</span> : null}
      </span>
    );
    const aRef = ref as Ref<HTMLAnchorElement>;
    if (ext) {
      return (
        <a ref={aRef} href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
          {content}
        </a>
      );
    }
    if (href.startsWith("#") || /^(mailto|tel):/.test(href)) {
      return (
        <a ref={aRef} href={href} className={cls} {...rest}>
          {content}
        </a>
      );
    }
    return (
      <TransitionLink ref={aRef} href={href} label={label} className={cls} {...rest}>
        {content}
      </TransitionLink>
    );
  }

  const { variant: _v, size: _s, magnetic: _m, icon: _i, iconBefore: _ib, nudge: _n, className: _c, children: _ch, href: _h, type = "button", ...rest } = props;
  return (
    <button ref={ref as Ref<HTMLButtonElement>} type={type} className={cls} {...rest}>
      <span ref={inner} className="inline-flex items-center gap-[inherit]">
        {iconBefore}
        <span>{children}</span>
        {icon ? (
          <span data-nudge={nudge ?? "right"} className="inline-flex">
            {icon}
          </span>
        ) : null}
      </span>
    </button>
  );
}
