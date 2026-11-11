/**
 * CONTRACT 2 (owner: stack): the tools of the stack, from src/content/skills.ts, de-duplicated and
 * in layer order.
 *
 *   export type StackKey
 *   export const stackKeys: StackKey[]
 *
 * Plain data (not a "use client" module), so server components can import it too. Which tool is
 * open is local state of the dive (./Dive), one card per layer.
 */
import { skillGroups } from "@/content";

export type StackKey = {
  id: string;
  label: string;
  groupId: string;
  groupLabel: string;
  /** First letter or digit of the name: typing it opens the tool (./Dive). */
  letter: string;
  usedIn: string[];
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const stackKeys: StackKey[] = (() => {
  const seen = new Set<string>();
  const out: StackKey[] = [];
  for (const g of skillGroups) {
    for (const s of g.skills) {
      const id = slugify(s.name);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        label: s.name,
        groupId: g.id,
        groupLabel: g.label,
        letter: (/[a-z0-9]/i.exec(s.name)?.[0] ?? "?").toUpperCase(),
        usedIn: [...s.usedIn],
      });
    }
  }
  return out;
})();
