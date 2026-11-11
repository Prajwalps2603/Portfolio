import { Section } from "@/components/ui";
import { Bench } from "./Bench";
import { Archive } from "./Archive";

/**
 * 02 Systems: the bench (featured systems, re-acquired on scroll) + 02.b Also built.
 * Owner: work. The sticky bench panel is the instrument (data-instrument) and the origin of
 * the screen-to-sheet transition into /work/[slug]/.
 */
export function Work() {
  return (
    <Section id="work" surface="screen" labelledBy="work-title" className="px-margin py-section">
      <h2 id="work-title" className="type-display">
        Selected systems
      </h2>
      <p className="type-lead measure mt-5 text-muted">
        Each system drawn as built, from its own record. Open a datasheet for the full story.
      </p>
      <Bench />
      <Archive />
    </Section>
  );
}
