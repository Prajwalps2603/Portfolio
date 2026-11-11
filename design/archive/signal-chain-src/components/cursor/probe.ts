/**
 * Imperative probe API for targets that are not DOM elements (canvas lanes, 3D board
 * connections). DOM targets should use the data-attribute contract instead:
 *
 *   <section data-instrument>                      probe zone: native cursor -> crosshair
 *     <button data-cursor-label="Probe /ws/kpi">   brackets snap to the box + mono readout
 *     <input data-cursor="native">                 native cursor back over this element
 *
 * Virtual targets (call from pointermove handlers on your canvas):
 *   probeAt({ left, top, right, bottom }, "Probe /ws/kpi");   // viewport px
 *   probeRelease();
 * A virtual target wins over DOM targets until released. No-ops when the probe is not mounted
 * (touch devices, reduced motion).
 */
export type ProbeRect = { left: number; top: number; right: number; bottom: number };
type ProbeApi = { at: (rect: ProbeRect, label: string) => void; release: () => void };

let api: ProbeApi | null = null;

export function probeAt(rect: ProbeRect, label: string) {
  api?.at(rect, label);
}

export function probeRelease() {
  api?.release();
}

/** Whether the probe cursor is active right now (fine pointer + full motion). */
export function probeActive(): boolean {
  return api !== null;
}

/** Internal: the <Cursor> registers itself. */
export function registerProbe(next: ProbeApi): () => void {
  api = next;
  return () => {
    if (api === next) api = null;
  };
}
