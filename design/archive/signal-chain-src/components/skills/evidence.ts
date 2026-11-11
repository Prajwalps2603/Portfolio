import { experience, projects } from "@/content";
import { routes } from "@/lib/routes";

export type Evidence = {
  id: string;
  kind: "Project" | "Role";
  title: string;
  meta: string;
  /** Internal datasheet / section link, or an external repository. */
  href: { type: "internal" | "external"; to: string; label: string } | null;
};

/** Resolve a `usedIn` id (project id or experience id) to something the reader can open. */
export function resolveEvidence(id: string): Evidence | null {
  const p = projects.find((x) => x.id === id);
  if (p) {
    return {
      id,
      kind: "Project",
      title: p.shortTitle,
      meta: `${p.year} / ${p.category}`,
      href: p.featured
        ? { type: "internal", to: routes.work(p.id), label: "Datasheet" }
        : p.links.repo
          ? { type: "external", to: p.links.repo, label: "Repository" }
          : p.links.live
            ? { type: "external", to: p.links.live, label: "Site" }
          : null,
    };
  }
  const e = experience.find((x) => x.id === id);
  if (e) {
    return {
      id,
      kind: "Role",
      title: `${e.role}, ${e.company}`,
      meta: e.periodLabel,
      href: {
        type: "internal",
        to: routes.section("experience"),
        label: "Experience",
      },
    };
  }
  return null;
}
