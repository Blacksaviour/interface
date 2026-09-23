# Changelog

All notable changes to `@workspace/ui` — the SO4 design system — are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Accessibility

---

## [0.0.0] — 2026-07-29 — Baseline

Initial release of the SO4 design system, extracted and standardized from the existing SO4 Markets application.

### Added (Baseline)

- **Surface tokens**: five explicit surface layers — `canvas`, `sunken`, `raised`, `overlay`, `interactive` — replacing the generic shadcn page/card/popover pattern.
- **Text tokens**: six text roles — `primary`, `secondary`, `tertiary`, `disabled`, `inverse`, `link`.
- **Trading-state colours**: foreground/subtle/border triplets for `long`, `short`, `liquidation`.
- **Semantic-status colours**: foreground/subtle/border triplets for `success`, `warning`, `info`, `danger`, `neutral`. Colour is never the only signal — shape, position, or label must accompany it.
- **Micro-typography scale**: 16 font-size tokens between 9.5px and 40px (`text-9-5` through `text-40`) for the app's dense data-table-heavy UI.
- **Radius scale**: `--radius-sm` through `--radius-4xl` derived from a single `--radius` root via `calc()`.
- **Components** (60+): `alert`, `app-shell`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `data-table`, `dialog`, `dropdown-menu`, `empty-state`, `field`, `filter-chip`, `icon-button`, `input`, `keyboard-shortcut`, `loading-button`, `numeric`, `page-header`, `popover`, `progress-indicator`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `slider`, `spinner`, `stat`, `states`, `status-badge`, `switch`, `table`, `table-toolbar`, `tabs`, `text`, `textarea`, `token-avatar`, `tooltip`, `transaction-status`.
- **Design-token check**: `scripts/check-design-tokens.ts` enforces token usage in CI — flags raw hex colours, arbitrary font sizes, and arbitrary radius classes.
- **Visual regression suite**: Playwright spec (`e2e/design-system-visual.spec.ts`) screenshots `/gallery` and all main routes at desktop and mobile widths in both themes.
- **Component gallery**: `/gallery` route rendering every component variant on one page for easy review.
- **Geist Mono**: available for monospaced contexts (order books, addresses, code).
- **Base UI primitives**: `@base-ui/react` as the accessibility foundation for all interactive components.

### Deprecated

- **shadcn aliases** (`--background`, `--card`, `--popover`): remain for backwards compatibility during migration. Prefer the surface-layer tokens (`--surface-*`) in new code.

### Fixed

- **DS-050 audit**: resolved 268 arbitrary-value violations (229 arbitrary font sizes, 38 raw hex colours, 1 arbitrary radius) across ~40 files — see [`DESIGN.md`](./DESIGN.md#audit-history) for details.