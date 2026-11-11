import type { Metadata } from "next";
import { routes } from "@/lib/routes";
import { Pill, Section } from "@/components/ui";
import { ArrowRight } from "@/components/icons";
import { HandNote, SketchSvg, Stroke, roughCircle, roughLine, roughPolyline, roughRect, scribble } from "@/components/sketch";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

/** A sketched app window with a crack through it: the page that never shipped. */
function BrokenWindow() {
  return (
    <SketchSvg viewBox="0 0 440 320" draw="mount" drawDelay={0.15} drawDuration={1.1} className="w-full max-w-[520px]">
      <Stroke d={roughRect(12, 12, 416, 292, { seed: "nf-frame", radius: 22 })} />
      <Stroke d={roughLine([12, 58], [428, 58], { seed: "nf-bar", passes: 1 })} />
      <Stroke d={roughCircle(40, 35, 6, { seed: "nf-d1", passes: 1 })} />
      <Stroke d={roughCircle(60, 35, 6, { seed: "nf-d2", passes: 1 })} />
      <Stroke d={roughCircle(80, 35, 6, { seed: "nf-d3", passes: 1 })} />
      {/* the UI that was going to be here */}
      <g className="text-pencil">
        <Stroke d={roughRect(44, 88, 168, 30, { seed: "nf-b1", radius: 8, passes: 1 })} />
        <Stroke d={roughLine([44, 140], [250, 140], { seed: "nf-l1", passes: 1 })} />
        <Stroke d={roughLine([44, 158], [210, 158], { seed: "nf-l2", passes: 1 })} />
        <Stroke d={roughRect(44, 184, 120, 86, { seed: "nf-b2", radius: 10, passes: 1 })} />
        <Stroke d={scribble(58, 200, 92, 54, { seed: "nf-s" })} />
      </g>
      {/* the crack, and the pieces that fell out */}
      <g className="text-tangerine">
        <Stroke strokeWidth={2} d={roughPolyline([[318, 58], [290, 112], [322, 140], [262, 196], [286, 226], [232, 304]], { seed: "nf-crack", passes: 2 })} />
        <Stroke d={roughPolyline([[322, 140], [372, 168], [356, 210]], { seed: "nf-crack-2" })} />
        <Stroke d={roughPolyline([[346, 238], [374, 252], [340, 262]], { seed: "nf-shard", close: true })} />
        <Stroke d={roughPolyline([[386, 270], [404, 290], [380, 292]], { seed: "nf-shard-2", close: true })} />
      </g>
    </SketchSvg>
  );
}

/** 404: "This page never shipped." A sketch of a broken window, with the way home and to the work. */
export default function NotFound() {
  return (
    <Section labelledBy="nf-title" spacing="none" className="flex min-h-[max(100svh,640px)] items-center pt-(--header-h) pb-16">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_1fr]">
        <div className="md:order-2">
          <BrokenWindow />
          <HandNote tone="tangerine" arrow="up" seed="nf-note" className="mt-2 ml-[18%]">
            404: still a sketch
          </HandNote>
        </div>
        <div>
          <h1 id="nf-title" className="type-display">
            This page never shipped.
          </h1>
          <p className="type-lead measure mt-6 text-graphite">The link may be old, or this idea never left the sketchbook. Everything that did ship is one click away.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Pill href={routes.home} label="home" icon={null}>
              Back home
            </Pill>
            <Pill href={routes.section("work")} label="home" variant="outline" icon={<ArrowRight />}>
              See my work
            </Pill>
          </div>
        </div>
      </div>
    </Section>
  );
}
