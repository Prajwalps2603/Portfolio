"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type AnchorHTMLAttributes, type ReactNode, type Ref } from "react";
import { usePageTransition } from "./TransitionProvider";

type TransitionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** App path WITHOUT the base path: routes.work("resumai"), routes.section("work"), routes.home. */
  href: string;
  children: ReactNode;
  /** Handwritten label on the page sheet (e.g. the project's shortTitle). Default: from the path. */
  label?: string;
  /**
   * Viewport prefetch. Default OFF: in a static export Next prefetches a route with a HEAD probe
   * of the page (Chromium reports it as net::ERR_ABORTED even on success) plus three segment
   * files, and the home page puts up to six case-study links on screen (the hero cycle, the work
   * stage), so viewport prefetch cost ~24 requests on every home load. Instead every link warms
   * its route on intent (a pointer resting on it for 90ms, focus, touch start), and the page
   * sheet covers the screen for 0.46s while the route arrives. Pass `prefetch` only for a link that is the obvious next
   * step and rarely hovered first.
   */
  prefetch?: boolean;
  ref?: Ref<HTMLAnchorElement>;
};

/** A pointer must MOVE onto a link and then rest this long before it warms. Links sliding under
 *  a still pointer while the page scrolls are not intent: Chromium gives them mouseenter but no
 *  mousemove, so the timer is armed by movement only (a wheel scroll past the work section used
 *  to warm every case study it passed). Focus and touch warm at once. */
const HOVER_INTENT_MS = 90;

/**
 * next/link that plays the page sheet between pages. Use it for EVERY internal page link.
 * - basePath and trailing slashes are handled by next/link.
 * - Same-page hashes ("/#work" while on home) are smooth-scrolled by <SmoothScroll> instead.
 * - Modified clicks (new tab) and reduced motion navigate plainly (no sheet).
 */
export function TransitionLink({ href, label, prefetch, onMouseMove, onMouseLeave, onFocus, onTouchStart, children, ref, ...rest }: TransitionLinkProps) {
  const { navigate } = usePageTransition();
  const router = useRouter();
  const warmed = useRef<string | null>(null);
  const intent = useRef(0);
  useEffect(() => () => window.clearTimeout(intent.current), []);
  const warm = () => {
    // once per destination (a link may change its href, e.g. the hero window as it cycles): the
    // router caches the route, so its HEAD probe never needs to repeat
    if (warmed.current === href) return;
    warmed.current = href;
    try {
      router.prefetch(href);
    } catch {
      // prefetch is best effort
    }
  };
  return (
    <Link
      ref={ref}
      href={href}
      prefetch={prefetch ?? false}
      onNavigate={(e) => {
        if (navigate(href, { label })) e.preventDefault();
      }}
      onMouseMove={(e) => {
        // every move restarts the rest timer; once warmed, nothing more to do for this href
        if (warmed.current !== href) {
          window.clearTimeout(intent.current);
          intent.current = window.setTimeout(warm, HOVER_INTENT_MS);
        }
        onMouseMove?.(e);
      }}
      onMouseLeave={(e) => {
        window.clearTimeout(intent.current);
        onMouseLeave?.(e);
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
