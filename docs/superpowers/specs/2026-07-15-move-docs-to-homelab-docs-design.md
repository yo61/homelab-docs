# Design: Move the Fumadocs site to a dedicated `homelab-docs` repo

**Date:** 2026-07-15
**Status:** Approved (design)
**Supersedes (repo/publish decisions of):**
`docs/superpowers/specs/2026-07-14-docs-site-fumadocs-design.md`

## Purpose

Relocate the Fumadocs documentation site out of `flux-homelab` and into a new
standalone repo, `yo61/homelab-docs`, with the site at the repo **root** and
published to GitHub **Project Pages**. `flux-homelab` returns to pure cluster
config; its `main` is never touched by docs artifacts.

This is a restructure, not a rebuild. The site's internals (app, components,
lib, content skeleton, pinned deps) built and reviewed on the `docs/fumadocs-site`
branch move essentially unchanged. Only the repo-location-dependent config
changes: basePath, git repo name, "edit on GitHub" paths, and the workflow.

### Note on transient location of this spec

This spec (and the original design + its implementation plan) are written on the
`flux-homelab` `docs/fumadocs-site` branch only. During implementation they
**relocate** into `homelab-docs/docs/superpowers/`, and the `docs/fumadocs-site`
branch is discarded. They never land on `flux-homelab`'s `main`.

## Decisions (from brainstorming)

- **Move scope:** the Fumadocs site only. The root prose (`README.md`,
  `BOOTSTRAP.md`, `REBUILD.md`, `SERVICES.md`) and the external-dns/other
  `docs/superpowers/` artifacts stay in `flux-homelab`. Only the **docs-site**
  spec + plan travel to `homelab-docs` as design history.
- **Layout:** site at the repo **root** (`package.json`, `content/`, `app/` at
  top level) — no `docs/site/` nesting.
- **Publish target:** Project Pages — `https://yo61.github.io/homelab-docs/`,
  basePath `/homelab-docs`. basePath stays env-overridable, so a custom domain
  later is a config change, not a rebuild. No DNS now.
- **git history:** fresh `git init` in `homelab-docs`. The `flux-homelab` branch
  history (which carries the old `/flux-homelab` basePath and `docs/site/` paths)
  is **not** filtered over.
- **Repo bring-up:** built locally and handed off. **Robin's GitHub-repo IaC**
  provisions `yo61/homelab-docs` and enables Pages (Source = GitHub Actions).
  No `gh repo create` from the implementer; the push happens once the remote
  exists.
- **flux-homelab cleanup:** close PR #29, delete the `docs/fumadocs-site` branch
  (local + remote). `main` stays at `f8f4040`.
- **Licensing:** dual — **MIT** for the code, **CC-BY-4.0** for the documentation
  prose under `content/docs/`. Explained in the README.
- **Plumbing:** full standalone-repo plumbing (below), modelled on the sibling
  `../go-udap` Node repo.

## Target repo structure

```
homelab-docs/
  package.json  pnpm-lock.yaml  pnpm-workspace.yaml
  next.config.mjs  source.config.ts  tsconfig.json  postcss.config.mjs
  .gitignore  README.md  CLAUDE.md
  LICENSE           # MIT (code)
  LICENSE-docs      # CC-BY-4.0 (content/docs/ prose)
  .pre-commit-config.yaml
  app/  components/  lib/
  content/docs/                     # Diátaxis skeleton, moved unchanged
    index.mdx  meta.json
    tutorials/  how-to/  reference/  explanation/
  docs/superpowers/                 # design history (not built by the site)
    specs/{2026-07-14-docs-site-fumadocs-design.md,
           2026-07-15-move-docs-to-homelab-docs-design.md}
    plans/2026-07-14-docs-site-fumadocs.md
  .github/
    dependabot.yml
    workflows/{deploy.yaml, ci.yaml}
```

`docs/superpowers/` sits alongside the site but is **not** part of the build:
`source.config.ts` sources only `content/docs`, so the design docs are never
rendered or picked up by Fumadocs.

## Config adaptations (the delta from the built site)

Everything below is the *only* thing that changes from the reviewed `docs/site/`
subtree; app/components/lib logic and the content are otherwise identical.

- **`next.config.mjs`:** `const basePath = process.env.BASE_PATH ?? '/homelab-docs';`
  (was `/flux-homelab`). `siteUrl` unchanged (`https://yo61.github.io`).
- **`lib/shared.ts`:** `gitConfig.repo` → `'homelab-docs'` (user `yo61`, branch
  `main` unchanged). `appName` stays `'Homelab GitOps'`.
- **`app/(docs)/[[...slug]]/page.tsx`:** the ViewOptions `githubUrl` drops the
  `docs/site/` path prefix:
  `` `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}` ``
  (was `.../docs/site/content/docs/${page.path}`).
- **`.gitignore`:** the site's `.gitignore` (node_modules, `.next`, `.source`,
  `out`, `*.tsbuildinfo`, `next-env.d.ts`) becomes the repo-**root** `.gitignore`.
- **`package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml` / `source.config.ts`
  / `tsconfig.json` / `postcss.config.mjs`:** moved verbatim (pinned versions and
  exact lock resolution preserved).
- **Content (`content/docs/**`):** moved unchanged. Internal links are already
  root-relative (`/tutorials`, `/how-to`, …) and basePath-independent in Fumadocs,
  so no link edits.

## Plumbing (standalone repo)

- **`.pre-commit-config.yaml`** (prek): flux-homelab's hook set —
  `conventional-pre-commit` (commit-msg stage), `gitleaks`, and
  pre-commit-hooks (`trailing-whitespace`, `end-of-file-fixer`, `check-yaml`
  `--allow-multiple-documents`, `check-added-large-files --maxkb=1024`,
  `check-merge-conflict`, `detect-private-key`) — **plus** `actionlint` and
  `zizmor` (the repo ships workflows). `trailing-whitespace` and
  `end-of-file-fixer` **exclude** `^pnpm-lock\.yaml$` (now at root) so the
  vendored lockfile can't be rewritten and desync `--frozen-lockfile`.
  `default_install_hook_types: [pre-commit, commit-msg]`.
- **`.github/dependabot.yml`:** weekly, `cooldown.default-days: 7`, grouped
  `minor`/`patch`. Ecosystems: `pre-commit` (`/`), `github-actions` (`/`),
  `npm` (`/`). No `gomod`.
- **`.github/workflows/deploy.yaml`:** Pages build + deploy. Triggers: push to
  `main` + `workflow_dispatch` (no path filter — the repo *is* the site). No
  `working-directory`. `cache-dependency-path: pnpm-lock.yaml`; upload
  `path: out`. Same job shape and security posture as before
  (`permissions: contents: read` top-level; deploy job `pages: write` +
  `id-token: write`; `persist-credentials: false`). Actions SHA-pinned; each
  SHA re-verified current-stable at implementation time.
- **`.github/workflows/ci.yaml`:** PR gate — on `pull_request`, run
  `pnpm install --frozen-lockfile` → `pnpm build` → `pnpm types:check`. Catches
  a broken build before it merges and only fails at deploy (the gap the prior
  final review flagged). `permissions: contents: read`, `persist-credentials:
  false`, SHA-pinned actions.
- **`LICENSE`:** MIT, © 2026 Robin Bowes.
- **`LICENSE-docs`:** the full CC-BY-4.0 legal code; applies to `content/docs/`.
- **`README.md`:** standalone — what the repo is, `pnpm dev`/`build`/`types:check`,
  the Diátaxis layout, the deploy model, and a **License** section stating code =
  MIT, docs (`content/docs/`) = CC-BY-4.0.
- **`CLAUDE.md`:** short repo guide (Fumadocs static-export docs site; commands;
  Diátaxis structure; deploy pipeline; the Pages-enablement out-of-band note).

## Repo bring-up and flux-homelab cleanup

1. `git init` `homelab-docs`; assemble files; commit in clean logical commits.
2. Hand off — Robin's IaC creates `yo61/homelab-docs` and enables Pages
   (Source = GitHub Actions). Push once the remote exists.
3. On `flux-homelab`: `gh pr close 29`; delete branch `docs/fumadocs-site`
   locally and on `origin`. Verify `main` is untouched at `f8f4040`.

## Verification (before "done")

1. In `homelab-docs`: `pnpm install --frozen-lockfile` clean; `pnpm build`
   produces `out/` with zero errors/warnings; `pnpm types:check` clean.
2. `pnpm dev` driven in a real browser at `http://localhost:3000/homelab-docs`:
   landing, all four quadrant pages, a leaf page, search, and one `llms.*` route
   render with a clean console and correct `/homelab-docs` basePath.
3. `actionlint` + `zizmor` clean on both `deploy.yaml` and `ci.yaml`.
4. `prek run --all-files` clean.
5. `flux-homelab`: PR #29 closed, branch gone, `main` == `f8f4040`.

## Done criteria

`homelab-docs` exists locally as a clean repo that builds and browses, ready to
push; once Robin's IaC creates the remote + enables Pages and it merges to
`main`, the site is live at `https://yo61.github.io/homelab-docs/`. flux-homelab
is back to its pre-PR-#29 state.

## Out of scope

- Custom domain / CNAME (basePath left env-overridable for a later, easy switch).
- Authoring real documentation content (still a later effort).
- Migrating flux-homelab's root prose into the Diátaxis structure.
- Any change to `flux-homelab` `main`.
