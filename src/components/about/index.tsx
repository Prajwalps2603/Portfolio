import { Highlight, Section } from "@/components/ui";
import { HandNote } from "@/components/sketch";
import { Readme } from "./Readme";
import { RoadMap } from "./RoadMap";
import { Vault } from "./Vault";

export function About() {
  return (
    // Extra bottom room: the section ends on the ink vault slab and the next section is the ink
    // Contact slab, so the paper between them must clearly read as a section boundary.
    <Section id="about" labelledBy="about-title" spacing="none" sketchNote className="pt-(--section-y) pb-[calc(var(--section-y-end)+clamp(24px,4vw,64px))]">
      <h2 id="about-title" className="type-display">
        About, in a <Highlight color="tangerine">README</Highlight>
      </h2>

      <div className="mt-12 grid items-start gap-10 lg:mt-14 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        {/* the README, Preview | Code (./Readme); from 1200px the ECE note sits under it, pointing at
            the degree's ticket across the gap */}
        <div className="flex flex-col gap-10">
          <Readme />
          <HandNote tone="blue" arrow="right" seed="about-note-ece-lg" rotate={-1.5} className="self-end max-lg:hidden">
            ECE degree, software career. yes, really.
          </HandNote>
        </div>

        {/* the road so far: the route on a map, the schooling, degree and work as tickets (./RoadMap) */}
        <div className="flex flex-col gap-6">
          <RoadMap />
          <HandNote tone="blue" arrow="up" seed="about-note-ece" rotate={1.5} className="-mt-2 self-start lg:hidden">
            ECE degree, software career. yes, really.
          </HandNote>
        </div>
      </div>

      {/* certifications and the award: a vault that opens, a deposit box for each (./Vault) */}
      <div className="mt-16 lg:mt-20">
        <HandNote tone="graphite" arrow="down" seed="about-note-verify" rotate={-1.5} className="mb-4">
          Verify opens each one at the issuer
        </HandNote>
        <div data-tone="ink" className="slab-clip relative overflow-hidden rounded-slab bg-ink px-6 pt-14 pb-[clamp(32px,4vw,56px)] text-paper sm:px-12 lg:px-16">
          <h3 className="type-h3">Certifications &amp; awards</h3>
          <Vault />
        </div>
      </div>
    </Section>
  );
}
