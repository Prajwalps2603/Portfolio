"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { TransitionLink } from "@/components/transition";

type IconButtonBase = {
  /** Accessible name (required: the control has no visible text). */
  label: string;
  icon: ReactNode;
  /** outline (default, the round arrow button) · ink · lime. */
  variant?: "outline" | "ink" | "lime";
  /** sm 40px (44 on touch) · md 48px · lg 56px. */
  size?: "sm" | "md" | "lg";
  className?: string;
};

type IconLinkProps = IconButtonBase & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children"> & { href: string; external?: boolean };
type IconBtnProps = IconButtonBase & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

/**
 * A round icon-only control. Hover / focus fills it from the centre (expo out); aria-pressed and
 * aria-expanded hold the filled state. Internal hrefs use the page sheet.
 *
 *   <IconButton label="Open the ResumAI case study" icon={<ArrowUpRight />} href={routes.work("resumai")} />
 */
export function IconButton(props: IconLinkProps | IconBtnProps) {
  const { label, icon, variant = "outline", size = "md", className } = props;
  const cls = `icon-btn icon-btn-${variant}${size !== "md" ? ` icon-btn-${size}` : ""}${className ? ` ${className}` : ""}`;
  if (props.href !== undefined) {
    const { href, external, label: _l, icon: _i, variant: _v, size: _s, className: _c, ...rest } = props;
    const ext = external ?? /^(https?:)?\/\//.test(href);
    if (ext) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`} className={cls} {...rest}>
          {icon}
        </a>
      );
    }
    if (href.startsWith("#") || /^(mailto|tel):/.test(href)) {
      return (
        <a href={href} aria-label={label} className={cls} {...rest}>
          {icon}
        </a>
      );
    }
    return (
      <TransitionLink href={href} aria-label={label} className={cls} {...rest}>
        {icon}
      </TransitionLink>
    );
  }
  const { label: _l, icon: _i, variant: _v, size: _s, className: _c, href: _h, type = "button", ...rest } = props;
  return (
    <button type={type} aria-label={label} className={cls} {...rest}>
      {icon}
    </button>
  );
}
