"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { MotionLite } from "@/lib/motion/lazyMotion";
import { experience, profile } from "@/content";
import { Card, Highlight, LiveDot, Pill, Section } from "@/components/ui";
import { Check, Copy, FileText, SocialIcon } from "@/components/icons";
import { SketchUnderline } from "@/components/sketch";
import { IdeaTicket } from "./IdeaTicket";
import { VisitingCard } from "@/components/card/VisitingCard";
import { useIstClock } from "@/lib/hooks/useIstClock";
import { useCopy } from "@/lib/hooks/useCopy";
import { useReducedMotion } from "@/lib/motion/media";

function CopyEmail() {
  const { copy, copied, failed } = useCopy();
  const reduced = useReducedMotion();
  const label = copied ? "Copied" : failed ? "Copy failed" : "Copy";
  const enter = reduced ? { opacity: 0 } : { opacity: 0, y: 10 };
  const exit = reduced ? { opacity: 0 } : { opacity: 0, y: -10 };
  return (
    <>
      <Pill variant="outline" size="lg" iconBefore={null} onClick={() => copy(profile.email)} className="min-w-40 justify-center" aria-label="Copy email address">
        <span className="relative inline-flex h-6 items-center overflow-hidden">
          <MotionLite>
            <AnimatePresence mode="popLayout" initial={false}>
              <m.span
                key={label}
                initial={enter}
                animate={{ opacity: 1, y: 0 }}
                exit={exit}
                transition={{ duration: reduced ? 0.16 : 0.26, ease: [0.16, 1, 0.3, 1] }}
                className={`inline-flex items-center gap-2 ${copied ? "text-tangerine in-hover:text-tangerine-deep in-focus-visible:text-tangerine-deep" : ""}`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : label}
              </m.span>
            </AnimatePresence>
          </MotionLite>
        </span>
      </Pill>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Email address copied to clipboard" : failed ? "Could not copy. Select the address and copy it manually." : ""}
      </span>
    </>
  );
}

function EmailLink() {
  const [active, setActive] = useState(false);
  const reduced = useReducedMotion();
  return (
    <a
      href={`mailto:${profile.email}`}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && setActive(true)}
      onBlur={() => setActive(false)}
      data-cursor="lime"
      className="relative inline-block w-min max-w-full rounded-chip pb-2 font-display text-[clamp(1.3rem,0.2rem+8vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.03em] transition-colors duration-(--dur-feedback) hocus:text-lime"
    >
      {profile.email.split("@")[0]}
      <wbr />
      {"@" + profile.email.split("@")[1]}
      {(active || (reduced && active)) && (
        <SketchUnderline seed="contact-email" tone="lime" strokeWidth={3} offset={2} style="swash" draw={reduced ? false : "mount"} drawDuration={0.6} />
      )}
    </a>
  );
}

export function Contact() {
  const clock = useIstClock();
  const current = experience[0];
  const role = current?.role ?? profile.title;
  const org = current?.company ?? "Maruti Flex Traders LLP";
  return (
    <Section id="contact" tone="ink" slab labelledBy="contact-title">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-16">
        <div className="min-w-0">
          <h2 id="contact-title" className="type-display text-paper">
            Let&apos;s <Highlight color="lime">build</Highlight> something.
          </h2>
          <p className="type-lead measure mt-5 text-fog">Have an idea, a role or a problem? I reply to every email.</p>

          <p className="mt-10 md:mt-14">
            <EmailLink />
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CopyEmail />
            <Pill href={profile.resume.href} variant="lime" size="lg" iconBefore={<FileText />} hint="PDF on Google Drive, opens in a new tab">
              {profile.resume.label}
            </Pill>
          </div>

          <ul className="mt-10 flex flex-wrap gap-3" aria-label="Find me elsewhere">
            {profile.socials.map((s) => (
              <li key={s.kind}>
                <Pill href={s.href} variant="outline" size="md" iconBefore={<SocialIcon kind={s.kind} />} hint={`${s.label}, ${s.handle}, opens in a new tab`}>
                  {s.label}
                </Pill>
              </li>
            ))}
          </ul>
        </div>

        {/* the right column: the visiting card up top, beside the heading (tilted, like a card left on a
            desk), the "Now" card (the Bengaluru time, role, availability) at the bottom */}
        <div className="flex min-w-0 flex-col gap-12 lg:justify-between lg:self-stretch">
          <div className="w-full max-w-[25rem] lg:px-3 lg:pt-4">
            <VisitingCard tilt />
          </div>
          <Card padding="md" className="min-w-0" aria-labelledby="now-title">
            <h3 id="now-title" className="type-label flex items-center gap-2 text-tangerine">
              <LiveDot tone="tangerine" /> Now
            </h3>
            <p className="mt-5 font-display text-[clamp(2.25rem,1.5rem+3vw,3.5rem)] font-bold leading-none tracking-[-0.03em] tabular-nums text-paper" style={{ minHeight: "1em" }}>
              {clock ? <time dateTime={clock.iso}>{clock.time}</time> : <span aria-hidden="true">&nbsp;</span>}
            </p>
            <p className="type-mono mt-2 text-fog">
              Bengaluru · IST{clock ? ` · ${clock.day}` : ""}
            </p>
            <hr className="my-5 border-seam" />
            <p className="type-h4 text-paper">
              {role} at {org}
            </p>
            <p className="type-small mt-2 flex items-center gap-2 text-fog">
              <LiveDot tone="lime" pulse={false} /> {profile.availability}
            </p>
          </Card>
        </div>
      </div>

      <div className="mt-16 border-t border-seam pt-14 md:mt-20 md:pt-16">
        <IdeaTicket />
      </div>
    </Section>
  );
}
