import { Newsreader, UnifrakturMaguntia } from "next/font/google";

/**
 * The newspaper's own type (only the /resume page, The Prajwal Times, imports this module, so only
 * that page loads these): a blackletter for the masthead, as front pages have, and Newsreader, a
 * serif made for news text, for headlines and columns. A documented exception to the site's four
 * families (docs/DESIGN.md): a newspaper is set in newspaper type.
 */
export const blackletter = UnifrakturMaguntia({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-blackletter",
  fallback: ["Georgia", "serif"],
});

export const news = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-news",
  fallback: ["Georgia", "Times New Roman", "serif"],
});
