import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const basePath = process.env.BASE_PATH ?? '/homelab-docs';
const siteUrl = process.env.SITE_URL ?? 'https://yo61.github.io';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  // Expose basePath + siteUrl to client AND server bundles. Used by:
  //   - components/search.tsx: prefix the static-search fetch URL
  //     (`<basePath>/api/search`) so it doesn't 404 on a basePath-
  //     mounted site.
  //   - lib/shared.ts: build the basePath-prefixed llms.mdx route URL.
  //   - app/layout.tsx: set metadataBase so relative metadata URLs
  //     resolve against the production origin.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default withMDX(config);
