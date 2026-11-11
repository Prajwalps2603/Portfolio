"use client";

/**
 * Cheap, synchronous device-capability heuristic used to pick a rendering quality tier for WebGL.
 * (Avoids shipping a GPU benchmark library; good enough to protect low-end phones.)
 */
export type QualityTier = "low" | "medium" | "high";

export function getQualityTier(): QualityTier {
  if (typeof window === "undefined") return "medium";
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return "low";
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (cores <= 4 || memory <= 2) return "low";
  if (coarse || small) return "medium";
  return "high";
}

/** Device pixel ratio clamp per tier — the single biggest lever on fragment-shader cost. */
export function dprForTier(tier: QualityTier): [number, number] {
  if (tier === "low") return [1, 1];
  if (tier === "medium") return [1, 1.5];
  return [1, 1.75];
}

/** True if WebGL is available at all (some locked-down browsers disable it). */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
