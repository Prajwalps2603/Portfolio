import { Fragment, type ComponentType } from "react";
import type { Project } from "@/content";
import { routes } from "@/lib/routes";
import { LiveDot, Pill, Tag } from "@/components/ui";
import { ArrowRight, Award, Calendar, Chat, FileText, ImageIcon, Mic, Package, Terminal, type IconProps } from "@/components/icons";
import { SketchRect } from "@/components/sketch";
import { roughArrow } from "@/components/sketch/rough";

/**
 * Shared pieces of "03 Selected work": the layout switch, the project glyphs and the
 * facts / stack / actions blocks used by both the pinned stage and the stacked cards.
 */

/**
 * The pinned two-column stage needs width AND height (index + details on the left, the window on
 * the right, all inside one viewport): >= 1100 x 700, or >= 900 x 760 (narrower columns wrap
 * more). Elsewhere the stacked cards take over. Below 860px of height the stage compacts (smaller
 * index rows; below 820px the details drop their visual title, the active row names the project).
 * Keep the JS query and the class strings in sync (Tailwind reads the class strings literally).
 */
export const PINNED_QUERY = "(min-width: 1100px) and (min-height: 700px), (min-width: 900px) and (min-height: 760px)";
export const PINNED_ONLY = "hidden [@media(min-width:68.75rem)_and_(min-height:43.75rem)]:block [@media(min-width:56.25rem)_and_(min-height:47.5rem)]:block";
export const CARDS_ONLY = "[@media(min-width:68.75rem)_and_(min-height:43.75rem)]:hidden [@media(min-width:56.25rem)_and_(min-height:47.5rem)]:hidden";

/** The mini-UI template of each featured project, as an authored icon (editor, chat, phone...). */
const GLYPHS: Record<string, ComponentType<IconProps>> = {
  resumai: FileText,
  "drone-intelligence": Chat,
  "audify-ai": Mic,
  bookmyvenue: Calendar,
  "brain-tumor-detection": ImageIcon,
  "mcp-job-agent": Terminal,
};

/**
 * The index tile: a pencil-sketched box while the project waits (the idea), a crisp tangerine
 * chip when it is on stage ("now"). Decorative: the row's text names the project.
 */
export function ProjectGlyph({ id, active }: { id: string; active: boolean }) {
  const Icon = GLYPHS[id] ?? Package;
  return (
    <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center [@media(max-height:53.74rem)]:size-8">
      <span
        className={`absolute inset-0 rounded-chip bg-tangerine transition-[opacity,scale] duration-(--dur-ui) ease-arrive reduced:scale-100 ${active ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
      />
      <span className={`absolute inset-0 transition-opacity duration-(--dur-ui) ease-arrive ${active ? "opacity-0" : "opacity-100"}`}>
        <SketchRect seed={`work-glyph-${id}`} radius={9} tone="pencil" roughness={1.1} />
      </span>
      <Icon className={`relative size-5 transition-colors duration-(--dur-ui) [@media(max-height:53.74rem)]:size-[1.125rem] ${active ? "text-ink" : "text-graphite"}`} />
    </span>
  );
}

/** Real numbers only (from the content), plus the award when there is one. Null when neither. */
export function ProjectFacts({ project, className }: { project: Project; className?: string }) {
  const { metrics, award } = project;
  if (!metrics.length && !award) return null;
  return (
    <ul aria-label="Results" className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${className ?? ""}`}>
      {metrics.map((m) => (
        <li key={m.label} className="flex items-baseline gap-1.5">
          <span className="type-h4 tabular-nums">{m.value}</span>
          <span className="type-small text-graphite">{m.label}</span>
        </li>
      ))}
      {award ? (
        <li className="type-mono inline-flex items-center gap-2 rounded-chip bg-ink px-3 py-1.5 text-paper">
          <Award className="size-4 shrink-0 text-lime" />
          <span>{award}</span>
        </li>
      ) : null}
    </ul>
  );
}

/** The project's stack as tags. */
export function ProjectStack({ project, className }: { project: Project; className?: string }) {
  return (
    <ul aria-label="Stack" className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {project.stack.map((s) => (
        <Tag as="li" key={s} className="bg-card/70">
          {s}
        </Tag>
      ))}
    </ul>
  );
}

/** Case study (page sheet), Repository and Live (new tab, only when they exist). */
export function ProjectActions({ project, className }: { project: Project; className?: string }) {
  const { repo, live } = project.links;
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className ?? ""}`}>
      <Pill href={routes.work(project.id)} label={project.shortTitle} size="sm" icon={<ArrowRight />}>
        Case study<span className="sr-only">: {project.shortTitle}</span>
      </Pill>
      {repo ? (
        <Pill href={repo} variant="outline" size="sm" hint="source on GitHub, opens in a new tab" data-cursor="blue">
          Repository<span className="sr-only">: {project.shortTitle}</span>
        </Pill>
      ) : null}
      {live ? (
        <Pill href={live} variant="outline" size="sm" hint="live site, opens in a new tab" data-cursor="tangerine" iconBefore={<LiveDot />}>
          Live<span className="sr-only">: {project.shortTitle}</span>
        </Pill>
      ) : null}
    </div>
  );
}

/**
 * The project's real flow (projects.ts `flow`), handwritten under the stage: the idea of how it
 * works, in the sketch layer. Decorative (aria-hidden): `flowSentence` gives the same steps as
 * real text inside the project's panel.
 */
export function FlowNote({ project, className }: { project: Project; className?: string }) {
  const steps = project.flow ?? [];
  if (!steps.length) return null;
  return (
    <p aria-hidden="true" className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-graphite ${className ?? ""}`}>
      <span className="type-hand text-ink">flow:</span>
      {steps.map((step, i) => (
        <Fragment key={step}>
          {i > 0 ? (
            <svg width={24} height={14} viewBox="0 0 24 14" className="shrink-0 overflow-visible text-pencil">
              <path
                d={roughArrow([2, 8], [21, 6], { seed: `${project.id}-flow-${i}`, bend: -0.12, head: 5 })}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                suppressHydrationWarning
              />
            </svg>
          ) : null}
          <span className="type-hand-sm whitespace-nowrap">{step}</span>
        </Fragment>
      ))}
    </p>
  );
}

/** "Question, then Embed the query, then ..." for screen readers. */
export function flowSentence(project: Project): string | null {
  const steps = project.flow ?? [];
  return steps.length ? `How it works: ${steps.join(", then ")}.` : null;
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/** 6 -> "Six" (counts are derived from the content, never typed in). */
export function countWord(n: number, capital = false): string {
  const w = WORDS[n] ?? String(n);
  return capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}
