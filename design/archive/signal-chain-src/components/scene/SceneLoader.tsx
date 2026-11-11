"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion/media";
import { hasWebGL } from "@/lib/gpu";

/**
 * Picks the scope's render path after hydration, and only then downloads it, so nothing blocks
 * first paint or the LCP (the hero name is DOM text). Until a chunk arrives the server-rendered
 * CSS graticule shows.
 *
 * The WebGL chunk loads only when it earns its cost: never under reduced motion (the scope would
 * render one locked frame, which the SVG draws identically), never on Save-Data or devices with
 * 2GB of memory or less, and never without WebGL. A failed WebGL2 context falls back at runtime.
 * The footer's motion toggle swaps the path live.
 */
const ScopeCanvas = dynamic(() => import("./ScopeCanvas"), { ssr: false, loading: () => null });
const StaticScope = dynamic(() => import("./StaticScope"), { ssr: false, loading: () => null });

type Mode = "pending" | "webgl" | "static";

function liteDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return !!nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2);
}

export function SceneLoader() {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>("pending");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // decided after mount: the server cannot know the device, and both paths are client-only
    setMode(reduced || failed || liteDevice() || !hasWebGL() ? "static" : "webgl");
  }, [reduced, failed]);

  const onFail = useCallback(() => setFailed(true), []);

  if (mode === "webgl") return <ScopeCanvas onFail={onFail} />;
  if (mode === "static") return <StaticScope />;
  return null;
}
