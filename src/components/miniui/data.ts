import { projects, type Project } from "@/content";

/**
 * Mini-UI data. Every real label comes from src/content (a project's flow, metrics, architecture,
 * stack, award): the helpers below read them by meaning, with a graceful fallback so a content
 * edit never breaks a template. ILLUSTRATIVE values (sample input a user would type, placeholder
 * names) live only in SAMPLE and must read as illustrative ("Venue A", "Contact A"): they are
 * never facts about Prajwal or his projects, and never numbers dressed up as results.
 */

export function projectData(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

/** The project's flow step at `i` (real wording), or the fallback. */
export function step(
  p: Project | undefined,
  i: number,
  fallback: string,
): string {
  return p?.flow?.[i] ?? fallback;
}

/** The value of the metric whose label contains `match` (e.g. "accuracy" -> "97%"). */
export function metric(
  p: Project | undefined,
  match: string,
): { value: string; label: string } | undefined {
  const m = p?.metrics.find((x) =>
    x.label.toLowerCase().includes(match.toLowerCase()),
  );
  return m ? { value: m.value, label: m.label } : undefined;
}

/** First architecture item (any layer) matching `match` (case-insensitive), or the fallback. */
export function part(
  p: Project | undefined,
  match: RegExp,
  fallback: string,
): string {
  for (const layer of p?.architecture ?? []) {
    const hit = layer.items.find((it) => match.test(it));
    if (hit) return hit;
  }
  return fallback;
}

/** Stack entries matching `match`, in content order. */
export function stackOf(p: Project | undefined, match: RegExp): string[] {
  return (p?.stack ?? []).filter((s) => match.test(s));
}

/** Short award line ("1st Place — BE Final Year Project"), without the institution and year. */
export function awardShort(p: Project | undefined): string | undefined {
  if (!p?.award) return undefined;
  return p.award.split(",")[0]?.trim();
}

/** Names in the project's highlights matching `match` (e.g. its speech-to-text providers), in order. */
export function namesIn(p: Project | undefined, match: RegExp): string[] {
  const rx = new RegExp(match.source, `g${match.flags.replace("g", "")}`);
  const out: string[] = [];
  for (const h of p?.highlights ?? [])
    for (const m of h.matchAll(rx)) if (!out.includes(m[0])) out.push(m[0]);
  return out;
}

/** Illustrative sample data: obviously placeholder, never a claim. */
export const SAMPLE = {
  /** A question a user might type into the drone-rules assistant. */
  question: "Which DGCA rules apply to my flight?",
  /** The composer placeholder of the same assistant. */
  ask: "Ask about DGCA rules",
  /** Telecaller call list: placeholder contacts, sample clock times. */
  calls: [
    { name: "Contact A", time: "10:42", dir: "in" },
    { name: "Contact B", time: "11:05", dir: "out" },
    { name: "Contact C", time: "11:38", dir: "in" },
    { name: "Contact D", time: "12:10", dir: "out" },
  ],
  /** The drone-rules assistant, a sample exchange. The answer restates DGCA's Drone Rules, 2021 (green
   *  zones: up to 400 ft above ground without permission; yellow and red zones need approval). */
  drone: {
    question: "Can I fly my drone at 100 m in a green zone?",
    answer:
      "Yes. In a green zone you can fly up to 400 ft (120 m) above ground without prior permission. Yellow and red zones need approval first.",
    /** the passages the answer was built from (the retrieval step), by topic; they restate the same rules */
    chunks: [
      "Green zone: up to 400 ft, no permission",
      "Yellow zone: permission from ATC",
      "Red zone: permission from the Centre",
    ],
    source: "Drone Rules, 2021",
    verdict: "Green zone",
    limit: "up to 120 m",
  },
  /** One telecaller call, transcribed with its speakers (a sample conversation, not a real call). */
  transcript: [
    {
      who: "Speaker 1",
      at: "00:02",
      text: "Hi, calling about your enquiry from yesterday.",
    },
    {
      who: "Speaker 2",
      at: "00:06",
      text: "Yes, I wanted the price and the delivery date.",
    },
    {
      who: "Speaker 1",
      at: "00:11",
      text: "Sure, I'll share both on this number today.",
    },
  ],
  /** The same call's summary row as it lands in Google Sheets (sample). */
  summary: "Asked for price and delivery date",
  venue: "Venue A",
  /** Résumé sections on the A4 preview (generic headings). */
  resumeSections: ["Experience", "Skills"],
  /** Audit log rows (placeholder roles). */
  jobs: ["Role A", "Role B", "Role C", "Role D", "Role E"],
} as const;
