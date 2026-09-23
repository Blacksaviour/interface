## Design-system checklist

Use this checklist when your PR changes design tokens, shared components in `packages/ui`, or introduces a new component to the design system.

### API compatibility

- [ ] Component API follows existing conventions: `className` forwarding, `cva` variants, `...props` spread last
- [ ] No breaking API changes without a **migration note** in the PR description (see changelog below)
- [ ] Subpath export added to `packages/ui/package.json` if this is a new component

### Theme & visual

- [ ] Verified in **light theme** and **dark theme**
- [ ] Verified at **mobile** viewport width (360px)
- [ ] No new raw hex colours, arbitrary font sizes, or arbitrary radius values — `bun run check:tokens` passes clean

### Accessibility

- [ ] Interactive elements are operable by **keyboard alone** (Tab, Enter/Escape, arrow keys where applicable)
- [ ] Correct ARIA roles and states are exposed (use Base UI primitives where possible)
- [ ] Colour is never the only signal — shape, label, or position accompanies any colour-coded state

### Testing

- [ ] Non-trivial logic includes a unit test (`*.test.tsx` alongside the component)
- [ ] Component added to the gallery (`apps/web/src/features/gallery/components/gallery-page.tsx`)
- [ ] Visual regression snapshots updated (`bun run test:e2e -- design-system-visual --update-snapshots`) and reviewed in the diff

### Changelog

- [ ] Entry added to [`packages/ui/CHANGELOG.md`](../../packages/ui/CHANGELOG.md) under the correct section (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, or `Accessibility`)
- [ ] Breaking changes include a `### Migration note` subsection

### CI

- [ ] `bun run typecheck --filter=@workspace/ui` passes
- [ ] `bun run lint --filter=@workspace/ui` passes
- [ ] `bun run test:e2e -- design-system-visual` passes (or snapshots intentionally updated)