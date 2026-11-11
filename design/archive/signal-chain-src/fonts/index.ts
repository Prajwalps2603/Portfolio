import { Archivo, Martian_Mono } from "next/font/google";

/**
 * Signal Chain type system: one superfamily split by its width axis, plus a mono for data.
 *
 * - Archivo (OFL), variable wdth 62-125 / wght 100-900. Expanded widths (108-125%) are for
 *   measurement (name, headings); 100% is for reading. Select widths with `font-stretch`
 *   (the type-* utilities in globals.css do this for you).
 * - Martian Mono (OFL), variable wdth 75-112.5 / wght 100-800, used at wdth 87.5%: labels,
 *   readouts, refdes, protocol names and every numeral on the site. Never body copy.
 *
 * Both are self-hosted by next/font at build time (no request to Google from the browser),
 * Latin subset only, `display: swap` with size-adjusted fallbacks so CLS stays near zero.
 * Variable fonts ship as one file per family, so "only the weights we use" = one file each.
 */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const martianMono = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-martian",
  fallback: ["ui-monospace", "Consolas", "monospace"],
});

/** Put on <html>: exposes --font-archivo and --font-martian to globals.css. */
export const fontVariables = `${archivo.variable} ${martianMono.variable}`;
