import type { Project } from "@/content";
import { routes } from "@/lib/routes";
import { Highlight, Pill, Section } from "@/components/ui";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { MiniUI } from "@/components/miniui";

/** Previous / next project (cyclic) in an ink slab. Internal links play the page sheet. */
export function CaseNext({ next, prev }: { next: Project; prev: Project }) {
  return (
    <Section id="next" tone="ink" slab labelledBy="next-title">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h2 id="next-title" className="type-display">
            Up <Highlight color="lime">next</Highlight>
          </h2>
          <p className="type-h3 mt-8">{next.shortTitle}</p>
          <p className="type-lead measure mt-3 text-fog">{next.tagline}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Pill href={routes.work(next.id)} label={next.shortTitle} size="lg" icon={<ArrowRight />} nudge="right">
              Read the case study
            </Pill>
            {prev.id !== next.id && (
              <Pill href={routes.work(prev.id)} label={prev.shortTitle} size="lg" variant="outline" iconBefore={<ArrowLeft />} icon={null}>
                Previous: {prev.shortTitle}
              </Pill>
            )}
          </div>
        </div>
        <div aria-hidden="true" className="hidden sm:block">
          <MiniUI projectId={next.id} size="sm" stamp={false} />
        </div>
      </div>
    </Section>
  );
}
