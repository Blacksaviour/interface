# DX1 — Changelog & Documentation: Issue Index

The hundred issues that build SO4's changelog and documentation site, in
dependency order. Each is scoped as one independently reviewable pull request.

Read the companion specs before starting:

- [`001_docs_site.md`](./001_docs_site.md) — `apps/docs` architecture: workspace
  layout, content model, rendering pipeline, design-system rules, deploy.
- [`002_changelog.md`](./002_changelog.md) — changelog format, entry-file
  authoring, the release command, and the `/changelog` page.
- [`003_content_map.md`](./003_content_map.md) — who the docs are for, the full
  section tree, the page contract, and the voice guide.

Every issue must clear the commit gate in [`AGENTS.md`](../../AGENTS.md) §1.
Nothing may be disabled, skipped, or weakened to get a check green (§2).

**Questions?** Reach out to the maintainer at [t.me/ibrahimijai](https://t.me/ibrahimijai).

---

## Changelog — DX-001…DX-025

Format, authoring pipeline, and the `/changelog` page in `apps/web`. Spec: [`002_changelog.md`](./002_changelog.md).

| #      | Issue                                                   |
| ------ | ------------------------------------------------------- |
| DX-001 | Adopt Keep a Changelog and seed CHANGELOG.md            |
| DX-002 | Add .changelog entry files to avoid merge conflicts     |
| DX-003 | Validate changelog entry files in CI                    |
| DX-004 | Add the changelog:release command                       |
| DX-005 | Parse CHANGELOG.md into typed JSON                      |
| DX-006 | Scaffold the /changelog route                           |
| DX-007 | Build ReleaseSection and ChangelogEntry components      |
| DX-008 | Map changelog categories onto StatusBadge variants      |
| DX-009 | Permanent version anchors and copyable permalinks       |
| DX-010 | Filter the changelog by category and area, as URL state |
| DX-011 | Search within the changelog                             |
| DX-012 | Load older releases on demand                           |
| DX-013 | Loading, empty, and error states for /changelog         |
| DX-014 | Publish an Atom feed for releases                       |
| DX-015 | Publish a JSON Feed for releases                        |
| DX-016 | Add an unobtrusive "what's new" indicator to the navbar |
| DX-017 | Add a what's-new dialog, opened only on request         |
| DX-018 | Per-release metadata and social preview images          |
| DX-019 | Surface the changelog in navigation and the footer      |
| DX-020 | Accessibility pass on /changelog                        |
| DX-021 | Responsive layout for /changelog                        |
| DX-022 | Visual regression coverage for /changelog               |
| DX-023 | Unit and integration tests for the changelog pipeline   |
| DX-024 | Playwright end-to-end coverage for the changelog        |
| DX-025 | Verify the changelog on release tags in CI              |

## Docs app foundation — DX-026…DX-040

The `apps/docs` workspace: scaffold, MDX pipeline, layout, and deploy. Spec: [`001_docs_site.md`](./001_docs_site.md).

| #      | Issue                                                      |
| ------ | ---------------------------------------------------------- |
| DX-026 | Scaffold the apps/docs workspace                           |
| DX-027 | Wire the shared design system into apps/docs               |
| DX-028 | Add the MDX build pipeline with typed frontmatter          |
| DX-029 | Build the content loader and route tree                    |
| DX-030 | Build the three-column DocsLayout shell                    |
| DX-031 | Drive the sidebar from meta.json manifests                 |
| DX-032 | Add the on-page table of contents with scroll-spy          |
| DX-033 | Add breadcrumbs and previous/next pagers                   |
| DX-034 | Map MDX elements onto design-system primitives             |
| DX-035 | Build the CodeBlock component with build-time highlighting |
| DX-036 | Build the Callout component                                |
| DX-037 | Build Tabs and CodeGroup for MDX                           |
| DX-038 | Build the Steps component for procedures                   |
| DX-039 | Theme toggle and light/dark parity for docs                |
| DX-040 | Build and deployment configuration for docs.so4.market     |

## Docs platform features — DX-041…DX-055

Search, metadata, versioning, and the content-validation tooling. Spec: [`001_docs_site.md`](./001_docs_site.md).

| #      | Issue                                                |
| ------ | ---------------------------------------------------- |
| DX-041 | Build the static search index                        |
| DX-042 | Build the docs search dialog                         |
| DX-043 | Keyboard shortcuts for docs navigation               |
| DX-044 | Add heading anchors and copy-link affordances        |
| DX-045 | Add "Edit this page" and accurate last-updated dates |
| DX-046 | Generate sitemap.xml and robots.txt                  |
| DX-047 | Per-page SEO and social preview metadata             |
| DX-048 | Publish llms.txt for agent consumption               |
| DX-049 | Build a useful docs 404 page                         |
| DX-050 | Add versioned documentation routing                  |
| DX-051 | Add a link checker to the docs pipeline              |
| DX-052 | Add the check:content validation command             |
| DX-053 | Add prose linting with the SO4 style rules           |
| DX-054 | Add build-time Mermaid diagram support               |
| DX-055 | Build the docs image and asset pipeline              |

## Docs quality and infrastructure — DX-056…DX-065

Tests, budgets, feedback, print, i18n scaffolding, and the contributor guide. Spec: [`001_docs_site.md`](./001_docs_site.md).

| #      | Issue                                                    |
| ------ | -------------------------------------------------------- |
| DX-056 | Accessibility test coverage for the docs site            |
| DX-057 | Visual regression coverage for the docs site             |
| DX-058 | Unit tests for docs components and the content pipeline  |
| DX-059 | End-to-end coverage for docs navigation and search       |
| DX-060 | Add a performance budget for the docs site               |
| DX-061 | Add cookieless "was this helpful" page feedback          |
| DX-062 | Add reading time and reading progress                    |
| DX-063 | Add a print stylesheet for documentation pages           |
| DX-064 | Add internationalisation scaffolding                     |
| DX-065 | Write the documentation contribution guide and templates |

## Content — product — DX-066…DX-080

Getting started, concepts, and the per-feature guides. Spec: [`003_content_map.md`](./003_content_map.md).

| #      | Issue                                               |
| ------ | --------------------------------------------------- |
| DX-066 | Write the docs home page                            |
| DX-067 | Write /get-started/introduction                     |
| DX-068 | Write /get-started/quickstart                       |
| DX-069 | Write /get-started/wallets                          |
| DX-070 | Write /get-started/testnet                          |
| DX-071 | Write /concepts/perpetuals                          |
| DX-072 | Write /concepts/unified-liquidity                   |
| DX-073 | Write /concepts/margin-and-leverage                 |
| DX-074 | Write /concepts/liquidation                         |
| DX-075 | Write /concepts/funding-and-fees                    |
| DX-076 | Write /concepts/order-types                         |
| DX-077 | Write /concepts/oracles                             |
| DX-078 | Write /concepts/risk                                |
| DX-079 | Write /guides/trading and /guides/positions         |
| DX-080 | Write the pools, earn, referrals, and faucet guides |

## Content — developer and reference — DX-081…DX-095

Architecture, contract references, generated pages, and troubleshooting. Spec: [`003_content_map.md`](./003_content_map.md).

| #      | Issue                                                       |
| ------ | ----------------------------------------------------------- |
| DX-081 | Write /developers/architecture                              |
| DX-082 | Write /developers/local-setup                               |
| DX-083 | Generate the contract address reference page                |
| DX-084 | Document the ExchangeRouter contract                        |
| DX-085 | Document the DataStore contract                             |
| DX-086 | Document the SyntheticsReader contract                      |
| DX-087 | Document the OrderVault contract                            |
| DX-088 | Generate the indexer GraphQL schema reference               |
| DX-089 | Write /developers/indexer                                   |
| DX-090 | Write /developers/contract-clients                          |
| DX-091 | Write /developers/reading-data                              |
| DX-092 | Write /developers/writing-transactions                      |
| DX-093 | Generate the design token reference and document the system |
| DX-094 | Write /reference/errors                                     |
| DX-095 | Write /guides/troubleshooting                               |

## Content — resources and close-out — DX-096…DX-100

Security, terms, FAQ, glossary, roadmap, and the batch audit. Spec: [`003_content_map.md`](./003_content_map.md).

| #      | Issue                                                   |
| ------ | ------------------------------------------------------- |
| DX-096 | Write /resources/security                               |
| DX-097 | Write /resources/terms                                  |
| DX-098 | Make the docs FAQ the single source for the landing FAQ |
| DX-099 | Write /reference/glossary                               |
| DX-100 | Write /resources/roadmap and close out the DX1 batch    |
