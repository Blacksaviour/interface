# GrantFox 3 — GMX Theme & Landing Revamp Issues

These three issues take SO4's interface to the GMX design language: first the theme,
then the landing page structure, then landing content and polish. Each is scoped as
one independently reviewable pull request. Read the companion specs before starting:

- [`docs/gf_3/001_theme_update.md`](./001_theme_update.md) — full GMX theme token
  reference (fonts, colors, typography, spacing, motion) and the GMX→SO4 mapping.
- [`docs/gf_3/002_landing_page.md`](./002_landing_page.md) — section-by-section
  landing spec with copy decks, source permalinks, and reference screenshots.

GMX landing source — **browse it here**:
[`gmx-io/gmx-interface` → `landing/`](https://github.com/gmx-io/gmx-interface/tree/release/landing)
(GitHub URL = branch `release`, folder `landing/`). The specs and issues link to
individual files pinned at commit `e27759a2835c7dc2197f41b6a6043bf07b935621` so
they can't rot; use the branch URL above to explore, the permalinks to quote exact
code.

**Questions?** Reach out to the maintainer at [t.me/ibrahimijai](https://t.me/ibrahimijai).

### GF3-001: Revamp the app theme to the GMX design language

**Context**

SO4 is adopting GMX's visual identity: a dark, violet-navy palette (`#090A14` page,
`#171827` cards), the electric `#2D42FC` brand blue, tight-tracked grotesque display
type, hairline 0.5px borders, and 180ms transitions. The token foundation (GMX
reference palette as `--color-gmx-*`, landing font stacks, `text-heading-*` /
`btn-landing` utilities) already exists in `packages/ui/src/styles/globals.css` —
see §8 of [`001_theme_update.md`](./001_theme_update.md). The `ThemeProvider` still
toggles a `.dark` class on `<html>`, but no `.dark` token block exists today, so
this issue (re)introduces the dark theme with GMX-derived values. The light theme
stays as-is. TTHoves (GMX's font) is paid software we cannot ship — the approved
stand-in is Archivo via `@fontsource-variable/archivo`, already wired as
`--font-landing-sans`; Space Mono (`@fontsource/space-mono`) covers code/mono
accents. Full rationale and every token value: `docs/gf_3/001_theme_update.md`.
Reference tailwind config:
[`landing/tailwind.config.ts`](https://github.com/gmx-io/gmx-interface/blob/e27759a2835c7dc2197f41b6a6043bf07b935621/landing/tailwind.config.ts).

**Scope**

- Define the `.dark` block in `packages/ui/src/styles/globals.css` using the mapping
  table in `001_theme_update.md` §8.2 (surfaces, text roles, border, primary, ring,
  accent, sidebar, chart aliases) — semantic tokens referencing the `gmx-*` palette.
- Make the landing page route (`apps/web/src/routes/index.tsx` and
  `apps/web/src/ui/landing/*`) always render the dark palette regardless of the
  user's theme setting (GMX's landing is dark-only), without leaking the override
  into app routes.
- Switch the landing font to `var(--font-landing-sans)` (Archivo) and apply the
  `text-heading-*` / `text-subheadline` / `text-description` / `btn-landing`
  utilities in place of ad-hoc landing type styles; retire landing-local font
  overrides in `apps/web/src/styles/landing.css`.
- Rebalance trading-state `subtle`/`border` token variants so they read correctly on
  the new dark surfaces (values stay in the existing hue families — see §8.2 note).
- Update `DESIGN.md`: document the dark theme's return and its GMX derivation
  (house rule — token changes and DESIGN.md updates land in the same PR).
- Add the landing typography and `btn-landing` to the `/gallery` page, then
  regenerate visual-regression baselines
  (`bun run test:e2e -- design-system-visual --update-snapshots`) and include the
  reviewed diffs in the PR.

**Acceptance criteria**

- [ ] Dark theme renders GMX-derived surfaces/text/brand tokens; light theme is
      pixel-unchanged (baseline diffs limited to dark + `/gallery` additions).
- [ ] Landing route is dark in all theme modes; `/trade`, `/pools`, `/earn`,
      `/referrals`, `/faucet` still honor the user's theme.
- [ ] No raw hex, arbitrary font-size, or arbitrary radius in changed code —
      `bun run check:tokens` passes.
- [ ] Headings on the landing use Archivo with GMX's exact sizes, line-heights
      (98%/108%), and negative tracking from `001_theme_update.md` §4.
- [ ] `bun run typecheck` and `bun run test` pass; gallery shows the new utilities.

**Out of scope**

- Landing page section structure (that is GF3-002) and final copy (GF3-003).
- A GMX-aligned light theme — deliberately not derived this round.
- Replacing Geist inside the app routes; Archivo is landing-scoped for now.

### GF3-002: Rebuild the landing page structure to match GMX

**Context**

With the theme in place (GF3-001), the landing page at `/` is rebuilt section-by-section
to mirror GMX's Home page. **Read the GMX code as you build:**
[github.com/gmx-io/gmx-interface/tree/release/landing](https://github.com/gmx-io/gmx-interface/tree/release/landing)
— every component referenced below lives under `landing/src/pages/Home/`. The full
spec — render order, layouts, responsive behavior, reference screenshots, and a
GMX→SO4 section map — is [`002_landing_page.md`](./002_landing_page.md), with
permalinks to every GMX source file at the pinned commit. GMX's order is: HeaderMenu →
HeroSection (animated headline, CTA, live stats, feature grid) → LaunchSection (light
band) → LiqiuditySection (light band) → SponsorsSection (light band) → ProgramCards →
FaqSection → RoadmapSection → SocialSection (which includes the footer link row — GMX
has no separate footer). This issue is **structure only**: layout, components,
responsiveness, and wiring, using placeholder copy and placeholder visuals. Content
perfection is GF3-003.

**Scope**

- Rebuild `apps/web/src/ui/landing/*` into GMX's nine sections (rename/replace the
  existing `hero/stats/features/markets/how-it-works/infrastructure/final-cta/footer`
  set per the section map in `002_landing_page.md`), composed from
  `apps/web/src/routes/index.tsx`.
- Fixed `HeaderMenu` with desktop nav, mobile burger full-screen menu (hairline-divided
  links, bottom social row), and `btn-landing` "Open app" → `/trade`.
- Hero: 100px display headline with the rotating-word slot (framer-motion
  `AnimatePresence`, 2.5s cycle, `y 98→0→−98` — see `AnimatedTitle.tsx` permalink in
  the spec), "Trade now" CTA, subheadline, and the 3-stat row (Traders / Open interest /
  Total volume) reading from SO4's stats source with `-` loading placeholders.
- Feature card grid (`lg:grid-cols-3 lg:grid-rows-3`, six `rounded-20` cards including
  one `bg-blue-400` and one col-span-2 CTA card).
- Light bands: LaunchSection (chain launcher grid), LiqiuditySection (live total +
  pool cards with hover lift), SponsorsSection (logo card row) — pure-white and
  `#F4F5F9` surfaces exactly as specced.
- Dark sections: ProgramCards (two program cards over the glow treatment), FaqSection
  (grid-rows accordion, no JS height measurement), RoadmapSection (horizontal
  quarter timeline with completed/upcoming states), SocialSection (marquee skeleton,
  community stats + newsletter form, footer link row).
- Newsletter form, social links, and footer links wired to SO4's real endpoints/URLs
  (placeholder handlers where a backend doesn't exist yet).
- `prefers-reduced-motion` respected for the marquee and title rotation.

**Acceptance criteria**

- [ ] All nine sections render in GMX's order at `/`, responsive at 390px / 768px /
      1440px, matching the layouts in `002_landing_page.md`.
- [ ] Light/dark band rhythm matches the spec (hero dark → launch white →
      liquidity/sponsors `#F4F5F9` → programs→footer dark).
- [ ] Stats render live values when available and `-` while loading; no layout shift
      when values arrive.
- [ ] FAQ accordion, mobile menu, and roadmap scroll work with keyboard and touch;
      focus states visible.
- [ ] `bun run check:tokens`, `typecheck`, and `test` pass; visual-regression baselines
      for `/` regenerated and reviewed in the PR.
- [ ] Placeholder copy is clearly marked (`TODO(GF3-003)`) so finishing work is
      greppable.

**Out of scope**

- Final copy, real partner/tweet content, recreated image assets, and pixel-perfect
  parity polish — all GF3-003.
- Theme tokens themselves (GF3-001); this issue consumes them.
- The `/builders`, `/trader-affiliate-program`, and terms pages GMX also ships.

### GF3-003: Landing page finishing — content, assets, and pixel parity

**Context**

GF3-002 delivers the skeleton; this issue makes it *ours* and makes it *exact*. GMX's
landing gets its quality from details: the word-rotation cadence, hairline borders,
the pool-card hover parallax, light-band rhythm, and real numbers. The spec
(`002_landing_page.md`) embeds reference screenshots captured from <https://gmx.io>
under `docs/gf_3/screenshots/` — this issue is done when SO4's landing matches them
section by section, with SO4 content. It also replaces every placeholder with final
copy and recreated assets (GMX's images are not public — equivalents must be produced,
see the "Assets to recreate" table in the spec).

**Scope**

- Final copy pass for every section (headline rotation words, feature cards, FAQ
  questions/answers, roadmap milestones, program cards, footer) — reviewed against
  SO4 messaging; remove all `TODO(GF3-003)` markers.
- Recreate visual assets: hero background, feature-card illustrations, chain logos,
  pool-card gradients/coin art, sponsor logos, program-card glow, social avatars —
  exported as optimized SVG/WebP under `apps/web/public/landing/` and referenced via
  the theme's asset conventions.
- Wire real content: live stats formatting (`shortFormat`/`cleanFormatUsd`
  equivalents per the spec), pool cards from the pools API, social links and counts,
  curated testimonial cards for the marquee.
- Parity pass against `docs/gf_3/screenshots/`: section spacing (1200px column,
  `py-80 sm:py-[120px]`), hairline separators, type scale/tracking, button hover/active
  gradient overlays, 180ms transitions, marquee pause-on-hover.
- Accessibility and performance finish: semantic landmarks/heading order, alt text,
  `prefers-reduced-motion` verified, image `width`/`height` set (no CLS), fonts
  preloaded, Lighthouse ≥ 95 on performance/accessibility/best-practices at mobile.

**Acceptance criteria**

- [ ] Side-by-side screenshots (GMX reference vs SO4 implementation, desktop + mobile,
      every section) posted in the PR description; differences are either SO4 content
      or explicitly called out.
- [ ] No `TODO(GF3-003)` markers remain; all copy approved by the maintainer.
- [ ] All images optimized (SVG where possible, WebP otherwise) with dimensions set;
      no layout shift on load.
- [ ] Live stats/pool data render real values on mainnet-data and degrade to `-`
      gracefully.
- [ ] Lighthouse mobile scores ≥ 95 (perf/a11y/best-practices); `check:tokens`,
      `typecheck`, `test`, and the visual-regression suite all pass with updated
      baselines.

**Out of scope**

- New sections or content beyond the GMX structure (extra pages, blog, i18n).
- App-route theming or components outside the landing route.
- Analytics/tracking events beyond what already exists on the route.
