# Design: Migrate REBUILD.md into the Diátaxis site (pilot)

**Date:** 2026-07-21
**Status:** Approved (design)
**Context:** First slice of the "migrate flux-homelab root prose into the
Diátaxis structure" effort that `2026-07-15-move-docs-to-homelab-docs-design.md`
deferred as out of scope.

## Purpose

`flux-homelab/REBUILD.md` is a single file wearing all four Diátaxis hats — a
how-to spine (the wipe/rebuild steps) obscured by embedded reference (topology
facts) and explanation (the "why" and troubleshooting). Split it into the
appropriate pages on the public `homelab-docs` site so the steps read cleanly and
the reference/explanation are preserved but out of the step flow. This pilot also
establishes the pattern for migrating the remaining root prose (BOOTSTRAP.md,
SERVICES.md, knowledge/, decisions/) in later slices.

## Decisions (from brainstorming)

- **Publish everything, topology included.** `homelab-docs` is public;
  `flux-homelab` is private. Internal specifics (node IPs, VIP, iSCSI IQNs,
  TrueNAS/OpenBao addresses, installer schematic) are RFC1918 / non-credential and
  Robin is comfortable publishing them. No redaction.
- **Scope: REBUILD.md only** (the pilot). Other docs follow later, each its own
  slice, reusing this structure.
- **Four-page mapping** (below).
- **Troubleshooting split:** the *fix* stays in the how-to (a terse
  Troubleshooting section, symptom → command); the *why* moves to the explanation
  gotchas page, linked.
- **flux-homelab keeps code + config only:** remove `REBUILD.md`; add a pointer
  in `flux-homelab/README.md` to the docs site.
- **Design history lives in `homelab-docs/docs/superpowers/`**, not flux-homelab.

## Page mapping

| REBUILD.md content | → page | Mode |
|---|---|---|
| Phases 0–4 command sequence (+ prerequisites) | `content/docs/how-to/rebuild-the-cluster.mdx` | How-to |
| *Environment* (nodes, IPs, VIP, Talos/k8s versions, install disk, schematic, TrueNAS/OpenBao, LAG port map) + *Key files* table | `content/docs/reference/environment.mdx` | Reference |
| Cilium two-layer model (day-0 inline floor + Flux day-2 HelmRelease, take-ownership adoption, floor↔target convergence) | `content/docs/explanation/cilium-day0-day2.mdx` | Explanation |
| Rebuild gotchas — LACP-off-during-reset ordering, PodSecurity duplicate-exemption apiserver crashloop, static iSCSI IQN requirement, `pending-install` HelmRelease behaviour, node-exporter PSS | `content/docs/explanation/talos-rebuild-gotchas.mdx` | Explanation |

## Content handling

### how-to/rebuild-the-cluster.mdx
- Lean, scannable spine: a **Prerequisites** block (talsecret restored, OpenBao
  unsealed, Flux App creds, tooling), then **Phases 0–4** as numbered command
  steps with only point-of-act notes.
- Where a step currently embeds paragraphs of "why," replace with a one-line link
  to the relevant explanation section (e.g. *"bonds must be off first →
  [gotchas](/explanation/talos-rebuild-gotchas#lacp)"*). Reference lookups
  (schematic hash, IQN format) link to `/reference/environment`.
- A terse **Troubleshooting** section near the end: each entry *symptom →
  one-line fix/command*, linking to the gotchas page for the reasoning.
- Preserve the destructive-step call-outs (Phase 1 wipe, zvol deletion) as
  prominent warnings — the "human go-ahead" rule is operational, not decorative.

### reference/environment.mdx
- The *Environment* facts and *Key files* table, near-verbatim, as lookup tables.
- Version facts (Talos v1.13.6, k8s v1.36.2, Cilium floor/target) cross-checked
  against the live config at authoring time.

### explanation/cilium-day0-day2.mdx
- The two-layer model: why day-0 is an inline manifest, how the Flux HelmRelease
  adopts it (helm-controller default take-ownership), floor==target normally /
  convergence when they differ. Draws on flux-homelab `knowledge/cilium/`.

### explanation/talos-rebuild-gotchas.mdx
- One section per gotcha with a stable anchor (e.g. `#lacp`, `#podsecurity`,
  `#iscsi-iqn`, `#pending-install`) so the how-to can deep-link. Each: symptom,
  why it happens, the declarative fix already in the repo.

### Nav (meta.json)
- Add `rebuild-the-cluster` to `how-to/meta.json`, `environment` to
  `reference/meta.json`, and `cilium-day0-day2` + `talos-rebuild-gotchas` to
  `explanation/meta.json`. Existing placeholders stay.

## flux-homelab side (separate, private repo)

- Remove `REBUILD.md`.
- Add to `flux-homelab/README.md`: *"Rebuild / operate the cluster →
  https://yo61.github.io/homelab-docs/ (how-to guides)."*
- The rebuild is still run from a flux-homelab checkout; the guide is read from
  the public site (commands reference the repo's `./talos/`, `./clusterconfig/`).

## Conventions (from homelab-docs CLAUDE.md)

- MDX frontmatter `title` + `description`; Fumadocs UI components available.
- `meta.json` `{title, pages}` for nav ordering; content only under
  `content/docs/`.
- Conventional Commits; prek hooks; pinned deps; never rewrite `pnpm-lock.yaml`.
- Docs prose is CC-BY-4.0 (`content/docs/`).

## Verification (before "done")

1. `pnpm install --frozen-lockfile` clean; `pnpm build` produces `out/` with zero
   errors/warnings; `pnpm types:check` clean.
2. `pnpm dev` in a browser at `http://localhost:3000/homelab-docs`: the four new
   pages render, nav shows them in the right quadrants, and every intra-doc link
   (how-to → reference/explanation, and the troubleshooting deep-links) resolves.
3. `prek run --all-files` clean.
4. Content fidelity: every command and fact from REBUILD.md is present on exactly
   one page (no step lost in the split) — checked against the original.
5. flux-homelab: `REBUILD.md` gone, README pointer present, no config changed.

## Done criteria

REBUILD.md's content lives on the site as a clean how-to plus its reference and
explanation pages; the site builds and browses; flux-homelab is REBUILD-free with
a pointer. The pattern is proven for the later prose-migration slices.

## Out of scope

- BOOTSTRAP.md, SERVICES.md, `knowledge/`, `decisions/` (later slices).
- Any change to flux-homelab cluster config.
- Rewriting the placeholder pages (`add-a-new-service`, `bootstrap-the-cluster`,
  `components`, `why-gitops`).
- Custom domain / redaction (topology is published as-is).
