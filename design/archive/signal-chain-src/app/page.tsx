import { Intro } from "@/components/intro";
import { Scene } from "@/components/scene";
import { Hero } from "@/components/hero";
import { Statement, History } from "@/components/about";
import { Work } from "@/components/work";
import { Stack } from "@/components/skills";
import { Contact } from "@/components/contact";

/**
 * Home: the signal chain, in the direction's order.
 *   00 Source   hero + opening over the scope    (screen)  #source
 *   01 Signal   the job in his words             (screen)  #signal
 *   02 Systems  the bench + also built           (screen)  #work
 *   03 Stack    channel setup (BOM)              (screen)  #stack
 *   04 History  where the signal came from       (sheet)   #experience
 *   05 Connect  the chain ends with you          (screen)  #contact
 * The scope canvas is hero-only, so <Scene> mounts here behind the hero, not in the layout.
 */
export default function HomePage() {
  return (
    <>
      <Intro />
      <div className="relative isolate bg-graphite">
        <Scene />
        <Hero />
      </div>
      <Statement />
      <Work />
      <Stack />
      <History />
      <Contact />
    </>
  );
}
