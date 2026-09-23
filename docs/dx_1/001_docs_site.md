# DX1 — `apps/docs`: Documentation Site Architecture

Architecture spec for SO4's documentation site. Companion to
[`002_changelog.md`](./002_changelog.md) (release changelog),
[`003_content_map.md`](./003_content_map.md) (information architecture), and the
issue index in [`dx_issues.md`](./dx_issues.md).

- **Target:** a new `apps/docs` workspace in this monorepo
- **Deployed at:** `docs.so4.market`
- **Stack parity:** matches `apps/web` deliberately — Vite 7, TanStack Start,
  Tailwind v4, `@workspace/ui`, Bun, Vitest, Playwright
- **Design source of truth:** [`DESIGN.md`](../../DESIGN.md) and
  `packages/ui/src/styles/globals.css`

**Questions?** Reach out to the maintainer at [t.me/ibrahimijai](https://t.me/ibrahimijai).

> **Implementation note (2026-08-24):** DX-097–DX-100 introduced a dependency-light
> static documentation workspace while the wider DX1 foundation remains deferred.
> It keeps the specified `apps/docs/content` boundary, typed frontmatter checks,
> explicit navigation, link validation, printable HTML, and generated FAQ data.
> TanStack Start, runtime MDX compilation, Pagefind, syntax highlighting, Mermaid,
> generated reference pages, deployment configuration, and the complete docs chrome
> remain deferred because their prerequisite issues have not landed. This note records
> the built state rather than presenting the target architecture below as complete.

---

## 1. Why a separate app

`apps/web` is a trading interface: a heavy client, wallet providers, streaming
price sockets, chart libraries. Documentation has the opposite profile — mostly
static, crawl-friendly, cache-forever. Putting them in one bundle means every
docs reader downloads the trading runtime, and every trade page deploy is gated
on prose edits.

A separate workspace gives us:

- an independent deploy cadence and its own subdomain,
- a build that can be fully prerendered and CDN-cached,
- room for versioned docs (`/v1`, `/next`) without touching app routing,
- a much smaller dependency surface to audit.

It costs us one thing: shared UI has to actually be shared. That is already
true — `@workspace/ui` exists and `DESIGN.md` is the contract. The docs app
consumes both and adds no tokens of its own.

## 2. Workspace layout

```
apps/docs/
├── content/                    # all MDX prose — the only thing writers touch
│   ├── index.mdx
│   ├── meta.json               # top-level section order
│   ├── get-started/
│   │   ├── meta.json
│   │   └── *.mdx
│   ├── concepts/
│   ├── guides/
│   ├── developers/
│   ├── reference/
│   └── resources/
├── public/                     # og images, diagrams, favicons
├── src/
│   ├── app/                    # providers, router, theme
│   ├── components/             # docs-only chrome: Sidebar, Toc, Pager, Search
│   ├── mdx/                    # MDX component map + custom blocks
│   ├── lib/                    # content loader, frontmatter schema, nav builder
│   ├── routes/                 # TanStack Router file routes
│   └── styles/
├── scripts/                    # search index, link check, llms.txt, sitemap
├── package.json
├── tsconfig.json
└── vite.config.ts
```

`content/` is intentionally outside `src/`. Prose contributors should never need
to open an application directory, and the boundary keeps the "docs are code"
tooling (lint, link check, frontmatter validation) pointed at one tree.

## 3. Content model

Every page is an `.mdx` file with typed frontmatter:

```yaml
---
title: Placing your first trade        # required, <= 60 chars, used in <title> and sidebar fallback
description: Connect a wallet, pick a  # required, 50-160 chars, used in meta + search snippet
  market, and submit a market order.
sidebarLabel: First trade              # optional, overrides title in the sidebar
order: 20                              # optional, sort key within its section (default: alphabetical)
tags: [trading, onboarding]            # optional
status: stable                         # stable | beta | draft — draft is excluded from prod builds
updated: 2026-08-24                    # required, ISO date, validated against git history
---
```

The schema lives in `src/lib/frontmatter.ts` and is enforced by
`bun run --cwd apps/docs check:content`, which is part of the repo gate. A page
that fails validation fails the build — there is no warn-and-continue mode,
because a warning in a 100-page site is a warning nobody reads.

### Navigation

Sidebar structure comes from `meta.json` files, not from filesystem order:

```json
{
  "label": "Get started",
  "icon": "rocket",
  "pages": ["introduction", "quickstart", "wallets", "testnet"]
}
```

Explicit ordering beats numeric filename prefixes (`01-intro.mdx`) because
reordering a section should not rewrite every URL. A page present on disk but
missing from `pages` is a validation error; a page listed but missing on disk is
also an error. Both directions are checked.

## 4. Rendering pipeline

| Concern             | Choice                                          | Why                                                                 |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| MDX compilation     | `@mdx-js/rollup` at build time                  | No runtime MDX, no `eval`, works with a strict CSP                  |
| Frontmatter         | `remark-frontmatter` + `remark-mdx-frontmatter` | Exported as a typed module constant                                 |
| Headings/anchors    | `rehype-slug` + custom autolink                 | Anchor ids are stable across builds; used by the TOC and deep links |
| Syntax highlighting | Shiki, build-time                               | Zero client JS, themes tied to our `--surface-*` tokens             |
| Diagrams            | Mermaid, prerendered to inline SVG              | Same reason — no client library, no CLS                             |
| Search              | Pagefind, post-build index                      | Static, no service to run, ~50KB of index loaded on demand          |

Everything above runs at build time. The shipped page is HTML plus a small
hydration bundle for the sidebar, theme toggle, and search dialog. If JavaScript
fails to load, the documentation still reads.

## 5. Design-system rules

The docs app **defines no color, spacing, radius, or type tokens.** It imports
`@workspace/ui/styles/globals.css` and uses the semantic tokens documented in
[`DESIGN.md`](../../DESIGN.md): `bg-surface-canvas`, `text-text-secondary`,
`border-border`, and so on. `bun run check:tokens` runs over `apps/docs` exactly
as it runs over `apps/web`.

MDX elements map onto existing primitives rather than getting bespoke styles:

| Markdown     | Renders as                                                                            |
| ------------ | ------------------------------------------------------------------------------------- |
| `# … ######` | `Typography` variants (DS-011) with autolinked anchors                                |
| `` `code` `` | Inline code with `--font-mono` and `bg-surface-sunken`                                |
| `fenced`     | `CodeBlock` — Shiki output + `CopyButton` (DS-060) + optional filename/line highlight |
| `> quote`    | `Callout` variant `note`                                                              |
| tables       | `DataTable` shell (DS-034) in read-only mode, horizontally scrollable                 |
| links        | Internal links prefetch on hover; external links get an icon and `rel="noreferrer"`   |

Custom blocks available in MDX: `<Callout>`, `<Steps>`, `<CodeGroup>`,
`<Tabs>`, `<ParamTable>`, `<ContractAddress>`, `<Mermaid>`. Each is a thin
composition over `@workspace/ui` — none of them ship new visual language.

## 6. Generated reference pages

Three reference sections are **generated, not written**, and regenerating them is
part of CI:

1. **Contract addresses** — from `packages/contracts/contracts.json`. The
   committed IDs are the source of truth (see the repository invariant in
   [`AGENTS.md`](../../AGENTS.md) §5); the docs page must never hardcode them.
2. **Indexer GraphQL schema** — from `apps/s03-indexer` codegen output.
3. **Design tokens** — from `packages/ui/src/styles/globals.css`.

Each generator writes into `content/reference/<name>.generated.mdx` with a
"do not edit" banner, and CI fails if the committed output differs from a fresh
run. This is the same contract the contract bindings already use.

## 7. Build, deploy, CI

```jsonc
// turbo.json — docs joins the existing pipeline unchanged
"build":         { "dependsOn": ["^build"], "outputs": [".output/**"] }
"test":          { "dependsOn": ["^build"] }
```

New workspace scripts:

```bash
bun run --cwd apps/docs dev            # vite dev --port 3001
bun run --cwd apps/docs build          # vite build + search index + sitemap + llms.txt
bun run --cwd apps/docs check:content  # frontmatter + nav + link validation
bun run --cwd apps/docs check:links    # internal + external link check
```

`check:content` and `check:links` are wired into `.github/workflows/ci.yml`. The
external link check runs on a schedule rather than per-PR, so a third-party
outage never blocks a merge.

Deployment target is the same Nitro preset `apps/web` uses. Caching:
`immutable` for hashed assets, `s-maxage=300, stale-while-revalidate=86400` for
HTML.

## 8. Non-goals for DX1

Named explicitly so nobody builds them by accident:

- **No CMS.** Content is MDX in git, reviewed like code.
- **No translations.** i18n _scaffolding_ is in scope (locale-aware routing and
  a message catalog boundary); actual translated content is not.
- **No blog.** The changelog covers "what shipped"; marketing posts are separate.
- **No third-party analytics.** Page feedback is a first-party, cookieless
  aggregate counter or it does not ship.
- **No comment system or user accounts.**
