import type { Metadata } from "next";
import { profile } from "@/content";
import { routes } from "@/lib/routes";
import { TransitionLink } from "@/components/transition";
import { ArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: `No signal · ${profile.name}`,
};

/**
 * 404 as an instrument with nothing on the input: a graticule, a flat trace with a little
 * residual noise, and the way back to a live signal.
 */
export default function NotFound() {
  return (
    <section
      data-surface="screen"
      aria-labelledby="nf-title"
      className="relative isolate flex min-h-[max(100svh,600px)] flex-col justify-center overflow-hidden px-margin pt-(--bar) pb-16"
    >
      <div aria-hidden="true" className="graticule absolute inset-x-(--margin) top-[calc(var(--bar)+24px)] bottom-10 -z-10 opacity-70" />
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 top-[62%] -z-10 h-16 w-full text-bone"
        viewBox="0 0 1200 64"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 32 H310 l4 -2 3 3 4 -1 3 1 H690 l3 2 4 -3 3 2 4 -1 H1200"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          opacity="0.85"
        />
      </svg>
      <p className="type-label absolute top-[calc(var(--bar)+36px)] right-(--margin) flex gap-4 text-dim">
        <span>
          CH1-CH4 <span className="text-bone">no input</span>
        </span>
        <span className="num text-bone">404</span>
      </p>
      <div className="max-w-[40rem]">
        <h1 id="nf-title" className="type-display">
          No signal on this channel.
        </h1>
        <p className="type-lead measure mt-6 text-muted">
          This address has nothing connected to it. The rest of the signal chain is one step away.
        </p>
        <div className="mt-10 flex flex-wrap gap-2.5">
          <TransitionLink href={routes.home} className="btn btn-solid" data-cta="nf-home">
            Return to source
          </TransitionLink>
          <TransitionLink href={routes.section("work")} className="btn" data-cta="nf-work">
            See the systems <ArrowRight />
          </TransitionLink>
        </div>
      </div>
    </section>
  );
}
