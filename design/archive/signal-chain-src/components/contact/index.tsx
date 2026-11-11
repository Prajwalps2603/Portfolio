"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { profile } from "@/content";
import { ExternalLink, Section } from "@/components/ui";
import { ArrowRight, ArrowUpRight, Check, Copy, SocialIcon } from "@/components/icons";
import { useCopy } from "@/lib/hooks/useCopy";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { safeStart } from "@/lib/motion/SplitReveal";

const TZ = "Asia/Kolkata";
const PULSE = 70;

/** Bengaluru local time, refreshed on the minute. Null until mounted (no hydration mismatch). */
function useBengaluruClock() {
  const [now, setNow] = useState<{ text: string; iso: string } | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow({ text: fmt.format(d), iso: d.toISOString() });
      t = setTimeout(tick, 60000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  return now;
}

/** 05 Connect. The output trace draws in under the address; a copy sends a pulse along it. */
export function Contact() {
  const reduced = useReducedMotion();
  const scope = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pulseRef = useRef<SVGPathElement>(null);
  const emailRef = useRef<HTMLAnchorElement>(null);
  const lenRef = useRef(1);
  const drawn = useRef(false);
  const { copy, copied, failed } = useCopy(2400);
  const clock = useBengaluruClock();

  /** Route the trace: a step down at the left, then a rule under the address's last line. */
  const geo = useCallback(() => {
    const svg = svgRef.current, path = pathRef.current, pulse = pulseRef.current, email = emailRef.current;
    if (!svg || !path || !pulse || !email) return;
    const sr = svg.getBoundingClientRect();
    const rects = email.getClientRects();
    const er = email.getBoundingClientRect();
    const last = rects[rects.length - 1] ?? er;
    const y = last.bottom - sr.top - 3;
    const x1 = er.left - sr.left - 14;
    const d = `M0 ${y - 44} H${Math.max(12, x1 - 64)} L${x1 - 20} ${y} H${sr.width}`;
    path.setAttribute("d", d);
    pulse.setAttribute("d", d);
    const len = path.getTotalLength();
    lenRef.current = len;
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = drawn.current || reduced ? "0" : String(len);
    pulse.style.strokeDasharray = `${PULSE} ${len + PULSE}`;
    pulse.style.strokeDashoffset = String(PULSE);
  }, [reduced]);

  useGSAP(
    () => {
      const term = termRef.current, path = pathRef.current;
      if (!term || !path) return;
      geo();
      const ro = new ResizeObserver(geo);
      ro.observe(term);
      document.fonts?.ready.then(geo);
      if (reduced) {
        drawn.current = true;
        return () => ro.disconnect();
      }
      ScrollTrigger.create({
        trigger: term,
        start: () => safeStart(term, "top 80%"),
        once: true,
        onEnter: () => {
          gsap.fromTo(
            path,
            { strokeDashoffset: lenRef.current },
            { strokeDashoffset: 0, duration: DUR.traceDraw, ease: EASE.beam, onComplete: () => { drawn.current = true; } },
          );
        },
      });
      return () => ro.disconnect();
    },
    { scope, dependencies: [reduced, geo] },
  );

  const onCopy = async () => {
    const ok = await copy(profile.email);
    if (ok) {
      const pulse = pulseRef.current;
      if (pulse && !reduced) {
        gsap.fromTo(pulse, { strokeDashoffset: PULSE }, { strokeDashoffset: -lenRef.current, duration: 0.7, ease: EASE.none, overwrite: true });
      }
    } else if (emailRef.current) {
      const r = document.createRange();
      r.selectNodeContents(emailRef.current);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
  };

  const [local, domain] = profile.email.split("@");
  const swap = "col-start-1 row-start-1 inline-flex items-center justify-center gap-2";
  // Exit is faster than entry; reduced motion keeps a plain cross-fade, no travel or blur.
  const dy = reduced ? 0 : 8;
  const blur = reduced ? "blur(0px)" : "blur(3px)";
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <Section id="contact" surface="screen" labelledBy="contact-title" className="overflow-hidden px-margin pt-[var(--section-y)] pb-[clamp(56px,9vh,96px)]">
      <div ref={scope}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <h2 id="contact-title" className="type-display">
            The chain ends with you.
          </h2>
          <p className="type-readout flex flex-col gap-1 pb-2 text-muted md:items-end">
            <span>{profile.location}</span>
            <span className="text-bone">
              <time dateTime={clock?.iso}>{clock ? `${clock.text} IST` : "--:-- IST"}</time>
            </span>
            <span className="inline-flex items-center gap-2 text-ch3">
              <span aria-hidden="true" className="size-[7px] bg-ch3" />
              {profile.availability}
            </span>
          </p>
        </div>

        <div ref={termRef} className="relative mt-[clamp(44px,8vh,90px)]">
          <svg
            ref={svgRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 h-full overflow-visible"
            style={{ left: "calc(-1 * var(--margin))", width: "calc(100% + 2 * var(--margin))" }}
          >
            <path ref={pathRef} fill="none" className="stroke-bone" strokeWidth="1.5" />
            <path ref={pulseRef} fill="none" className="stroke-bone" strokeWidth="3.5" />
          </svg>
          <a
            ref={emailRef}
            href={`mailto:${profile.email}`}
            className="type-email relative inline-block pb-[0.2em] transition-opacity duration-200 hover:opacity-80"
          >
            {local}
            <wbr />@{domain}
          </a>
        </div>

        <div className="mt-[clamp(26px,4.5vh,44px)] flex flex-wrap items-center gap-2.5">
          <button type="button" className="btn btn-solid" data-cta="copy-email" onClick={onCopy} aria-describedby="copy-status">
            <span className="inline-grid">
              {/* Invisible sizer: the button keeps the width of its longer label, so neighbours never shift. */}
              <span aria-hidden="true" className={`${swap} invisible`}>
                <Copy /> Copy address
              </span>
              <AnimatePresence initial={false} mode="popLayout">
                {copied ? (
                  <motion.span
                    key="copied"
                    className={swap}
                    initial={{ opacity: 0, y: dy, filter: blur }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.36, ease } }}
                    exit={{ opacity: 0, y: -dy, filter: blur, transition: { duration: 0.14, ease: "easeIn" } }}
                  >
                    <Check /> Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    className={swap}
                    initial={{ opacity: 0, y: -dy, filter: blur }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.36, ease } }}
                    exit={{ opacity: 0, y: dy, filter: blur, transition: { duration: 0.14, ease: "easeIn" } }}
                  >
                    <Copy /> Copy address
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
          <a className="btn" href={`mailto:${profile.email}?subject=Hello%20Prajwal`}>
            Write an email <ArrowRight />
          </a>
          <ExternalLink className="btn" href={profile.resume.href}>
            {profile.resume.label} <span className="font-normal">PDF, Google Drive</span>
          </ExternalLink>
          <span id="copy-status" role="status" aria-live="polite" className={`type-readout ml-1.5 min-h-[1.4em] ${failed ? "text-ch1" : "text-ch3"}`}>
            {copied ? "Address copied to clipboard" : failed ? "Selected: press Ctrl+C or Cmd+C" : ""}
          </span>
        </div>

        <ul className="rule-t mt-[clamp(56px,10vh,110px)]" aria-label="Elsewhere">
          {profile.socials.map((s) => (
            <li key={s.kind} className="rule-b">
              <ExternalLink
                href={s.href}
                arrow={false}
                className="group grid min-h-[58px] grid-cols-[8.5rem_minmax(0,1fr)_auto] items-center gap-x-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto]"
              >
                <span className="type-label flex items-center gap-2.5 text-muted transition-[color,transform] duration-300 ease-panel group-hover:translate-x-3 group-hover:text-bone group-focus-visible:translate-x-3 group-focus-visible:text-bone">
                  <SocialIcon kind={s.kind} /> {s.label}
                </span>
                <span className="type-lead min-w-0 transition-transform duration-300 ease-panel [overflow-wrap:anywhere] group-hover:translate-x-3 group-focus-visible:translate-x-3">{s.handle}</span>
                <ArrowUpRight className="shrink-0 transition-transform duration-300 ease-panel group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </ExternalLink>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
