/**
 * Prefix a public asset path with the deployment base path (e.g. /Portfolio on GitHub Pages).
 * next/link and next/image handle basePath automatically; raw <img>, fetch() and texture loaders do not.
 */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
