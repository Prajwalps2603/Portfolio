"use client";

import { roughCircle, roughRect, roughUnderline, scribble } from "@/components/sketch/rough";

/**
 * The opening's sketch layer: one absolutely positioned <svg> over the hero, drawn from the REAL
 * hero DOM (bounding boxes, text line boxes) with the one seeded generator.
 *
 * Every piece pairs the real element it becomes with two groups of [data-stroke] paths:
 *   frame  outlines (boxes, pill outlines, circles): they TIGHTEN onto the element and fade
 *   fill   scribbles and squiggles standing in for text: they are ERASED left to right while the
 *          real text is revealed by the same sweep (the compile line)
 * Each sub-path is its own <path>, so drawOn() traces strokes one after another like a hand
 * (SVG restarts a dash pattern on every sub-path, which would draw them all at once).
 *
 *   header      wordmark boxed, nav words underlined, pills outlined (the menu pill on phones)
 *   name        a box around the name, a heavy scribble where each line will be
 *   role        a box where the highlighter goes, a scribble for the rest
 *   statement   a pencil squiggle per line
 *   actions     pill outlines, an underline for the email
 *   status      a circle for the live dot, a squiggle for the line
 *   note        the tilted note outline, its title squiggle and four bar outlines, the pin
 *   chips       a circle per stage mark, a squiggle per label
 *   controls    a circle per round button
 * The window and the connector are real sketches already (MiniUI's sketch state, the dashed
 * SketchArrow); they draw themselves in place.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

export type Box = { x: number; y: number; w: number; h: number };

export type PieceKey = "header" | "name" | "role" | "statement" | "actions" | "status" | "note" | "chips" | "controls";

export type SketchPiece = {
  key: PieceKey;
  /** Container of frame + fill, in pen order (what drawOn traces). */
  group: SVGGElement;
  frame: SVGGElement;
  fill: SVGGElement;
  /** The real element the sketch compiles into (revealed from data-boot). */
  target: HTMLElement;
  /** The box the frame tightens onto (overlay coordinates) and the padding it was drawn with. */
  box: Box;
  pad: number;
};

export type OpeningSketch = { svg: SVGSVGElement; pieces: SketchPiece[] };

const visible = (el: Element) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";

/**
 * One rect per rendered line of an element's VISIBLE TEXT (viewport coordinates). Only text nodes
 * count: block spans and decorations would stretch a line to the full column, and screen-reader
 * text (.sr-only) sits anywhere.
 */
function lineBoxes(el: Element): DOMRect[] {
  const range = document.createRange();
  const lines: { t: number; b: number; l: number; r: number }[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = n.parentElement;
    if (!n.textContent?.trim() || !parent || parent.closest(".sr-only") || !visible(parent)) continue;
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 3 || r.height < 3) continue;
      const mid = (r.top + r.bottom) / 2;
      const line = lines.find((l) => Math.abs((l.t + l.b) / 2 - mid) < Math.min(l.b - l.t, r.height) / 2);
      if (line) {
        line.t = Math.min(line.t, r.top);
        line.b = Math.max(line.b, r.bottom);
        line.l = Math.min(line.l, r.left);
        line.r = Math.max(line.r, r.right);
      } else lines.push({ t: r.top, b: r.bottom, l: r.left, r: r.right });
    }
  }
  range.detach();
  return lines.map((l) => new DOMRect(l.l, l.t, l.r - l.l, l.b - l.t));
}

const union = (rects: DOMRect[]): DOMRect | null => {
  if (!rects.length) return null;
  const l = Math.min(...rects.map((r) => r.left));
  const t = Math.min(...rects.map((r) => r.top));
  const r = Math.max(...rects.map((x) => x.right));
  const b = Math.max(...rects.map((x) => x.bottom));
  return new DOMRect(l, t, r - l, b - t);
};

export function buildOpeningSketch(hero: HTMLElement): OpeningSketch {
  const o = hero.getBoundingClientRect();
  const rel = (r: DOMRect): Box => ({ x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height });

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("data-opening-sketch", "");
  svg.setAttribute("width", String(Math.round(o.width)));
  svg.setAttribute("height", String(Math.round(o.height)));
  svg.setAttribute("class", "pointer-events-none absolute top-0 left-0 z-(--z-raised) overflow-visible text-ink/80");

  const pieces: SketchPiece[] = [];
  const g = (cls?: string) => {
    const el = document.createElementNS(SVG_NS, "g");
    if (cls) el.setAttribute("class", cls);
    return el;
  };
  /** One <path> per sub-path, in pen order. */
  const stroke = (into: SVGGElement, d: string, width = 1.6) => {
    for (const part of d.split(/(?=M)/)) {
      if (!part.trim()) continue;
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("data-stroke", "");
      p.setAttribute("d", part);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "currentColor");
      p.setAttribute("stroke-width", String(width));
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
      into.appendChild(p);
    }
  };
  const squiggle = (into: SVGGElement, b: Box, seed: string, density = 1.5) => {
    if (b.w < 6) return;
    const h = Math.max(5, Math.min(9, b.h * 0.3));
    stroke(into, scribble(b.x, b.y + b.h / 2 - h / 2, b.w, h, { seed, density, roughness: 0.7, slant: -8 }), 1.4);
  };
  const add = (key: PieceKey, target: HTMLElement | null, build: (frame: SVGGElement, fill: SVGGElement) => { box?: Box; pad?: number } | void, fillTone = "text-pencil") => {
    if (!target || !visible(target)) return;
    const frame = g();
    const fill = g(fillTone);
    const res = build(frame, fill) || {};
    if (!frame.childNodes.length && !fill.childNodes.length) return;
    const group = g();
    group.append(frame, fill);
    svg.appendChild(group);
    pieces.push({ key, group, frame, fill, target, box: res.box ?? rel(target.getBoundingClientRect()), pad: res.pad ?? 0 });
  };

  // ---- header (fixed at the top; the hero starts at y = 0 so its coordinates line up)
  const header = document.querySelector<HTMLElement>("header[data-boot]");
  add("header", header, (frame) => {
    header!.querySelectorAll<HTMLElement>("a[href], button").forEach((el, i) => {
      if (!visible(el) || el.closest("[hidden]")) return;
      const r = el.getBoundingClientRect();
      if (r.top > 120 || r.width < 2) return;
      const b = rel(r);
      if (el.classList.contains("pill")) {
        stroke(frame, roughRect(b.x, b.y, b.w, b.h, { seed: `op-head-pill-${i}`, radius: b.h / 2, roughness: 0.8, passes: 1 }));
      } else if (el.closest("nav")) {
        const t = lineBoxes(el)[0];
        if (t) stroke(frame, roughUnderline(t.left - o.left, t.bottom - o.top + 1, t.width, { seed: `op-head-nav-${i}`, roughness: 0.8 }), 1.5);
      } else {
        const t = lineBoxes(el)[0];
        if (t) stroke(frame, roughRect(t.left - o.left - 6, t.top - o.top - 2, t.width + 22, t.height + 4, { seed: `op-head-mark-${i}`, radius: 8, roughness: 0.9, passes: 1 }));
      }
    });
  });

  // ---- name: a box hugging the words, a heavy scribble where each line will be
  const name = hero.querySelector<HTMLElement>('[data-hero="name"]');
  add(
    "name",
    name,
    (frame, fill) => {
      const lines = lineBoxes(name!);
      const u = union(lines);
      if (!u) return;
      const b = rel(u);
      // the glyph boxes carry ascent/descent: hug the letters, not the font's line box
      const box = { x: b.x, y: b.y + b.h * 0.08, w: b.w, h: b.h * 0.86 };
      const pad = 12;
      stroke(frame, roughRect(box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2, { seed: "op-name-box", roughness: 1.1, overshoot: 8 }), 1.6);
      lines.forEach((l, i) => {
        const lb = rel(l);
        stroke(fill, scribble(lb.x + 6, lb.y + lb.h * 0.3, lb.w - 12, lb.h * 0.4, { seed: `op-name-${i}`, density: 0.4, roughness: 1.5, slant: -14 }), 2.2);
      });
      return { box, pad };
    },
    "text-ink/80",
  );

  // ---- role: a box where the highlighter will be, a scribble for the rest
  const role = hero.querySelector<HTMLElement>('[data-hero="role"]');
  add(
    "role",
    role,
    (frame, fill) => {
      const hl = role!.querySelector<HTMLElement>(".hl");
      const lines = lineBoxes(role!);
      if (!hl) {
        lines.forEach((l, i) => squiggle(fill, rel(l), `op-role-${i}`, 0.8));
        return;
      }
      const hb = rel(hl.getBoundingClientRect());
      const box = { x: hb.x, y: hb.y + hb.h * 0.16, w: hb.w, h: hb.h * 0.72 };
      const pad = 5;
      stroke(frame, roughRect(box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2, { seed: "op-role-hl", roughness: 1 }));
      const line = lines[lines.length - 1];
      if (line) {
        const lb = rel(line);
        const x0 = Math.min(lb.x + lb.w, hb.x + hb.w + 14);
        if (lb.x + lb.w - x0 > 12) stroke(fill, scribble(x0, lb.y + lb.h * 0.32, lb.x + lb.w - x0, lb.h * 0.36, { seed: "op-role-rest", density: 0.6, roughness: 1.2 }), 1.8);
      }
      return { box, pad };
    },
    "text-ink/80",
  );

  // ---- statement: pencil squiggles
  const statement = hero.querySelector<HTMLElement>('[data-hero="statement"]');
  add("statement", statement, (_frame, fill) => {
    lineBoxes(statement!).forEach((l, i) => squiggle(fill, rel(l), `op-st-${i}`, 1.5));
  });

  // ---- actions: pill outlines, an underline for the email
  const actions = hero.querySelector<HTMLElement>('[data-hero="actions"]');
  add("actions", actions, (frame) => {
    actions!.querySelectorAll<HTMLElement>("a, button").forEach((el, i) => {
      const b = rel(el.getBoundingClientRect());
      if (el.classList.contains("pill")) {
        stroke(frame, roughRect(b.x, b.y, b.w, b.h, { seed: `op-pill-${i}`, radius: b.h / 2, roughness: 0.9 }));
      } else {
        const t = lineBoxes(el)[0];
        if (t) stroke(frame, roughUnderline(t.left - o.left, t.bottom - o.top + 2, t.width, { seed: `op-mail-${i}`, roughness: 0.9 }), 1.5);
      }
    });
  });

  // ---- status: the dot circled, the line squiggled
  const status = hero.querySelector<HTMLElement>('[data-hero="status"]');
  add("status", status, (frame, fill) => {
    const dot = status!.querySelector<HTMLElement>("[data-live-dot], [aria-hidden='true']");
    const d = dot ? rel(dot.getBoundingClientRect()) : null;
    if (d) stroke(frame, roughCircle(d.x + d.w / 2, d.y + d.h / 2, Math.max(d.w, 8) * 0.8, { seed: "op-status-dot", passes: 1 }), 1.5);
    lineBoxes(status!).forEach((l, i) => {
      const lb = rel(l);
      const x0 = d && Math.abs(d.y + d.h / 2 - (lb.y + lb.h / 2)) < lb.h ? Math.max(lb.x, d.x + d.w + 8) : lb.x;
      squiggle(fill, { ...lb, x: x0, w: lb.x + lb.w - x0 }, `op-status-${i}`, 1.6);
    });
  });

  // ---- note: the tilted outline (unrotated geometry, rotated like the note), title, four bars, pin
  const noteWrap = hero.querySelector<HTMLElement>('[data-hero="note"]');
  const note = noteWrap?.querySelector<HTMLElement>(".sticky-note") ?? null;
  add("note", noteWrap ?? null, (frame, fill) => {
    if (!note) return;
    const r = rel(note.getBoundingClientRect());
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const w = note.offsetWidth;
    const h = note.offsetHeight;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const tilt = parseFloat(getComputedStyle(note).rotate) || 0;
    const rot = `rotate(${tilt} ${cx.toFixed(1)} ${cy.toFixed(1)})`;
    // the tilt lives on inner groups; the Intro scales the frame group itself (the tighten)
    const f = g();
    f.setAttribute("transform", rot);
    frame.appendChild(f);
    const fi = g();
    fi.setAttribute("transform", rot);
    fill.appendChild(fi);
    stroke(f, roughRect(x, y, w, h, { seed: "op-note", radius: 6, roughness: 1 }));
    const pin = note.querySelector<HTMLElement>(".sticky-pin");
    if (pin) stroke(f, roughCircle(x + pin.offsetLeft + pin.offsetWidth / 2, y + pin.offsetTop + pin.offsetHeight / 2, pin.offsetWidth / 2, { seed: "op-note-pin", passes: 1 }), 1.5);
    const title = note.querySelector<HTMLElement>("p");
    if (title) squiggle(fi, { x: x + title.offsetLeft, y: y + title.offsetTop, w: Math.min(title.offsetWidth, w * 0.62), h: title.offsetHeight }, "op-note-title", 1.1);
    note.querySelectorAll<HTMLElement>("li").forEach((li, i) => {
      stroke(fi, roughRect(x + li.offsetLeft, y + li.offsetTop + li.offsetHeight * 0.16, li.offsetWidth, li.offsetHeight * 0.74, { seed: `op-note-bar-${i}`, roughness: 0.8, passes: 1, overshoot: 2 }), 1.4);
    });
    return { box: { x, y, w, h }, pad: 4 };
  });

  // ---- chips and controls: small circles where the marks and buttons will be
  const chips = hero.querySelector<HTMLElement>('[data-hero="chips"]');
  add("chips", chips, (frame, fill) => {
    chips!.querySelectorAll<HTMLElement>("li").forEach((li, i) => {
      const mark = li.firstElementChild as HTMLElement | null;
      const m = mark ? rel(mark.getBoundingClientRect()) : null;
      if (m) stroke(frame, roughCircle(m.x + m.w / 2, m.y + m.h / 2, m.w * 0.42, { seed: `op-chip-${i}`, passes: 1, roughness: 0.6 }), 1.3);
      const label = li.querySelector<HTMLElement>("[data-chip-label]");
      if (label) squiggle(fill, rel(label.getBoundingClientRect()), `op-chip-t-${i}`, 2);
    });
  });
  const controls = hero.querySelector<HTMLElement>('[data-hero="controls"]');
  add("controls", controls, (frame) => {
    controls!.querySelectorAll<HTMLElement>("button").forEach((el, i) => {
      if (!visible(el)) return;
      const b = rel(el.getBoundingClientRect());
      stroke(frame, roughCircle(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, { seed: `op-ctl-${i}`, roughness: 0.8 }), 1.5);
    });
  });

  hero.appendChild(svg);
  return { svg, pieces };
}
