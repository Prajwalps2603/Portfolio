import type { CSSProperties } from "react";
import type { Project } from "@/content";
import { routes } from "@/lib/routes";
import { Highlight, Label, LiveDot, Pill, Section, Tag } from "@/components/ui";
import { ArrowDown, ArrowLeft, Github } from "@/components/icons";
import { MiniUI } from "@/components/miniui";
import { StickyNote } from "@/components/sketch";
import { LANE_LABEL } from "./journey/model";

/** Split the title around its short name so one highlighter lands on the project's own name. */
function splitTitle(title: string, short: string): [string, string, string] {
  const at = title.indexOf(short);
  if (at >= 0) return [title.slice(0, at), short, title.slice(at + short.length)];
  const [first, ...rest] = title.split(" ");
  return ["", first, rest.length ? ` ${rest.join(" ")}` : ""];
}

/** Case-study hero: title block beside the MiniUI, which plays sketch -> ship once. */
export function CaseHero({ project }: { project: Project }) {
  const [before, hit, after] = splitTitle(project.title, project.shortTitle);
  return (
    <Section id="case" labelledBy="case-title" spacing="none" className="pt-[calc(var(--header-h)+clamp(32px,5vw,80px))] pb-[clamp(56px,7vw,112px)]">
      <Pill href={routes.section("work")} label="home" variant="ghost" size="sm" iconBefore={<ArrowLeft />} icon={null} className="-ml-3">
        All work
      </Pill>
      <div className="mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Tag caps>{project.category}</Tag>
            <time className="type-mono text-graphite" dateTime={project.year}>
              {project.year}
            </time>
          </div>
          <h1 id="case-title" className="type-display mt-5">
            {before}
            <Highlight color="tangerine">{hit}</Highlight>
            {after}
          </h1>
          <p className="type-lead measure mt-5 text-graphite">{project.tagline}</p>

          {project.metrics.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Key numbers">
              {project.metrics.map((m) => (
                <Tag as="li" tone="lime" key={m.label}>
                  <strong className="font-medium">{m.value}</strong>&nbsp;{m.label}
                </Tag>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {project.links.live && (
              <Pill href={project.links.live} size="lg" iconBefore={<LiveDot />} hint="Live demo, opens in a new tab">
                Live demo
              </Pill>
            )}
            {project.links.repo && (
              <Pill href={project.links.repo} size="lg" variant="outline" iconBefore={<Github />} hint="Source on GitHub, opens in a new tab">
                Source code
              </Pill>
            )}
          </div>

          {project.award && (
            <StickyNote color="lime" tilt={-2} pin="tangerine" className="mt-10 max-w-[22rem] px-6 py-5">
              <p className="type-hand">{project.award}</p>
            </StickyNote>
          )}
        </div>
        <MiniUI projectId={project.id} autoplay size="lg" />
      </div>
      <BuiltIn project={project} />
    </Section>
  );
}

const LAYER_ORDER = ["Interface", "API", "Intelligence", "Data", "Infrastructure"] as const;

/**
 * "How it's built": the architecture (projects.ts `architecture`) as a compact spec under the hero,
 * one column per layer, top of the stack to the bottom. On wide screens the journey board below
 * draws the same layers as its lanes; on phones this is where they live.
 */
function BuiltIn({ project }: { project: Project }) {
  const layers = [...project.architecture].sort((a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer));
  if (layers.length < 2) return null;
  return (
    <div data-qa="case-built" className="mt-14 border-t border-line pt-6 lg:mt-20">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Label as="p" dot="lime">
          <span id="built-title">How it&rsquo;s built</span>
        </Label>
        {project.flow?.length ? (
          <a href="#how" data-qa="case-built-follow" className="link type-small inline-flex min-h-11 items-center gap-1.5 rounded-chip">
            Follow one request through it
            <ArrowDown size={16} />
          </a>
        ) : null}
      </div>
      <dl
        aria-labelledby="built-title"
        className="mt-3 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-[repeat(var(--layers),minmax(0,1fr))]"
        style={{ "--layers": layers.length } as CSSProperties}
      >
        {layers.map((l) => (
          <div key={l.layer} className="min-w-0 border-t border-line pt-3">
            <dt className="type-micro uppercase text-graphite">{LANE_LABEL[l.layer]}</dt>
            <dd className="type-small mt-1.5 text-ink">
              <ul>
                {l.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
