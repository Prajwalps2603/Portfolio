"use client";

/**
 * The README (About): his bio as README.md in a file viewer, with "Preview | Code" like a code
 * host, an "Open to new opportunities" badge, and what he is learning as open branches.
 *
 * THE MOMENT (sketch -> ship, once): the first time the card comes in (top at 80%), it shows the
 * markdown source; a moment later a pencil line sweeps down the file and renders it as it passes
 * (the preview above the line, the source still below), ~1.6s. The tabs switch between the
 * rendered README and its source any time (a tablist: arrow keys too). Reduced motion: the
 * rendered README, no sweep. The source is generated from the same content as the preview.
 */
import { useRef, useState, type KeyboardEvent } from "react";
import { profile } from "@/content";
import { LiveDot, Tag } from "@/components/ui";
import { GitBranch } from "@/components/icons";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { useReducedMotion } from "@/lib/motion/media";

/** The markdown source of the README, line by line. */
const SOURCE: string[] = [`# ${profile.name}`, "", ...profile.about.flatMap((p) => [p, ""]), "## Currently learning", "", ...profile.learning.map((l) => `- ${l}`)];

type View = "preview" | "code";
const VIEWS: { id: View; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "code", label: "Code" },
];

export function Readme() {
  const [view, setView] = useState<View>("preview");
  /** During the sweep both layers show (the preview above the pencil line, the source below). */
  const [rendering, setRendering] = useState(false);
  const reduced = useReducedMotion();
  const card = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const code = useRef<HTMLDivElement>(null);
  const pen = useRef<HTMLSpanElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useGSAP(
    () => {
      const box = card.current;
      if (!box || reduced || !preview.current || !code.current || !pen.current) return;
      const r = box.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85) return;
      // hidden from JS only: the source shows first, the preview waits under it
      const [pv, cd, line] = [preview.current, code.current, pen.current];
      gsap.set(cd, { autoAlpha: 1, clipPath: "inset(0% 0 0 0)" });
      gsap.set(pv, { clipPath: "inset(0 0 100% 0)" });
      gsap.set(line, { autoAlpha: 0, top: "0%" });
      setView("code");
      setRendering(true);
      ScrollTrigger.create({
        trigger: box,
        start: () => safeStart(box, "top 80%"),
        once: true,
        onEnter: () => {
          const sweep = { p: 0 };
          const tl = gsap.timeline({
            delay: 0.55,
            onComplete: () => {
              gsap.set([pv, cd], { clearProps: "clipPath" });
              gsap.set(cd, { clearProps: "visibility,opacity" });
              setRendering(false);
              setView("preview");
            },
          });
          tl.set(line, { autoAlpha: 1 });
          tl.to(sweep, {
            p: 100,
            duration: 1.05,
            ease: EASE.pen,
            onUpdate: () => {
              pv.style.clipPath = `inset(0 0 ${(100 - sweep.p).toFixed(2)}% 0)`;
              cd.style.clipPath = `inset(${sweep.p.toFixed(2)}% 0 0 0)`;
              line.style.top = `${sweep.p.toFixed(2)}%`;
            },
          });
          tl.to(line, { autoAlpha: 0, duration: 0.2, ease: EASE.exit });
        },
      });
      // undone with this run (e.g. reduced motion turns out to be on after the first render): back
      // to the rendered README, so the source view is never left showing by a sweep that won't run
      return () => {
        setRendering(false);
        setView("preview");
      };
    },
    { dependencies: [reduced], revertOnUpdate: true },
  );

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const to = (i + 1) % VIEWS.length;
    setView(VIEWS[to].id);
    tabs.current[to]?.focus();
  };

  return (
    <article ref={card} className="card overflow-hidden" data-qa="readme">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-b border-line bg-paper-2 px-4 pt-3">
        <div className="flex items-end gap-3">
          <span className="type-mono -mb-px rounded-t-chip border border-b-card border-line bg-card px-4 py-2">README.md</span>
          <span className="type-micro mb-2 hidden items-center gap-1.5 rounded-chip border border-line-strong bg-card px-2 py-1 text-ink sm:inline-flex">
            <LiveDot size={7} />
            {profile.availability}
          </span>
        </div>
        <div role="tablist" aria-label="README view" className="mb-2 inline-flex rounded-chip border border-line-strong bg-card p-0.5">
          {VIEWS.map((v, i) => (
            <button
              key={v.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`readme-tab-${v.id}`}
              aria-selected={view === v.id}
              aria-controls={`readme-${v.id}`}
              tabIndex={view === v.id ? 0 : -1}
              onClick={() => setView(v.id)}
              onKeyDown={(e) => onKey(e, i)}
              className="type-micro min-h-8 cursor-pointer rounded-chip px-3 text-graphite transition-colors duration-(--dur-feedback) hocus:text-ink aria-selected:bg-ink aria-selected:text-paper aria-selected:hocus:text-paper coarse:min-h-11"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* the rendered README */}
        <div ref={preview} role="tabpanel" id="readme-preview" aria-labelledby="readme-tab-preview" className={`p-6 sm:p-9 ${view === "preview" || rendering ? "" : "invisible"}`}>
          <h3 className="type-h3">{profile.name}</h3>
          {profile.about.map((p) => (
            <p key={p.slice(0, 24)} className="type-body measure mt-4">
              {p}
            </p>
          ))}
          <h4 className="type-h4 mt-9">Currently learning</h4>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.learning.map((l) => (
              <Tag as="li" key={l} tone="blue" className="gap-1.5">
                <GitBranch size={13} />
                {l}
              </Tag>
            ))}
          </ul>
        </div>

        {/* its markdown source */}
        <div
          ref={code}
          role="tabpanel"
          id="readme-code"
          aria-labelledby="readme-tab-code"
          className={`absolute inset-0 overflow-y-auto bg-card py-6 pr-6 sm:py-8 sm:pr-8 ${view === "code" || rendering ? "" : "invisible"}`}
        >
          <pre className="type-mono whitespace-pre-wrap">
            {SOURCE.map((line, i) => (
              <span key={i} className="grid grid-cols-[3rem_minmax(0,1fr)]">
                <span aria-hidden="true" className="pr-4 text-right text-pencil tabular-nums select-none">
                  {i + 1}
                </span>
                <Md line={line} />
              </span>
            ))}
          </pre>
        </div>

        {/* the pencil line that renders it */}
        <span ref={pen} aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 h-0.5 -translate-y-px bg-graphite opacity-0" />
      </div>
    </article>
  );
}

/** One markdown line, its marks coloured like an editor would. */
function Md({ line }: { line: string }) {
  const h = /^(#+)\s(.*)$/.exec(line);
  if (h) {
    return (
      <span className="font-semibold text-ink">
        <span className="text-blue-deep">{h[1]}</span> {h[2]}
      </span>
    );
  }
  const li = /^-\s(.*)$/.exec(line);
  if (li) {
    return (
      <span className="text-ink">
        <span className="text-tangerine-deep">-</span> {li[1]}
      </span>
    );
  }
  return <span className="text-graphite">{line || " "}</span>;
}
