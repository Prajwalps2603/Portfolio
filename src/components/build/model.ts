/**
 * THE STACK MAP MODEL (server side: the section's Server Component imports it, so none of this
 * ships to the browser): the six layers of what Prajwal builds end to end, the wires between
 * them, and the path each capability takes through them, as one plain `GRAPH` object.
 *
 * Nothing here is a new fact. Every technology is a skill name from src/content/skills.ts, every
 * note is a content description, and every path is DERIVED, never typed in:
 *
 *   route(capability) = the layers its title / subtitle name ("delivery" -> Deploy)
 *                     + the layers its tags live in ("ChromaDB" -> Data)
 *                     + the layers EVERY one of its proof projects / roles uses
 *                       (project `architecture`, role `stack`),
 *   ordered Interface -> API -> Intelligence -> Data -> Automation -> Deploy.
 *
 * `home` (the layers it names or tags) is where the capability lives; the rest of the route is
 * how a request reaches it. e.g. AI-Powered Applications: home Intelligence, route
 * Interface -> API -> Intelligence -> Data.
 */
import { capabilities, experience, projects, skillGroups } from "@/content";
import type { ArchitectureLayer, Capability } from "@/content";
import { NODE_ORDER, accentOf, edgeKey, neighbours, type CapabilityPath, type Graph, type MapNode, type NodeId } from "./graph";

// ---------------------------------------------------------------------------------------------
// Skills -> layers
// ---------------------------------------------------------------------------------------------

/** The skill group each layer draws from. Automation borrows from three groups (PICKS). */
const GROUP_OF: Partial<Record<NodeId, string>> = {
  interface: "interface",
  api: "api",
  intelligence: "intelligence",
  data: "data",
  deploy: "infrastructure",
};

const LABEL: Record<NodeId, string> = {
  interface: "Interface",
  api: "API",
  intelligence: "Intelligence",
  data: "Data",
  automation: "Automation",
  deploy: "Deploy",
};

/**
 * The technologies each node lists, by their exact name in skills.ts (anything renamed or removed
 * there simply drops off the map). Order matters: phones show the first two.
 */
const PICKS: Record<NodeId, string[]> = {
  interface: ["React 19", "Next.js", "React Native"],
  api: ["Spring Boot", "Node.js & Express", "FastAPI"],
  intelligence: ["RAG pipelines", "Google Gemini", "TensorFlow & Keras"],
  data: ["PostgreSQL", "MongoDB", "ChromaDB"],
  automation: ["Google Apps Script", "Playwright", "Google Sheets & Drive"],
  deploy: ["Docker", "GitHub Actions", "AWS — EC2, S3, RDS"],
};

/** "Node.js & Express" -> ["node.js", "express"]. */
function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.+#]+/g, " ")
    .split(" ")
    .map((w) => w.replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
}

const startsWith = (a: string[], b: string[]) => b.length <= a.length && b.every((w, i) => a[i] === w);
function contains(a: string[], b: string[]) {
  for (let i = 0; i + b.length <= a.length; i++) if (b.every((w, j) => a[i + j] === w)) return true;
  return false;
}

type SkillRef = { name: string; group: string; words: string[]; acronym: string };
const SKILLS: SkillRef[] = skillGroups.flatMap((g) =>
  g.skills.map((s) => {
    const w = words(s.name);
    return { name: s.name, group: g.id, words: w, acronym: w.map((x) => x[0]).join("") };
  }),
);
const SKILL_NAMES = new Set(SKILLS.map((s) => s.name));

/** Which node a skill belongs to: a node's own pick first, else its group's layer (languages: none). */
function nodeOfSkill(s: SkillRef): NodeId | null {
  for (const id of NODE_ORDER) if (PICKS[id].includes(s.name)) return id;
  for (const id of NODE_ORDER) if (GROUP_OF[id] === s.group) return id;
  return null;
}

/**
 * A free-text term (a tag, a stack item, an architecture item) -> its node, through the skill it
 * names: same words, a word prefix ("React" -> "React 19", "Next.js 14" -> "Next.js"), contained
 * words ("Express" -> "Node.js & Express") or an acronym ("MCP" -> "Model Context Protocol").
 */
function nodeOfTerm(term: string): NodeId | null {
  const t = words(term);
  if (!t.length) return null;
  for (const s of SKILLS) {
    const w = s.words;
    if (startsWith(w, t) || startsWith(t, w) || contains(w, t) || (t.length === 1 && t[0].length >= 3 && s.acronym === t[0])) {
      return nodeOfSkill(s);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------------------------

/** Words that name each layer: its skill group's label + layer ("Cloud & Delivery", "Infrastructure"). */
const KEYWORDS: Record<NodeId, string[]> = Object.fromEntries(
  NODE_ORDER.map((id) => {
    const g = skillGroups.find((x) => x.id === GROUP_OF[id]);
    return [id, words(g ? `${g.label} ${g.layer}` : LABEL[id])];
  }),
) as Record<NodeId, string[]>;

/** A content description as a short handwritten note: up to an em dash, or the first clause if long. */
function shortNote(text: string): string {
  let s = text.split(/\s+—\s+/)[0] ?? text;
  if (s.length > 80) s = s.split(/,\s/)[0] ?? s;
  return s.replace(/\.\s*$/, "").trim();
}

function noteFor(id: NodeId): string {
  const g = skillGroups.find((x) => x.id === GROUP_OF[id]);
  if (g) return shortNote(g.description);
  // a layer without a skill group: the capability named after it ("Automation & Digital Solutions")
  const cap = capabilities.find((c) => words(c.title).some((w) => KEYWORDS[id].includes(w)));
  return cap ? shortNote(cap.description) : "";
}

const NODES: MapNode[] = NODE_ORDER.map((id) => ({
  id,
  label: LABEL[id],
  sketch: LABEL[id].toLowerCase(),
  techs: PICKS[id].filter((name) => SKILL_NAMES.has(name)),
  note: noteFor(id),
}));

// ---------------------------------------------------------------------------------------------
// Evidence -> paths
// ---------------------------------------------------------------------------------------------

const LAYER_NODE: Record<ArchitectureLayer["layer"], NodeId | null> = {
  Interface: "interface",
  API: "api",
  Intelligence: "intelligence",
  Data: "data",
  Infrastructure: null, // per item: Playwright -> Automation, the rest -> Deploy
};

/** The layers a proof (a project's architecture, or a role's stack) actually uses. */
function evidence(id: string): Set<NodeId> | null {
  const p = projects.find((x) => x.id === id);
  if (p) {
    const out = new Set<NodeId>();
    for (const l of p.architecture) {
      const n = LAYER_NODE[l.layer];
      if (n) out.add(n);
      else for (const item of l.items) out.add(nodeOfTerm(item) === "automation" ? "automation" : "deploy");
    }
    return out;
  }
  const e = experience.find((x) => x.id === id);
  if (e) {
    const out = new Set<NodeId>();
    for (const s of e.stack) {
      const n = nodeOfTerm(s);
      if (n) out.add(n);
    }
    return out;
  }
  return null;
}

function derive(cap: Capability, index: number): CapabilityPath {
  const named = new Set<NodeId>();
  const capWords = words(`${cap.title} ${cap.subtitle}`);
  for (const id of NODE_ORDER) if (KEYWORDS[id].some((k) => capWords.includes(k))) named.add(id);
  for (const t of cap.tags) {
    const n = nodeOfTerm(t);
    if (n) named.add(n);
  }
  // the layers every proof shares
  const proofs = cap.proof.map(evidence).filter((x): x is Set<NodeId> => x !== null);
  const shared = new Set<NodeId>(proofs.length ? NODE_ORDER.filter((n) => proofs.every((ev) => ev.has(n))) : []);
  const route = NODE_ORDER.filter((n) => named.has(n) || shared.has(n));
  return {
    id: cap.id,
    title: cap.title,
    accent: accentOf(index),
    route: route.length ? route : ["interface"],
    home: NODE_ORDER.filter((n) => named.has(n)),
  };
}

const PATHS: CapabilityPath[] = capabilities.map(derive);

// ---------------------------------------------------------------------------------------------
// Edges + the idle circulation
// ---------------------------------------------------------------------------------------------

const rank = (n: NodeId) => NODE_ORDER.indexOf(n);

/** Every wire the paths need, plus the full chain the idle request walks. Canonical direction. */
const EDGES: [NodeId, NodeId][] = (() => {
  const seen = new Map<string, [NodeId, NodeId]>();
  const add = (a: NodeId, b: NodeId) => {
    const [x, y] = rank(a) <= rank(b) ? [a, b] : [b, a];
    seen.set(edgeKey(x, y), [x, y]);
  };
  for (let i = 1; i < NODE_ORDER.length; i++) add(NODE_ORDER[i - 1], NODE_ORDER[i]);
  for (const p of PATHS) for (let i = 1; i < p.route.length; i++) add(p.route[i - 1], p.route[i]);
  return [...seen.values()].sort((a, b) => rank(a[0]) - rank(b[0]) || rank(a[1]) - rank(b[1]));
})();

/** The result comes home by the shortest wires (breadth-first from Deploy to Interface). */
const BACK: NodeId[] = (() => {
  const from: NodeId = "deploy";
  const to: NodeId = "interface";
  const prev = new Map<NodeId, NodeId | null>([[from, null]]);
  const queue: NodeId[] = [from];
  while (queue.length) {
    const n = queue.shift() as NodeId;
    if (n === to) break;
    for (const m of neighbours(EDGES, n)) {
      if (!prev.has(m)) {
        prev.set(m, n);
        queue.push(m);
      }
    }
  }
  // walk back from Interface: unshift builds Deploy -> ... -> Interface
  const out: NodeId[] = [];
  for (let n: NodeId | null | undefined = to; n; n = prev.get(n)) out.unshift(n);
  return out.length > 1 ? out : [...NODE_ORDER].reverse();
})();

/** Everything the map needs, as plain data for the client. */
export const GRAPH: Graph = { nodes: NODES, edges: EDGES, idle: [...NODE_ORDER], back: BACK, paths: PATHS };
