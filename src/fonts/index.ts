import { Bricolage_Grotesque, Caveat, Inter, JetBrains_Mono } from "next/font/google";

/**
 * Sketch -> Ship type system. Self-hosted by next/font at build time (no browser request to
 * Google), Latin subset, display: swap with size-adjusted fallbacks (no layout shift).
 *
 * | role    | family              | weights            | utilities                          |
 * |---------|---------------------|--------------------|------------------------------------|
 * | display | Bricolage Grotesque | 700, 800 (var.)    | type-hero, type-display, type-h3/4 |
 * | text    | Inter               | 400, 500, 600      | type-lead, type-body, type-ui      |
 * | mono    | JetBrains Mono      | 400, 500           | type-mono, type-label, type-micro  |
 * | hand    | Caveat              | 500, 600, 700      | type-hand-sm, type-hand, -lg       |
 *
 * Bricolage loads its optical-size axis (opsz 12-96): browsers set it from the font size
 * automatically (font-optical-sizing: auto), so big headlines get the tight display cut.
 * Google serves ONE variable file per family whatever weights are listed; listing the used
 * weights keeps everyone on-system (an unlisted weight would be faux-bolded).
 * Budget (woff2, latin): Bricolage+opsz ~77 KB, Caveat ~75 KB, Inter ~48 KB, JetBrains ~31 KB.
 */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-bricolage",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains",
  fallback: ["ui-monospace", "Consolas", "monospace"],
});

export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-caveat",
  fallback: ["Segoe Print", "cursive"],
});

/** Put on <html>: exposes the four --font-* variables to globals.css. */
export const fontVariables = `${bricolage.variable} ${inter.variable} ${jetbrains.variable} ${caveat.variable}`;
