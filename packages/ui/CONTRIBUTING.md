# Contributing to `@workspace/ui`

`packages/ui` is the shared component library consumed by `apps/web` (and any future app in this monorepo) via the `@workspace/ui/*` import alias. This guide covers adding, testing, documenting, and exporting a component here — see the [design-system PR checklist](../../.github/PULL_REQUEST_TEMPLATE/design-system.md) for the pull-request requirements specific to token and shared-component changes.

## Does this belong in `packages/ui`, or in a feature?

Ask: **would a second app in this monorepo (or a second unrelated feature in `apps/web`) plausibly reuse this exactly as-is?**

- **Yes → `packages/ui`.** Generic primitives with no knowledge of SO4's domain: buttons, inputs, dialogs, tooltips, tabs. They take data and callbacks as props; they never import from `apps/web/src/features/*`, call the indexer, or know what a "stream," "pool," or "position" is.
- **No → a feature directory** (`apps/web/src/features/<feature>/components/`). Anything that renders domain data, calls a hook that fetches it, or is meaningfully specific to one page (e.g. `StreamProgressBar`, `PoolTransactionDialog`).

If you're unsure, default to the feature directory — it's a much smaller change to promote a component to `packages/ui` later (once a second real consumer exists) than to over-generalize one prematurely.

## Adding a component

1. **File naming**: `kebab-case.tsx` in `packages/ui/src/components/` (e.g. `date-picker.tsx`), matching every existing file in that directory. One component (plus its tightly-coupled sub-parts, e.g. `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` in one file) per file.
2. **API**:
   - Accept `className` and forward it into `cn(yourVariants({ ...variantProps }), className)` (see [`lib/utils.ts`](./src/lib/utils.ts)'s `cn`) so consumers can extend, never fight, your styles.
   - Use [`class-variance-authority`](https://cva.style/docs) (`cva`) for variant props, matching [`button.tsx`](./src/components/button.tsx) and [`badge.tsx`](./src/components/badge.tsx) — a `variants` object plus `defaultVariants`, exported alongside the component (`export { Button, buttonVariants }`) so consumers can compose the class list elsewhere if they need to.
   - Spread `...props` onto the root element last, after your own computed props, so a consumer can still override anything you didn't explicitly design as a variant.
   - Only reach for design values from the token system in [`DESIGN.md`](../../DESIGN.md) (colors, radius, the micro-typography scale) — `bun run check:tokens` (from the repo root) enforces this in CI; see that doc for the escape hatch (`ds-allow` comments) for the rare genuinely-structural exception.
3. **Accessibility**: this library is built on [Base UI](https://base-ui.com) primitives (`@base-ui/react/*`), which already handle most ARIA/keyboard-interaction concerns — prefer wrapping a Base UI primitive over building interactive behavior (focus trapping, roving tabindex, etc.) from scratch. If you do add custom interactive behavior, it needs to be operable by keyboard alone and expose the correct role/state via ARIA attributes, not just visually.
4. **Testing**: there's no unit-test runner wired up in this package yet — component behavior today is exercised indirectly through `apps/web`'s test suite (which renders these components) and through the visual regression suite below. If you're adding non-trivial logic (not just markup + variants — e.g. a hook, a reducer, keyboard-navigation logic), add a proper test using the shared config:
   ```ts
   // packages/ui/vitest.config.ts (create if it doesn't exist yet)
   import { defineConfig, mergeConfig } from "vitest/config"
   import { reactConfig } from "@repo/vitest-config/react"

   export default mergeConfig(reactConfig, defineConfig({}))
   ```
   then add a `"test": "vitest run"` script to this package's `package.json` and a `component-name.test.tsx` alongside the component, following the render/assert patterns already used in `apps/web/src/**/*.test.tsx`.
5. **Export**: add both the component and its prop-types export to whichever consumer imports it via `@workspace/ui/components/<file>` — no central barrel file exists (each component is its own subpath export per `package.json`'s `exports` map), so there's no index to update.
6. **Document in the gallery**: add your component to [`apps/web/src/features/gallery/components/gallery-page.tsx`](../../apps/web/src/features/gallery/components/gallery-page.tsx), rendering every variant/size it supports. This is how reviewers and future contributors discover what exists and see every state at a glance — see [`DESIGN.md`](../../DESIGN.md#the-component-gallery-gallery) for why it exists.
7. **Log in the changelog**: if the change is user-observable (new component, API change, deprecation, accessibility fix, token addition), add an entry to [`CHANGELOG.md`](./CHANGELOG.md) under the correct section — see the file's header for the expected sections. Breaking changes require a `### Migration note` subsection.

## Commands

Run from the repo root (or `--filter=@workspace/ui` via turbo to scope to just this package):

```bash
bun run typecheck --filter=@workspace/ui   # tsc --noEmit
bun run lint --filter=@workspace/ui        # eslint
bun run check:tokens                        # design-token usage check (whole repo, not package-scoped)
bun run test:e2e -- design-system-visual   # visual regression, once your component is in the gallery
```

All four should be clean before opening a PR that touches this package.

## Pull request

Before opening or requesting review on a PR that touches `packages/ui` or the design tokens, run through the [design-system PR checklist](../../.github/PULL_REQUEST_TEMPLATE/design-system.md). It covers theme verification, keyboard accessibility, mobile layout, visual regression snapshots, API compatibility, the token check, and changelog entry requirements.

## Further reading

- [`DESIGN.md`](../../DESIGN.md) — the token system (color, radius, typography scale), the design-token check, and the visual regression suite in full.
- [`apps/web/src/features/gallery/components/gallery-page.tsx`](../../apps/web/src/features/gallery/components/gallery-page.tsx) (`/gallery` route) — see every component's current variants rendered together.
