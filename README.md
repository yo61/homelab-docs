# Homelab GitOps docs

Fumadocs (Next.js static export) documentation site for the flux-homelab
Kubernetes cluster, structured on the [Diátaxis](https://diataxis.fr/) system
and published to GitHub Pages at https://yo61.github.io/homelab-docs/.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000/homelab-docs
pnpm dev:local    # http://localhost:3000 (no basePath)
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
- `docs/superpowers/` — design specs and plans (not part of the built site).

## Deploy

`.github/workflows/deploy.yaml` builds and deploys to GitHub Pages on push to
`main`. Pages **Source** must be set to **GitHub Actions** for the repo (managed
via IaC) or the deploy job fails. `.github/workflows/ci.yaml` builds and
type-checks every pull request.

## License

- **Code** — MIT, see [`LICENSE`](LICENSE).
- **Documentation content** under `content/docs/` — Creative Commons
  Attribution 4.0 International (CC-BY-4.0), see [`LICENSE-docs`](LICENSE-docs).
