"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { routes } from "@/lib/routes";
import type { SectionId } from "@/lib/sections";
import { TransitionLink } from "@/components/transition";

type NavLinkProps = {
  id: SectionId;
  home: boolean;
  current: boolean;
  className: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

/**
 * A link to a home section: a plain hash link on home (SmoothScroll travels), the page sheet
 * from any other page ("/#work").
 */
export function NavLink({ id, home, current, className, children, onClick }: NavLinkProps) {
  if (home) {
    return (
      <a href={`#${id}`} aria-current={current ? "location" : undefined} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <TransitionLink href={routes.section(id)} label="home" className={className} onClick={onClick}>
      {children}
    </TransitionLink>
  );
}
