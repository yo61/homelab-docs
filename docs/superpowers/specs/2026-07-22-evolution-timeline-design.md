# Design: Cluster evolution timeline (explanation page)

**Date:** 2026-07-22
**Status:** Approved (design)
**Context:** Parked task from the 2026-07-22 handover. The homelab is framed as a
*learning cluster* whose north-star is a zero-manual-intervention bare-metal →
working-k8s bootstrap. The most on-brand doc for that framing is a narrative of
how the cluster actually got there: the problems hit and the choices made. This
reconstructs that story from existing artifacts (git log, ADRs, gotchas,
knowledge) — it is not invention.

## Purpose

Add one explanation-quadrant page, `explanation/evolution`, that tells how the
cluster evolved as a sequence of **thematic arcs**, each framed *problem → choice
→ trade-off*, with a compact dated **timeline strip** at the top for the
chronological read. It is discussion-oriented (why it's built this way), not a
changelog and not a how-to.

## Decisions (from brainstorming)

- **One page, two lenses.** Thematic arcs as the body + a dated timeline strip up
  top. Rejected: pure chronological entries (reads as a changelog the git log
  already is); two pages (a standalone chronological page would restate git/PR
  history and only add the why/pain, which is inherently thematic — split later
  if it grows, YAGNI now).
- **Arcs ordered by when each theme began**, each header carrying a date range —
  that is the "when did I think about this theme" signal. This cluster's themes
  are already near-chronological, so the two lenses reinforce rather than fight.
- **Depth scales with pain.** The bootstrap saga and the Cilium/rebuild arcs get
  real narrative; DNS/secrets/Renovate get a tight paragraph each. Minor threads
  (conventional-commits hook, pod-gc-threshold) fold in as asides, not arcs.
- **Draft-first, Robin annotates.** git gives *what/when*; the *why/pain* often
  lives only in Robin's head. Claude writes a full first pass from artifacts and
  drops visible inline markers wherever the pain/why is uncertain; Robin sweeps
  once to fill/correct/delete. (Chosen over interview-first and hybrid.)
- **Link, don't repeat.** Where an arc is already explained elsewhere
  (`cilium-day0-day2`, `talos-rebuild-gotchas`, the cilium-render ADR), the arc
  summarises and links rather than duplicating.
- **Home:** `homelab-docs` (public). Design history lives in
  `homelab-docs/docs/superpowers/`. No change to flux-homelab.

## Source material (the reconstruction inputs)

- **git log** (flux-homelab, single repo incl. `talos/`) — the chronological
  spine: initial commit `834f9ba` + PRs #1–#48.
- **`decisions/2026-07-20-cilium-render-helm4.md`** — the helm-4 render ADR.
- **`knowledge/cilium/`** + **`knowledge/INDEX.md`** — the day-0/day-2 model.
- **`explanation/talos-rebuild-gotchas.mdx`** (already on the site) — the issues
  hit: PodSecurity apiserver crash, static-IQN, LACP-off-during-reset, node-exporter
  PSS, pending-install HelmRelease.
- **`explanation/cilium-day0-day2.mdx`** — the two-layer Cilium story + the
  2026-07-21 rebuild proof.
- **PR titles** — the milestone labels.

## Page anatomy

### Timeline strip (top)
A short dated list of the ~8 turning points, newest theme last, each line linking
to its arc anchor. Includes the spanning threads shown in true sequence (Cilium
day-0 at bootstrap vs day-2 later; Renovate arriving mid-history). Kept terse —
one line per beat, date + one-clause what.

### Arc template
Each arc is an `##` section with a stable anchor and a date range in/under the
header. Body follows **problem → choice → trade-off**, links out to the relevant
ADR / gotchas / knowledge / existing-explanation page. Bold key terms, house
style (matches `cilium-day0-day2.mdx`).

### Annotation markers
Wherever the pain/why can't be sourced from artifacts, an inline blockquote
callout:

> 🖊️ **Robin:** what actually hurt here? *(placeholder — fill or delete)*

Robin sweeps the rendered page once and resolves every marker. These are the only
intentional "incomplete" spots; they are expected, not defects.

## Arc list (ordered by theme start)

| # | Arc (anchor) | Date range | Sources / links | Depth |
|---|---|---|---|---|
| 1 | The seed (`#seed`) | early Jul | `834f9ba`; `why-gitops` (planned) | short |
| 2 | The bootstrap saga (`#bootstrap`) | Jul 7–14 | #4, #6, #7, #11, #13, #21; `talos-rebuild-gotchas` | deep |
| 3 | Getting traffic in (`#ingress`) | ~Jul 14 | #16, #17, #18, #23 | medium |
| 4 | Declarative DNS (`#dns`) | Jul 15 | #26, #27, #28 | short |
| 5 | Secrets without secrets in git (`#secrets`) | Jul 15 | #25 | short |
| 6 | Automating dependencies (`#renovate`) | ~Jul 18 | #30, #32, #33 | short |
| 7 | Cilium: day-0 → day-2 (`#cilium-day2`) | Jul 20–21 | #37, #38, #39–41, #42, #45; `cilium-day0-day2`, cilium-render ADR | deep |
| 8 | Proving it: the bare-metal rebuild (`#rebuild`) | Jul 21 | #43, #44; + ops-tooling coda #47 | deep |

Content per arc (problem → choice → trade-off):

1. **The seed** — the founding stack chosen up front: Cilium CNI (no
   kube-proxy/flannel) + OpenBao/ESO + Flux/Talos GitOps. Brief; defers the deep
   "why GitOps / why Talos" to the planned `why-gitops` page (link, don't
   pre-empt).
2. **The bootstrap saga** — the hard road to zero-manual bring-up. Beats:
   duplicate PodSecurity exemption block crashing the apiserver (#4); node-exporter
   needing privileged PSS (#6); the **static iSCSI IQN** so persistent storage
   survives node wipes (#7); PXE commissioning over the LACP bond (#11); bootstrapping
   Flux with GitHub-App auth (#13); teardown ordering so `reset` doesn't hang
   (#21, LACP-off-first). Each links to its `talos-rebuild-gotchas` anchor.
3. **Getting traffic in** — exposing services on `*.lab.yo61.net` via Cilium
   Gateway API: Flux-managed GatewayClass (#16), cert-manager Gateway support
   (#17), Gateway CRDs installed at day-0 via `extraManifests` (#18), HTTPRoutes
   live (#23).
4. **Declarative DNS** — external-dns + UniFi webhook so DNS records follow the
   HTTPRoutes (#26); the no-`v`-prefix image-tag gotcha (#27); explicit TLS verify
   (#28).
5. **Secrets without secrets in git** — Grafana admin creds sourced from OpenBao
   via ESO (#25); the ESO/random-password + `admin`-user gotcha; ties back to the
   seed's OpenBao/ESO choice.
6. **Automating dependencies** — Renovate on a dedicated `yo61-renovate` GitHub
   App (#30), App client-id over deprecated app-id (#32), token vuln-alert read
   (#33); why an App over a PAT.
7. **Cilium: day-0 → day-2** — the split that lets a CNI be GitOps-managed:
   re-render the inline floor + the **helm-4 render ADR** (#37/#38), Flux-managed
   day-2 HelmRelease adopting the inline resources (#39–41), floor/target
   convergence testing (#42, #45). Summarises, links to `cilium-day0-day2`.
8. **Proving it: the bare-metal rebuild** — the north-star validation: a full
   wipe→rebuild that came up with zero manual steps and let Flux converge Cilium
   1.19.5→1.19.6 (#43, #44). Coda: the ops tooling that fell out of it — Taskfile
   + `iscsi-reclaim` (#47).

### Nav (meta.json)
Append `evolution` to `explanation/meta.json` `pages` (after `why-gitops`, or
positioned to read well — likely first or last in the list; decide at authoring).

## Conventions (from homelab-docs CLAUDE.md)

- MDX frontmatter `title` + `description`; Fumadocs UI components available;
  content only under `content/docs/`.
- `meta.json` `{title, pages}` for nav ordering.
- Conventional Commits; prek hooks; pinned deps; never rewrite `pnpm-lock.yaml`.
- Docs prose is CC-BY-4.0.
- Dates/versions cross-checked against artifacts at authoring time.

## Verification (before "done")

1. `pnpm install --frozen-lockfile` clean; `pnpm build` zero errors/warnings;
   `pnpm types:check` clean.
2. `pnpm dev` in a browser: `explanation/evolution` renders, nav shows it in the
   explanation quadrant, the timeline strip's anchor links all resolve to their
   arcs, and every out-link (ADR, gotchas, cilium-day0-day2, why-gitops) resolves.
3. `prek run --all-files` clean.
4. Fidelity: every arc's cited PR/commit is real (checked against git log); no
   arc claims a fact not in the artifacts (pain/why gaps are marked, not invented).
5. Every 🖊️ marker is intentional and visible for Robin's annotation pass.

## Done criteria

`explanation/evolution` is live on the site as a thematic problem→choice→trade-off
narrative with a working dated timeline strip; the site builds and browses; all
links resolve; annotation markers are in place for Robin's fill pass. flux-homelab
is untouched.

## Out of scope

- Writing the `why-gitops` placeholder (link to it; author under its own spec).
- Any flux-homelab change; any cluster-config change.
- Robin's annotation pass itself (post-draft; the markers enable it).
- Extending the timeline strip into a second standalone chronological page.
