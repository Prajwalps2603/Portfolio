"use client";

import { Fragment, useRef, type CSSProperties, type ReactNode } from "react";
import { profile } from "@/content";
import { Section } from "@/components/ui";
import { channel, type ChannelId } from "@/lib/channels";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/media";

type Tag = { phrase: string; ch: ChannelId };

/** 01 Signal. The phrases of his own sentence (profile.inHisWords) that map to a channel. */
const TAGS: Tag[] = [
  { phrase: "designing responsive frontend interfaces", ch: 1 },
  { phrase: "developing backend APIs", ch: 2 },
  { phrase: "integrating databases", ch: 3 },
  { phrase: "implementing business logic", ch: 2 },
  { phrase: "deploying applications", ch: "sigma" },
];

/** Second line: the AI work, from profile.about[2] (RAG platforms, an MCP server, models in products). */
const AI_LINE: { text: string; tags: Tag[] } = {
  text: "Lately that includes AI: RAG pipelines, MCP servers and models inside real products.",
  tags: [{ phrase: "AI: RAG pipelines, MCP servers", ch: 4 }],
};

type Seg = { text: string; tag?: Tag };

function segment(text: string, tags: Tag[]): Seg[] {
  const segs: Seg[] = [];
  let rest = text;
  while (rest) {
    let best: { i: number; tag: Tag } | null = null;
    for (const tag of tags) {
      const i = rest.indexOf(tag.phrase);
      if (i >= 0 && (!best || i < best.i)) best = { i, tag };
    }
    if (!best) {
      segs.push({ text: rest });
      break;
    }
    if (best.i > 0) segs.push({ text: rest.slice(0, best.i) });
    segs.push({ text: best.tag.phrase, tag: best.tag });
    rest = rest.slice(best.i + best.tag.phrase.length);
  }
  return segs;
}

function words(text: string): ReactNode[] {
  return text.split(/(\s+)/).filter(Boolean).map((tok, i) =>
    /^\s+$/.test(tok) ? tok : (
      <span key={i} className="wd">
        {tok}
      </span>
    ),
  );
}

function Mark({ ch }: { ch: ChannelId }) {
  const c = channel(ch);
  return (
    <sup
      data-chref
      aria-hidden="true"
      className="font-mono font-semibold uppercase tracking-[0.06em] [font-stretch:87.5%]"
      style={{
        color: c.color,
        fontSize: "max(11px, 0.19em)",
        verticalAlign: "0.55em",
        lineHeight: 0,
        margin: "0 0.1em 0 0.3em",
        whiteSpace: "nowrap",
        opacity: "var(--u, 1)",
      }}
    >
      {c.mark} {ch === "sigma" ? "Shipped" : c.label}
    </sup>
  );
}

function Tagged({ text, tags }: { text: string; tags: Tag[] }) {
  const segs = segment(text, tags);
  return (
    <>
      {segs.map((s, i) => {
        if (!s.tag) return <Fragment key={i}>{words(s.text)}</Fragment>;
        const c = channel(s.tag.ch);
        const style: CSSProperties = {
          backgroundImage: `linear-gradient(${c.color}, ${c.color})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 100%",
          backgroundSize: "calc(var(--u, 1) * 100%) 2px",
          paddingBottom: "0.05em",
        };
        // The mark follows its punctuation like a footnote: "databases,3" not "databases3,".
        const next = segs[i + 1]?.text ?? "";
        const punct = /^[,.;:]/.test(next) ? next[0] : "";
        if (punct) segs[i + 1] = { text: next.slice(1) };
        return (
          <Fragment key={i}>
            <span data-tag style={style}>
              {words(s.text)}
            </span>
            {punct ? <span className="wd">{punct}</span> : null}
            <Mark ch={s.tag.ch} />
          </Fragment>
        );
      })}
    </>
  );
}

export function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced) return;
      gsap.utils.toArray<HTMLElement>("[data-split]", root).forEach((p) => {
        const ws = gsap.utils.toArray<HTMLElement>(".wd", p);
        const tags = gsap.utils.toArray<HTMLElement>("[data-tag]", p);
        if (!ws.length) return;
        gsap.set(ws, { opacity: 0.42 });
        const lit = [...tags, ...gsap.utils.toArray<HTMLElement>("[data-chref]", p)];
        if (lit.length) gsap.set(lit, { "--u": 0 });
        const second = p.hasAttribute("data-second");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: p,
            start: "top 85%",
            end: () => `bottom ${second ? 70 : 60}%`,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        tl.to(ws, { opacity: 1, stagger: 0.08, duration: 0.3, ease: "none" }, 0);
        tags.forEach((t) => {
          const first = t.querySelector(".wd");
          const idx = first ? ws.indexOf(first as HTMLElement) : 0;
          const n = t.querySelectorAll(".wd").length;
          const sup = t.nextElementSibling?.matches("[data-chref]")
            ? t.nextElementSibling
            : t.nextElementSibling?.nextElementSibling;
          tl.to(sup ? [t, sup] : t, { "--u": 1, duration: Math.max(0.3, n * 0.08), ease: "none" }, idx * 0.08 + 0.05);
        });
      });
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <Section id="signal" surface="screen" labelledBy="signal-title" className="px-margin py-section">
      <div ref={ref}>
      <h2 id="signal-title" className="sr-only">
        What I do
      </h2>
      <p data-split className="type-statement max-w-[23ch] text-pretty">
        <Tagged text={profile.inHisWords} tags={TAGS} />
      </p>
      <p
        data-split
        data-second
        className="mt-[clamp(28px,6vh,64px)] max-w-[32ch] text-[length:clamp(21px,2.5vw,38px)] leading-[1.18] font-medium tracking-[-0.016em] text-pretty"
      >
        <Tagged text={AI_LINE.text} tags={AI_LINE.tags} />
      </p>
      </div>
    </Section>
  );
}
