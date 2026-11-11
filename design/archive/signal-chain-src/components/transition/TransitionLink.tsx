"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode, RefObject } from "react";
import { isHomePath } from "@/lib/routes";
import { usePageTransition, type TransitionKind } from "./TransitionProvider";

type TransitionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** App path without the base path, e.g. routes.work("drone-intelligence") or routes.section("work"). */
  href: string;
  children: ReactNode;
  /** Override the automatic choice (/work/* -> to-sheet, / -> to-screen). */
  kind?: TransitionKind;
  /** Element whose rectangle expands into the curtain (the bench panel for "Open datasheet"). */
  origin?: RefObject<HTMLElement | null>;
  /**
   * Viewport prefetch. Default: on for datasheets, OFF for home-bound links ("/", "/#work").
   * Prefetching home makes Next inject home's resource hints (hero CSS, display fonts) into
   * datasheets and the 404, where the browser then warns they were preloaded but unused.
   * Every link still warms its route on intent (hover, focus, touchstart); the curtain's OUT
   * phase covers the remaining fetch.
   */
  prefetch?: boolean;
};

/**
 * next/link that plays the Signal Chain curtain between home and datasheets.
 * - basePath and trailing slashes are handled by next/link / router.push.
 * - Modified clicks (new tab), external URLs fall through to plain navigation; reduced motion
 *   gets a plain crossfade (see TransitionProvider).
 * - Same-page hashes ("/#work" on home) are smooth-scrolled by <SmoothScroll> instead.
 * - A second click while the curtain is falling fast-forwards it.
 */
export function TransitionLink({
  href,
  kind,
  origin,
  prefetch,
  onMouseEnter,
  onFocus,
  onTouchStart,
  children,
  ...rest
}: TransitionLinkProps) {
  const { navigate } = usePageTransition();
  const router = useRouter();
  const toHome = isHomePath(href);
  const warm = () => {
    try {
      router.prefetch(href);
    } catch {
      // prefetch is best effort
    }
  };
  return (
    <Link
      href={href}
      prefetch={prefetch ?? (toHome ? false : undefined)}
      onNavigate={(e) => {
        if (navigate(href, { kind, origin: origin?.current ?? null })) e.preventDefault();
      }}
      onMouseEnter={(e) => {
        warm();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        warm();
        onTouchStart?.(e);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
