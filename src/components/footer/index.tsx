import { profile } from "@/content";
import { MotionToggle, Pill } from "@/components/ui";
import { ArrowUp } from "@/components/icons";
import { PaletteHint } from "./PaletteHint";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="wrap flex flex-wrap items-center justify-between gap-x-8 gap-y-5 py-10">
      <div className="min-w-0">
        <p className="font-display text-xl font-bold tracking-[-0.02em]">{profile.name}</p>
        <p className="type-mono mt-1 text-graphite">Designed &amp; built by {profile.name} · Next.js, GSAP, Motion</p>
        <PaletteHint className="mt-2 -ml-0.5" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <MotionToggle />
        <small className="type-mono text-graphite tabular-nums">© {year}</small>
        <Pill href="#top" variant="outline" size="sm" icon={<ArrowUp />} nudge="none">
          Back to top
        </Pill>
      </div>
    </footer>
  );
}
