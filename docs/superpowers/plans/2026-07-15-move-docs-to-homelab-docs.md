# Move Fumadocs Site to homelab-docs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate the reviewed Fumadocs site from `flux-homelab`'s
`docs/fumadocs-site` branch into a new standalone repo `../homelab-docs` (site at
root, basePath `/homelab-docs`), add full standalone-repo plumbing, and tear down
the flux-homelab docs footprint (close PR #29, delete the branch) leaving
`main` untouched.

**Architecture:** Copy the site subtree out of the flux-homelab branch via
`git archive` (tracked files only — no generated dirs), adapt the three
location-dependent files, add plumbing modelled on the sibling `../go-udap` Node
repo, move the docs-site design history, `git init` fresh (no history carried).
The GitHub remote is created by Robin's IaC — this plan leaves the local repo
**ready to push, but does not push**.

**Tech Stack:** Fumadocs 16 / Next 16 static export / React 19 / Tailwind 4 /
pnpm; GitHub Actions; prek.

**Governing spec:** `docs/superpowers/specs/2026-07-15-move-docs-to-homelab-docs-design.md`

## Paths (used throughout)

- `FLUX` = `/Users/robin/code/github.com/yo61/flux-homelab` (current repo, on branch `docs/fumadocs-site`)
- `DOCS` = `/Users/robin/code/github.com/yo61/homelab-docs` (new repo, created in Task 1)

## Global Constraints

- **basePath:** `/homelab-docs` (default in `next.config.mjs`, env-overridable via `BASE_PATH`).
- **siteUrl:** `https://yo61.github.io` (unchanged).
- **appName:** `Homelab GitOps` (unchanged).
- **gitConfig:** `{ user: 'yo61', repo: 'homelab-docs', branch: 'main' }`.
- **Site at repo root** — no `docs/site/` nesting.
- **Fresh git history** — no filtering of the flux-homelab branch.
- **Do NOT push and do NOT create the GitHub remote** — Robin's IaC owns that. End state is a clean local repo ready to push.
- **Pinned versions preserved** — `package.json` + `pnpm-lock.yaml` move verbatim; no `pnpm update`.
- **Licensing:** MIT for code (`LICENSE`), CC-BY-4.0 for `content/docs/` prose (`LICENSE-docs`).
- **Design docs that move (docs-site only):** `specs/2026-07-14-docs-site-fumadocs-design.md`, `specs/2026-07-15-move-docs-to-homelab-docs-design.md`, `plans/2026-07-14-docs-site-fumadocs.md`, `plans/2026-07-15-move-docs-to-homelab-docs.md`. The external-dns spec/plan do **NOT** move.
- **flux-homelab `main` must stay at `f8f4040`** — untouched.
- **Zero warnings:** `pnpm build` and `pnpm types:check` finish clean before a task is done.

## File Structure (end state of homelab-docs)

```
homelab-docs/
  package.json  pnpm-lock.yaml  pnpm-workspace.yaml       # verbatim from site
  next.config.mjs                                         # adapted (basePath)
  source.config.ts  tsconfig.json  postcss.config.mjs     # verbatim
  .gitignore                                              # the site's, now at root
  README.md                                               # rewritten
  CLAUDE.md                                               # new
  LICENSE            LICENSE-docs                          # MIT / CC-BY-4.0
  .pre-commit-config.yaml                                 # new
  app/  components/  lib/                                 # verbatim except lib/shared.ts, app/(docs)/[[...slug]]/page.tsx
  content/docs/                                           # verbatim
  docs/superpowers/{specs,plans}/                         # moved design history
  .github/dependabot.yml                                  # new
  .github/workflows/deploy.yaml  .github/workflows/ci.yaml # deploy adapted, ci new
```

---

## Task 1: Create homelab-docs and move + adapt the site

Init the new repo, extract the site subtree from the flux-homelab branch, adapt
the three location-dependent files, and verify it builds at the new basePath.
Plumbing and design docs come in later tasks.

**Working repo:** `DOCS` (created here)
**Files:**
- Create repo `DOCS` via `git init`
- Populate from `FLUX` `git archive docs/fumadocs-site:docs/site`
- Adapt: `DOCS/next.config.mjs`, `DOCS/lib/shared.ts`, `DOCS/app/(docs)/[[...slug]]/page.tsx`

**Interfaces:**
- Produces for Task 2: buildable site at `DOCS` root; `pnpm install --frozen-lockfile` + `pnpm build` (→ `DOCS/out`) + `pnpm types:check` all clean; the site's `.gitignore` is at `DOCS/.gitignore`.
- Produces for Task 3: content source dir is `content/docs`; design docs land under `DOCS/docs/superpowers/`.

- [ ] **Step 1: Create and populate the repo (tracked files only, no generated dirs)**

```bash
FLUX=/Users/robin/code/github.com/yo61/flux-homelab
DOCS=/Users/robin/code/github.com/yo61/homelab-docs
mkdir -p "$DOCS"
git -C "$DOCS" init -b main
# extract the site subtree at root (archive contains only committed files)
git -C "$FLUX" archive docs/fumadocs-site:docs/site | tar -x -C "$DOCS"
ls "$DOCS"        # expect: app components content lib next.config.mjs package.json pnpm-lock.yaml ...
```

Expected: `DOCS` contains the site files at root; no `node_modules`, `.next`,
`.source`, or `out` (archive excludes untracked/generated files); `DOCS/.gitignore`
present.

- [ ] **Step 2: Adapt `next.config.mjs` (basePath → `/homelab-docs`)**

Overwrite `DOCS/next.config.mjs` with:

```javascript
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
```

- [ ] **Step 3: Adapt `lib/shared.ts` (gitConfig repo → `homelab-docs`)**

In `DOCS/lib/shared.ts`, change only the `gitConfig.repo` value:

```
Old:  repo: 'flux-homelab',
New:  repo: 'homelab-docs',
```

Leave `appName = 'Homelab GitOps'`, `docsRoute`, `docsContentRoute`, `user`, and
`branch` unchanged. The file after editing:

```typescript
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
```

(Also update the comment's example from `/flux-homelab/` to `/homelab-docs/` as shown.)

- [ ] **Step 4: Adapt the "edit on GitHub" path in `app/(docs)/[[...slug]]/page.tsx`**

The site moved from `docs/site/content/docs/` to `content/docs/`. In
`DOCS/app/(docs)/[[...slug]]/page.tsx`, change the `githubUrl` template:

```
Old:  githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/site/content/docs/${page.path}`}
New:  githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
```

That is the only change in this file.

- [ ] **Step 5: Install, build, and type-check**

```bash
cd "$DOCS"
pnpm install --frozen-lockfile
pnpm build
pnpm types:check
```

Expected: install clean (no lockfile mismatch — confirms verbatim
package.json/lock); `pnpm build` zero errors/warnings, produces `DOCS/out`;
`pnpm types:check` zero errors.

- [ ] **Step 6: Confirm the static export uses the new basePath**

```bash
cd "$DOCS"
ls out/index.html out/tutorials/index.html out/how-to/index.html out/reference/index.html out/explanation/index.html out/llms.txt
# every internal href/src must be /homelab-docs-prefixed; this must print nothing:
rg --pcre2 -o '(href|src)="/(?!homelab-docs/)[a-zA-Z_][^"]*"' out/index.html || echo "OK: all internal URLs are /homelab-docs-prefixed"
rg -o '/homelab-docs/api/search' out/_next/static/**/*.js | head -1
```

Expected: all five route files + `llms.txt` exist; the `--pcre2` check prints the
"OK" line (no unprefixed root-absolute URLs); the search client references
`/homelab-docs/api/search`.

- [ ] **Step 7: Initial commit**

```bash
cd "$DOCS"
git add -A
git commit -m "feat: Fumadocs docs site (relocated from flux-homelab)" \
  -m "Static-export Fumadocs site at repo root, basePath /homelab-docs,
published to https://yo61.github.io/homelab-docs/. Moved from the
flux-homelab docs/fumadocs-site branch; OG-image route already removed;
search + llms.* routes retained." \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" \
  -m "Claude-Session: https://claude.ai/code/session_01PVnh9EFVT7s3zFvzaLj8je"
```

(No pre-commit hooks are installed in `DOCS` yet — that config arrives in Task 2.)

**Controller note:** after Task 1 review, the controller runs the live browser
check against `pnpm dev` at `http://localhost:3000/homelab-docs` (landing, four
quadrants, a leaf page, interactive search, `llms.txt`) before marking complete.

---

## Task 2: Standalone repo plumbing

Add the licenses, README, CLAUDE.md, pre-commit config, Dependabot config, and
the two workflows. Verify the workflows lint clean and the hooks pass on the
whole tree.

**Working repo:** `DOCS`
**Files:**
- Create: `DOCS/LICENSE`, `DOCS/LICENSE-docs`, `DOCS/README.md` (overwrite), `DOCS/CLAUDE.md`, `DOCS/.pre-commit-config.yaml`, `DOCS/.github/dependabot.yml`, `DOCS/.github/workflows/deploy.yaml`, `DOCS/.github/workflows/ci.yaml`

**Interfaces:**
- Consumes from Task 1: buildable site with `pnpm install --frozen-lockfile` / `pnpm build` → `out`; lockfile at `DOCS/pnpm-lock.yaml`.

- [ ] **Step 1: `LICENSE` (MIT)**

Create `DOCS/LICENSE`:

```
MIT License

Copyright (c) 2026 Robin Bowes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: `LICENSE-docs` (CC-BY-4.0 — fetch the canonical text, do not transcribe)**

```bash
cd "$DOCS"
curl -fsSL https://raw.githubusercontent.com/spdx/license-list-data/main/text/CC-BY-4.0.txt -o LICENSE-docs \
  || curl -fsSL https://creativecommons.org/licenses/by/4.0/legalcode.txt -o LICENSE-docs
# verify it is the full legal code, not an error page:
wc -c LICENSE-docs                       # expect > 10000 bytes
rg -q "Creative Commons Attribution 4.0 International" LICENSE-docs && echo "OK: CC-BY-4.0 text present"
rg -q "Section 1 . Definitions|Section 1 – Definitions" LICENSE-docs && echo "OK: sections present"
```

Expected: `LICENSE-docs` > 10 KB and both "OK" lines print. If neither URL yields
the full text, STOP and report BLOCKED — do not hand-write the legal code.

- [ ] **Step 3: `README.md` (overwrite the moved go-udap-derived one)**

Create `DOCS/README.md`:

```markdown
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
```

- [ ] **Step 4: `CLAUDE.md`**

Create `DOCS/CLAUDE.md`:

```markdown
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
```

- [ ] **Step 5: `.pre-commit-config.yaml`**

Create `DOCS/.pre-commit-config.yaml`:

```yaml
default_install_hook_types: [pre-commit, commit-msg]

repos:
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v4.4.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.30.1
    hooks:
      - id: gitleaks

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      - id: detect-private-key
      - id: check-yaml
        args: [--allow-multiple-documents]
      - id: end-of-file-fixer
        exclude: ^pnpm-lock\.yaml$
      - id: trailing-whitespace
        exclude: ^pnpm-lock\.yaml$
      - id: check-added-large-files
        args: [--maxkb=1024]
      - id: check-merge-conflict

  - repo: https://github.com/rhysd/actionlint
    rev: v1.7.12
    hooks:
      - id: actionlint

  - repo: https://github.com/woodruffw/zizmor-pre-commit
    rev: v1.26.1
    hooks:
      - id: zizmor
```

Note: revs above are the current-stable values from the sibling repos. Optionally
refresh with `prek autoupdate --cooldown-days 7` and keep whatever it resolves.

- [ ] **Step 6: `.github/dependabot.yml`**

Create `DOCS/.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "pre-commit"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 7
    groups:
      hooks:
        patterns: ["*"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 7
    groups:
      actions-minor-patch:
        update-types: ["minor", "patch"]

  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 7
    groups:
      npm-minor-patch:
        update-types: ["minor", "patch"]
```

- [ ] **Step 7: `.github/workflows/deploy.yaml` (re-verify SHAs first)**

Resolve the current-stable commit SHA for each of the six actions (see
`gh` recipe in Task 1 of the prior plan; annotated tags must be dereferenced to
the commit SHA). The values below were current on 2026-07-15 — re-verify and
correct if newer. Create `DOCS/.github/workflows/deploy.yaml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0  # v7.0.0
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@0ebf47130e4866e96fce0953f49152a61190b271  # v6.0.9
        with:
          version: 11
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020  # v7.0.0
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d  # v6.0.0
      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9  # v5.0.0
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128  # v5.0.0
```

- [ ] **Step 8: `.github/workflows/ci.yaml`**

Create `DOCS/.github/workflows/ci.yaml` (reuse the same SHAs resolved in Step 7):

```yaml
name: CI

on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0  # v7.0.0
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@0ebf47130e4866e96fce0953f49152a61190b271  # v6.0.9
        with:
          version: 11
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020  # v7.0.0
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm types:check
```

- [ ] **Step 9: Lint the workflows and run the hooks**

```bash
cd "$DOCS"
actionlint .github/workflows/deploy.yaml .github/workflows/ci.yaml
zizmor .github/workflows/deploy.yaml .github/workflows/ci.yaml
prek run --all-files
```

Expected: `actionlint` clean; `zizmor` clean (all actions SHA-pinned;
`persist-credentials: false`; least-privilege permissions — `pull_request` (not
`pull_request_target`) is not a dangerous trigger); `prek run --all-files` passes
all hooks. If a whitespace hook tries to rewrite `pnpm-lock.yaml`, the exclusion
is wrong — fix it. If `gitleaks` false-positives on a lockfile hash, add a scoped
`.gitleaks.toml` allowlist and note it; do not disable the hook.

- [ ] **Step 10: Commit**

```bash
cd "$DOCS"
git add -A
git commit -m "chore: standalone repo plumbing (licenses, hooks, dependabot, CI)" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" \
  -m "Claude-Session: https://claude.ai/code/session_01PVnh9EFVT7s3zFvzaLj8je"
```

---

## Task 3: Move the docs-site design history

Copy the docs-site design specs and plans into `homelab-docs` as history (they
live only on the flux-homelab branch that Task 4 deletes). The external-dns
spec/plan are NOT moved.

**Working repo:** `DOCS` (reads files from `FLUX`)
**Files:**
- Create: `DOCS/docs/superpowers/specs/2026-07-14-docs-site-fumadocs-design.md`, `DOCS/docs/superpowers/specs/2026-07-15-move-docs-to-homelab-docs-design.md`, `DOCS/docs/superpowers/plans/2026-07-14-docs-site-fumadocs.md`, `DOCS/docs/superpowers/plans/2026-07-15-move-docs-to-homelab-docs.md`

**Interfaces:**
- Consumes from Task 1: `content/docs` is the only build source, so `docs/superpowers/` is inert to the site build.

- [ ] **Step 1: Copy the four design docs**

```bash
FLUX=/Users/robin/code/github.com/yo61/flux-homelab
DOCS=/Users/robin/code/github.com/yo61/homelab-docs
mkdir -p "$DOCS/docs/superpowers/specs" "$DOCS/docs/superpowers/plans"
cp "$FLUX/docs/superpowers/specs/2026-07-14-docs-site-fumadocs-design.md" \
   "$FLUX/docs/superpowers/specs/2026-07-15-move-docs-to-homelab-docs-design.md" \
   "$DOCS/docs/superpowers/specs/"
cp "$FLUX/docs/superpowers/plans/2026-07-14-docs-site-fumadocs.md" \
   "$FLUX/docs/superpowers/plans/2026-07-15-move-docs-to-homelab-docs.md" \
   "$DOCS/docs/superpowers/plans/"
ls "$DOCS/docs/superpowers/specs" "$DOCS/docs/superpowers/plans"
```

Expected: exactly two specs and two plans copied; no external-dns files present.

- [ ] **Step 2: Confirm the site build ignores the design docs**

```bash
cd "$DOCS"
pnpm build 2>&1 | tail -3
rg -l "move-docs-to-homelab-docs" out/ 2>/dev/null && echo "UNEXPECTED: design doc leaked into build" || echo "OK: design docs not in build output"
```

Expected: build still clean; the "OK" line prints (the design docs are not
rendered into `out/`).

- [ ] **Step 3: Run hooks and commit**

```bash
cd "$DOCS"
git add -A
prek run --files $(git diff --cached --name-only)
git commit -m "docs: design specs and implementation plans (history)" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" \
  -m "Claude-Session: https://claude.ai/code/session_01PVnh9EFVT7s3zFvzaLj8je"
```

Expected: hooks pass; commit created.

**End state:** `homelab-docs` is a clean local repo, ready to push. **Do not push
and do not create the GitHub remote** — Robin's IaC provisions `yo61/homelab-docs`
and enables Pages, then the push happens. Report the local repo path and its
commit log.

---

## Task 4: Tear down the flux-homelab docs footprint

Close PR #29 and delete the `docs/fumadocs-site` branch (local + remote), leaving
`flux-homelab` `main` untouched. Run this ONLY after Tasks 1–3 have copied
everything out of the branch.

**Working repo:** `FLUX`
**Files:** none created; branch + PR removed.

**Interfaces:**
- Consumes from Tasks 1–3: the site and all four design docs already exist in `DOCS`, so the branch is safe to delete.

- [ ] **Step 1: Safety check — confirm the work is preserved in homelab-docs**

```bash
DOCS=/Users/robin/code/github.com/yo61/homelab-docs
test -f "$DOCS/next.config.mjs" && test -d "$DOCS/content/docs" \
  && test -f "$DOCS/docs/superpowers/specs/2026-07-15-move-docs-to-homelab-docs-design.md" \
  && echo "OK: site + design docs present in homelab-docs" || { echo "ABORT: homelab-docs incomplete"; exit 1; }
git -C "$DOCS" log --oneline
```

Expected: "OK" line prints and `DOCS` shows three commits. If not, STOP — do not
delete anything.

- [ ] **Step 2: Move off the branch and confirm main is at f8f4040**

```bash
FLUX=/Users/robin/code/github.com/yo61/flux-homelab
cd "$FLUX"
git checkout main
git rev-parse --short main    # expect: f8f4040
```

- [ ] **Step 3: Close PR #29 and delete the remote branch**

```bash
cd "$FLUX"
gh pr close 29 --comment "Superseded: the docs site now lives in its own repo (yo61/homelab-docs). See docs/superpowers/specs/2026-07-15-move-docs-to-homelab-docs-design.md." --delete-branch
```

`--delete-branch` removes `origin/docs/fumadocs-site` and the local branch if it
is fully merged; since it is not merged, delete the local branch explicitly next.

- [ ] **Step 4: Delete the local branch and tidy leftovers**

```bash
cd "$FLUX"
git branch -D docs/fumadocs-site
git branch --list docs/fumadocs-site     # expect: empty
# remove the now-untracked generated site dir left on disk (was gitignored)
trash docs/site 2>/dev/null || rm -rf docs/site
git status --short                       # expect: clean (main untouched)
```

Expected: local branch gone; `docs/site` removed from the working tree; `git
status` clean; `git rev-parse --short main` still `f8f4040`.

- [ ] **Step 5: Verify PR #29 state**

```bash
cd "$FLUX"
gh pr view 29 --json state,title -q '.state + " — " + .title'   # expect: CLOSED — ...
```

---

## Self-Review (against the spec)

**Spec coverage:**
- Move scope = site only → Tasks 1–2 move the site; root prose never touched. ✓
- Site at root → Task 1 Step 1 (`git archive <tree>:docs/site` extracts at root). ✓
- basePath `/homelab-docs`, gitConfig repo, edit-on-GitHub path → Task 1 Steps 2–4. ✓
- Project Pages, env-overridable basePath → Task 1 Step 2 (`BASE_PATH ?? '/homelab-docs'`). ✓
- Fresh git history → Task 1 Step 1 (`git init`; archive carries no history). ✓
- IaC owns remote; ready-to-push, no push → Task 3 end state; no `gh repo create`/`git push` anywhere. ✓
- flux-homelab cleanup, main untouched → Task 4 (checkout main, close #29, delete branch, verify f8f4040). ✓
- Dual license MIT + CC-BY-4.0 → Task 2 Steps 1–2 (+ README/CLAUDE license notes). ✓
- Plumbing (pre-commit, dependabot, deploy, ci, README, CLAUDE, LICENSE, LICENSE-docs) → Task 2. ✓
- Design docs move (docs-site only, not external-dns) → Task 3 Step 1 (explicit file list). ✓
- Verification: build, browser, actionlint/zizmor, prek → Task 1 Steps 5–6 + controller browser note; Task 2 Step 9. ✓

**Placeholder scan:** No TBD/TODO. The only fetched content (CC-BY-4.0 text, Task 2
Step 2) is deliberately fetched with verification rather than transcribed; the
workflow SHAs (Task 2 Steps 7–8) are concrete current-stable values with a
re-verify instruction — a gate, not a gap.

**Type/name consistency:** `gitConfig.repo` = `homelab-docs` used consistently in
`lib/shared.ts` (Task 1 Step 3) and the `githubUrl` in `page.tsx` (Task 1 Step 4).
basePath `/homelab-docs` consistent across `next.config.mjs`, the static-export
check (Task 1 Step 6), README, and CLAUDE.md. Workflow cache/upload paths
(`pnpm-lock.yaml`, `out`) match the root layout. The four moved design-doc
filenames in Task 3 match the actual files listed in Global Constraints.
