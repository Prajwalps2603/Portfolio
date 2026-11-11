/**
 * THE DIAGRAM SPEC: the data a living system diagram is drawn from. Pure TS (server-safe).
 *
 * A spec is a set of lanes (layers, top to bottom / left to right), the nodes in each lane, the
 * edges between nodes and the journey a request takes through them (`steps`). Build one with
 * `buildSpec()` from plain labels; `projectDiagram()` (./projects.ts) builds one from a project.
 *
 * Packet kinds have FIXED meanings across the site (the diagram grammar):
 * - request  (lime):      a request going in
 * - data     (blue):      data or code moving between services
 * - response (tangerine): the response / shipped result coming back
 */

export type PacketKind = "request" | "data" | "response";

export type DiagramNode = {
  id: string;
  /** Lane index (0 = the user-facing layer). */
  lane: number;
  /** The real technology or step, from the content (Inter). */
  label: string;
  /** The layer, as a short mono micro-label: INTERFACE / API / INTELLIGENCE / DATA / INFRA. */
  micro: string;
  /** The layer's plain name ("Infrastructure"), for notes and accessible names. */
  layer: string;
  /** What happens here, from the content (a layer note). Steps hosted here are added at render. */
  note?: string;
};

export type DiagramLane = { id: string; layer: string; micro: string; nodes: string[] };

/** route: part of the journey (solid). link: a relationship the content states (dashed, no packets). */
export type DiagramEdge = { id: string; a: string; b: string; kind: "route" | "link" };

/** One hop of a packet: along `edge`, from node `from` to node `to`. */
export type DiagramHop = { edge: string; from: string; to: string };

export type DiagramStep = {
  /** The step, verbatim from the content's flow. */
  text: string;
  /** What happens there in a few handwritten words (src/content/journeys.ts), when known. */
  note?: string;
  /** The node where the step happens. */
  node: string;
  kind: PacketKind;
  /** The hops from the previous step's node to this one (the first step: from its `via`, if any). */
  hops: DiagramHop[];
};

export type DiagramSpec = {
  id: string;
  /** Human name of the system ("ResumAI"), for accessible labels. */
  name: string;
  lanes: DiagramLane[];
  nodes: Record<string, DiagramNode>;
  edges: DiagramEdge[];
  steps: DiagramStep[];
};

export type LaneInput = { layer: string; micro?: string; items: string[]; note?: string };
export type StepInput = { text: string; note?: string; at: string; via?: readonly string[]; kind: PacketKind };

/** Mono micro-labels of the content's layers (short, uppercase in CSS). */
const MICRO: Record<string, string> = {
  Interface: "Interface",
  API: "API",
  Intelligence: "Intelligence",
  Data: "Data",
  Infrastructure: "Infra",
  Automation: "Automation",
  Deploy: "Deploy",
};

export function microFor(layer: string): string {
  return MICRO[layer] ?? layer;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Build a spec from labels. `steps[].at` / `via` and `links` name nodes by their label (or
 * "Layer: label" when a label repeats). Returns null when a name does not resolve, so a caller can
 * fall back instead of drawing a wrong journey.
 */
export function buildSpec({
  id,
  name,
  lanes,
  steps = [],
  links = [],
}: {
  id: string;
  name: string;
  lanes: readonly LaneInput[];
  steps?: readonly StepInput[];
  links?: readonly (readonly [string, string])[];
}): DiagramSpec | null {
  const nodes: Record<string, DiagramNode> = {};
  const byLabel = new Map<string, string[]>();
  const outLanes: DiagramLane[] = lanes.map((lane, li) => {
    const ids = lane.items.map((label) => {
      let nid = `${slug(lane.layer)}--${slug(label)}`;
      while (nodes[nid]) nid += "-x";
      nodes[nid] = { id: nid, lane: li, label, micro: lane.micro ?? microFor(lane.layer), layer: lane.layer, note: lane.note };
      byLabel.set(label, [...(byLabel.get(label) ?? []), nid]);
      byLabel.set(`${lane.layer}: ${label}`, [nid]);
      return nid;
    });
    return { id: `lane-${slug(lane.layer)}`, layer: lane.layer, micro: lane.micro ?? microFor(lane.layer), nodes: ids };
  });

  const resolve = (label: string): string | null => {
    const hit = byLabel.get(label);
    return hit && hit.length === 1 ? hit[0] : null;
  };

  const edges: DiagramEdge[] = [];
  const edgeOf = new Map<string, DiagramEdge>();
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const ensure = (a: string, b: string, kind: DiagramEdge["kind"]): DiagramEdge => {
    const k = key(a, b);
    const found = edgeOf.get(k);
    if (found) {
      if (kind === "route") found.kind = "route";
      return found;
    }
    const e: DiagramEdge = { id: `e-${edges.length}-${a}-${b}`, a, b, kind };
    edges.push(e);
    edgeOf.set(k, e);
    return e;
  };

  const outSteps: DiagramStep[] = [];
  let prev: string | null = null;
  for (const s of steps) {
    const at = resolve(s.at);
    if (!at) return null;
    const via: string[] = [];
    for (const v of s.via ?? []) {
      const r = resolve(v);
      if (!r) return null;
      via.push(r);
    }
    // the first step may start upstream (e.g. the app that runs the pipeline): its `via` leads in
    const path = prev ? [prev, ...via, at] : [...via, at];
    const hops: DiagramHop[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i] === path[i + 1]) continue;
      const e = ensure(path[i], path[i + 1], "route");
      hops.push({ edge: e.id, from: path[i], to: path[i + 1] });
    }
    outSteps.push({ text: s.text, note: s.note, node: at, kind: s.kind, hops });
    prev = at;
  }
  for (const [la, lb] of links) {
    const a = resolve(la);
    const b = resolve(lb);
    if (!a || !b) return null;
    ensure(a, b, "link");
  }

  return { id, name, lanes: outLanes, nodes, edges, steps: outSteps };
}

/** The steps hosted by a node (index + text + handwritten note), in journey order. */
export function stepsAt(spec: DiagramSpec, nodeId: string): { index: number; text: string; note?: string; kind: PacketKind }[] {
  const out: { index: number; text: string; note?: string; kind: PacketKind }[] = [];
  spec.steps.forEach((s, index) => {
    if (s.node === nodeId) out.push({ index, text: s.text, note: s.note, kind: s.kind });
  });
  return out;
}

/** The steps whose request passes through a node on its way (not where the step happens). */
export function passesThrough(spec: DiagramSpec, nodeId: string): number[] {
  const out: number[] = [];
  spec.steps.forEach((s, index) => {
    if (s.node === nodeId) return;
    const prev = index > 0 ? spec.steps[index - 1].node : null;
    if (s.hops.some((h) => (h.from === nodeId && h.from !== prev) || (h.to === nodeId && h.to !== s.node))) out.push(index);
  });
  return out;
}

/** Ids of the nodes a node shares an edge with. */
export function neighbours(spec: DiagramSpec, nodeId: string): { nodes: Set<string>; edges: Set<string> } {
  const nodes = new Set<string>([nodeId]);
  const edges = new Set<string>();
  for (const e of spec.edges) {
    if (e.a === nodeId || e.b === nodeId) {
      edges.add(e.id);
      nodes.add(e.a === nodeId ? e.b : e.a);
    }
  }
  return { nodes, edges };
}
