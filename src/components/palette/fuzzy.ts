/**
 * Tiny fuzzy matcher. Every whitespace-separated token of the query must match the label
 * (substring first, then in-order characters) or the keywords (substring). Returns a score and
 * the label character indices to highlight.
 */
export type Match = { score: number; idx: number[] };

export function matchText(query: string, label: string, keywords: string): Match | null {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return { score: 0, idx: [] };
  const l = label.toLowerCase();
  const k = keywords.toLowerCase();
  let score = 0;
  const idx = new Set<number>();
  for (const tok of tokens) {
    const at = l.indexOf(tok);
    if (at >= 0) {
      const wordStart = at === 0 || /[\s\-_/.]/.test(l[at - 1]);
      score += 100 - Math.min(at, 40) + (wordStart ? 30 : 0) + (l === tok ? 60 : 0);
      for (let i = 0; i < tok.length; i++) idx.add(at + i);
      continue;
    }
    if (tok.length >= 2) {
      const sub = subsequence(tok, l);
      if (sub) {
        score += 40 - sub.gaps;
        sub.idx.forEach((i) => idx.add(i));
        continue;
      }
    }
    if (k.includes(tok)) {
      score += 25;
      continue;
    }
    return null;
  }
  return { score, idx: [...idx].sort((a, b) => a - b) };
}

function subsequence(tok: string, text: string): { idx: number[]; gaps: number } | null {
  const idx: number[] = [];
  let from = 0;
  let gaps = 0;
  for (const ch of tok) {
    const at = text.indexOf(ch, from);
    if (at < 0) return null;
    if (idx.length && at !== idx[idx.length - 1] + 1) gaps++;
    idx.push(at);
    from = at + 1;
  }
  return gaps > 3 ? null : { idx, gaps };
}
