import { Highlight, Section } from "@/components/ui";
import { GardenScene } from "./GardenScene";
import { SeedShelf } from "./SeedShelf";

/**
 * The /garden page (linked from the header as "Garden"): Prajwal's public GitHub activity grown
 * as a garden (./GardenScene: the plot, the time-lapse, the garden signs), then the seed shelf
 * (./SeedShelf: a packet per public repo). Every number and name comes from GitHub at build time
 * (scripts/garden-data.mjs -> src/content/garden.json).
 */
export function GardenPage() {
  return (
    <>
      <Section
        labelledBy="garden-title"
        spacing="none"
        className="pt-[calc(var(--header-h)+clamp(32px,6vw,72px))] pb-(--section-y)"
      >
        <h1 id="garden-title" className="type-display">
          The <Highlight color="lime">garden</Highlight>
        </h1>
        <p className="type-lead measure mt-5 text-graphite">
          Every day I push code to GitHub, something comes up here. One spot in
          the soil for every day; the more I contributed that day, the taller
          the plant. Real data from my public GitHub, nothing planted by hand.
        </p>
        <div className="mt-10">
          <GardenScene />
        </div>
      </Section>
      <Section
        tone="paper-2"
        labelledBy="shelf-title"
        spacing="none"
        className="py-(--section-y)"
      >
        <h2
          id="shelf-title"
          className="type-display text-[clamp(2rem,4.4vw,3.25rem)]"
        >
          The seed shelf
        </h2>
        <p className="type-lead measure mt-4 text-graphite">
          Every public repository I have sown, newest first. The plant on each
          packet is the language it grows in.
        </p>
        <SeedShelf />
      </Section>
    </>
  );
}
