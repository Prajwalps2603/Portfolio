/**
 * The four layers + Σ, and the palette as numbers for canvases and shaders.
 * Colour is functional only: these four colours encode the same four layers everywhere
 * (hero lanes, bench chip outlines, BOM groups, datasheet labels). Bone is Σ and "you".
 *
 * Mirror of the @theme palette in src/app/globals.css: change both together.
 */

export type ChannelId = 1 | 2 | 3 | 4 | "sigma";
export type ChannelKey = "interface" | "services" | "data" | "intelligence" | "shipped";

export type Channel = {
  id: ChannelId;
  key: ChannelKey;
  /** Mark shown in the 18px channel square. */
  mark: string;
  /** Plain-language layer name. */
  label: string;
  /** Waveform shape that encodes the layer (the hero legend says so). */
  shape: "sine" | "square" | "staircase" | "am" | "sum";
  /** CSS colour on graphite. */
  color: string;
  /** CSS colour for text labels on bone sheets (>= 4.5:1 on bone). */
  ink: string;
  /** Hex on graphite, for canvas / WebGL. */
  hex: string;
};

export const CHANNELS: readonly Channel[] = [
  { id: 1, key: "interface", mark: "1", label: "Interface", shape: "sine", color: "var(--color-ch1)", ink: "var(--color-ch1-ink)", hex: "#F2B53D" },
  { id: 2, key: "services", mark: "2", label: "Services", shape: "square", color: "var(--color-ch2)", ink: "var(--color-ch2-ink)", hex: "#4EC1BC" },
  { id: 3, key: "data", mark: "3", label: "Data", shape: "staircase", color: "var(--color-ch3)", ink: "var(--color-ch3-ink)", hex: "#93CF63" },
  { id: 4, key: "intelligence", mark: "4", label: "Intelligence", shape: "am", color: "var(--color-ch4)", ink: "var(--color-ch4-ink)", hex: "#7FA8F5" },
  { id: "sigma", key: "shipped", mark: "Σ", label: "Shipped system", shape: "sum", color: "var(--color-bone)", ink: "var(--color-ink)", hex: "#ECE8DF" },
] as const;

export function channel(id: ChannelId): Channel {
  return CHANNELS.find((c) => c.id === id) ?? CHANNELS[4];
}

/**
 * Map a content layer (src/content types: ArchitectureLayer.layer, SkillGroup.layer) to its
 * channel. Content says "API" / "Infrastructure"; the instrument says Services / Σ.
 * Returns null for layers that are not a channel ("Languages", "Practice").
 */
export function channelForLayer(layer: string): Channel | null {
  switch (layer) {
    case "Interface":
      return channel(1);
    case "API":
    case "Services":
      return channel(2);
    case "Data":
      return channel(3);
    case "Intelligence":
      return channel(4);
    case "Infrastructure":
    case "Delivery":
      return channel("sigma");
    default:
      return null;
  }
}

/** Palette hex values (canvas / WebGL / SVG attributes that cannot take CSS variables). */
export const PALETTE = {
  graphite: "#0E0F0D",
  bezel: "#171815",
  graticule: "#2B2D28",
  graticuleStrong: "#3A3C36",
  bone: "#ECE8DF",
  muted: "#A29E93",
  dim: "#85827A",
  ink: "#141512",
  inkMuted: "#57544C",
  rule: "#CFCABE",
  tick: "#8D887C",
  boneShade: "#E4DFD4",
  ch1: "#F2B53D",
  ch2: "#4EC1BC",
  ch3: "#93CF63",
  ch4: "#7FA8F5",
  ch1Ink: "#8A5F00",
  ch2Ink: "#0F6E6A",
  ch3Ink: "#386F17",
  ch4Ink: "#2F5DB8",
} as const;

/** "#RRGGBB" -> [r, g, b] in 0..1 (for shader uniforms). */
export function hexToRgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
