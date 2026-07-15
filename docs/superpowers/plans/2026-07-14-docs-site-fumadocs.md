# Fumadocs Docs Site + GitHub Pages Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a buildable, browsable, deployable Fumadocs documentation
site under `docs/site/`, rendering a Diátaxis skeleton and publishing to GitHub
Pages — tooling and pipeline only, no real content.

**Architecture:** Copy the working Fumadocs site from the sibling repo
`../go-udap/docs/site`, adapt a handful of config strings (basePath, app name,
git repo), strip the dynamic OG-image route, replace go-udap's content with a
fresh four-quadrant Diátaxis skeleton, and copy go-udap's GitHub Pages workflow.
Static export (`output: 'export'`) → `out/` → `actions/deploy-pages`.

**Tech Stack:** Fumadocs 16.10.7, Next.js 16.2.10 (static export), React 19,
Tailwind 4, pnpm, TypeScript. GitHub Actions for build + deploy.

**Reference source:** `../go-udap/docs/site` (a working sibling site). Where this
plan says "copy from go-udap", copy the file verbatim unless an adaptation step
says otherwise. Absolute reference path assumed:
`/Users/robin/code/github.com/yo61/go-udap/docs/site`.

**Governing spec:** `docs/superpowers/specs/2026-07-14-docs-site-fumadocs-design.md`

## Global Constraints

- **Publish target:** GitHub Project Pages — `https://yo61.github.io/flux-homelab/`.
- **basePath:** `/flux-homelab` (default in `next.config.mjs`, overridable via `BASE_PATH`).
- **siteUrl:** `https://yo61.github.io` (unchanged from go-udap — same GitHub user).
- **Diátaxis labels (canonical):** `tutorials/`, `how-to/`, `reference/`, `explanation/`
  (go-udap used `concepts/` for the last quadrant — we rename it to `explanation/`).
- **App name string:** `Homelab GitOps`.
- **gitConfig:** `{ user: 'yo61', repo: 'flux-homelab', branch: 'main' }`.
- **Keep** from go-udap: client-side search, and the `llms.txt` / `llms-full.txt` /
  `llms.mdx` routes.
- **Drop** from go-udap: the dynamic OG-image route (`app/og/**`) and its
  `getPageImage` wiring.
- **Pinned versions:** keep go-udap's exact `package.json` versions and copy its
  `pnpm-lock.yaml` verbatim to preserve resolution. Do **not** run `pnpm update`.
- **Existing prose untouched:** `README.md`, `BOOTSTRAP.md`, `REBUILD.md`,
  `SERVICES.md` stay in place. This session ships skeletons only, not migrated content.
- **Zero warnings:** `pnpm build` and `pnpm types:check` must finish with zero
  errors and zero warnings before a task is "done".

## Out-of-band requirement (user-owned, NOT in this plan)

GitHub Pages "Build and deployment → Source" must be set to **GitHub Actions**
via the user's GitHub-repo IaC before the first deploy succeeds. This plan
creates the workflow but does not touch repo settings. Flag this to Robin at
the end; the workflow will fail its deploy job until Pages is enabled.

## File Structure

New site under `docs/site/`, coexisting with the existing `docs/superpowers/` tree.

| Path | Responsibility | Origin |
| --- | --- | --- |
| `docs/site/next.config.mjs` | Next config: static export, basePath, env | adapt |
| `docs/site/source.config.ts` | Fumadocs MDX collection definition | verbatim |
| `docs/site/tsconfig.json` | TS compiler + path aliases | verbatim |
| `docs/site/postcss.config.mjs` | Tailwind via PostCSS | verbatim |
| `docs/site/package.json` | Deps + scripts | verbatim |
| `docs/site/pnpm-lock.yaml` | Pinned resolution | verbatim |
| `docs/site/pnpm-workspace.yaml` | pnpm build-allow + overrides | verbatim |
| `docs/site/.gitignore` | Ignore generated dirs (node_modules, .next, .source, out) | verbatim |
| `docs/site/README.md` | Dev instructions | adapt |
| `docs/site/app/layout.tsx` | Root HTML layout + metadataBase | verbatim |
| `docs/site/app/global.css` | Tailwind + Fumadocs theme tweaks | verbatim |
| `docs/site/app/(docs)/layout.tsx` | Docs shell (sidebar tree) | verbatim |
| `docs/site/app/(docs)/[[...slug]]/page.tsx` | Docs page renderer | adapt (drop OG) |
| `docs/site/app/api/search/route.ts` | Static search index | verbatim |
| `docs/site/app/llms.txt/route.ts` | LLM index | verbatim |
| `docs/site/app/llms-full.txt/route.ts` | LLM full dump | verbatim |
| `docs/site/app/llms.mdx/docs/[[...slug]]/route.ts` | Per-page markdown | verbatim |
| `docs/site/components/mdx.tsx` | MDX component map | verbatim |
| `docs/site/components/provider.tsx` | Root + search provider | verbatim |
| `docs/site/components/search.tsx` | basePath-aware search dialog | verbatim |
| `docs/site/lib/cn.ts` | classname helper | verbatim |
| `docs/site/lib/source.ts` | Content loader | adapt (drop getPageImage) |
| `docs/site/lib/shared.ts` | App name, git config, route prefixes | adapt |
| `docs/site/lib/layout.shared.tsx` | Nav title + GitHub link | verbatim |
| `docs/site/content/docs/**` | Diátaxis skeleton (fresh) | **new** |
| `.github/workflows/docs.yaml` | Build + deploy to Pages | adapt (verify SHAs) |
| `.pre-commit-config.yaml` | Exclude vendored lockfile from whitespace hooks | modify |

**Deliberately NOT copied:** `app/og/docs/[...slug]/route.tsx` (dropped),
`.next/`, `.source/`, `node_modules/`, `out/`, `next-env.d.ts`,
`tsconfig.tsbuildinfo` (all generated), and go-udap's `content/docs/**` (replaced).

---

## Task 1: Scaffold the Fumadocs tooling (config + app + libs, OG removed)

Copy the go-udap site infrastructure, adapt the config strings, strip the
OG-image route and its wiring, and make the subtree install cleanly under the
repo's pre-commit hooks. No site content yet — that is Task 2.

**Files:**
- Create (verbatim copy): `docs/site/{source.config.ts, tsconfig.json, postcss.config.mjs, package.json, pnpm-lock.yaml, pnpm-workspace.yaml, .gitignore}`
- Create (verbatim copy): `docs/site/app/{layout.tsx, global.css}`, `docs/site/app/(docs)/layout.tsx`, `docs/site/app/api/search/route.ts`, `docs/site/app/llms.txt/route.ts`, `docs/site/app/llms-full.txt/route.ts`, `docs/site/app/llms.mdx/docs/[[...slug]]/route.ts`
- Create (verbatim copy): `docs/site/components/{mdx.tsx, provider.tsx, search.tsx}`, `docs/site/lib/{cn.ts, layout.shared.tsx}`
- Create (adapted): `docs/site/next.config.mjs`, `docs/site/README.md`, `docs/site/lib/shared.ts`, `docs/site/lib/source.ts`, `docs/site/app/(docs)/[[...slug]]/page.tsx`
- Modify: `.pre-commit-config.yaml`
- **Do NOT create:** `docs/site/app/og/**`

**Interfaces:**
- Produces for Task 2: content lives in `docs/site/content/docs/`; the loader
  `source` (in `lib/source.ts`) has `baseUrl: '/'`; frontmatter uses
  `pageSchema` (fields: `title`, `description`, optional `full`).
- Produces for Task 3: build script `pnpm build` emits static site to
  `docs/site/out`; install is `pnpm install --frozen-lockfile`.

- [ ] **Step 1: Copy the verbatim files**

```bash
cd /Users/robin/code/github.com/yo61/flux-homelab
SRC=/Users/robin/code/github.com/yo61/go-udap/docs/site
mkdir -p docs/site/app/api/search docs/site/app/llms.txt docs/site/app/llms-full.txt \
  "docs/site/app/llms.mdx/docs/[[...slug]]" "docs/site/app/(docs)/[[...slug]]" \
  docs/site/components docs/site/lib

# root-level verbatim config
cp "$SRC/source.config.ts" "$SRC/tsconfig.json" "$SRC/postcss.config.mjs" \
   "$SRC/package.json" "$SRC/pnpm-lock.yaml" "$SRC/pnpm-workspace.yaml" \
   "$SRC/.gitignore" docs/site/

# app (NOTE: app/og/** is intentionally NOT copied)
cp "$SRC/app/layout.tsx" "$SRC/app/global.css" docs/site/app/
cp "$SRC/app/(docs)/layout.tsx" "docs/site/app/(docs)/"
cp "$SRC/app/api/search/route.ts" docs/site/app/api/search/
cp "$SRC/app/llms.txt/route.ts" docs/site/app/llms.txt/
cp "$SRC/app/llms-full.txt/route.ts" docs/site/app/llms-full.txt/
cp "$SRC/app/llms.mdx/docs/[[...slug]]/route.ts" "docs/site/app/llms.mdx/docs/[[...slug]]/"

# components + lib verbatim
cp "$SRC/components/mdx.tsx" "$SRC/components/provider.tsx" "$SRC/components/search.tsx" docs/site/components/
cp "$SRC/lib/cn.ts" "$SRC/lib/layout.shared.tsx" docs/site/lib/
```

- [ ] **Step 2: Write the adapted `next.config.mjs`**

Create `docs/site/next.config.mjs` (basePath default → `/flux-homelab`; OG bullet
removed from the comment since that route is dropped):

```javascript
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const basePath = process.env.BASE_PATH ?? '/flux-homelab';
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

- [ ] **Step 3: Write the adapted `lib/shared.ts`**

Create `docs/site/lib/shared.ts` — new `appName`, new repo, and **remove**
`docsImageRoute` (OG-only):

```typescript
// Inlined at build time from next.config.mjs `env.NEXT_PUBLIC_BASE_PATH`.
// Prepended to the "view as markdown" (llms.mdx) URL so the rendered link
// resolves against the basePath-mounted site (e.g. `/flux-homelab/llms.mdx/...`)
// rather than the host root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const appName = 'Homelab GitOps';
export const docsRoute = '/';
export const docsContentRoute = `${basePath}/llms.mdx/docs`;

export const gitConfig = {
  user: 'yo61',
  repo: 'flux-homelab',
  branch: 'main',
};
```

- [ ] **Step 4: Write the adapted `lib/source.ts`**

Create `docs/site/lib/source.ts` — drop the `docsImageRoute` import and the
`getPageImage` function; keep `getPageMarkdownUrl` and `getLLMText`:

```typescript
import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { docsContentRoute, docsRoute } from './shared';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [],
});

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
```

- [ ] **Step 5: Write the adapted docs page `app/(docs)/[[...slug]]/page.tsx`**

Create `docs/site/app/(docs)/[[...slug]]/page.tsx` — remove the `getPageImage`
import and the `openGraph.images` metadata (the only OG references in this file):

```tsx
import { getPageMarkdownUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/site/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
```

- [ ] **Step 6: Write the adapted `README.md`**

Create `docs/site/README.md`:

```markdown
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
```

- [ ] **Step 7: Guard the vendored lockfile from auto-fixing hooks**

The repo's `trailing-whitespace` and `end-of-file-fixer` hooks *rewrite* files
in place. Rewriting `pnpm-lock.yaml` would desync it from `package.json` and
break CI's `--frozen-lockfile`. Exclude it.

Modify `.pre-commit-config.yaml` — change the two hook entries to add an
`exclude`:

```yaml
      - id: end-of-file-fixer
        exclude: ^docs/site/pnpm-lock\.yaml$
      - id: trailing-whitespace
        exclude: ^docs/site/pnpm-lock\.yaml$
```

- [ ] **Step 8: Install dependencies and generate the source types**

```bash
cd docs/site
pnpm install --frozen-lockfile
```

Expected: install completes; `postinstall` runs `fumadocs-mdx`; a `.source/`
directory is generated. No lockfile-mismatch error (confirms verbatim
`pnpm-lock.yaml` matches `package.json`).

- [ ] **Step 9: Type-check the scaffold**

```bash
cd docs/site
pnpm types:check
```

Expected: PASS with zero errors. This is the gate that proves the OG removal is
consistent — a leftover `getPageImage`/`docsImageRoute` reference would fail
here with "has no exported member".

- [ ] **Step 10: Run the pre-commit hooks against the new subtree**

```bash
cd /Users/robin/code/github.com/yo61/flux-homelab
git add docs/site .pre-commit-config.yaml
prek run --files $(git diff --cached --name-only)
```

Expected: all hooks pass. `check-yaml`, `check-added-large-files` (lockfile is
164 KB < 1024 KB), `gitleaks`, `detect-private-key` clean. If
`trailing-whitespace`/`end-of-file-fixer` modify any *source* file (not the
excluded lockfile), let them auto-fix, re-stage, and re-run. If `gitleaks`
false-positives on a lockfile integrity hash, add a scoped allowlist entry to
`.gitleaks.toml` and note it — do not disable the hook.

- [ ] **Step 11: Commit**

```bash
git add docs/site .pre-commit-config.yaml
git commit -m "feat(docs): scaffold Fumadocs site tooling from go-udap"
```

---

## Task 2: Diátaxis content skeleton + local render verification

Replace go-udap's content with a fresh four-quadrant Diátaxis skeleton, then
prove the site both builds statically and renders correctly in a real browser.
The browser check is a distinct gate: `output: 'export'` + `basePath` bugs
produce runtime 404s that a green `pnpm build` hides.

**Files:**
- Create: `docs/site/content/docs/index.mdx`
- Create: `docs/site/content/docs/meta.json`
- Create (×4 quadrants `tutorials`, `how-to`, `reference`, `explanation`):
  `docs/site/content/docs/<q>/index.mdx`, `docs/site/content/docs/<q>/meta.json`,
  and one placeholder stub `.mdx`

**Interfaces:**
- Consumes from Task 1: `source` loader with `baseUrl: '/'`; `pageSchema`
  frontmatter (`title`, `description`); `<Cards>`/`<Card>` from
  `fumadocs-ui/components/card`.
- Produces for Task 3: a non-empty `out/` after `pnpm build`, including
  `out/index.html`, one HTML file per quadrant, and `out/api/search/route`
  static index.

- [ ] **Step 1: Write the landing page `content/docs/index.mdx`**

```mdx
---
title: Homelab GitOps
description: Documentation for the flux-homelab Kubernetes cluster
---

import { Cards, Card } from 'fumadocs-ui/components/card';

A Talos + Flux GitOps homelab cluster. This site documents how it is built,
how to operate it, what every component is, and why it is designed the way it
is — organised on the [Diátaxis](https://diataxis.fr/) system.

## Start here

<Cards>
  <Card
    title="Tutorials"
    href="/tutorials"
    description="Learning-oriented, start-to-finish lessons for someone new to the cluster."
  />
  <Card
    title="How-to guides"
    href="/how-to"
    description="Task-oriented recipes: do one specific thing, verify the result."
  />
  <Card
    title="Reference"
    href="/reference"
    description="Authoritative lookup: components, versions, config, endpoints."
  />
  <Card
    title="Explanation"
    href="/explanation"
    description="The why: architecture, design decisions, and trade-offs."
  />
</Cards>

## Source

[github.com/yo61/flux-homelab](https://github.com/yo61/flux-homelab)
```

- [ ] **Step 2: Write the root `content/docs/meta.json`**

Orders the quadrants in the sidebar (go-udap's `concepts`/`contributing`
dropped; `explanation` added):

```json
{
  "title": "Docs",
  "pages": [
    "tutorials",
    "how-to",
    "reference",
    "explanation"
  ]
}
```

- [ ] **Step 3: Write the Tutorials quadrant**

`content/docs/tutorials/index.mdx`:

```mdx
---
title: Tutorials
description: Learning-oriented, start-to-finish lessons
---

Hands-on walkthroughs for someone new to the cluster. Pick one and follow it
end-to-end — every step has expected output so you can confirm you are on track.
```

`content/docs/tutorials/meta.json`:

```json
{
  "title": "Tutorials",
  "pages": [
    "index",
    "bootstrap-the-cluster"
  ]
}
```

`content/docs/tutorials/bootstrap-the-cluster.mdx` (placeholder stub doubling as
the content backlog):

```mdx
---
title: Bootstrap the cluster (planned)
description: Placeholder — content authored under a later spec
---

> **Placeholder.** This tutorial is not written yet. Planned coverage:

- [ ] Bare-metal → Talos install
- [ ] Bootstrap Flux against this repo
- [ ] First reconcile and how to confirm it worked
- [ ] Verifying core add-ons (Cilium, cert-manager, external-dns) are healthy
```

- [ ] **Step 4: Write the How-to quadrant**

`content/docs/how-to/index.mdx`:

```mdx
---
title: How-to guides
description: Task-oriented recipes
---

Each page solves one specific problem. Find the goal that matches yours, check
the prerequisites, follow the steps, verify the result.
```

`content/docs/how-to/meta.json`:

```json
{
  "title": "How-to",
  "pages": [
    "index",
    "add-a-new-service"
  ]
}
```

`content/docs/how-to/add-a-new-service.mdx`:

```mdx
---
title: Add a new service (planned)
description: Placeholder — content authored under a later spec
---

> **Placeholder.** This guide is not written yet. Planned coverage:

- [ ] Where a new app HelmRelease / Kustomization goes in the repo
- [ ] Wiring an HTTPRoute on the Cilium Gateway
- [ ] Getting DNS via external-dns and a cert via cert-manager
- [ ] Confirming the reconcile and reaching the service
```

- [ ] **Step 5: Write the Reference quadrant**

`content/docs/reference/index.mdx`:

```mdx
---
title: Reference
description: Authoritative lookup
---

Precise, information-oriented descriptions of the cluster's parts: components
and their versions, configuration, endpoints, and defaults. Look here to check
a fact, not to learn a workflow.
```

`content/docs/reference/meta.json`:

```json
{
  "title": "Reference",
  "pages": [
    "index",
    "components"
  ]
}
```

`content/docs/reference/components.mdx`:

```mdx
---
title: Components (planned)
description: Placeholder — content authored under a later spec
---

> **Placeholder.** This reference is not written yet. Planned coverage:

- [ ] Talos + Kubernetes versions
- [ ] Core add-ons: Cilium, cert-manager, external-dns, ESO, OpenBao
- [ ] Ingress: Cilium Gateway + HTTPRoutes
- [ ] Monitoring: Prometheus, Grafana
```

- [ ] **Step 6: Write the Explanation quadrant**

`content/docs/explanation/index.mdx`:

```mdx
---
title: Explanation
description: The why behind the design
---

Discussion-oriented background: why the cluster is built this way, what
alternatives were weighed, and the trade-offs accepted. Read here to understand,
not to accomplish a task.
```

`content/docs/explanation/meta.json`:

```json
{
  "title": "Explanation",
  "pages": [
    "index",
    "why-gitops"
  ]
}
```

`content/docs/explanation/why-gitops.mdx`:

```mdx
---
title: Why GitOps (planned)
description: Placeholder — content authored under a later spec
---

> **Placeholder.** This explanation is not written yet. Planned coverage:

- [ ] Why Flux + Git as the single source of truth
- [ ] Why Talos for immutable, API-driven nodes
- [ ] The zero-manual-intervention bring-up goal
- [ ] Secrets flow: OpenBao → External Secrets Operator
```

- [ ] **Step 7: Build the static site**

```bash
cd docs/site
pnpm build
```

Expected: PASS, zero errors/warnings. `out/` is created containing
`index.html`, `tutorials/index.html`, `how-to/index.html`,
`reference/index.html`, `explanation/index.html`, and the stub pages. Confirm:

```bash
ls out/index.html out/tutorials/index.html out/how-to/index.html \
   out/reference/index.html out/explanation/index.html
```

Expected: all five paths exist.

- [ ] **Step 8: Serve the built output and verify in a real browser**

Start the dev server (uses the `/flux-homelab` basePath, matching production):

```bash
cd docs/site
pnpm dev
```

Then, using the browser automation tools (claude-in-chrome), open a new tab and
verify each of these renders with **no console errors** and no 404s:

1. `http://localhost:3000/flux-homelab` — landing page, the four `<Card>`s show and link.
2. Click each Card → `/tutorials`, `/how-to`, `/reference`, `/explanation`
   quadrant index pages render.
3. Left sidebar shows all four quadrants in order, each expandable to its stub page.
4. Open one stub page (e.g. `/tutorials/bootstrap-the-cluster`) — renders with
   its TODO list.
5. Search: press `⌘K` (or click search), type "cluster", results appear.
6. One `llms` route: open `http://localhost:3000/flux-homelab/llms.txt` — returns
   the index text (not a 404).

Stop the dev server when done (Ctrl-C). If any route 404s or the console shows
errors, fix before proceeding — this is exactly the class of basePath/static-export
bug a green build does not catch.

- [ ] **Step 9: Commit**

```bash
cd /Users/robin/code/github.com/yo61/flux-homelab
git add docs/site/content
git commit -m "feat(docs): seed Diátaxis skeleton content"
```

---

## Task 3: GitHub Pages publishing pipeline

Add the build + deploy workflow. Re-verify each pinned action SHA is the current
stable release at implementation time (do not trust go-udap's copied pins
blindly), then lint for correctness and security.

**Files:**
- Create: `.github/workflows/docs.yaml`

**Interfaces:**
- Consumes from Tasks 1–2: `docs/site/` builds via `pnpm install --frozen-lockfile`
  then `pnpm build` → `docs/site/out`.

- [ ] **Step 1: Look up the current stable SHA for each action**

For each of the five actions below, resolve the latest stable release tag and
its commit SHA (e.g. `gh release view --repo actions/checkout`, then
`gh api repos/actions/checkout/git/refs/tags/<tag>`). Record tag + SHA — you
will pin to these, not to go-udap's values, which may have aged.

- `actions/checkout`
- `pnpm/action-setup`
- `actions/setup-node`
- `actions/configure-pages`
- `actions/upload-pages-artifact`
- `actions/deploy-pages`

- [ ] **Step 2: Write `.github/workflows/docs.yaml`**

Use the resolved SHAs from Step 1 in place of the `<sha>` placeholders and put
the matching version in each trailing comment. Structure (copied from go-udap,
paths already correct for this repo):

```yaml
name: Docs

on:
  push:
    branches: [main]
    paths:
      - 'docs/site/**'
      - '.github/workflows/docs.yaml'
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: docs/site
    steps:
      - uses: actions/checkout@<sha>  # vX.Y.Z
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@<sha>  # vX.Y.Z
        with:
          version: 11
      - uses: actions/setup-node@<sha>  # vX.Y.Z
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: docs/site/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/configure-pages@<sha>  # vX.Y.Z
      - uses: actions/upload-pages-artifact@<sha>  # vX.Y.Z
        with:
          path: docs/site/out

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
        uses: actions/deploy-pages@<sha>  # vX.Y.Z
```

- [ ] **Step 3: Lint the workflow**

```bash
cd /Users/robin/code/github.com/yo61/flux-homelab
actionlint .github/workflows/docs.yaml
zizmor .github/workflows/docs.yaml
```

Expected: both clean. `zizmor` should not flag unpinned actions (all are
SHA-pinned) or credential persistence (`persist-credentials: false` is set on
checkout). Fix any finding before proceeding.

- [ ] **Step 4: Run the pre-commit hooks**

```bash
git add .github/workflows/docs.yaml
prek run --files .github/workflows/docs.yaml
```

Expected: `check-yaml` and hygiene hooks pass.

- [ ] **Step 5: Commit**

```bash
git commit -m "ci(docs): build and deploy Fumadocs site to GitHub Pages"
```

---

## Post-plan handoff (not a task)

Tell Robin: the workflow's **deploy** job will fail until GitHub Pages "Source"
is set to **GitHub Actions** for the repo — that is his GitHub-repo IaC to
apply (Global Constraints → out-of-band requirement). The **build** job proves
the site compiles in CI regardless. Once Pages is enabled and this branch merges
to `main`, the site goes live at `https://yo61.github.io/flux-homelab/`.

---

## Self-Review (against the spec)

**Spec coverage:**
- Diátaxis skeleton (4 quadrants, canonical labels) → Task 2. ✓
- Publish to GitHub Project Pages, basePath `/flux-homelab` → Task 1 Step 2 + Task 3. ✓
- Keep search + llms.* routes → Task 1 (copied verbatim, verified Task 2 Step 8). ✓
- Drop OG route + getPageImage wiring → Task 1 Steps 3–5 (og not copied; shared/source/page adapted). ✓
- Config adaptations (appName, gitConfig, basePath, siteUrl) → Task 1 Steps 2–3. ✓
- Keep pinned versions + copy lockfile → Task 1 Step 1 (verbatim). ✓
- Publishing pipeline (triggers, concurrency, jobs, SHA-pin + re-verify) → Task 3. ✓
- `.gitignore` for generated dirs → Task 1 Step 1 (go-udap's `docs/site/.gitignore`
  is copied verbatim and covers `node_modules`, `.next`, `.source`, `out`,
  `*.tsbuildinfo`, `next-env.d.ts`; nested .gitignore applies to the subtree, so
  the root `.gitignore` needs no change). ✓
- Pre-commit tolerance of the JS/TS subtree → Task 1 Steps 7 & 10. ✓
- Verification: build clean, browser render, actionlint/zizmor, hooks pass →
  Task 2 Steps 7–8, Task 3 Step 3, Tasks 1/3 hook steps. ✓
- Out-of-band Pages enablement documented, not automated → Global Constraints +
  post-plan handoff. ✓
- Existing root prose untouched → no task modifies `README.md`/`BOOTSTRAP.md`/
  `REBUILD.md`/`SERVICES.md`. ✓

**Placeholder scan:** All code steps contain full file contents or exact commands.
The only intentional `<sha>` placeholders are in Task 3 Step 2, resolved by Task 3
Step 1 — a deliberate "verify current at implementation time" gate, not a plan gap.

**Type consistency:** `source`, `getPageMarkdownUrl`, `getLLMText`,
`docsContentRoute`, `appName`, `gitConfig`, `docsRoute` names match across
`lib/shared.ts` (Task 1 Step 3), `lib/source.ts` (Step 4), `page.tsx` (Step 5),
and the verbatim llms routes. `docsImageRoute`/`getPageImage` are removed
consistently from all three adapted files — no dangling reference.
