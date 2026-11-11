import { Highlight, Section } from "@/components/ui";
import { capabilities, experience, profile, projects } from "@/content";
import { routes } from "@/lib/routes";
import { BuildBody, type CapRow, type ProofLink } from "./Body";
import { GRAPH } from "./model";

/**
 * 02 WHAT I BUILD (a Server Component): six capability rows (the section's authored moment: the
 * row flood + a handwritten "proof:" note) and, as its second beat, the LIVE STACK MAP, the shape
 * of what Prajwal builds end to end. Desktop: the map is sticky beside the rows (~55 / 45).
 * Below 1200px: a compact map above the rows.
 *
 * The map's data (layers, wires, each capability's path) is derived from src/content here on the
 * server (./model.ts) and handed to the client island (./Body.tsx) as plain props, so the
 * derivation never ships to the browser; the motion engine (./engine.ts) loads lazily.
 */

/** Resolve a `proof` id to a real project (case study or repo/live) or role (#changelog). */
function resolveProof(id: string): ProofLink | null {
  const p = projects.find((x) => x.id === id);
  if (p) {
    if (p.featured) return { kind: "page", id, label: p.shortTitle, href: routes.work(p.id) };
    const href = p.links.live ?? p.links.repo;
    if (!href) return null;
    return { kind: "external", id, label: p.shortTitle, href, hint: p.links.live ? "live site, opens in a new tab" : "repository, opens in a new tab" };
  }
  const e = experience.find((x) => x.id === id);
  if (e) return { kind: "section", id, label: e.company, href: "#changelog" };
  return null;
}

const ROWS: CapRow[] = capabilities.map((c) => ({
  id: c.id,
  title: c.title,
  subtitle: c.subtitle,
  description: c.description,
  tags: c.tags,
  proof: c.proof.map(resolveProof).filter((x): x is ProofLink => x !== null),
}));

export function BuildSection() {
  const sub = `${profile.inHisWords.split(" — ")[0]}.`;
  return (
    <Section id="build" labelledBy="build-title">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-12">
        <h2 id="build-title" className="type-display">
          What I <Highlight color="blue">build</Highlight>
        </h2>
        <p className="type-lead max-w-[36ch] text-graphite">{sub}</p>
      </div>
      <BuildBody rows={ROWS} graph={GRAPH} />
    </Section>
  );
}
