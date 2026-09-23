# DX1 — Changelog: Format, Pipeline, and `/changelog`

Spec for SO4's release changelog: how entries are authored, how they become a
release, and how they are published in the app. Companion to
[`001_docs_site.md`](./001_docs_site.md) and the issue index in
[`dx_issues.md`](./dx_issues.md).

- **Source of truth:** `CHANGELOG.md` at the repository root
- **Authoring surface:** `.changelog/unreleased/*.md` entry files
- **Published at:** `so4.market/changelog` (in `apps/web`, not the docs app)
- **Machine surfaces:** `/changelog.json`, `/changelog.xml` (Atom)

**Questions?** Reach out to the maintainer at [t.me/ibrahimijai](https://t.me/ibrahimijai).

> **Implementation note (2026-08-24):** The DX1 resource batch adds an unreleased
> `docs` entry and `/resources/changelog`, which points to the canonical product
> history. The parser, release command, feeds, and `/changelog` application route
> described below remain deferred to DX-002 and its dependent issues; they were not
> recreated as part of documentation close-out work.

---

## 1. Why the changelog lives in `apps/web`

Docs answer "how does this work"; the changelog answers "what changed since I
last looked". The second question is asked by people who are already using the
app, usually right after they notice something moved. Keeping `/changelog` in
`apps/web` means the in-app "what's new" affordance, the release badge in the
navbar, and the page itself share one data source and one deploy.

The docs site links to it. It does not host it.

## 2. Format

`CHANGELOG.md` follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning 2.0.0](https://semver.org/):

```markdown
## [0.4.0] - 2026-08-24

### Added

- Trigger orders on the trade panel. ([#512](https://github.com/SO4-Markets/interface/pull/512))

### Fixed

- Liquidation price line no longer drifts after a theme switch. ([#514](…))
```

The six permitted categories are **Added, Changed, Deprecated, Removed, Fixed,
Security** — no others, because a fixed vocabulary is what makes the page
filterable and the badges meaningful.

## 3. Authoring: entry files, not direct edits

Editing `CHANGELOG.md` in a pull request guarantees merge conflicts: every open
PR touches the same few lines at the top of the same file. Instead, each PR adds
one small file:

```
.changelog/unreleased/512-trigger-orders.md
```

```yaml
---
type: added # added | changed | deprecated | removed | fixed | security
area: trade # trade | pools | earn | referrals | faucet | wallet | docs | ci | internal
pr: 512
breaking: false
---
Trigger orders are now available on the trade panel, including take-profit and
stop-loss with independent trigger prices.
```

Two PRs never touch the same file, so the conflict disappears. `internal` and
`ci` entries are collected but hidden from the public page by default — they
still exist for maintainers, behind a "show internal changes" toggle.

## 4. Pipeline

```
.changelog/unreleased/*.md
        │  scripts/changelog/validate.ts   (schema, PR number, area enum)
        ▼
   bun run changelog:release 0.4.0
        │  moves entries into CHANGELOG.md under a new version heading,
        │  empties .changelog/unreleased/, writes the release date
        ▼
     CHANGELOG.md
        │  scripts/changelog/build.ts      (parser → typed JSON)
        ▼
 apps/web/public/changelog.json  +  changelog.xml  +  changelog.json feed
```

The parser is the interesting piece: `CHANGELOG.md` stays the human artifact and
the JSON is derived from it, never the other way round. That means a hand-written
historical entry (everything before this system existed) is still picked up, and
the file remains readable on GitHub with no tooling.

Parsed shape:

```ts
type Release = {
  version: string // "0.4.0"
  date: string // ISO date
  yanked: boolean
  entries: Array<{
    type: "added" | "changed" | "deprecated" | "removed" | "fixed" | "security"
    area: string
    text: string // markdown, inline only
    pr: number | null
    breaking: boolean
  }>
}
```

## 5. The `/changelog` page

Layout, in one column, newest release first:

```
┌──────────────────────────────────────────────┐
│  Changelog                    [ RSS ] [ ⌘K ] │
│  Everything that shipped, newest first.      │
├──────────────────────────────────────────────┤
│  [All] [Added] [Changed] [Fixed] [Security]  │  ← category filter chips (DS-035)
│  [All areas ▾]                     [Search]  │
├──────────────────────────────────────────────┤
│  0.4.0            24 Aug 2026     #v0-4-0    │  ← anchor, copyable permalink
│  ─────────────────────────────────────────   │
│  ADDED    Trigger orders on the trade …  #512│
│  FIXED    Liquidation price line no lo…  #514│
│                                              │
│  0.3.2            11 Aug 2026     #v0-3-2    │
│  …                                           │
├──────────────────────────────────────────────┤
│            [ Load older releases ]           │
└──────────────────────────────────────────────┘
```

Rules:

- **Anchors are permanent.** `#v0-4-0` must resolve for every version that has
  ever shipped, including yanked ones.
- **Filters are URL state**, not component state: `?type=fixed&area=trade`
  is shareable and survives a reload.
- **Badges use existing semantic tokens.** `Added` → success, `Fixed` → info,
  `Security` → warning, `Removed`/`Deprecated` → danger/muted. No new colors —
  see [`DESIGN.md`](../../DESIGN.md).
- **The initial payload is bounded.** Ship the most recent 10 releases inline;
  older ones load on demand. A three-year changelog must not become a 2MB page.

## 6. In-app "what's new"

The navbar shows an unobtrusive dot when the newest release version is newer
than the last version this browser has acknowledged, stored in `localStorage`
under `so4:changelog:seen`. Clicking through to `/changelog` clears it.

Constraints that keep this from becoming spam:

- Only `major` and `minor` releases raise the indicator; patch releases do not.
- It is a dot, not a modal, on first render. The what's-new dialog opens only on
  an explicit click.
- Absent or unreadable `localStorage` means _no_ indicator — never a false
  positive on every page load in a private window.

## 7. Release automation

On a pushed `v*` tag, CI:

1. runs the full gate (`AGENTS.md` §1),
2. verifies `.changelog/unreleased/` is empty and `CHANGELOG.md` has a heading
   matching the tag,
3. publishes a GitHub Release whose body is that version's section,
4. rebuilds `changelog.json` / `changelog.xml` as part of the normal web build.

CI **verifies**; it does not write. A workflow that edits `CHANGELOG.md` and
pushes back to `main` is a merge race waiting to happen, and it takes the release
notes out of review. The `changelog:release` command is run by a human, in a PR.

## 8. Non-goals for DX1

- **No auto-generated entries from commit messages.** Conventional Commits tell
  you what a diff did; a changelog entry tells a user what changed for them.
  Those are different sentences and the second one is worth writing by hand.
- **No npm publishing or version bumping of workspace packages.** This repo is
  private and unpublished; a changeset-style release tool is out of proportion.
- **No email digest or push notifications.** RSS/Atom and JSON are enough.
- **No per-user read state on a server.** `localStorage` only.
