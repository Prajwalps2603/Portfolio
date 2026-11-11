/**
 * Resolves a skill's `usedIn` ids (project ids or experience ids from src/content) into
 * something the side panel can link to. Pure data; no React.
 */
import { experience, projects } from "@/content";

export type UsedInRef =
  | { kind: "case"; id: string; title: string; meta: string; href: string }
  | { kind: "repo"; id: string; title: string; meta: string; href: string }
  | { kind: "role"; id: string; title: string; meta: string; href: string }
  | { kind: "plain"; id: string; title: string; meta: string };

export function resolveUsedIn(ids: string[]): UsedInRef[] {
  const out: UsedInRef[] = [];
  for (const id of ids) {
    const project = projects.find((p) => p.id === id);
    if (project) {
      const meta = `${project.category} · ${project.year}`;
      if (project.featured) out.push({ kind: "case", id, title: project.shortTitle, meta, href: `/work/${project.id}/` });
      else if (project.links.repo) out.push({ kind: "repo", id, title: project.shortTitle, meta, href: project.links.repo });
      else out.push({ kind: "plain", id, title: project.shortTitle, meta });
      continue;
    }
    const role = experience.find((e) => e.id === id);
    if (role) {
      out.push({ kind: "role", id, title: role.company, meta: `${role.role} · ${role.periodLabel}`, href: "#changelog" });
    }
  }
  return out;
}
