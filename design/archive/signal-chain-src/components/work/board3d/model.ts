import type { Project } from "@/content";
import type { Connection } from "@/content/projects";
import { CHANNELS, type ChannelId } from "@/lib/channels";
import { boardRows, type ResolvedSystem } from "../system";
import { COLS, type Frame } from "./frame";
import { requestHops, routeBoard, type Hop, type Routed } from "./layout";
import type { PaintChip, PaintColumn } from "./texture";

/**
 * Everything the 3D board draws for one system, derived from the same typed record as the SVG
 * board, the connection list and the scope (one source of truth). Routing depends only on the
 * topology, so it is cached per system; labels, idle copper and failures follow the what-if.
 */
export type ModelChip = PaintChip & { layer: string; channel: ChannelId; down: boolean };
export type ModelWire = { id: string; hex: string; conn: Connection; idle: boolean; sigma: boolean };

export type BoardModel = {
  /** System + what-if: changes repaint labels and re-light copper. */
  key: string;
  /** System only: changes rebuild geometry and play the acquisition. */
  topo: string;
  frame: Frame;
  routed: Routed;
  chips: ModelChip[];
  wires: ModelWire[];
  columns: PaintColumn[];
  legend: { left: string; right: string };
  hops: Hop[];
  stages: string[][];
};

const LAYER_NAME: Record<string, string> = { 1: "Interface", 2: "Services", 3: "Data", 4: "Intelligence", sigma: "Delivery" };
const colOf = (id: ChannelId) => (id === "sigma" ? COLS - 1 : id - 1);
const hexOf = (id: ChannelId) => CHANNELS.find((c) => c.id === id)?.hex ?? CHANNELS[4].hex;

export function buildModel(project: Project, system: ResolvedSystem, opt: number, frame: Frame): BoardModel {
  const rows = boardRows(project);
  const columns: string[][] = Array.from({ length: COLS }, () => []);
  const channelOfItem = new Map<string, ChannelId>();
  const layerOfItem = new Map<string, string>();
  rows.forEach((r) =>
    r.items.forEach((it) => {
      columns[colOf(r.ch.id)].push(it);
      channelOfItem.set(it, r.ch.id);
      layerOfItem.set(it, r.ch.id === "sigma" ? "Delivery" : r.ch.label);
    }),
  );
  const routed = routeBoard({ key: `${project.id}:${frame.rows}`, frame, columns, conns: system.record.connections });

  // Silkscreen reference designators, in board order (the SVG board numbers them the same way).
  const refdes = new Map<string, string>();
  rows.forEach((r) => r.items.forEach((it) => refdes.has(it) || refdes.set(it, `U${refdes.size + 1}`)));

  const failing = new Set(system.conns.filter((c) => c.shape === "fail" && !c.idle).map((c) => c.to));
  const chips: ModelChip[] = routed.chips.map((c) => {
    const ch = channelOfItem.get(c.id) ?? "sigma";
    return {
      id: c.id,
      label: system.nodeLabel(c.id),
      refdes: refdes.get(c.id) ?? "",
      hex: hexOf(ch),
      layer: layerOfItem.get(c.id) ?? "",
      channel: ch,
      down: failing.has(c.id),
    };
  });

  const byId = new Map(system.conns.map((c) => [c.id, c]));
  const wires: ModelWire[] = routed.wires.map((w) => {
    const conn = byId.get(w.id) as Connection;
    return { id: w.id, hex: hexOf(conn.channel), conn, idle: !!conn.idle, sigma: conn.channel === "sigma" };
  });

  const paintColumns: PaintColumn[] = CHANNELS.map((c) => ({
    label: LAYER_NAME[String(c.id)],
    mark: c.mark,
    hex: c.hex,
    fitted: columns[colOf(c.id)].length > 0,
  }));

  return {
    key: `${project.id}:${opt}`,
    topo: project.id,
    frame,
    routed,
    chips,
    wires,
    columns: paintColumns,
    legend: {
      left: project.title,
      right: `U1 to U${refdes.size} · ${project.architecture.length} layers / ${system.conns.length} connections`,
    },
    hops: requestHops(system.record.stages, system.conns),
    stages: system.record.stages,
  };
}
