import { systems, type Connection, type SystemRecord, type WhatIfOption } from "@/content/projects";
import type { Project } from "@/content";
import { channel, type ChannelId } from "@/lib/channels";
import { layerChannel } from "./layers";

/** Probe state of one system on the bench (kept by the Bench so the board, scope and list agree). */
export type SysState = {
  /** Connection pinned on each of the four scope channels (null = nothing clipped). */
  pins: (string | null)[];
  /** Connection previewed by hover (desktop pointers only). */
  preview: string | null;
  /** Connection whose README note is shown in the readout. */
  last: string | null;
  /** Selected what-if option. */
  opt: number;
  /** Selected stage of the request path (-1 = none). */
  stage: number;
  /** Per scope channel: counts taps on an already-pinned connection, so its trace sweeps again. */
  ping: number[];
};

export type ResolvedSystem = {
  record: SystemRecord;
  option: WhatIfOption;
  /** Connections with the selected what-if applied. */
  conns: Connection[];
  /** Display name of a chip (what-ifs may rename it). */
  nodeLabel: (item: string) => string;
};

export function getSystem(id: string): SystemRecord {
  const s = systems[id];
  if (!s) throw new Error(`No bench record for "${id}"`);
  return s;
}

export function resolveSystem(id: string, opt: number): ResolvedSystem {
  const record = getSystem(id);
  const option = record.whatIf.options[opt] ?? record.whatIf.options[0];
  const conns = record.connections.map((c) => ({ ...c, ...(option.connections?.[c.id] ?? {}) }));
  return { record, option, conns, nodeLabel: (item) => option.nodes?.[item] ?? item };
}

/** Probes start clipped on the first connection of each channel, so the scope is never empty. */
export function defaultState(id: string): SysState {
  const { connections } = getSystem(id);
  const pins = ([1, 2, 3, 4] as const).map((ch) => connections.find((c) => c.channel === ch)?.id ?? null);
  return { pins, preview: null, last: pins[0], opt: 0, stage: -1, ping: [0, 0, 0, 0] };
}

/** Scope channel number -> palette channel. */
export function scopeChannel(ch: Connection["channel"]) {
  return channel(ch as ChannelId);
}

export type BoardRow = { layer: string; ch: ReturnType<typeof layerChannel>; items: string[] };

const ORDER = (id: ChannelId) => (id === "sigma" ? 5 : id);

/** Rows of the board, ordered Interface, Services, Data, Intelligence, then delivery. */
export function boardRows(project: Project): BoardRow[] {
  return project.architecture
    .map((l) => ({ layer: l.layer, ch: layerChannel(l.layer), items: l.items }))
    .sort((a, b) => ORDER(a.ch.id) - ORDER(b.ch.id));
}

export function rowOf(rows: { items: string[] }[], item: string): number {
  return rows.findIndex((r) => r.items.includes(item));
}

/** What the sigma row is called on the board: it is delivery, not a shipped-system label. */
export function rowLabel(r: BoardRow): string {
  return r.ch.id === "sigma" ? "Delivery" : r.ch.label;
}

export type Fact = { label: string; value: string };

/** Every fact of a featured system: award, then metrics, then the README facts (the datasheet table). */
export function allFacts(project: Project, record: SystemRecord): Fact[] {
  return [
    ...(project.award ? [{ label: "Award", value: project.award }] : []),
    ...project.metrics.map((m) => ({ label: m.label, value: m.value })),
    ...record.facts,
  ];
}

/** The 3-4 key facts the bench prints (record.bench picks them by label; the rest live on the datasheet). */
export function benchFacts(project: Project, record: SystemRecord): Fact[] {
  const all = allFacts(project, record);
  return record.bench.map((l) => all.find((f) => f.label === l)).filter((f): f is Fact => !!f);
}
