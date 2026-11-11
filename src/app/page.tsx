import type { Metadata } from "next";
import { site } from "@/content";
import { Intro } from "@/components/intro";
import { Hero } from "@/components/hero";
import { BuildSection } from "@/components/build";
import { Work } from "@/components/work";
import { Stack } from "@/components/stack";
import { Changelog } from "@/components/changelog";
import { About } from "@/components/about";
import { Contact } from "@/components/contact";

export const metadata: Metadata = {
  alternates: { canonical: site.url },
};

/**
 * Home: Sketch -> Ship, in the direction's order (ids are the anchor contract, src/lib/sections.ts).
 *   #top        hero + the opening (sketch -> ship)      paper
 *   #build      What I build (row flood)                 paper
 *   #work       Selected work (stage re-compile)         paper-2
 *   #stack      Stack (the iceberg dive)                 paper, then the ink sea
 *   #changelog  Experience as a git history              paper
 *   #about      README.md + education + certificates     paper
 *   #contact    Let's build something                    ink slab
 */
export default function HomePage() {
  return (
    <>
      <Intro />
      <Hero />
      <BuildSection />
      <Work />
      <Stack />
      <Changelog />
      <About />
      <Contact />
    </>
  );
}
