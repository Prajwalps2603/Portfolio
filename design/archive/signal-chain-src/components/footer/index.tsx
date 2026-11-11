"use client";

import { usePathname } from "next/navigation";
import { profile } from "@/content";
import { isHomePath } from "@/lib/routes";
import { setMotionPreference, setSignals, useMotionPreference, useSignals } from "@/lib/motion/preferences";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { TransitionLink } from "@/components/transition";
import { ExternalLink } from "@/components/ui";
import { ArrowUp, SocialIcon } from "@/components/icons";

/**
 * The footer, rendered by the root layout on every page after <main>: name and elsewhere links,
 * the way back to the source, the build credit, and the REAL motion controls
 * (Motion: full | reduced, Signals: on | paused).
 */
export function Footer() {
  const pathname = usePathname();
  const home = isHomePath(pathname);
  const { scrollTo } = useSmoothScroll();
  const { reduced } = useMotionPreference();
  const signals = useSignals();
  const built = process.env.NEXT_PUBLIC_BUILD_DATE ?? "";
  const ctl =
    "type-label inline-flex min-h-11 items-center border-b border-graticule-strong text-muted transition-colors duration-200 hover:border-bone hover:text-bone";
  const icon =
    "inline-flex size-11 items-center justify-center border border-graticule-strong text-muted transition-colors duration-200 hover:border-bone hover:bg-bone hover:text-graphite active:bg-muted";

  return (
    <footer data-surface="screen" className="border-t border-graticule bg-graphite px-margin pt-10 pb-6 text-bone">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
        <div>
          <p className="type-title">{profile.name}</p>
          <p className="type-small mt-1 text-muted">
            {profile.title}, {profile.location}
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-2" aria-label="Elsewhere">
          {profile.socials.map((s) => (
            <li key={s.kind}>
              <ExternalLink href={s.href} arrow={false} className={icon} hint={`${s.label}, opens in a new tab`}>
                <SocialIcon kind={s.kind} />
              </ExternalLink>
            </li>
          ))}
          <li>
            <ExternalLink href={profile.resume.href} className={`${ctl} ml-3 gap-1.5`}>
              {profile.resume.label}
            </ExternalLink>
          </li>
        </ul>
        {home ? (
          <a
            href="#source"
            className={`${ctl} gap-1.5`}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              scrollTo(0);
              history.replaceState(null, "", "#source");
            }}
            data-scroll="manual"
          >
            Return to source <ArrowUp />
          </a>
        ) : (
          <TransitionLink href="/" className={`${ctl} gap-1.5`}>
            Return to source <ArrowUp />
          </TransitionLink>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-graticule pt-4 text-dim">
        <p className="type-readout max-w-[75ch]">
          &copy; <span className="num">{built.slice(0, 4)}</span> {profile.name} / Next.js, GSAP, Three.js, Motion, WebGL2, Lenis / Set in Archivo and Martian Mono / Static build on GitHub Pages
          {built ? (
            <>
              {" "}/ Built <time dateTime={built}>{built}</time>
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-x-4">
        <button type="button" className={ctl} aria-pressed={reduced} onClick={() => setMotionPreference(reduced ? "full" : "reduced")}>
          Motion: {reduced ? "reduced" : "full"}
        </button>
        <button type="button" className={ctl} aria-pressed={!signals} onClick={() => setSignals(!signals)}>
          Signals: {signals ? "on" : "paused"}
        </button>
        </div>
      </div>
    </footer>
  );
}
