/**
 * The stack map's shapes and tiny helpers (isomorphic, no content imports, so the client and
 * the lazily-loaded engine stay small). The data itself is derived on the server in ./model.ts
 * and handed down as plain props.
 */

export type NodeId = "interface" | "api" | "intelligence" | "data" | "automation" | "deploy";
export type Accent = "lime" | "blue" | "tangerine";

/** End to end, in order. The idle journey walks all of it. */
export const NODE_ORDER: readonly NodeId[] = ["interface", "api", "intelligence", "data", "automation", "deploy"];

/** Rows flood lime / blue-soft / tangerine-soft, rotating; the map lights a row's path in the same colour. */
export const ACCENTS: readonly Accent[] = ["lime", "blue", "tangerine"];
export const accentOf = (index: number): Accent => ACCENTS[index % ACCENTS.length];

export type MapNode = {
  id: NodeId;
  /** Layer name (the mono micro-label, uppercase). */
  label: string;
  /** The same name in the sketch state (Caveat). */
  sketch: string;
  /** 2-3 real technologies (skill names). Phones show the first two. */
  techs: string[];
  /** What happens there: a content description, cut to a short handwritten note. */
  note: string;
};

export type CapabilityPath = {
  id: string;
  title: string;
  accent: Accent;
  /** Ordered layers, canonical order. */
  route: NodeId[];
  /** Layers the capability names or is tagged with (flooded in its accent). */
  home: NodeId[];
};

export type Graph = {
  nodes: MapNode[];
  /** Wires, canonical direction (a before b in NODE_ORDER). */
  edges: [NodeId, NodeId][];
  /** The idle request's way in (the whole system) ... */
  idle: NodeId[];
  /** ... and its result's way home. */
  back: NodeId[];
  paths: CapabilityPath[];
};

export type MapView = { kind: "idle" } | { kind: "path"; path: CapabilityPath } | { kind: "node"; node: NodeId };

const rank = (n: NodeId) => NODE_ORDER.indexOf(n);
export const edgeKey = (a: NodeId, b: NodeId) => (rank(a) <= rank(b) ? `${a}>${b}` : `${b}>${a}`);

export const viewKey = (v: MapView) => (v.kind === "idle" ? "idle" : v.kind === "path" ? `path:${v.path.id}` : `node:${v.node}`);

export const neighbours = (edges: Graph["edges"], id: NodeId): NodeId[] =>
  edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : [])).sort((a, b) => rank(a) - rank(b));

/** Plain-language path for assistive tech: "Interface, API, Intelligence and Data". */
export function routeSentence(route: NodeId[], nodes: MapNode[]): string {
  const names = route.map((id) => nodes.find((n) => n.id === id)?.label ?? id);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? "");
}
