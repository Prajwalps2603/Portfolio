import { profile } from "@/content";

/** Social card size and alt text, shared by the renderer and the metadata. */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_ALT = `${profile.name}, ${profile.title}`;

/**
 * Metadata entries for the social card (src/app/og.png/route.tsx exports it as out/og.png).
 * Paths carry the deployment base path themselves: metadataBase is the bare origin, so the
 * URL resolves to https://prajwalps2603.github.io/Portfolio/og.png on GitHub Pages.
 * Kept free of next/og and node:fs so layouts and pages can import it cheaply.
 */
export function ogImages() {
  const url = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/og.png`;
  return [{ url, ...OG_SIZE, alt: OG_ALT, type: "image/png" }];
}
