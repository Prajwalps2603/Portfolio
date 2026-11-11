/**
 * THE PORT's containers (pure: no React, no DOM). Each "Also shipped" project is a shipping
 * container: numbered in reading order, painted from a fixed set of tones (dark ones carry paper
 * stencils), a tangerine LIVE placard when the project has a live site, and an owner code like a
 * real one: PMP (Prajwal M P) + U (the ISO 6346 freight-container category), a six-digit serial
 * (the year and the number) and its ISO 6346 check digit. Decoration only; every fact the card
 * states comes from src/content.
 */
import type { Project } from "@/content";

export type BoxTone = "blue-soft" | "ink" | "card" | "paper-2" | "graphite";

/** The paint cycle (blue: code; ink and greys for rhythm; accents keep their meanings elsewhere). */
const TONES: BoxTone[] = ["blue-soft", "ink", "card", "graphite", "paper-2"];

export type Box = {
  id: string;
  index: number;
  /** "01".."09". */
  no: string;
  /** "PMPU 202601 4". */
  code: string;
  tone: BoxTone;
  /** Dark paint: paper stencils. */
  dark: boolean;
  live: boolean;
  /** The stencilled name, uppercase, in one or two lines. */
  lines: string[];
};

// ISO 6346: letters count from A = 10, skipping multiples of 11.
const LETTER: Record<string, number> = {};
{
  let v = 10;
  for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (v % 11 === 0) v++;
    LETTER[ch] = v++;
  }
}

/** The ISO 6346 check digit of a 10-character owner code + category + serial. */
export function checkDigit(code: string): number {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const c = code[i];
    sum += (/\d/.test(c) ? Number(c) : LETTER[c] ?? 0) * 2 ** i;
  }
  return (sum % 11) % 10;
}

/** The stencil: one line, or two when a long name has a space to break at. */
function stencil(name: string): string[] {
  const up = name.toUpperCase();
  if (up.length <= 11 || !up.includes(" ")) return [up];
  const mid = up.length / 2;
  let at = -1;
  for (let i = 0; i < up.length; i++) if (up[i] === " " && (at < 0 || Math.abs(i - mid) < Math.abs(at - mid))) at = i;
  return [up.slice(0, at), up.slice(at + 1)];
}

export function boxesOf(projects: readonly Project[]): Box[] {
  return projects.map((p, i) => {
    const no = String(i + 1).padStart(2, "0");
    const serial = `${p.year}${no}`.slice(-6).padStart(6, "0");
    const tone = TONES[i % TONES.length];
    return {
      id: p.id,
      index: i,
      no,
      code: `PMPU ${serial} ${checkDigit(`PMPU${serial}`)}`,
      tone,
      dark: tone === "ink" || tone === "graphite",
      live: Boolean(p.links.live),
      lines: stencil(p.shortTitle),
    };
  });
}
