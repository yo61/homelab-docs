# Cluster Evolution Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one explanation-quadrant page, `explanation/evolution`, that tells how the cluster evolved as thematic problem→choice→trade-off arcs, fronted by a dated timeline strip.

**Architecture:** A single MDX page under `content/docs/explanation/`, registered in that quadrant's `meta.json`. Body = ~8 `##` arc sections (stable anchors, date ranges), fronted by a compact linked timeline strip. Prose is reconstructed from existing artifacts (git log, ADRs, the already-migrated gotchas/cilium explanation pages). Where the *why/pain* isn't in an artifact, an inline `🖊️ Robin:` marker is planted for a later annotation pass — not invented.

**Tech Stack:** Fumadocs (Next.js, `output: export`), MDX, pnpm, prek.

## Global Constraints

- Content lives only under `content/docs/`. Page: `content/docs/explanation/evolution.mdx`.
- MDX frontmatter requires `title` + `description`.
- Nav ordering via `content/docs/explanation/meta.json` `{title, pages}`.
- Conventional Commits; prek hooks must pass; never rewrite `pnpm-lock.yaml`; pinned deps.
- Docs prose is CC-BY-4.0. House style matches `content/docs/explanation/cilium-day0-day2.mdx` (bold key terms, prose over bullets, dated proof points).
- **Reconstruction, not invention:** every cited PR/commit must be real (verify against `git -C ../flux-homelab log`). Unknown why/pain is *marked*, never guessed.
- Annotation-marker format (verbatim):
  `> 🖊️ **Robin:** <question> *(placeholder — fill or delete)*`
- Source repo for facts: the sibling checkout `../flux-homelab` (single repo, includes `talos/`).

## Arc → source map (authoritative; from the design spec)

| Anchor | Arc | Dates | PRs / commit | Depth | Links out |
|---|---|---|---|---|---|
| `#seed` | The seed | early Jul | `834f9ba` | short | `why-gitops` (planned) |
| `#bootstrap` | The bootstrap saga | Jul 7–14 | #4, #6, #7, #11, #13, #21 | deep | `talos-rebuild-gotchas` anchors |
| `#ingress` | Getting traffic in | ~Jul 14 | #16, #17, #18, #23 | medium | — |
| `#dns` | Declarative DNS | Jul 15 | #26, #27, #28 | short | — |
| `#secrets` | Secrets without secrets in git | Jul 15 | #25 | short | — |
| `#renovate` | Automating dependencies | ~Jul 18 | #30, #32, #33 | short | — |
| `#cilium-day2` | Cilium: day-0 → day-2 | Jul 20–21 | #37, #38, #39–41, #42, #45 | deep | `cilium-day0-day2`, cilium-render ADR |
| `#rebuild` | Proving it: the bare-metal rebuild | Jul 21 | #43, #44 (+ #47 coda) | deep | `cilium-day0-day2` |

Full commit subjects are in `git -C ../flux-homelab log --oneline`. The ADR text is `../flux-homelab/decisions/2026-07-20-cilium-render-helm4.md`. The gotchas already written (source of truth for the pain details) are `content/docs/explanation/talos-rebuild-gotchas.mdx`.

---

### Task 1: Page scaffold + nav registration + timeline strip

Produces the page skeleton: frontmatter, intro, the full timeline strip (linked to arc anchors), and all 8 empty arc headers with date ranges. This is independently reviewable — a reviewer can accept the structure/nav/anchors before any prose exists.

**Files:**
- Create: `content/docs/explanation/evolution.mdx`
- Modify: `content/docs/explanation/meta.json`

**Interfaces:**
- Produces: the 8 arc anchors (`#seed`, `#bootstrap`, `#ingress`, `#dns`, `#secrets`, `#renovate`, `#cilium-day2`, `#rebuild`) that Tasks 2–3 fill and the timeline strip links to. MDX auto-generates heading anchors by slugifying the heading text — so heading text must slugify to these anchors (e.g. `## The bootstrap saga` → `#the-bootstrap-saga`). To pin short stable anchors, set them explicitly with `[#anchor]` heading syntax (Fumadocs supports `## The bootstrap saga [#bootstrap]`). Use that syntax so the anchors above are exact.

- [ ] **Step 1: Create the page with frontmatter, intro, timeline strip, and empty arc headers**

Create `content/docs/explanation/evolution.mdx`:

```mdx
---
title: How this cluster evolved
description: The problems hit and the choices made, as the homelab grew from bare metal to a self-converging GitOps cluster
---

This is a *learning cluster*. Its north-star is a zero-manual-intervention path
from bare metal to a working Kubernetes cluster — and the interesting part is not
where it landed but how it got there. What follows is the story as a set of
themes, each framed as the **problem** that forced a change, the **choice** made,
and the **trade-off** accepted.

Read the timeline for the sequence; read the arcs for the reasoning.

## Timeline at a glance

- **early Jul** — [the founding stack is chosen](#seed): Cilium, OpenBao/ESO, Flux on Talos
- **Jul 7–14** — [the bootstrap saga](#bootstrap): getting bare metal to a healthy cluster with no manual steps
- **~Jul 14** — [getting traffic in](#ingress): services on `*.lab.yo61.net` via Cilium Gateway API
- **Jul 15** — [declarative DNS](#dns) and [secrets without secrets in git](#secrets)
- **~Jul 18** — [automating dependencies](#renovate): Renovate on a dedicated GitHub App
- **Jul 20–21** — [Cilium goes day-0 → day-2](#cilium-day2): a CNI that Flux can upgrade
- **Jul 21** — [proving it](#rebuild): a full bare-metal rebuild with zero manual steps

## The seed [#seed]

## The bootstrap saga [#bootstrap]

## Getting traffic in [#ingress]

## Declarative DNS [#dns]

## Secrets without secrets in git [#secrets]

## Automating dependencies [#renovate]

## Cilium: day-0 → day-2 [#cilium-day2]

## Proving it: the bare-metal rebuild [#rebuild]
```

- [ ] **Step 2: Register the page in nav**

Modify `content/docs/explanation/meta.json` — append `"evolution"` to `pages` (last, so it reads after the topic pages):

```json
{
  "title": "Explanation",
  "pages": [
    "index",
    "cilium-day0-day2",
    "talos-rebuild-gotchas",
    "why-gitops",
    "evolution"
  ]
}
```

- [ ] **Step 3: Build and verify the page compiles and registers**

Run: `pnpm build`
Expected: build completes with zero errors/warnings; output includes a route for `/explanation/evolution`.

- [ ] **Step 4: Verify anchors resolve in the browser**

Run: `pnpm dev` then open `http://localhost:3000/homelab-docs/explanation/evolution/`
Expected: page renders; nav shows "How this cluster evolved" under Explanation; clicking each timeline-strip link jumps to the matching (empty) arc header. Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add content/docs/explanation/evolution.mdx content/docs/explanation/meta.json
git commit -m "docs(explanation): scaffold evolution timeline page + nav"
```

---

### Task 2: Write the deep arcs (bootstrap, Cilium day-2, rebuild)

The three high-depth arcs where the real reconstruction risk lives. Independently reviewable: a reviewer can reject the pain narrative here while accepting the scaffold and the short arcs.

**Files:**
- Modify: `content/docs/explanation/evolution.mdx` (fill `#bootstrap`, `#cilium-day2`, `#rebuild`)

**Interfaces:**
- Consumes: the arc headers from Task 1.
- Produces: filled deep arcs, each ending in a **trade-off** sentence and linking to the relevant existing explanation page/anchor.

- [ ] **Step 1: Read the source artifacts for these arcs**

Read, in the sibling repo and this repo:
- `git -C ../flux-homelab log --oneline` (confirm #4, #6, #7, #11, #13, #21, #37–#45, #43, #44, #47 subjects)
- `content/docs/explanation/talos-rebuild-gotchas.mdx` (the pain details + its anchor names, for `#bootstrap` links)
- `content/docs/explanation/cilium-day0-day2.mdx` (the two-layer model + the 2026-07-21 rebuild proof, for `#cilium-day2` and `#rebuild`)
- `../flux-homelab/decisions/2026-07-20-cilium-render-helm4.md` (the helm-4 ADR, for `#cilium-day2`)

- [ ] **Step 2: Fill `## The bootstrap saga [#bootstrap]`**

Write prose (problem→choice→trade-off) covering, each linking to its `talos-rebuild-gotchas` anchor where one exists:
- duplicate PodSecurity exemption block crash-looping the apiserver (#4 `fix(talos): drop duplicate PodSecurity block that crashed apiserver`)
- node-exporter needing privileged PodSecurity (#6)
- the **static iSCSI initiator IQN** so persistent storage survives node wipes (#7 `fix(talos): pin static iSCSI initiator IQN to survive node wipes`)
- PXE commissioning over the LACP bond (#11)
- bootstrapping Flux with GitHub-App auth (#13)
- teardown ordering — LACP off first so `reset` doesn't hang (#21)

Open the arc with the *problem* (bare metal → healthy cluster, no hands) and plant an annotation marker for the pain that git can't show:

```mdx
> 🖊️ **Robin:** which of these actually cost you the most time — the apiserver crash-loop, or the static-IQN discovery? *(placeholder — fill or delete)*
```

- [ ] **Step 3: Fill `## Cilium: day-0 → day-2 [#cilium-day2]`**

Write prose covering: the re-render of the inline floor and the **helm-4 render decision** (#37/#38 — link the ADR reasoning), the Flux-managed day-2 HelmRelease adopting the inline resources (#39–41), and floor/target convergence testing (#42 lowered the floor to 1.19.5, #45 restored it to 1.19.6). Summarise — do **not** duplicate `cilium-day0-day2.mdx`; link to it as the full treatment. Trade-off: two independently-pinned versions to keep straight.

- [ ] **Step 4: Fill `## Proving it: the bare-metal rebuild [#rebuild]`**

Write prose: the full wipe→rebuild that validated the north-star — zero manual steps to a healthy cluster, and Flux converging Cilium 1.19.5→1.19.6 live (#43 `docs(rebuild): verify Cilium day-0 to day-2 convergence`, #44). Close with the ops-tooling coda that fell out of the rebuild: the Taskfile + `iscsi-reclaim` script (#47). Link `#rebuild` back to `cilium-day0-day2` for the convergence detail.

- [ ] **Step 5: Build and verify**

Run: `pnpm build`
Expected: zero errors/warnings. Then `pnpm dev` and confirm the three arcs render and every out-link (to `/explanation/talos-rebuild-gotchas`, `/explanation/cilium-day0-day2`) resolves (no 404).

- [ ] **Step 6: Commit**

```bash
git add content/docs/explanation/evolution.mdx
git commit -m "docs(explanation): write bootstrap, cilium day-2, and rebuild arcs"
```

---

### Task 3: Write the short/medium arcs (seed, ingress, DNS, secrets, Renovate)

The remaining five arcs, each a tight paragraph. Independently reviewable against Task 2.

**Files:**
- Modify: `content/docs/explanation/evolution.mdx` (fill `#seed`, `#ingress`, `#dns`, `#secrets`, `#renovate`)

**Interfaces:**
- Consumes: the arc headers from Task 1; the house tone set in Task 2.
- Produces: the five filled arcs. `#seed` links to `why-gitops`; `#ingress` covers the Gateway API chain.

- [ ] **Step 1: Fill `## The seed [#seed]`**

Short: the founding stack chosen up front (initial commit `834f9ba` — Cilium CNI with kube-proxy/flannel disabled, OpenBao + External Secrets Operator, Flux on Talos). Keep the deep "why GitOps / why Talos" for the planned page — link it: `see [why GitOps](/explanation/why-gitops)`. Plant the origin-story marker Robin asked for:

```mdx
> 🖊️ **Robin:** why did you start this project, and why these foundations? *(placeholder — your views go here)*
```

- [ ] **Step 2: Fill `## Getting traffic in [#ingress]`**

Medium: exposing services on `*.lab.yo61.net` through Cilium's Gateway API — Flux-managed GatewayClass (#16), cert-manager Gateway support (#17), Gateway API CRDs installed at **day-0** via `extraManifests` because they must exist before the GatewayClass reconciles (#18), and HTTPRoutes going live (#23). Trade-off: CRDs pinned in two places (day-0 + day-2).

- [ ] **Step 3: Fill `## Declarative DNS [#dns]`**

Short: external-dns + the UniFi webhook so DNS records follow the HTTPRoutes automatically (#26); the gotcha that cost a round-trip — the webhook image tag has **no `v` prefix** (#27) — and enabling TLS verification explicitly (#28).

- [ ] **Step 4: Fill `## Secrets without secrets in git [#secrets]`**

Short: Grafana admin credentials sourced from OpenBao via ESO rather than committed or left as the chart default (#25). Note the gotcha (the login is the OpenBao value, not `prom-operator`; random-password + persistence caveat). Ties back to the seed's OpenBao/ESO choice.

- [ ] **Step 5: Fill `## Automating dependencies [#renovate]`**

Short: Renovate for dependency PRs, running as a dedicated `yo61-renovate` GitHub App (#30) — App **client-id** over the deprecated app-id (#32), token granted vulnerability-alert read (#33). Trade-off / why an App over a PAT: scoped, rotable, not tied to a person.

- [ ] **Step 6: Build and verify**

Run: `pnpm build`
Expected: zero errors/warnings. `pnpm dev`: all five arcs render; the `#seed` link to `/explanation/why-gitops` resolves.

- [ ] **Step 7: Commit**

```bash
git add content/docs/explanation/evolution.mdx
git commit -m "docs(explanation): write seed, ingress, dns, secrets, renovate arcs"
```

---

### Task 4: Final verification gate

Audits the whole page: link/anchor integrity, marker inventory, fact fidelity, lint. Deliverable is a verified, mergeable page.

**Files:**
- Modify: `content/docs/explanation/evolution.mdx` (only if the audit finds issues)

- [ ] **Step 1: Fidelity check against git**

Run: `git -C ../flux-homelab log --oneline | grep -E '#(4|6|7|11|13|16|17|18|21|23|25|26|27|28|30|32|33|37|38|39|41|42|43|44|45|47)\)'`
Expected: every PR number cited in the page appears with the subject the prose describes. Fix any mis-citation.

- [ ] **Step 2: Link + anchor audit**

Run: `pnpm build`
Expected: zero errors/warnings. Then in `pnpm dev`, click every timeline-strip link (8 anchors) and every out-link (`talos-rebuild-gotchas`, `cilium-day0-day2`, `why-gitops`) — all resolve, no 404, no dead anchor.

- [ ] **Step 3: Annotation-marker inventory**

Run: `rg '🖊️ \*\*Robin:\*\*' content/docs/explanation/evolution.mdx`
Expected: at least the two planted markers (`#bootstrap`, `#seed`); each is a visible blockquote in the rendered page. Confirm none were left mid-sentence or malformed.

- [ ] **Step 4: Lint**

Run: `prek run --all-files`
Expected: all hooks Pass/Skip. Fix anything flagged.

- [ ] **Step 5: Types check**

Run: `pnpm types:check`
Expected: clean (`tsc --noEmit` no errors).

- [ ] **Step 6: Commit any audit fixes**

```bash
git add content/docs/explanation/evolution.mdx
git commit -m "docs(explanation): fix links and citations from evolution audit"
```

(Skip the commit if the audit found nothing to fix.)

---

## Self-Review

**Spec coverage:**
- One page `explanation/evolution` + nav — Task 1. ✓
- Timeline strip linking to arcs — Task 1. ✓
- All 8 arcs problem→choice→trade-off — Tasks 2 (deep) + 3 (short/medium). ✓
- Depth scales with pain — deep arcs isolated in Task 2, short in Task 3. ✓
- Draft-first + annotation markers (incl. the project-origin one Robin requested) — Steps 2.2 and 3.1; inventoried in 4.3. ✓
- Link, don't repeat (cilium/gotchas/ADR/why-gitops) — Tasks 2 & 3, audited in 4.2. ✓
- Reconstruction not invention (real PRs, marked gaps) — fidelity check 4.1. ✓
- Verification: build/types/prek/browser/links — Task 4. ✓
- flux-homelab untouched — no task modifies it (read-only `git -C ../flux-homelab`). ✓

**Placeholder scan:** the only "placeholders" are the intentional 🖊️ output markers (a spec feature, inventoried in 4.3). No plan-level TBDs. ✓

**Type consistency:** anchor names (`#seed`, `#bootstrap`, `#ingress`, `#dns`, `#secrets`, `#renovate`, `#cilium-day2`, `#rebuild`) are identical across the timeline strip (Task 1), the headers (Task 1), and the fill tasks (2, 3). meta.json key `"evolution"` matches the filename `evolution.mdx`. ✓
