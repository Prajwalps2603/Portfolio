import { profile } from "@/content";
import { Ruler, Section } from "@/components/ui";
import { RevisionHistory } from "@/components/experience/RevisionHistory";
import { Education } from "@/components/credentials/Education";
import { Certifications } from "@/components/credentials/Certifications";
import { Route } from "./Route";

/** 04 History. A bone sheet: where the signal came from, as a datasheet's records. */
export function History() {
  return (
    <Section id="experience" surface="sheet" labelledBy="experience-title">
      <Ruler />
      <div className="px-margin py-section">
        <h2 id="experience-title" className="type-display max-w-[16ch]">
          Where the signal came from.
        </h2>
        <p className="type-lead mt-6 max-w-[44ch] text-pretty text-ink-muted">{profile.about[0]}</p>
        <div className="mt-[clamp(40px,7vh,72px)]">
          <Route />
        </div>
        <div className="mt-[clamp(56px,10vh,104px)]">
          <RevisionHistory />
        </div>
        <div className="mt-[clamp(56px,10vh,104px)]">
          <Education />
        </div>
        <div className="mt-[clamp(56px,10vh,104px)]">
          <Certifications />
        </div>
      </div>
    </Section>
  );
}
