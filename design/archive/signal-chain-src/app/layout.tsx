import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { site, profile } from "@/content";
import { fontVariables } from "@/fonts";
import { bootScript } from "@/lib/motion/bootScript";
import { SmoothScroll } from "@/lib/motion/SmoothScroll";
import { TransitionProvider } from "@/components/transition";
import { Header } from "@/components/chrome";
import { Cursor } from "@/components/cursor";
import { Footer } from "@/components/footer";
import { InlineScript, SkipLink } from "@/components/ui";
import { ogImages } from "@/lib/og";
import "./globals.css";

export const metadata: Metadata = {
  // Bare origin: metadata paths (the social card) already carry the base path.
  metadataBase: new URL(site.origin),
  title: site.title,
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
  themeColor: "#0E0F0D",
  colorScheme: "dark",
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * App shell (foundation). Order matters:
 * - the boot script runs in <head> before first paint (html.js / rm / signals-off / booting);
 * - SmoothScroll (Lenis + scroll bus) wraps everything, then the TransitionProvider (curtain);
 * - skip link, header, <main id="main">, footer, then the probe cursor on top.
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
            <Header />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <Cursor />
          </TransitionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
