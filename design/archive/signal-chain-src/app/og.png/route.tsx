import { ogCard } from "@/lib/ogCard";

/**
 * The social card, rendered once at build time to a real file: out/og.png.
 * (A route handler with a .png segment, not the opengraph-image convention, because the
 * convention exports an extensionless file that GitHub Pages would serve as
 * application/octet-stream, which some social crawlers reject.)
 * Referenced explicitly from metadata through ogImages() in src/lib/ogCard.tsx.
 */
export const dynamic = "force-static";

export function GET() {
  return ogCard();
}
