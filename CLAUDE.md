# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

Fumadocs (Next.js **static export**) documentation site for the flux-homelab
Kubernetes cluster, structured on the Diátaxis system (`tutorials/`, `how-to/`,
`reference/`, `explanation/`). Published to GitHub Pages at
https://yo61.github.io/homelab-docs/ with basePath `/homelab-docs`.

## Commands

- `pnpm dev` — dev server at http://localhost:3000/homelab-docs
- `pnpm build` — static export to `./out`
- `pnpm types:check` — fumadocs-mdx + next typegen + tsc --noEmit
- `prek run --all-files` — run the git hooks

## Structure

- `content/docs/**` — the documentation (MDX + `meta.json` ordering). This is the
  only content source (`source.config.ts` → `dir: 'content/docs'`).
- `app/`, `components/`, `lib/` — the Fumadocs/Next.js app. `lib/shared.ts` holds
  appName, gitConfig, and route prefixes.
- `docs/superpowers/` — design specs and plans; NOT built into the site.

## Deploy

`.github/workflows/deploy.yaml` (push to `main`) builds and deploys to Pages.
Pages **Source = GitHub Actions** must be enabled on the repo (via IaC) or the
deploy job fails; the build job compiles regardless. `.github/workflows/ci.yaml`
gates pull requests with build + types:check.

## Conventions

- Conventional Commits (enforced by the commit-msg hook).
- Pinned dependency versions; `pnpm-lock.yaml` is authoritative — no `pnpm update`
  without intent. Never let a formatter rewrite `pnpm-lock.yaml`.
