import type { Project } from "@/content";
import { Highlight, Section, Tag } from "@/components/ui";
import { Check } from "@/components/icons";
import { HandNote } from "@/components/sketch";

const DOT = ["bg-lime", "bg-blue-soft", "bg-tangerine-soft"] as const;

/** What it does (the README highlights) and what it is built with. */
export function CaseHighlights({ project }: { project: Project }) {
  return (
    <Section id="highlights" labelledBy="highlights-title">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+32px)] lg:self-start">
          <h2 id="highlights-title" className="type-display">
            What it <Highlight color="tangerine">does</Highlight>
          </h2>
          <HandNote rotate={-3} arrow="right" seed={`${project.id}-hl-note`} className="mt-6">
            the parts I would show you first
          </HandNote>
        </div>
        <ul className="border-t border-line">
          {project.highlights.map((h, i) => (
            <li key={h} className="flex gap-4 border-b border-line py-6 sm:gap-5 sm:py-7">
              <span aria-hidden="true" className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-ink ${DOT[i % DOT.length]}`}>
                <Check size={16} />
              </span>
              <p className="type-body">{h}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-20 border-t border-line pt-10 lg:mt-24">
        <h2 className="type-h3">Built with</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <Tag as="li" key={s}>
              {s}
            </Tag>
          ))}
        </ul>
      </div>
    </Section>
  );
}
