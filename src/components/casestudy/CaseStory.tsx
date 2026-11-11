import type { Project } from "@/content";
import { Highlight, Section } from "@/components/ui";
import { HandNote } from "@/components/sketch";

/**
 * The brief and, when the README states one, the approach. The brief is the README's own problem
 * (projects.ts `problem`, only where a README states one) followed by what was built; otherwise
 * just what was built.
 */
export function CaseStory({ project }: { project: Project }) {
  return (
    <Section id="brief" labelledBy="brief-title" spacing="none" className="py-[clamp(48px,6vw,96px)]">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <h2 id="brief-title" className="type-display text-[clamp(2rem,1.2rem+2.4vw,3.25rem)]">
            The <Highlight color="lime">brief</Highlight>
          </h2>
          {project.problem ? <p className="type-lead measure mt-6">{project.problem}</p> : null}
          <p className={`type-body measure ${project.problem ? "mt-4 text-graphite" : "mt-6"}`}>{project.summary}</p>
        </div>
        {project.approach && (
          <div>
            <h2 id="approach-title" className="type-display text-[clamp(2rem,1.2rem+2.4vw,3.25rem)]">
              The <Highlight color="blue">approach</Highlight>
            </h2>
            <p className="type-body measure mt-6">{project.approach}</p>
            <HandNote rotate={-2} arrow="down" seed={`${project.id}-approach-note`} className="mt-5">
              the diagram below walks it through
            </HandNote>
          </div>
        )}
      </div>
    </Section>
  );
}
