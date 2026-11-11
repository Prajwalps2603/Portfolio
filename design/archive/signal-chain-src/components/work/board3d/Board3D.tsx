"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BoardCanvasProps } from "./BoardCanvas";
import { frameFor } from "./frame";

/**
 * The 3D bench board's place on the page. It reserves the canvas's exact box (no layout shift
 * when three.js arrives), shows the bare FR4 slab until the first frame is on screen, and only
 * downloads the R3F chunk when the board is within about 1.2 viewports, never on the critical
 * path. On desktop the chunk is also prefetched once the page has loaded and the browser is idle.
 */
const BoardCanvas = dynamic(
  () =>
    import("./BoardCanvas").then((m) => {
      chunkLoaded = true;
      return m;
    }),
  { ssr: false, loading: () => null },
);

let chunkLoaded = false;
let prefetched = false;

/** After load (the LCP is long painted by then), fetch the chunk while the browser is idle. */
function prefetchWhenIdle() {
  if (prefetched || typeof window === "undefined") return;
  prefetched = true;
  const go = () => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    idle(() => void import("./BoardCanvas").catch(() => undefined), { timeout: 5000 });
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

type Props = Omit<BoardCanvasProps, "onReady" | "rows"> & { rows: number; description: string };

export function Board3D({ description, rows, ...props }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const frame = frameFor(rows);

  useEffect(() => prefetchWhenIdle(), []);

  // Load (or, once loaded, mount at once) when the board is within ~1.2 viewports and laid out.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    if (chunkLoaded && el.offsetWidth > 0) {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: "120% 0px 120% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const slab = frame.slab;
  return (
    <div ref={box} className="relative w-full" style={{ aspectRatio: frame.aspect }} role="img" aria-label={description}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute border border-graticule-strong bg-graphite transition-opacity duration-200 ease-panel"
        style={{
          left: `${slab.left * 100}%`,
          top: `${slab.top * 100}%`,
          width: `${slab.width * 100}%`,
          height: `${slab.height * 100}%`,
          opacity: ready ? 0 : 1,
        }}
      />
      {near ? <BoardCanvas {...props} rows={rows} onReady={() => setReady(true)} /> : null}
    </div>
  );
}
