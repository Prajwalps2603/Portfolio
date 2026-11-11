"use client";

/**
 * 05 Experience (#changelog): his career as a git history.
 * Main line (ink) draws as you scroll; internships are blue feature branches that merge back;
 * the current role is HEAD. Facts only from @/content.
 *
 * Every card has a panel beside its text (under it on phones): each role a figure of that job's
 * work (./RoleFigure, geometry in ./figures; its code loads when the card comes near), the award a
 * medal that swings on its ribbon (./Medal), and the first commit (the degree) the college, its
 * four years and a graduation cap tossed into the air (./College).
 */
import { useRef } from "react";
import dynamic from "next/dynamic";
import { certifications, education, experience } from "@/content";
import type { ExperienceItem } from "@/content";
import { Card, Fold, FoldToggle, Highlight, Section, Tag } from "@/components/ui";
import { ArrowRight, GitBranch, GitCommit } from "@/components/icons";
import { HandNote } from "@/components/sketch";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { safeStart } from "@/lib/motion/splitArrive";
import { prefersReducedMotion, useReducedMotion } from "@/lib/motion/media";
import { DUR, EASE } from "@/lib/motion/eases";
import { useInView } from "@/lib/hooks/useInView";
import { useSketchMode } from "@/lib/stores/sketchMode";
import type { FigureId } from "./figures";
import { College } from "./College";
import { Medal } from "./Medal";

const RoleFigure = dynamic(() => import("./RoleFigure").then((m) => m.RoleFigure), { ssr: false });

/** The figure each role gets (experience id -> figure; see ./figures.ts). */
const FIGURE_OF: Record<string, FigureId> = {
  "maruti-flex": "ops",
  dyashin: "java",
  rooman: "ml",
  techbyheart: "cloud",
};

type Role = { kind: "role"; item: ExperienceItem; version: string; note: string };
type Award = { kind: "award"; title: string; issuer: string; year: string; project?: string; note: string };
type Init = { kind: "init"; note: string; institution: string; qualification: string; location: string; period: string; grade?: string };
type Commit = Role | Award | Init;

/** Version tags and margin notes, keyed by experience id. Every note restates a fact from content. */
const ROLE_META: Record<string, { version: string; note: string }> = {
  "maruti-flex": { version: "v4.0", note: "live in production, every day" },
  dyashin: { version: "v3.0", note: "code reviews and pull requests" },
  rooman: { version: "v2.0", note: "Python, from EDA to model" },
  techbyheart: { version: "v1.0", note: "my first cloud: EC2, S3, RDS" },
};

function buildCommits(): Commit[] {
  const roles = (id: string): Role[] => {
    const item = experience.find((x) => x.id === id);
    const meta = ROLE_META[id];
    return item && meta ? [{ kind: "role", item, ...meta }] : [];
  };
  const award = certifications.find((c) => c.kind === "Award");
  const be = education.find((e) => e.id === "kvgce");
  return [
    ...roles("maruti-flex"),
    ...roles("dyashin"),
    ...roles("rooman"),
    ...(award
      ? [{ kind: "award", title: award.title, issuer: award.issuer, year: award.year, project: award.note, note: "the project behind it is in Work" } satisfies Award]
      : []),
    ...roles("techbyheart"),
    ...(be
      ? [{ kind: "init", note: "where the first commit happened", institution: be.institution, qualification: be.qualification, location: be.location, period: be.period, grade: be.grade } satisfies Init]
      : []),
  ];
}

const commits = buildCommits();

const NODE_Y = "2.4rem"; // y of every commit node inside its row

function keyOf(c: Commit): string {
  return c.kind === "role" ? c.item.id : c.kind;
}

export function Changelog() {
  const list = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const ol = list.current;
      if (!ol) return;
      const line = ol.querySelector<HTMLElement>("[data-main-line]");
      const track = ol.querySelector<HTMLElement>("[data-main-track]");
      const nodes = gsap.utils.toArray<HTMLElement>(ol.querySelectorAll("[data-node]"));
      if (!line || !track || nodes.length < 2) return;

      /** The line runs from the first node to the last node, wherever wrapping puts them. */
      const fit = () => {
        const top = ol.getBoundingClientRect().top;
        const y = (n: HTMLElement) => n.getBoundingClientRect().top - top + n.offsetHeight / 2;
        const a = y(nodes[0]);
        const b = y(nodes[nodes.length - 1]);
        for (const el of [line, track]) {
          el.style.top = `${a}px`;
          el.style.height = `${Math.max(0, b - a)}px`;
        }
      };
      fit();
      const ro = new ResizeObserver(() => {
        fit();
        ScrollTrigger.refresh();
      });
      ro.observe(ol);

      if (prefersReducedMotion()) {
        return () => ro.disconnect();
      }

      gsap.set(line, { scaleY: 0, transformOrigin: "top" });
      gsap.to(line, {
        scaleY: 1,
        ease: EASE.none,
        scrollTrigger: { trigger: ol, start: "top 65%", end: "bottom 85%", scrub: 0.4, invalidateOnRefresh: true },
      });

      gsap.utils.toArray<HTMLElement>(ol.querySelectorAll("[data-commit]")).forEach((row) => {
        const trig = { trigger: row, start: () => safeStart(row, "top 78%"), once: true, invalidateOnRefresh: true };
        const node = row.querySelector("[data-node]");
        const card = row.querySelector("[data-card]");
        const meta = row.querySelectorAll("[data-meta]");
        const branch = row.querySelector<HTMLElement>("[data-branch]");
        const tl = gsap.timeline({ scrollTrigger: trig, defaults: { ease: EASE.arrive } });
        if (node) tl.from(node, { scale: 0.6, opacity: 0, duration: DUR.ui }, 0);
        if (card) tl.from(card, { y: 18, opacity: 0, duration: DUR.fade }, 0.04);
        if (meta.length) tl.from(meta, { opacity: 0, duration: DUR.fade }, 0.1);
        if (branch) {
          gsap.set(branch, { clipPath: "inset(0 0 100% 0)" });
          gsap.to(branch, {
            clipPath: "inset(0 0 0% 0)",
            ease: EASE.none,
            scrollTrigger: { trigger: row, start: "top 70%", end: "bottom 85%", scrub: 0.4, invalidateOnRefresh: true },
          });
        }
      });

      return () => ro.disconnect();
    },
    { scope: list, dependencies: [] },
  );

  return (
    <Section id="changelog" labelledBy="changelog-title">
      <div className="max-w-3xl">
        <h2 id="changelog-title" className="type-display">
          Career, as a <Highlight color="blue">changelog</Highlight>
        </h2>
        <p className="type-lead measure mt-5 text-graphite">
          Newest first. Internships branched off main and merged back; the current role is HEAD.
        </p>
      </div>

      <ol
        ref={list}
        className="relative mt-12 [--rx:0.625rem] md:mt-16 md:[--rx:calc(11rem+0.625rem)]"
        style={{ ["--ny" as string]: NODE_Y }}
      >
        {/* main line: faint track, ink line drawn on scroll */}
        <span
          aria-hidden="true"
          data-main-track=""
          className="pointer-events-none absolute top-(--ny) bottom-0 w-0.5 -translate-x-1/2 bg-line-strong"
          style={{ left: "var(--rx)" }}
        />
        <span
          aria-hidden="true"
          data-main-line=""
          className="pointer-events-none absolute top-(--ny) bottom-0 w-0.5 -translate-x-1/2 bg-ink"
          style={{ left: "var(--rx)" }}
        />

        {commits.map((c) => (
          <CommitRow key={keyOf(c)} c={c} />
        ))}
      </ol>
    </Section>
  );
}

function CommitRow({ c }: { c: Commit }) {
  const branch = c.kind === "role" && !c.item.current;
  const head = c.kind === "role" && c.item.current;
  const last = c.kind === "init";

  return (
    <li
      data-commit=""
      className={`relative grid grid-cols-1 pl-14 md:grid-cols-[11rem_3.5rem_1fr] md:pl-0 ${last ? "" : "pb-10 md:pb-14"}`}
    >
      {/* feature branch: leaves main, runs beside it, merges back */}
      {branch ? <Branch /> : null}

      {/* commit node */}
      <span
        aria-hidden="true"
        data-node=""
        className={`absolute z-(--z-raised) grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 ${
          head
            ? "border-ink bg-tangerine"
            : branch
              ? "border-blue bg-card"
              : c.kind === "award"
                ? "border-ink bg-lime"
                : "border-ink bg-card"
        }`}
        style={{ top: "var(--ny)", left: branch ? "calc(var(--rx) + 1.5rem)" : "var(--rx)" }}
      >
        {head ? <span className="size-1.5 rounded-full bg-ink" /> : null}
      </span>

      {/* date + margin note */}
      <div
        data-meta=""
        className="col-start-1 row-start-1 mb-3 md:mb-0 md:pr-3 md:text-right"
        style={{ paddingTop: "calc(var(--ny) - 0.8rem)" }}
      >
        <MetaBlock c={c} />
      </div>

      <div className="col-start-1 md:col-start-3 md:row-span-2 md:row-start-1 md:pl-2">
        <Card as="article" padding="md" data-card="" className="relative">
          <CardBody c={c} />
        </Card>
      </div>

      <div data-meta="" className="col-start-1 row-start-3 mt-2 md:row-start-2 md:mt-3 md:pr-3 md:text-right">
        <HandNote tone={branch ? "blue" : head ? "tangerine" : "graphite"} size="md" rotate={c.kind === "role" && c.item.current ? -2 : 1.5} className="max-w-[16rem] md:justify-end">
          {c.note}
        </HandNote>
      </div>
    </li>
  );
}

function MetaBlock({ c }: { c: Commit }) {
  const label = c.kind === "role" ? c.item.periodLabel : c.kind === "award" ? c.year : c.period;
  const dur = c.kind === "role" ? c.item.durationLabel : undefined;
  return (
    <p className="type-mono text-graphite">
      <span className="text-ink">{label}</span>
      {dur ? <span className="block md:mt-0.5">{dur}</span> : null}
    </p>
  );
}

function Branch() {
  return (
    <div
      aria-hidden="true"
      data-branch=""
      className="pointer-events-none absolute top-0 bottom-0"
      style={{ left: "calc(var(--rx) - 1px)", width: "1.625rem" }}
    >
      <svg width="26" height="30" viewBox="0 0 26 30" className="absolute top-0 overflow-visible text-blue">
        <path d="M1 0 C1 18 24 8 24 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="absolute w-0.5 bg-blue" style={{ left: 23, top: 30, bottom: 30 }} />
      <svg width="26" height="30" viewBox="0 0 26 30" className="absolute bottom-0 overflow-visible text-blue">
        <path d="M24 0 C24 22 1 12 1 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** Beside the text from lg (as tall as the text, or its min height); under it on phones. */
const SIDE = "relative mt-6 w-full max-w-[26rem] overflow-hidden rounded-panel border border-line lg:col-start-2 lg:row-start-1 lg:mt-0 lg:max-w-none";

/**
 * The figure's panel: a sketchbook inset (paper and its dots). Phones: a box under the summary.
 * From lg: the right-hand column, as tall as the text beside it.
 */
function FigurePanel({ id }: { id: FigureId }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { rootMargin: "800px 0px", once: true });
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-qa="role-panel"
      className={`${SIDE} paper-dots aspect-[1/1.08] max-h-[22rem] bg-paper lg:row-span-3 lg:aspect-auto lg:max-h-none lg:min-h-[19rem]`}
    >
      {near ? <RoleFigure id={id} sketch={sketch} reduced={reduced} /> : null}
    </div>
  );
}

function CardBody({ c }: { c: Commit }) {
  if (c.kind === "role") {
    const { item, version } = c;
    const figure = FIGURE_OF[item.id];
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="gap-1.5">
            <GitCommit size={14} />
            {version}
          </Tag>
          {item.current ? (
            <Tag tone="tangerine" className="gap-1.5">
              HEAD <ArrowRight size={12} /> main · current
            </Tag>
          ) : (
            <Tag tone="blue" className="gap-1.5">
              <GitBranch size={14} />
              merged into main
            </Tag>
          )}
          <Tag>{item.type}</Tag>
        </div>
        <div className={`mt-4 grid ${figure ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-10" : ""}`}>
          <div>
            <h3 className="type-h3">{item.role}</h3>
            <p className="type-ui mt-1 text-graphite">
              {item.company}
              {item.location ? <span> · {item.location}</span> : null}
            </p>
            <p className="type-body measure mt-4 text-graphite">{item.summary}</p>
          </div>
          {figure ? <FigurePanel id={figure} /> : null}
          {/* Phones: the highlights fold behind "Details" (CSS fold, JS only; ui/Fold.tsx). */}
          <Fold className="mt-5">
            <FoldToggle
              controls={`${item.id}-details`}
              data-qa="changelog-details-toggle"
              more="Details"
              less="Hide details"
              className="type-ui -mx-2 min-h-11 w-fit cursor-pointer rounded-chip px-2 text-blue-deep transition-colors duration-(--dur-feedback) hocus:bg-blue-soft hocus:text-ink"
            />
            <ul id={`${item.id}-details`} data-fold-rest="" className="type-body grid content-start gap-2.5 max-sm:mt-2">
              {item.highlights.map((h) => (
                <li key={h} className="relative pl-5 before:absolute before:top-[0.7em] before:left-0 before:size-1.5 before:rounded-full before:bg-ink">
                  {h}
                </li>
              ))}
            </ul>
          </Fold>
          <ul className="mt-5 flex flex-wrap gap-2 lg:self-end" aria-label="Stack">
            {item.stack.map((s) => (
              <Tag as="li" key={s}>
                {s}
              </Tag>
            ))}
          </ul>
        </div>
      </>
    );
  }
  if (c.kind === "award") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="lime" className="gap-1.5">
            <GitCommit size={14} />
            tag: 1st-place
          </Tag>
        </div>
        <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:gap-x-10">
          <div>
            <h3 className="type-h4">{c.title}</h3>
            <p className="type-ui mt-1 text-graphite">{c.issuer}</p>
            {c.project ? <p className="type-body measure mt-3">{c.project}</p> : null}
          </div>
          {/* the medal hangs from above the panel's top edge */}
          <div aria-hidden="true" data-qa="medal-panel" className={`${SIDE} paper-dots h-40 bg-paper lg:h-auto lg:min-h-[10rem]`}>
            <Medal />
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Tag className="gap-1.5">
          <GitCommit size={14} />
          init
        </Tag>
      </div>
      <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:gap-x-10">
        <div>
          <h3 className="type-h4">{c.qualification}</h3>
          <p className="type-ui mt-1 text-graphite">
            {c.institution} · {c.location}
          </p>
          {c.grade ? <p className="type-mono mt-3 text-graphite">{c.grade}</p> : null}
        </div>
        {/* the college, its four years, the cap in the air */}
        <div aria-hidden="true" data-qa="college-panel" className={`${SIDE} paper-dots h-44 bg-paper lg:h-auto lg:min-h-[10rem]`}>
          <College />
        </div>
      </div>
    </>
  );
}
