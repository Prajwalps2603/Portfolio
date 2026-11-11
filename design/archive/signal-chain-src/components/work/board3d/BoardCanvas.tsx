"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Project } from "@/content";
import { ChannelMark } from "@/components/ui";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import type { ResolvedSystem, SysState } from "../system";
import { frameFor } from "./frame";
import { buildModel, type BoardModel } from "./model";
import { lease, type Lease } from "./stage";
import { Scene, type SceneBridge, type ScenePointer } from "./Scene";

/**
 * The lazy entry of the 3D bench board (three.js + R3F live in this chunk). It borrows the
 * shared canvas (./stage) while its host is on the page, forwards pointer events to the scene
 * (queued until the scene is ready: the pending-selection queue), and renders the crisp DOM
 * overlays the scene positions every frame: a channel badge over each probe, and the readout of
 * the chip under the pointer. The canvas and overlays are aria-hidden; the board's role="img"
 * description and the connection list carry the same information for every input.
 */
export type BoardCanvasProps = {
  project: Project;
  system: ResolvedSystem;
  state: SysState;
  rows: number;
  lit: ReadonlySet<string>;
  /** Preview in effect (the bench's, or a hover on this board). */
  preview: string | null;
  reduced: boolean;
  loops: boolean;
  onProbe: (conn: string) => void;
  onHoverWire: (conn: string | null) => void;
  onStatus: (status: "seating" | "seated") => void;
  onReady: () => void;
  onFail: () => void;
};

const models = new Map<string, BoardModel>();
function modelFor(project: Project, system: ResolvedSystem, opt: number, rows: number) {
  const key = `${project.id}:${opt}:${rows}`;
  let m = models.get(key);
  if (!m) {
    m = buildModel(project, system, opt, frameFor(rows));
    models.set(key, m);
  }
  return m;
}

let leases = 0;

export default function BoardCanvas(props: BoardCanvasProps) {
  const { project, system, state, rows } = props;
  const host = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const badges = useRef<(HTMLSpanElement | null)[]>([]);
  const bridge = useRef<SceneBridge>({ handle: null, queue: [] });
  const held = useRef<{ lease: Lease; id: number } | null>(null);
  const [chip, setChip] = useState<{ id: string; pinned: boolean } | null>(null);
  const model = modelFor(project, system, state.opt, rows);

  // Probe under each channel: the pin, unless a preview is on that channel.
  const previewConn = props.preview ? system.conns.find((c) => c.id === props.preview) : undefined;
  const probes = ([1, 2, 3, 4] as const).map((ch) => (previewConn && previewConn.channel === ch ? previewConn.id : state.pins[ch - 1]));

  const latest = useRef(props);
  latest.current = props;
  const scene = (h: HTMLDivElement, leaseId: number): ReactNode => (
    <Scene
      key="board"
      model={model}
      lit={props.lit}
      probes={probes}
      ping={state.ping}
      stage={state.stage}
      reduced={props.reduced}
      loops={props.loops}
      host={h}
      bridge={bridge.current}
      tip={tip.current}
      badges={badges.current}
      chip={chip?.id ?? null}
      onChip={(id, pinned) => setChip(id ? { id, pinned } : null)}
      onWire={(id) => latest.current.onHoverWire(id)}
      onProbe={(id) => latest.current.onProbe(id)}
      onStatus={(s) => latest.current.onStatus(s)}
      frameKey={leaseId}
      onFirstFrame={() => {
        if (held.current?.id !== leaseId) return;
        held.current.lease.canvas.style.opacity = "1";
        latest.current.onReady();
      }}
    />
  );
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  // Pointer events reach the scene, or wait in the queue until it is ready.
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const forward = (kind: ScenePointer["kind"]) => (e: PointerEvent | MouseEvent) => {
      const r = el.getBoundingClientRect();
      const ev: ScenePointer = {
        kind,
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        pointerType: "pointerType" in e && e.pointerType ? e.pointerType : "mouse",
        t: performance.now(),
      };
      const b = bridge.current;
      if (b.handle) b.handle(ev);
      else if (kind !== "leave") {
        b.queue.push(ev);
        if (b.queue.length > 8) b.queue.shift();
      } else b.queue.length = 0;
    };
    const move = forward("move");
    const leave = forward("leave");
    const click = forward("click");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("click", click);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("click", click);
    };
  }, []);

  // Borrow the shared canvas while this host is laid out; give it back on unmount.
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const fail = () => latest.current.onFail();
    const sync = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      if (!held.current) {
        const id = ++leases;
        held.current = { lease: lease(el, w, h, fail), id };
        held.current.lease.render(sceneRef.current(el, id));
      } else held.current.lease.resize(w, h);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      held.current?.lease.release();
      held.current = null;
    };
  }, []);

  // Every render: hand the scene its latest props.
  useLayoutEffect(() => {
    const h = held.current;
    const el = host.current;
    if (h && el) h.lease.render(sceneRef.current(el, h.id));
  });

  const info = chip ? model.chips.find((c) => c.id === chip.id) : undefined;
  const links = info ? model.wires.filter((w) => w.conn.from === info.id || w.conn.to === info.id) : [];

  return (
    <div ref={host} className="absolute inset-0" data-board3d="">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {([1, 2, 3, 4] as const).map((ch, i) => (
          <span
            key={ch}
            ref={(el) => {
              badges.current[i] = el;
            }}
            className="absolute top-0 left-0 opacity-0 will-change-transform"
          >
            <ChannelMark ch={ch} size={16} />
          </span>
        ))}
        {info ? (
          <div
            ref={tip}
            className="absolute top-0 left-0 z-(--z-raised) w-max max-w-[min(320px,80%)] border bg-graphite px-3 py-2.5 transition-opacity duration-150 ease-panel starting:opacity-0"
            style={{ borderColor: info.hex }}
          >
            <p className="type-label flex items-center gap-2 text-muted">
              <ChannelMark ch={info.channel} size={14} />
              <span className="num text-bone">{info.refdes}</span>
              {info.layer}
            </p>
            <p className="type-small mt-1.5 font-semibold text-bone">{info.label}</p>
            {links.length ? (
              <ul className="mt-2 grid gap-1">
                {links.map((w) => {
                  const out = w.conn.from === info.id;
                  const other = model.chips.find((c) => c.id === (out ? w.conn.to : w.conn.from));
                  return (
                    <li key={w.id} className="type-readout flex items-baseline gap-1.5 text-muted">
                      <span className="translate-y-px text-bone">{out ? <ArrowRight /> : <ArrowLeft />}</span>
                      <span>
                        <span className="text-bone">{other?.label ?? ""}</span> {w.conn.label}
                        {w.idle ? " (idle)" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
