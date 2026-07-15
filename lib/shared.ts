// Inlined at build time from next.config.mjs `env.NEXT_PUBLIC_BASE_PATH`.
// Prepended to the "view as markdown" (llms.mdx) URL so the rendered link
// resolves against the basePath-mounted site (e.g. `/homelab-docs/llms.mdx/...`)
// rather than the host root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const appName = 'Homelab GitOps';
export const docsRoute = '/';
export const docsContentRoute = `${basePath}/llms.mdx/docs`;

export const gitConfig = {
  user: 'yo61',
  repo: 'homelab-docs',
  branch: 'main',
};
