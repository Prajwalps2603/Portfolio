import { Highlight, Section } from "@/components/ui";
import { Dive } from "./Dive";

/**
 * 04 STACK (#stack): "My stack, all the way down" (a Server Component; the island is ./Dive).
 *
 * A stack is an iceberg: users only see the interface. The section is a hand-drawn cross-section
 * you dive through. The Interface layer is the tip above the waterline, on paper; Server & APIs,
 * Data, AI and Cloud & Delivery sit under it in the ink sea; the languages are the seabed. Every
 * tool opens a card with where it was used. The drawing is ./IcebergArt (geometry in ./iceberg).
 *
 * The section pads its own top (spacing="none"); the sea carries the bottom padding, so the ink
 * runs to the section's end.
 */
export function Stack() {
  return (
    <Section id="stack" tone="paper" bleed spacing="none" sketchNote labelledBy="stack-title" className="pt-[var(--section-y)]">
      <div className="wrap">
        <h2 id="stack-title" className="type-display">
          My <Highlight color="lime">stack</Highlight>, all the way down
        </h2>
        <p className="type-lead measure mt-5 text-graphite">
          Users only see the tip. I build everything under it too: dive through every layer, and tap any tool to see where I used it.
        </p>
      </div>
      <Dive />
    </Section>
  );
}
