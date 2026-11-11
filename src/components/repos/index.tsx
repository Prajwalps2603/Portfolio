import { Highlight, Section } from "@/components/ui";
import { RepoEditor } from "./RepoEditor";

/**
 * The /repos page ("Repos" in the header): every public repository as a workspace in a code editor
 * (./RepoEditor): a folder per language, a folder per repo, its README.md and repo.json. Names,
 * languages, dates, sizes and descriptions come from GitHub at build time
 * (scripts/garden-data.mjs -> src/content/garden.json). The title sits in the content column; the
 * editor breaks out of it to the full width (only the page gutter, up to 1920px; his ask: "use max
 * width"). The plain list (./RepoLibrary) and the 3D library (./Library3D) before it stay in the
 * folder, unmounted.
 */
export function ReposPage() {
  return (
    <Section
      labelledBy="repos-title"
      spacing="none"
      bleed
      className="pt-[calc(var(--header-h)+clamp(32px,6vw,72px))] pb-(--section-y)"
    >
      <div className="wrap">
        <h1 id="repos-title" className="type-display">
          All my <Highlight color="lime">repos</Highlight>
        </h1>
        <p className="type-lead measure mt-5 text-graphite">
          Every public repository I have on GitHub, opened as a workspace. Open
          a folder for a repo&apos;s README, search them, read the git log, or
          type in the terminal.
        </p>
      </div>
      <div className="mx-auto mt-10 w-[min(100%-2*var(--margin),1920px)]">
        <RepoEditor />
      </div>
    </Section>
  );
}
