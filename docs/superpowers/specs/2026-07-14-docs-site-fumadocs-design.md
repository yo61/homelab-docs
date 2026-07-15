# Design: Fumadocs documentation site + GitHub Pages pipeline

**Date:** 2026-07-14
**Status:** Approved (design)
**Scope:** Sub-project A of a larger docs effort — stand up the tooling and
publishing pipeline. Content authoring is a separate follow-up spec.

## Purpose

Create a documentation site for the flux-homelab cluster, structured on the
[Diátaxis](https://diataxis.fr/) system (Tutorials, How-to Guides, Reference,
Explanation) and published to GitHub Pages. This session delivers the **tooling
and pipeline only**: a Fumadocs site that builds, deploys, and renders a
navigable Diátaxis skeleton. The actual documentation content is authored later,
under its own spec(s).

The tooling is copied and adapted from the existing `../go-udap` Fumadocs site,
which already implements the Diátaxis structure and a GitHub Pages deploy.

## Decisions (from brainstorming)

- **Scope:** Tooling first, then content. This session = pipeline + skeleton.
- **Existing prose** (`README.md`, `BOOTSTRAP.md`, `REBUILD.md`, `SERVICES.md`)
  stays in place, untouched. Seed pages are fresh skeletons; migration of that
  prose is a later content spec.
- **Publish target:** GitHub Project Pages —
  `https://yo61.github.io/flux-homelab/`, `basePath` = `/flux-homelab`. No custom
  domain, no extra DNS.
- **Diátaxis labels:** canonical — `tutorials/`, `how-to/`, `reference/`,
  `explanation/` (go-udap used `concepts/` for the last; we use `explanation/`).
- **Extras from go-udap:** keep client-side **search** and the **`llms.txt` /
  `llms-full.txt` / `llms.mdx`** routes; **drop** the dynamic OG-image route
  (`app/og/**`) and its font/asset dependency and `getPageImage` wiring.
- **GitHub Pages enablement** (source = "GitHub Actions") is done by the user
  through their GitHub-repo IaC. This spec documents the requirement but does not
  touch repo settings.

## Structure

New site under `docs/site/`, coexisting with the existing `docs/superpowers/`:

```
docs/site/
  content/docs/
    index.mdx                       # landing page, Cards → 4 quadrants
    meta.json                       # order: tutorials, how-to, reference, explanation
    tutorials/{index.mdx, meta.json, <one stub>.mdx}
    how-to/{index.mdx, meta.json, <one stub>.mdx}
    reference/{index.mdx, meta.json, <one stub>.mdx}
    explanation/{index.mdx, meta.json, <one stub>.mdx}
  app/                              # copied from go-udap, OG route removed
  components/                       # copied from go-udap
  lib/                              # copied; getPageImage / OG wiring removed
  package.json  pnpm-lock.yaml  pnpm-workspace.yaml
  next.config.mjs  source.config.ts  tsconfig.json  postcss.config.mjs
  .gitignore  README.md
```

## Config adaptations

Copy from go-udap and change the strings:

- `next.config.mjs`: `basePath` default → `/flux-homelab`;
  `siteUrl` → `https://yo61.github.io`; `output: 'export'`.
- `lib/shared.ts`: `appName` → `Homelab GitOps`;
  `gitConfig` → `{ user: 'yo61', repo: 'flux-homelab', branch: 'main' }`;
  OG/llms route prefixes follow from `basePath`.
- `package.json`: keep go-udap's pinned versions (fumadocs 16.10.7, next 16.2.10,
  react 19, tailwind 4) — recent and build-tested together. Re-copy
  `pnpm-lock.yaml` to preserve the exact resolution.
- Remove OG-image route (`app/og/**`) and any references to it in
  `lib/source.ts` (`getPageImage`) and page metadata.

## Publishing pipeline

Copy `.github/workflows/docs.yaml` from go-udap (paths already use
`docs/site`, identical here):

- Triggers on push to `main` touching `docs/site/**` or the workflow file, plus
  `workflow_dispatch`.
- `concurrency: { group: pages, cancel-in-progress: false }` — serialize deploys
  against the single Pages environment.
- Build job: pnpm install (frozen lockfile) → `pnpm build` → upload
  `docs/site/out` as the Pages artifact.
- Deploy job: `actions/deploy-pages`.
- SHA-pinned actions with version comments; re-verify each pinned SHA is current
  stable at implementation time rather than trusting the copied values.

**Out-of-band requirement (user-owned):** GitHub Pages source must be set to
"GitHub Actions" via the user's repo IaC before the first deploy succeeds.

## Seed content (skeletons only)

- `index.mdx` — short homelab intro + `<Cards>` grid linking the four quadrants.
- Four quadrant `index.mdx` pages, each a one-paragraph Diátaxis-appropriate
  intro:
  - Tutorials — learning-oriented, start-to-finish lessons.
  - How-to — task-oriented recipes.
  - Reference — authoritative lookup: components, versions, config.
  - Explanation — the why: architecture and design decisions.
- Each quadrant: a `meta.json` (title + page order) and **one placeholder stub
  page** with frontmatter `title` and a TODO list of planned pages, so the
  sidebar isn't a dead end. These stubs double as the backlog / information-
  architecture draft for the content spec.

No migration of existing root markdown in this session.

## `.gitignore` / hooks

Extend `.gitignore` to exclude generated dirs: `node_modules/`, `.next/`,
`.source/`, `out/`, `*.tsbuildinfo`. Confirm existing pre-commit hooks tolerate
the new JS/TS subtree (add exclusions if any hook tries to lint generated or
vendored files).

## Verification (before "done")

1. `pnpm install` clean; `pnpm build` produces `out/` with zero errors/warnings.
2. `pnpm dev` served locally and driven in a real browser: landing page, all
   four quadrant pages, sidebar nav, search, and one `llms.*` route render
   correctly (catches static-export/basePath 404s a green build hides).
3. `actionlint` + `zizmor` clean on `docs.yaml`.
4. `.gitignore` excludes generated dirs; existing pre-commit hooks pass.

## Done criteria

Site builds locally, the workflow deploys (once Pages is enabled via IaC), and
the site is live at `https://yo61.github.io/flux-homelab/` with working
navigation and search. Content authoring is the next spec.

## Out of scope

- Migrating `README.md` / `BOOTSTRAP.md` / `REBUILD.md` / `SERVICES.md` into the
  Diátaxis structure.
- Authoring real documentation content.
- Custom domain / CNAME.
- Dynamic OG-image generation.
