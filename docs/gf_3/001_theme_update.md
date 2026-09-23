# GF3 — Theme Update: The GMX Design Language, Mapped to SO4

This document is the complete reference for the GMX landing theme and the plan for
aligning SO4's design system to it. It is the companion spec for issue **GF3-001**
(theme revamp) and the visual foundation for **GF3-002 / GF3-003** (landing page).

Everything below was extracted from the GMX interface repository, pinned to a commit
so the links never rot:

- **Repo:** `gmx-io/gmx-interface`
- **Ref:** branch `release`, folder [`landing/`](https://github.com/gmx-io/gmx-interface/tree/e27759a2835c7dc2197f41b6a6043bf07b935621/landing)
- **Pinned commit:** `e27759a2835c7dc2197f41b6a6043bf07b935621`
- **Live reference:** <https://gmx.io>

Source files that define the theme:

| What | File (permalink) |
|---|---|
| All design tokens | [`landing/tailwind.config.ts`](https://github.com/gmx-io/gmx-interface/blob/e27759a2835c7dc2197f41b6a6043bf07b935621/landing/tailwind.config.ts) |
| Base styles + `@font-face` | [`landing/src/main.css`](https://github.com/gmx-io/gmx-interface/blob/e27759a2835c7dc2197f41b6a6043bf07b935621/landing/src/main.css) |
| Document shell | [`landing/index.html`](https://github.com/gmx-io/gmx-interface/blob/e27759a2835c7dc2197f41b6a6043bf07b935621/landing/index.html) |

---

## 1. Fonts

GMX uses three families. **None of the font files are committed to the public repo**
(proprietary licensing) — the `@font-face` declarations in `main.css` reference files
that are injected privately at deploy time.

| Family | Weights | Role | License |
|---|---|---|---|
| **TTHoves** (TTHoves Pro) | 400, 500 | Everything — body, headings, buttons. This *is* the GMX look. | Paid (TypeType). Cannot be committed or redistributed. |
| **TTHovesMono** | — | `font-mono` utility (barely used on landing) | Paid (TypeType). |
| **Space Mono** | 400 | `font-code` — code snippets (Builders page) | OFL — free to use. |

The exact `@font-face` declarations from
[`main.css`](https://github.com/gmx-io/gmx-interface/blob/e27759a2835c7dc2197f41b6a6043bf07b935621/landing/src/main.css):

```css
@font-face {
  font-family: "TTHoves";
  font-style: normal;
  font-weight: 400;
  src: url("fonts/tthoves/tthoves-pro-regular.ttf") format("truetype");
}
@font-face {
  font-family: "TTHoves";
  font-style: normal;
  font-weight: 500;
  src: url("fonts/tthoves/tthoves-pro-medium.ttf") format("truetype");
}
@font-face {
  font-family: "Space Mono";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("fonts/spacemono/space-mono-regular.woff2") format("woff2");
}
```

Tailwind family mapping (`tailwind.config.ts` → `theme.extend.fontFamily`):

```js
fontFamily: {
  sans: ["TTHoves", "sans-serif"],
  mono: ["TTHovesMono", "monospace"],
  code: ["Space Mono", "TTHovesMono", "monospace"],
},
```

### 1.1 SO4 substitution (decided)

TTHoves is a commercial TypeType font — we cannot ship it. The approved stand-ins,
both OFL and loaded via Fontsource (same mechanism SO4 already uses for Geist):

| GMX | SO4 substitute | Package | Why |
|---|---|---|---|
| TTHoves 400/500 | **Archivo** (variable, 400/500) | `@fontsource-variable/archivo` | Neo-grotesque with the same tight-tracked display character; takes `-2px…-5px` tracking gracefully at 50–100px. |
| TTHovesMono | Geist Mono (existing) | `@fontsource-variable/geist-mono` | Already loaded; mono is nearly invisible on the landing. |
| Space Mono 400 | **Space Mono** 400/700 | `@fontsource/space-mono` | Same font GMX uses — no substitute needed. |

> If SO4 ever licenses TTHoves Pro, drop `tthoves-pro-regular.ttf` /
> `tthoves-pro-medium.ttf` into `apps/web/public/fonts/tthoves/`, add the two
> `@font-face` blocks above to `packages/ui/src/styles/globals.css`, and put
> `"TTHoves"` first in `--font-landing-sans`. Everything else stays identical.

Alternate considered: **Inter Tight** — acceptable fallback if Archivo's rendering
tests poorly, but Archivo's grotesque skeleton is closer to TTHoves at display sizes.

---

## 2. The 10px root trick (rem scale)

GMX's landing sets the root font size to **10px** and then expresses every font size
in rems, so `text-16` literally means 16px:

```css
@layer base {
  :root { @apply text-[10px]; -webkit-font-smoothing: antialiased; }
  html  { @apply bg-slate-800 leading-base; }
}
```

```js
// tailwind.config.ts
fontSize: {
  12: "1.2rem", 14: "1.4rem", 15: "1.5rem", 16: "1.6rem", 18: "1.8rem",
  24: "2.4rem", 32: "3.2rem", 34: "3.4rem", 50: "5rem", 80: "8rem", 100: "10rem",
},
```

**SO4 does not adopt the 10px root** — our token system is rem-based at the standard
16px root, and changing the root would silently rescale every existing component.
All GMX rem values are converted to pixels and then to 16px-root rems in the mapping
below (`5rem` @10px = `50px` = `3.125rem` @16px).

---

## 3. Color palette

The complete GMX landing palette, with oklch conversions (the format SO4 tokens use).
Hex values are verbatim from `tailwind.config.ts`; the three extra hexes at the
bottom are used inline in section components.

| GMX token | Hex | oklch | Used for |
|---|---|---|---|
| `slate-950` | `#0B0B14` | `oklch(0.1545 0.0191 283.94)` | Deepest background shade |
| `slate-900` | `#090A14` | `oklch(0.1493 0.0216 278.91)` | **Page background** (hero, FAQ, roadmap, social) |
| `slate-800` | `#171827` | `oklch(0.2157 0.0294 280.68)` | **Card surface**, `<html>` base, inputs |
| `slate-700` | `#1E2033` | `oklch(0.2510 0.0360 278.84)` | Raised controls (mobile menu button, loader track) |
| `slate-650` | `#24273F` | `oklch(0.2817 0.0443 277.70)` | Interactive/hover-adjacent surface |
| `slate-600` | `#3C4067` | `oklch(0.3862 0.0663 278.34)` | **Borders & dividers** (`border-slate-600`, half-px rules) |
| `slate-500` | `#A0A3C4` | `oklch(0.7242 0.0478 281.04)` | Muted text (footer links, social labels) |
| `slate-400` | `#BEC0DA` | `oklch(0.8145 0.0364 282.07)` | **Secondary text** (subheadlines, descriptions) |
| `light-150` | `#F4F5F9` | `oklch(0.9705 0.0054 274.97)` | **Light band background** (Launch, Liquidity, Sponsors sections) |
| `blue-100` | `#A4C3F9` | `oklch(0.8136 0.0838 261.37)` | Light accent (rarely used on landing) |
| `blue-300` | `#7885ff` | `oklch(0.6651 0.1789 275.83)` | **Hover accent** (links, stat hover) |
| `blue-400` | `#2D42FC` | `oklch(0.5099 0.2688 268.08)` | **Primary brand / buttons / links** |
| `stroke.primary` | `#363A59` | `oklch(0.3591 0.0539 277.68)` | Semantic stroke token |
| `surface.primary` | `#121421` | `oklch(0.1959 0.0264 276.95)` | Semantic surface token |
| — (inline) | `#05050D` | `oklch(0.1206 0.0203 282.92)` | Social slider fade-out gradient |
| — (inline) | `#252635` | `oklch(0.2745 0.0277 281.43)` | Email input hover/focus/filled bg |
| — (inline) | `#D8DBE9` | `oklch(0.8933 0.0194 276.32)` | Sponsors section top border (light band) |

Every color is also emitted as a CSS variable `--color-<group>-<key>` on `:root` by
the `injectColorsPlugin` in the config (e.g. `var(--color-blue-400)`), which the
`.btn-landing` hover gradient references.

**Character notes:** the palette is a very dark, slightly violet navy; pure white
text; one saturated electric blue. Light sections are *warm-neutral off-white*
(`#F4F5F9`), not pure white — except LaunchSection, which is pure white.

---

## 4. Typography system

### 4.1 Line heights and tracking

```js
lineHeight: {
  "body-sm": "136%", "body-md": "144%",
  "heading-lg": "98%", "heading-md": "108%",
  base: "normal",
},
letterSpacing: { ...defaults, wide: "0.028px" },
```

Headings are *tighter than 1.0* line-height with large negative tracking — the
signature of the GMX look. Get these wrong and the replica reads as a knockoff.

### 4.2 Component classes (verbatim from `fontComponentsPlugin`)

These are Tailwind component classes, not utilities — the landing uses them
everywhere instead of raw size classes.

```css
/* Hero / page-level display — 50px → 100px at sm */
.text-heading-1 {
  @apply text-50 font-medium leading-heading-lg -tracking-[2.6px]
         sm:text-100 sm:-tracking-[5.2px];
}
/* Section titles — 40px → 80px at sm */
.text-heading-2 {
  @apply text-[40px] font-medium leading-heading-lg -tracking-[2.08px]
         sm:text-80 sm:-tracking-[4.16px];
}
/* Card titles — 32px */
.text-heading-3 { @apply text-32 font-medium leading-heading-md -tracking-[0.96px]; }
/* Small card titles — 24px */
.text-heading-4 { @apply text-24 font-medium leading-heading-md -tracking-[0.96px]; }

/* Supporting copy under CTAs */
.text-subheadline {
  @apply text-14 font-medium leading-body-sm text-slate-400 tracking-wide;
}
/* Body copy on dark cards */
.text-description {
  @apply text-16 font-normal leading-body-sm text-slate-400 tracking-wide;
}

/* THE button — every CTA on the page */
.btn-landing {
  @apply bg-blue-400 font-medium text-white transition-colors duration-180;
}
@media (hover: hover) {
  .btn-landing:hover {
    background: linear-gradient(0deg, rgba(9, 10, 21, 0.1) 0%, rgba(9, 10, 21, 0.1) 100%),
                var(--color-blue-400);
  }
  .btn-landing:active {
    background: linear-gradient(0deg, rgba(9, 10, 21, 0.2) 0%, rgba(9, 10, 21, 0.2) 100%),
                var(--color-blue-400);
  }
}
```

Converted to SO4's 16px root: `text-50 → 3.125rem`, `text-100 → 6.25rem`,
`text-80 → 5rem`, `text-32 → 2rem`, `text-24 → 1.5rem`, `text-14 → 0.875rem`,
`text-16 → 1rem`.

### 4.3 Ad-hoc sizes used inside sections

Stat numbers: `30px → 40px (sm)`, medium, `tracking-tight`. Section sub-heads:
`18px → 28px (sm)`, medium, tracking `-0.896px`. Pool card name: `28px` medium,
tracking `-0.896px`. Program card heading: `40px/48px`, tracking `-1.2px`. Sponsors
heading: `40px`, tracking `-1.28px`. Eyebrow/label text: `12px` uppercase,
tracking `0.864px`. Header nav: `14px` medium, tracking `-0.448px`.

---

## 5. Spacing, radius, borders

```js
spacing:      0…96 → "<n>px"          // integer pixel scale, e.g. p-20 = 20px
borderRadius: 0…96 → "<n>px", full: "9999px"
borderWidth:  { "1/2": "0.5px" }      // hairline borders everywhere
```

- **Hairline `border-1/2` (0.5px) in `slate-600`** separates sections and FAQ items —
  this is the single most-copied GMX detail. Tailwind v4 has no fractional border
  utility, so the foundation ships a `border-hairline` utility (0.5px) instead.
- Common radii on the landing: `rounded-8` (buttons, inputs), `rounded-12`
  (sponsor cards), `rounded-20` (feature/pool cards), `rounded-full` (icon chips).
  **SO4's default radius is 0 (sharp)** — the landing look needs the rounded scale;
  this is landing-scoped, not an app-wide change.
- Layout constants: max content width **1200px**, page gutters `px-16 sm:px-40`,
  section rhythm `py-80 sm:py-[120px]`.

## 6. Motion

```js
transitionDuration: { ...defaults, 180: "180ms" }   // the house duration
keyframes.scroll: translateX(0%) → translateX(-50%)  // marquee
animation.scroll: "scroll 60s linear infinite"       // social tweet slider
```

- `duration-180` on every interactive transition.
- `animate-pause` utility (`animation-play-state: paused`) pauses the marquee on hover.
- Hero title rotation: framer-motion `AnimatePresence`, `y: 98 → 0 → -98` with
  `opacity`, `0.25s easeInOut`, word swaps every **2.5s**
  ([`AnimatedTitle.tsx`](https://github.com/gmx-io/gmx-interface/blob/e27759a2835c7dc2197f41b6a6043bf07b935621/landing/src/pages/Home/HeroSection/AnimatedTitle.tsx)).
- Pool cards: `hover:-translate-y-4` with nested parallax on the background lines.

## 7. Breakpoints & dark mode

Stock Tailwind v3 screens (`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`).
The landing is **dark-only** — there is no light variant; `html` is hard-coded
`bg-slate-800`. Two sections intentionally invert to light bands (Launch pure
white, Liquidity/Sponsors `#F4F5F9`) for rhythm.

---

## 8. Mapping: GMX → SO4 tokens

SO4's design system is Tailwind **v4 CSS-first** (`packages/ui/src/styles/globals.css`,
semantic oklch tokens, no config file). GMX's is Tailwind v3 JS config, dark-only,
hex. We therefore **translate, not copy**. Two layers:

### 8.1 Layer 1 — GMX reference palette (added to `globals.css` by this round)

Raw values, namespaced so they never collide with semantic tokens. These are the
*source material* contributors use; the token-usage check does not flag them
(oklch, CSS custom properties).

```css
@theme {
  /* GMX reference palette — see docs/gf_3/001_theme_update.md */
  --color-gmx-slate-950: oklch(0.1545 0.0191 283.94);
  --color-gmx-slate-900: oklch(0.1493 0.0216 278.91);
  --color-gmx-slate-800: oklch(0.2157 0.0294 280.68);
  --color-gmx-slate-700: oklch(0.2510 0.0360 278.84);
  --color-gmx-slate-650: oklch(0.2817 0.0443 277.70);
  --color-gmx-slate-600: oklch(0.3862 0.0663 278.34);
  --color-gmx-slate-500: oklch(0.7242 0.0478 281.04);
  --color-gmx-slate-400: oklch(0.8145 0.0364 282.07);
  --color-gmx-light-150: oklch(0.9705 0.0054 274.97);
  --color-gmx-blue-100:  oklch(0.8136 0.0838 261.37);
  --color-gmx-blue-300:  oklch(0.6651 0.1789 275.83);
  --color-gmx-blue-400:  oklch(0.5099 0.2688 268.08);
  --color-gmx-stroke-primary:  oklch(0.3591 0.0539 277.68);
  --color-gmx-surface-primary: oklch(0.1959 0.0264 276.95);

  --font-landing-sans: "Archivo Variable", "Geist Variable", sans-serif;
  --font-landing-code: "Space Mono", "Geist Mono Variable", monospace;

  --leading-heading-lg: 0.98;
  --leading-heading-md: 1.08;
  --leading-body-sm: 1.36;
  --leading-body-md: 1.44;
}
```

Plus the typography/button component classes from §4.2 as Tailwind v4 `@utility`
rules (`text-heading-1…4`, `text-subheadline`, `text-description`, `btn-landing`),
values converted to the 16px root — and the landing helpers `border-hairline`
(0.5px), `scrollbar-hide`, `animate-pause`, and `--animate-scroll` (the 60s
marquee keyframes).

### 8.2 Layer 2 — semantic dark theme (what GF3-001 applies)

> **Current state:** SO4's `ThemeProvider` still toggles `.dark` on `<html>`, but the
> `.dark` token block no longer exists in `globals.css` — dark mode currently falls
> back to light values. GF3-001 (re)introduces the dark theme with GMX-derived
> values. Light theme (`:root`) is untouched this round.

| GMX source | SO4 dark token (`.dark`) | Value |
|---|---|---|
| `slate-900` page bg | `--background`, `--surface-canvas` | `oklch(0.1493 0.0216 278.91)` |
| `slate-950` | `--surface-sunken` | `oklch(0.1545 0.0191 283.94)` |
| `slate-800` cards | `--card`, `--surface-raised`, `--popover`, `--surface-overlay` | `oklch(0.2157 0.0294 280.68)` |
| `slate-650` / `#252635` | `--surface-interactive` | `oklch(0.2817 0.0443 277.70)` |
| `stroke.primary` / `slate-600` | `--border`, `--input` | `oklch(0.3591 0.0539 277.68)` |
| white | `--foreground`, `--text-primary` | `oklch(1 0 0)` |
| `slate-400` | `--text-secondary`, `--muted-foreground` | `oklch(0.8145 0.0364 282.07)` |
| `slate-500` | `--text-tertiary` | `oklch(0.7242 0.0478 281.04)` |
| `blue-400` | `--primary`, `--text-link`, `--ring` | `oklch(0.5099 0.2688 268.08)` |
| white | `--primary-foreground`, `--text-inverse` | `oklch(1 0 0)` |
| `blue-300` | `--accent` (hover states) | `oklch(0.6651 0.1789 275.83)` |
| `blue-400` on dark | `--sidebar-primary`, `--info` | `oklch(0.5099 0.2688 268.08)` |

Trading-state colors (`long`/`short`/`liquidation`, `success`/`warning`/`danger`)
are **not** GMX-landing concepts — GF3-001 keeps SO4's existing values, only
re-balancing their `subtle`/`border` variants to sit correctly on the new dark
surfaces.

## 9. Enforcement & verification hooks

- `bun run check:tokens` (`scripts/check-design-tokens.ts`) scans
  `apps/web/src` + `packages/ui/src` for raw hex / arbitrary sizes — landing code
  must use the `gmx-*` palette utilities and the `text-heading-*` classes, not
  `text-[30px]` or `#2D42FC`.
- `/gallery` (`apps/web/src/features/gallery/components/gallery-page.tsx`) — add the
  landing typography + button set to the gallery when GF3-001 lands.
- Visual regression: `bun run test:e2e -- design-system-visual` — GF3-001 must
  regenerate dark-theme baselines intentionally, with diffs reviewed in PR.
- `DESIGN.md` (repo root) is the token source of truth — any token added to
  `globals.css` is documented there in the same PR (house rule).
