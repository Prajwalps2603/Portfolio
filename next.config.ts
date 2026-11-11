import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages.
 * - Local dev / preview: no base path.
 * - GitHub Pages project site (https://prajwalps2603.github.io/Portfolio/):
 *   build with NEXT_PUBLIC_BASE_PATH=/Portfolio (see `npm run build:pages` and .github/workflows/deploy.yml).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep dev-mode screenshots clean (visual QA runs against the dev server).
  devIndicators: false,
};

export default nextConfig;
