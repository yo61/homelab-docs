# Homelab GitOps docs site

Fumadocs (Next.js static export) documentation site for the flux-homelab
cluster, structured on the [Diátaxis](https://diataxis.fr/) system and published
to GitHub Pages at https://yo61.github.io/flux-homelab/.

## Develop

```bash
pnpm install
pnpm dev          # serves at http://localhost:3000/flux-homelab
pnpm dev:local    # serves at http://localhost:3000 (no basePath)
```

## Build

```bash
pnpm build        # static export to ./out
pnpm types:check  # fumadocs-mdx + next typegen + tsc --noEmit
```

## Layout

- `content/docs/` — Diátaxis quadrants: `tutorials/`, `how-to/`, `reference/`, `explanation/`.
- `lib/source.ts` — content loader (Fumadocs `loader()`).
- `lib/shared.ts` — app name, git config, route prefixes.
- `app/api/search/route.ts` — static search index.

Deploy is automated by `.github/workflows/docs.yaml` on push to `main` touching
`docs/site/**`.
