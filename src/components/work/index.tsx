import { featuredProjects } from "@/content";
import { Highlight, Section } from "@/components/ui";
import { HandNote } from "@/components/sketch";
import { AlsoShipped } from "./AlsoShipped";
import { WorkCards } from "./WorkCards";
import { WorkStage } from "./WorkStage";
import { CARDS_ONLY, PINNED_ONLY, countWord } from "./parts";

/** No JavaScript: the stage cannot walk its index, so show the cards at every size. */
const NO_JS = "#work [data-work-stage]{display:none!important}#work [data-work-cards]{display:flex!important}";

/**
 * 03 SELECTED WORK (#work, paper-2 band). The authored moment is the stage re-compile:
 * - laptop / desktop: a pinned two-column stage (index + details | the project's window). Scrolling
 *   walks the index; each step wipes a paper sheet across the stage and the sketch compiles.
 * - phones, portrait tablets, short windows: stacked cards, each compiling once in view.
 * Then "Also shipped", the archive, as a container port: a crane loads the ship as you scroll,
 * and the manifest opens any container (./AlsoShipped.tsx, ./port).
 * Without JavaScript the pinned stage cannot walk its index, so every size gets the cards.
 * overflow-x: clip keeps transient overhang (a SHIPPED stamp landing from 1.9x at a card's
 * right edge, a tilt, a flip) from widening the page: on a phone that zooms the whole page out,
 * and it stays zoomed. clip is not a scroll container, so the sticky stage still sticks.
 */
export function Work() {
  const count = countWord(featuredProjects.length, true);
  return (
    <Section id="work" tone="paper-2" labelledBy="work-title" className="overflow-x-clip">
      <noscript>
        <style>{NO_JS}</style>
      </noscript>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-12">
        <h2 id="work-title" className="type-display">
          Selected <Highlight color="tangerine">work</Highlight>
        </h2>
        <div className="md:max-w-[36ch]">
          <p className="type-lead text-graphite">{count} projects, each one taken from a rough idea to working software.</p>
          <div data-work-stage="" className={PINNED_ONLY}>
            <HandNote tone="graphite" size="sm" rotate={-2} arrow="down" seed="work-scroll-note" className="mt-2">
              keep scrolling to flip through them
            </HandNote>
          </div>
        </div>
      </div>

      <WorkStage className={`mt-[clamp(28px,4vw,56px)] ${PINNED_ONLY}`} />
      <WorkCards className={`mt-12 md:mt-14 ${CARDS_ONLY}`} />

      <AlsoShipped className="mt-[clamp(64px,8vw,120px)]" />
    </Section>
  );
}
