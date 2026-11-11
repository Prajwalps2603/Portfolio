"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { profile } from "@/content";
import { Pill } from "@/components/ui";
import { Scribble, ShippedStamp, SketchRect } from "@/components/sketch";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { useCopy } from "@/lib/hooks/useCopy";
import { getSketchMode, useSketchMode } from "@/lib/stores/sketchMode";
import { routes } from "@/lib/routes";

const MAX = 120;

function mailtoFor(idea: string) {
  const subject = `Let's build: ${idea}`;
  const body = `Hi Prajwal,\n\nI have an idea: ${idea}\n\nA bit more about it:\n- \n\nBest,\n`;
  return `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** "Sketch your idea": type on a sticky note, ship it as a ticket, open a prefilled email. */
export function IdeaTicket() {
  const reduced = useReducedMotion();
  const { on: sketchMode } = useSketchMode();
  const uid = useId();
  const inputId = `${uid}-idea`;
  const [value, setValue] = useState("");
  const [idea, setIdea] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | null>(null);
  const shipped = idea !== null;
  const { copy, copied, failed } = useCopy();

  const { contextSafe } = useGSAP({ scope: root });

  // The compile: strokes tighten, the card fills left to right, rows arrive, the stamp lands.
  useGSAP(
    () => {
      const ticket = ticketRef.current;
      if (!idea || !ticket) return;
      const note = noteRef.current;
      const strokes = ticket.querySelector("[data-strokes]");
      const fill = ticket.querySelector("[data-fill]");
      const bits = ticket.querySelectorAll("[data-bit]");
      const stamp = stampRef.current;
      if (reduced) {
        gsap.set(note, { autoAlpha: 0 });
        gsap.set([ticket, stamp, bits], { autoAlpha: 1 });
        return;
      }
      const tl = gsap.timeline();
      tl.to(note, { autoAlpha: 0, scale: 0.94, y: -10, duration: DUR.exit, ease: EASE.exit }, 0);
      tl.set(ticket, { autoAlpha: 1 }, 0.05);
      tl.fromTo(ticket, { rotate: -4, scale: 0.96 }, { rotate: -1.2, scale: 1, duration: DUR.compile, ease: EASE.arrive }, 0.05);
      tl.fromTo(strokes, { opacity: 1 }, { opacity: getSketchMode() ? 1 : 0.35, duration: DUR.compile * 0.7, ease: EASE.pen }, 0.1 + DUR.compile * 0.3);
      tl.fromTo(fill, { clipPath: "inset(0 100% 0 0 round 20px)" }, { clipPath: "inset(0 0% 0 0 round 20px)", duration: DUR.compile, ease: EASE.pen }, 0.1);
      tl.fromTo(bits, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: DUR.ui, ease: EASE.arrive, stagger: 0.06 }, 0.3);
      if (stamp) tl.fromTo(stamp, { autoAlpha: 0, scale: 1.9, rotation: -16 }, { autoAlpha: 1, scale: 1, rotation: -7, duration: DUR.stamp, ease: EASE.snap, transformOrigin: "50% 50%" }, 0.85);
      tl.fromTo(ticket, { y: 0 }, { y: 2, duration: 0.07, ease: EASE.exit, yoyo: true, repeat: 1, clearProps: "y" }, 0.85 + DUR.stamp * 0.42);
    },
    { scope: root, dependencies: [idea, reduced], revertOnUpdate: true },
  );

  const shake = contextSafe(() => {
    if (reduced || !fieldRef.current) return;
    gsap.fromTo(fieldRef.current, { x: 0 }, { keyframes: { x: [-8, 7, -5, 3, 0] }, duration: 0.4, ease: "power2.out", overwrite: true });
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (shipped) return;
    const text = value.replace(/\s+/g, " ").trim();
    if (!text) {
      setHint(true);
      shake();
      document.getElementById(inputId)?.focus();
      return;
    }
    setHint(false);
    setIdea(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      window.location.href = mailtoFor(text);
    }, reduced ? 500 : 1700);
  }

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    setIdea(null);
    setValue("");
    window.setTimeout(() => document.getElementById(inputId)?.focus(), 0);
  }

  const shown = shipped ? idea : value;

  return (
    <div ref={root} data-qa="idea-ticket" className="grid items-center gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      <form onSubmit={onSubmit} noValidate className="min-w-0" aria-labelledby={`${uid}-title`}>
        <h3 id={`${uid}-title`} className="type-h3 text-paper">
          Sketch your idea
        </h3>
        <div ref={fieldRef} className="mt-5">
          <label htmlFor={inputId} className="block font-hand text-[1.5rem] font-bold leading-none text-lime">
            What should we build?
          </label>
          <input
            id={inputId}
            data-qa="idea-input"
            name="idea"
            type="text"
            maxLength={MAX}
            value={value}
            readOnly={shipped}
            autoComplete="off"
            enterKeyHint="send"
            onChange={(e) => {
              setValue(e.target.value);
              if (hint) setHint(false);
            }}
            aria-describedby={`${uid}-hint ${uid}-count`}
            aria-invalid={hint || undefined}
            placeholder="An app that…"
            className="mt-3 block h-14 w-full rounded-full border border-seam bg-ink-2 px-6 text-base text-paper transition-colors duration-(--dur-feedback) placeholder:text-fog hover:border-fog focus-visible:border-lime focus-visible:outline-none aria-invalid:border-tangerine"
          />
        </div>
        <div className="mt-3 flex min-h-6 items-baseline justify-between gap-4">
          <p id={`${uid}-hint`} role="status" className={`type-small ${hint ? "text-tangerine" : "text-fog"}`}>
            {hint ? "Give it a few words first, then ship it." : "Your email app opens with it."}
          </p>
          <span id={`${uid}-count`} className="type-mono shrink-0 tabular-nums text-fog" aria-label={`${value.length} of ${MAX} characters`}>
            {value.length}/{MAX}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {shipped ? (
            <>
              <Pill href={mailtoFor(idea)} variant="lime" size="lg" iconBefore={null} icon={null} data-qa="idea-open-mail">
                Open email again
              </Pill>
              <button
                type="button"
                data-qa="idea-copy"
                onClick={() => void copy(profile.email)}
                className="type-small inline-flex min-h-11 items-center rounded-full border border-seam px-5 font-semibold text-paper transition-colors duration-(--dur-feedback) hocus:border-lime hocus:text-lime active:scale-[0.98]"
              >
                {copied ? "Address copied" : failed ? "Copy failed" : "Copy address"}
              </button>
              <button type="button" data-qa="idea-reset" onClick={reset} className="type-small inline-flex min-h-11 items-center rounded-full px-4 text-paper underline underline-offset-4 hocus:text-lime">
                Sketch another
              </button>
            </>
          ) : (
            <Pill type="submit" variant="lime" size="lg" icon={null} data-qa="idea-submit">
              Ship it
            </Pill>
          )}
        </div>
        {/* the long way: a whole page that writes the email up like a pull request */}
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-seam pt-6">
          <p className="type-small text-fog">Hiring, or a bigger project?</p>
          <Pill
            href={routes.pullRequest}
            label="Open a pull request"
            variant="outline"
            size="lg"
            data-qa="idea-pr"
            iconBefore={
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="4" cy="3.5" r="1.6" />
                <circle cx="4" cy="12.5" r="1.6" />
                <circle cx="12" cy="12.5" r="1.6" />
                <path d="M4 5v6M12 11V7.5c0-2-1.5-3-3.5-3H7" />
              </svg>
            }
          >
            Create a pull request
          </Pill>
        </div>
      </form>

      {/* Fixed stage: the note and the ticket swap in the same box, so nothing shifts. */}
      <div className="relative order-first mx-auto h-[24rem] w-full max-w-[34rem] sm:h-[21rem] lg:order-none" data-qa="idea-stage">
        <div
          ref={noteRef}
          data-qa="idea-note"
          aria-hidden="true"
          className="absolute inset-x-[4%] top-5 bottom-5 flex rotate-[-3deg] flex-col justify-between rounded-md bg-lime p-6 text-ink shadow-[0_24px_40px_-22px_rgb(0_0_0/0.6)] sm:inset-x-[14%]"
        >
          <span
            aria-hidden="true"
            data-qa="idea-tape"
            className="absolute -top-3.5 left-1/2 h-7 w-24 -translate-x-1/2 rotate-2 border-y border-ink/20 bg-paper-2/90 shadow-[0_2px_4px_-1px_rgb(0_0_0/0.3)]"
            style={{ clipPath: "polygon(0 0,3% 18%,0 36%,3% 54%,0 72%,3% 100%,100% 100%,97% 82%,100% 64%,97% 46%,100% 28%,97% 10%,100% 0)" }}
          />
          <p className="font-hand text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-bold leading-[1.15] [overflow-wrap:anywhere]" data-qa="idea-note-text">
            {shown ? shown : <span className="text-ink/70">your idea lands here…</span>}
          </p>
          {shown ? null : (
            <div aria-hidden="true" data-qa="idea-ghost" className="pointer-events-none absolute inset-x-6 top-[4.5rem] bottom-14 opacity-60">
              <div className="relative h-full w-full max-h-[8.5rem]">
                <SketchRect seed="idea-ghost" radius={14} tone="ink" strokeWidth={1.3} />
                <span className="absolute top-3 left-4 font-hand text-xl font-bold leading-none text-ink/80">ISSUE #001</span>
                <div className="absolute inset-x-4 top-11 h-5">
                  <Scribble seed="idea-ghost-title" tone="ink" strokeWidth={1.2} density={0.7} />
                </div>
                <div className="absolute inset-x-4 top-[4.5rem] h-3 w-2/3">
                  <Scribble seed="idea-ghost-sub" tone="ink" strokeWidth={1.2} density={0.5} />
                </div>
              </div>
            </div>
          )}
          <span className="font-hand text-xl font-bold text-ink/70">for Prajwal</span>
        </div>

        <div
          ref={ticketRef}
          data-qa="idea-ticket-card"
          style={shipped ? undefined : { visibility: "hidden" }}
          className="absolute inset-0 flex items-center justify-center"
          role={shipped ? "group" : undefined}
          aria-label={shipped ? "Issue 001, ready to build" : undefined}
          aria-hidden={shipped ? undefined : true}
        >
          <div className={`relative w-full max-w-[30rem] rounded-[20px] p-6 sm:p-7 ${sketchMode ? "text-paper" : "text-ink"}`}>
            <div data-fill className={`absolute inset-0 rounded-[20px] bg-paper shadow-[0_30px_50px_-28px_rgb(0_0_0/0.7)] ${sketchMode ? "opacity-0" : ""}`} />
            <div data-strokes className="absolute inset-0">
              <SketchRect seed="idea-ticket" radius={20} tone={sketchMode ? "paper" : "pencil"} />
            </div>
            <div className="relative">
              <div data-bit className="flex items-center justify-between gap-3">
                <span className={`type-mono font-bold ${sketchMode ? "" : "text-blue-deep"}`}>ISSUE #001</span>
                <span data-qa="idea-status" className={`type-mono inline-flex items-center rounded-full px-3 py-1 ${sketchMode ? "border border-dashed border-paper" : "bg-lime text-ink"}`}>
                  ready to build
                </span>
              </div>
              <p
                data-bit
                data-qa="idea-ticket-title"
                className={`mt-5 [overflow-wrap:anywhere] ${sketchMode ? "font-hand text-[clamp(1.7rem,1.3rem+1.4vw,2.3rem)] font-bold leading-[1.15]" : "font-display text-[clamp(1.35rem,1rem+1.2vw,1.8rem)] font-bold leading-[1.12] tracking-[-0.03em]"}`}
              >
                {idea}
              </p>
              <div data-bit className={`mt-6 flex items-center gap-3 border-t pt-4 ${sketchMode ? "border-dashed border-paper/60" : "border-ink/15"}`}>
                <span className={`type-mono ${sketchMode ? "text-paper/80" : "text-graphite"}`}>Assignee</span>
                <span className="type-small font-semibold">{profile.name}</span>
              </div>
              <ShippedStamp ref={stampRef} label="Drafted" size="md" className="absolute -right-2 -bottom-12 z-(--z-raised) sm:-right-6" style={{ visibility: "hidden" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
