# Migrate REBUILD.md into the Diátaxis site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `flux-homelab/REBUILD.md` into a clean how-to plus its reference and explanation pages on the `homelab-docs` Fumadocs site, then remove REBUILD.md from the private repo and leave a pointer.

**Architecture:** Four new MDX pages under `content/docs/` (one how-to, one reference, two explanation), wired into their folders' `meta.json`. The how-to is a lean command spine that deep-links the explanation/reference pages instead of embedding their prose. Reference + explanation land first so the how-to's links resolve.

**Tech Stack:** Fumadocs (Next.js static export), MDX, pnpm, prek.

## Global Constraints

- Two repos: content is authored in `~/code/github.com/yo61/homelab-docs` (public); the SOURCE prose is `~/code/github.com/yo61/flux-homelab/REBUILD.md` (private, read-only for this work) and `flux-homelab/knowledge/cilium/knowledge.md`.
- Content only under `content/docs/`; nav via `meta.json` `{title, pages}`. `source.config.ts` sources only `content/docs`.
- MDX frontmatter is `title` + `description` (see each task for verbatim values).
- Conventional Commits; `prek run --all-files` must pass; pinned deps — **never** let a hook rewrite `pnpm-lock.yaml`.
- Every command and fact from REBUILD.md must land on exactly one page — nothing dropped in the split.
- Publish topology as-is (IPs, IQNs, addresses) — no redaction.
- flux-homelab changes (Task 6) are a SEPARATE repo/PR; do not touch flux-homelab cluster config.
- Verification commands run in `homelab-docs`: `pnpm install --frozen-lockfile`, `pnpm build` (→ `out/`), `pnpm types:check`, `prek run --all-files`.

---

### Task 1: Reference page — Environment

**Files:**
- Create: `content/docs/reference/environment.mdx`
- Modify: `content/docs/reference/meta.json`

**Interfaces:**
- Produces: page at route `/reference/environment` with a stable route the how-to and explanation pages link to for topology/version/file lookups.

**Source:** REBUILD.md sections *"Environment (facts you'll need)"* and *"Key files"* (the bullet list + the file table).

- [ ] **Step 1: Create the MDX page**

Frontmatter:
```mdx
---
title: Environment
description: Nodes, addresses, versions, install media, and key files for the cluster
---
```
Body: reproduce the *Environment* facts as a bulleted list / small tables (Nodes + IPs + VIP; Talos/k8s versions + HA layout; install disk + installer schematic hash; TrueNAS/OpenBao; Cilium floor+target; Switch/LAG port map), then the *Key files* table verbatim. Keep values exact (Talos v1.13.6, k8s v1.36.2, schematic `3a33ec6…`, VIP `192.168.20.9`, nodes `.11/.12/.13`, IQN `iqn.2026-07.net.yo61.lab:k8s-0N`).

- [ ] **Step 2: Add to nav**

Set `content/docs/reference/meta.json` to:
```json
{
  "title": "Reference",
  "pages": [
    "index",
    "environment",
    "components"
  ]
}
```

- [ ] **Step 3: Build + types + hooks**

Run (in `homelab-docs`):
```bash
pnpm build && pnpm types:check && prek run --all-files
```
Expected: build writes `out/` with zero errors/warnings; types clean; hooks pass.

- [ ] **Step 4: Commit**

```bash
git add content/docs/reference/environment.mdx content/docs/reference/meta.json
git commit -m "docs(reference): add cluster environment page"
```

### Task 2: Explanation page — Cilium day-0 / day-2

**Files:**
- Create: `content/docs/explanation/cilium-day0-day2.mdx`
- Modify: `content/docs/explanation/meta.json`

**Interfaces:**
- Produces: route `/explanation/cilium-day0-day2`, linked from the how-to's Cilium convergence checkpoint and from `talos-rebuild-gotchas`.

**Source:** flux-homelab `knowledge/cilium/knowledge.md` + REBUILD.md's *"Cilium day-0 → day-2 adoption"* checkpoint.

- [ ] **Step 1: Create the MDX page**

Frontmatter:
```mdx
---
title: 'Cilium: day-0 floor, day-2 Flux'
description: Why Cilium boots from a Talos inline manifest and is upgraded by a Flux HelmRelease
---
```
Body: the two-layer model — why day-0 must be an inline manifest (no CNI → no network → Flux can't install it); the frozen bootstrap floor; the Flux HelmRelease adopting inline-created resources via helm-controller default take-ownership; floor==target normally (no-op adoption) vs floor<target convergence (roll to target); that version bumps are Renovate PRs, not re-renders. Use stable headings; no repo-relative file paths that only make sense inside flux-homelab (describe them, link to the repo).

- [ ] **Step 2: Add to nav**

Set `content/docs/explanation/meta.json` to:
```json
{
  "title": "Explanation",
  "pages": [
    "index",
    "cilium-day0-day2",
    "talos-rebuild-gotchas",
    "why-gitops"
  ]
}
```
(`talos-rebuild-gotchas` is created in Task 3; listing it now is fine — Fumadocs tolerates a not-yet-present page in `meta.json` during the build of Task 2 only if the file exists. To avoid a build miss, run Task 2's build check AFTER Task 3, or create an empty stub first. Simplest: create the stub file in Step 1 of Task 3 before building. If Task 2 build fails on the missing page, create `talos-rebuild-gotchas.mdx` with frontmatter-only first.)

- [ ] **Step 3: Build + types + hooks**

```bash
pnpm build && pnpm types:check && prek run --all-files
```
Expected: clean (see the meta.json note above if it complains about a missing page).

- [ ] **Step 4: Commit**

```bash
git add content/docs/explanation/cilium-day0-day2.mdx content/docs/explanation/meta.json
git commit -m "docs(explanation): add Cilium day-0/day-2 model"
```

### Task 3: Explanation page — Talos rebuild gotchas

**Files:**
- Create: `content/docs/explanation/talos-rebuild-gotchas.mdx`

**Interfaces:**
- Produces: route `/explanation/talos-rebuild-gotchas` with one section per gotcha, each under a heading whose auto-slug the how-to deep-links. Confirm the built slugs and use them in Task 4.

**Source:** REBUILD.md's inline troubleshooting blockquotes and Phase-note reasoning: the LACP-bond ordering (Phase 1), the duplicate-PodSecurity `kube-system` apiserver crashloop (Phase 2 troubleshooting), the static iSCSI IQN requirement (Phase 4), the `pending-install` HelmRelease behaviour (Phase 4), and node-exporter baseline PSS (Phase 4).

- [ ] **Step 1: Create the MDX page**

Frontmatter:
```mdx
---
title: Talos rebuild gotchas
description: Non-obvious failure modes hit during a rebuild, and the declarative fixes
---
```
Body: one `##` section per gotcha, each with **Symptom / Why / Fix (already in the repo)**. Use short heading text so the auto-generated slugs are clean and stable — target slugs: `lacp`, `podsecurity`, `iscsi-iqn`, `pending-install`, `node-exporter-pss`. Achieve these by heading text that slugifies to them (e.g. `## LACP` → `#lacp`, `## PodSecurity` → `#podsecurity`, `## iSCSI IQN` → `#iscsi-iqn`, `## pending-install` → `#pending-install`, `## node-exporter PSS` → `#node-exporter-pss`).

- [ ] **Step 2: Build and confirm the anchor slugs**

```bash
pnpm build
grep -oE 'id="(lacp|podsecurity|iscsi-iqn|pending-install|node-exporter-pss)"' out/explanation/talos-rebuild-gotchas/index.html | sort -u
```
Expected: all five ids present in the built HTML. Record them for Task 4's links. (If a slug differs, adjust the heading text and rebuild until the five target slugs exist.)

- [ ] **Step 3: types + hooks**

```bash
pnpm types:check && prek run --all-files
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add content/docs/explanation/talos-rebuild-gotchas.mdx
git commit -m "docs(explanation): add Talos rebuild gotchas"
```

### Task 4: How-to — Rebuild the cluster

**Files:**
- Create: `content/docs/how-to/rebuild-the-cluster.mdx`
- Modify: `content/docs/how-to/meta.json`

**Interfaces:**
- Consumes: routes `/reference/environment`, `/explanation/cilium-day0-day2`, and the five `talos-rebuild-gotchas` anchors from Task 3.
- Produces: route `/how-to/rebuild-the-cluster` — the lean rebuild spine.

**Source:** REBUILD.md Phases 0–4 (the command steps only) + the destructive-step warnings.

- [ ] **Step 1: Create the MDX page**

Frontmatter:
```mdx
---
title: Rebuild the cluster
description: Wipe all three nodes and rebuild the cluster from checked-in config
---
```
Body structure:
- Intro (one line) + a link to `/explanation/cilium-day0-day2` for the "why day-0 works" and to `/reference/environment` for the facts.
- **Prerequisites** block (talsecret restored, OpenBao unsealed, Flux App creds, tooling) — the Phase 0 preflight, as a checklist with its commands.
- **Phases 0–4** as numbered command steps. Keep the commands (including the fixed `talosctl -n <ip> version --insecure`, the explicit 2a "print then run" apply template, LAG toggles, bootstrap, kubeconfig, health, CSR approve, Flux bootstrap defer to BOOTSTRAP on the site later). Replace embedded "why" paragraphs with one-line links, e.g. *"drop the bonds first — [why](/explanation/talos-rebuild-gotchas#lacp)"*.
- **Cilium convergence checkpoint** (Phase 3) linking to `/explanation/cilium-day0-day2`.
- **Troubleshooting** section: symptom → one-line fix/command for each of the five gotchas, each linking to its anchor (`/explanation/talos-rebuild-gotchas#podsecurity`, `#iscsi-iqn`, `#pending-install`, `#node-exporter-pss`, `#lacp`).
- Keep the destructive-step **warnings** (Phase 1 wipe, zvol deletion) prominent (a Fumadocs `<Callout type="warn">` or bold block).

- [ ] **Step 2: Add to nav**

Set `content/docs/how-to/meta.json` to:
```json
{
  "title": "How-to",
  "pages": [
    "index",
    "rebuild-the-cluster",
    "add-a-new-service"
  ]
}
```

- [ ] **Step 3: Build + types + hooks**

```bash
pnpm build && pnpm types:check && prek run --all-files
```
Expected: clean.

- [ ] **Step 4: Verify every intra-doc link resolves**

```bash
# collect hrefs on the how-to page and confirm each target exists in out/
grep -oE 'href="/(reference|explanation)[^"]*"' out/how-to/rebuild-the-cluster/index.html | sort -u
```
For each `#anchor` target, confirm the id exists in the target page's `out/**/index.html` (reuse the Task 3 grep). Expected: no link points at a missing page or missing anchor.

- [ ] **Step 5: Commit**

```bash
git add content/docs/how-to/rebuild-the-cluster.mdx content/docs/how-to/meta.json
git commit -m "docs(how-to): add rebuild-the-cluster guide"
```

### Task 5: Content-fidelity check

**Files:** none (audit); fixes fold back into Tasks 1–4 pages if gaps found.

- [ ] **Step 1: Diff coverage against the source**

Read `flux-homelab/REBUILD.md` top to bottom. For each command block and each factual claim, confirm it appears on exactly one of the four new pages (how-to = steps; reference = facts; explanation = why/gotchas). List anything missing or duplicated.

- [ ] **Step 2: Fix gaps**

Add any dropped command/fact to the correct page; remove any accidental duplication. Rebuild:
```bash
pnpm build && pnpm types:check
```
Expected: clean, and the coverage list is empty.

- [ ] **Step 3: Browser pass**

```bash
pnpm dev   # http://localhost:3000/homelab-docs
```
In a browser: the four pages render, appear in the right nav quadrants, and every how-to link (including the troubleshooting deep-links) navigates correctly. Console clean.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "docs: close content-fidelity gaps from the REBUILD split"
```

Then push and open the homelab-docs PR:
```bash
git push -u origin docs/migrate-rebuild-diataxis
gh pr create --base main --title "docs: migrate REBUILD.md into the Diátaxis site" --body "Implements docs/superpowers/specs/2026-07-21-migrate-rebuild-diataxis-design.md"
```

### Task 6: flux-homelab — remove REBUILD.md, add pointer (separate repo/PR)

**Files (in `~/code/github.com/yo61/flux-homelab`):**
- Delete: `REBUILD.md`
- Modify: `README.md`

**Do this only after the homelab-docs PR (Task 5) is merged and the site shows the guide** — so the pointer target is live before the source is removed.

- [ ] **Step 1: Branch**

```bash
cd ~/code/github.com/yo61/flux-homelab && git checkout main && git pull --ff-only
git checkout -b docs/rebuild-move-to-site
```

- [ ] **Step 2: Remove REBUILD.md and add the pointer**

`git rm REBUILD.md`. Add to `README.md` (near the top, under the intro) a line:
```markdown
> **Rebuild / operate the cluster:** see the how-to guides at <https://yo61.github.io/homelab-docs/> (the rebuild runbook now lives there). Run commands from a checkout of this repo.
```

- [ ] **Step 3: Verify + commit + PR**

```bash
prek run --all-files
git add -A && git commit -m "docs: move rebuild runbook to homelab-docs, leave a pointer"
git push -u origin docs/rebuild-move-to-site
gh pr create --base main --title "docs: move rebuild runbook to homelab-docs" --body "REBUILD.md content now lives at https://yo61.github.io/homelab-docs/ (see homelab-docs PR). Removes the file from the private repo per the code+config-only decision; README points to the site."
```
Expected: prek clean; no cluster config touched (only REBUILD.md removed + README edited).

---

## Self-review notes

- Spec coverage: four-page mapping (Tasks 1–4), troubleshooting split (Task 4 how-to section + Task 3 anchors), content fidelity (Task 5), flux-homelab removal + pointer (Task 6), conventions/verification (Global Constraints + per-task build/types/prek). All spec sections mapped.
- Ordering: reference + both explanation pages precede the how-to so its links/anchors resolve; flux-homelab removal is last and gated on the site PR merging.
- Anchor slugs are pinned to `lacp/podsecurity/iscsi-iqn/pending-install/node-exporter-pss` and verified against built HTML (Task 3 Step 2) before the how-to links them (Task 4).
- No placeholders: prose is a reorganization of named REBUILD.md/knowledge sections (source read at author time); frontmatter and meta.json are given verbatim.
