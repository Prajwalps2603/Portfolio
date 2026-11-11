import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { site, profile } from "@/content";
import { fontVariables } from "@/fonts";
import { bootScript } from "@/lib/motion/bootScript";
import { SmoothScroll } from "@/lib/motion/SmoothScroll";
import { ogImages } from "@/lib/og";
import { TransitionProvider } from "@/components/transition";
import { Header } from "@/components/chrome";
import { Cursor } from "@/components/cursor";
import { Background } from "@/components/background";
import { Footer } from "@/components/footer";
import { CommandPalette } from "@/components/palette";
import { CardPopup } from "@/components/card/CardPopup";
import { PerfWatch } from "@/components/chrome/PerfWatch";
import { Sketchbook } from "@/components/sketchbook";
import { InlineScript, SkipLink } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  // Bare origin: metadata paths (the social card, canonicals) carry the base path themselves.
  metadataBase: new URL(site.origin),
  title: { default: site.title, template: `%s · ${profile.name}` },
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: profile.name, url: site.url }],
  creator: profile.name,
  openGraph: {
    type: "website",
    url: site.url,
    title: site.title,
    description: site.description,
    siteName: profile.name,
    locale: "en_IN",
    images: ogImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    creator: "@PrajwalNair2603",
    images: ogImages(),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f4ef",
  colorScheme: "light",
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * App shell (foundation). Order matters:
 * - the boot script runs in <head> before first paint (html.js / rm / booting | booted);
 * - SmoothScroll (Lenis + scroll bus + anchors) wraps everything, then the TransitionProvider
 *   (the page sheet);
 * - skip link, the paper-grid lens (fixed, z -1), header, <main id="main">, footer, cursor.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <InlineScript html={bootScript(basePath)} />
      </head>
      <body>
        <SmoothScroll>
          <TransitionProvider>
            <SkipLink />
            <Background />
            <Header />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <Cursor />
            <CommandPalette />
            <CardPopup />
            <PerfWatch />
            <Sketchbook />
          </TransitionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
