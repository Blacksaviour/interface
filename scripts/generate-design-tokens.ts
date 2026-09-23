#!/usr/bin/env bun

/**
 * Generate the design token reference page from packages/ui/src/styles/globals.css.
 * Output: apps/docs/content/reference/tokens.generated.mdx
 *
 * Every token documented here is read directly out of globals.css — nothing is
 * retyped by hand — so the page cannot drift from the tokens `check:tokens`
 * (scripts/check-design-tokens.ts) actually enforces. Run with --check to
 * verify the committed file still matches the source (used in CI).
 *
 * Scope: the `@theme inline` block (the app-wide semantic tokens documented in
 * DESIGN.md) plus the `:root` / `.dark` values they resolve to. The namespaced
 * `--color-gmx-*` palette and its landing-only utilities are intentionally
 * excluded — DESIGN.md itself calls that set "source material for the
 * GrantFox 3 theme revamp, not tokens for general app use."
 */

import * as fs from "fs"
import * as path from "path"

// Resolve relative to this file, not process.cwd() — this script is invoked
// both from the repo root (bun run scripts/generate-design-tokens.ts) and
// from apps/docs via a relative package.json script, which have different
// working directories.
const REPO_ROOT = path.join(import.meta.dir, "..")
const CSS_PATH = path.join(REPO_ROOT, "packages/ui/src/styles/globals.css")
const OUTPUT_PATH = path.join(
  REPO_ROOT,
  "apps/docs/content/reference/tokens.generated.mdx",
)

type Declaration = {
  name: string
  value: string
  comment: string | null
}

function extractBlock(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Could not find "${selector} {" in globals.css`)
  let depth = 0
  let i = css.indexOf("{", start)
  const bodyStart = i + 1
  for (; i < css.length; i++) {
    if (css[i] === "{") depth++
    if (css[i] === "}") {
      depth--
      if (depth === 0) return css.slice(bodyStart, i)
    }
  }
  throw new Error(`Unterminated block for "${selector}"`)
}

function parseDeclarations(block: string): Array<Declaration> {
  // Strip nested at-rules (@media, @keyframes) so they don't get parsed as declarations.
  const withoutNested = block.replace(/@[a-z-]+[^{]*\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, "")
  const declarations: Array<Declaration> = []
  const re = /--([a-zA-Z0-9-]+):\s*([^;]+);(\s*\/\*\s*([^*]*)\*\/)?/g
  let match: RegExpExecArray | null
  while ((match = re.exec(withoutNested))) {
    declarations.push({
      name: match[1],
      value: match[2].trim(),
      comment: match[4] ? match[4].trim() : null,
    })
  }
  return declarations
}

function resolveValue(
  value: string,
  scope: Map<string, string>,
  seen = new Set<string>(),
): string {
  const varMatch = value.match(/^var\(--([a-zA-Z0-9-]+)(?:,\s*(.+))?\)$/)
  if (!varMatch) return value
  const [, refName, fallback] = varMatch
  if (seen.has(refName)) return value
  const refValue = scope.get(refName)
  if (refValue === undefined) return fallback ?? value
  seen.add(refName)
  return resolveValue(refValue, scope, seen)
}

function isColor(value: string): boolean {
  return /^oklch\(/.test(value) || /^#[0-9a-f]{3,8}$/i.test(value)
}

function swatch(light: string | null, dark: string | null, rawLight: string, rawDark: string): string {
  const cell = (resolved: string | null, raw: string) => {
    if (resolved)
      return `<span style="display:inline-block;width:1.1em;height:1.1em;border-radius:2px;border:1px solid rgba(128,128,128,0.4);vertical-align:middle;background:${resolved}"></span>`
    const reason = raw === "—" ? "not defined in this theme" : "resolves through the excluded GMX palette"
    return `<span style="display:inline-block;width:1.1em;height:1.1em;border-radius:2px;border:1px dashed rgba(128,128,128,0.4);vertical-align:middle;" title="${reason}"></span>`
  }
  return `${cell(light, rawLight)} ${cell(dark, rawDark)}`
}

function preview(name: string, value: string): string {
  if (name.startsWith("radius-")) {
    return `<span style="display:inline-block;width:2em;height:1.2em;background:oklch(0.6 0.15 264);border-radius:${value}"></span>`
  }
  if (name.startsWith("text-")) {
    return `<span style="font-size:${value}">Ag</span>`
  }
  if (name.startsWith("spacing-") || name.startsWith("gutter-") || name.startsWith("height-")) {
    return `<span style="display:inline-block;width:${value};height:0.6em;background:oklch(0.6 0.15 264);vertical-align:middle"></span>`
  }
  return "—"
}

async function generate() {
  const css = fs.readFileSync(CSS_PATH, "utf-8")

  const themeInline = parseDeclarations(extractBlock(css, "@theme inline"))
  const root = parseDeclarations(extractBlock(css, ":root"))
  const dark = parseDeclarations(extractBlock(css, ".dark"))

  const rootScope = new Map(root.map((d) => [d.name, d.value]))
  // .dark only overrides a subset — unresolved names fall back to :root.
  const darkScope = new Map([...rootScope, ...dark.map((d) => [d.name, d.value] as const)])
  const darkOverridden = new Set(dark.map((d) => d.name))

  function utility(name: string, value: string): string {
    if (name.startsWith("radius-")) return `rounded-${name.slice("radius-".length)}`
    if (name.startsWith("text-")) return `text-${name.slice("text-".length)}`
    if (name.startsWith("spacing-")) return `spacing scale (p-*, m-*, gap-*, ...)`
    if (name.startsWith("height-")) return `h-[var(--${name})]`
    if (name.startsWith("gutter-")) return `px-[var(--${name})]`
    if (name.startsWith("font-")) return `font-${name.slice("font-".length)}`
    if (name.startsWith("color-")) {
      const bare = name.slice("color-".length)
      return `bg-${bare}, text-${bare}, border-${bare}, ...`
    }
    return "—"
  }

  type Row = {
    name: string
    tailwind: string
    lightRaw: string
    darkRaw: string
    lightResolved: string
    darkResolved: string
    comment: string | null
  }

  const rows: Array<Row> = []
  for (const decl of themeInline) {
    const isColorToken = decl.name.startsWith("color-")
    const bare = isColorToken ? decl.name.slice("color-".length) : decl.name

    let lightRaw = decl.value
    let darkRaw = decl.value
    let lightResolved = resolveValue(decl.value, rootScope)
    let darkResolved = resolveValue(decl.value, darkScope)

    if (isColorToken) {
      // decl.value is `var(--bare)` — read the underlying :root / .dark declaration directly.
      lightRaw = rootScope.get(bare) ?? "—"
      lightResolved = rootScope.has(bare) ? resolveValue(lightRaw, rootScope) : "—"
      const definedInDark = darkOverridden.has(bare) || rootScope.has(bare)
      darkRaw = definedInDark ? (darkScope.get(bare) ?? "—") : "—"
      darkResolved = definedInDark ? resolveValue(darkRaw, darkScope) : "—"
    }

    rows.push({
      name: decl.name,
      tailwind: utility(decl.name, decl.value),
      lightRaw,
      darkRaw,
      lightResolved,
      darkResolved,
      comment: decl.comment,
    })
  }

  const colorRows = rows.filter((r) => r.name.startsWith("color-"))
  const scaleRows = rows.filter((r) => !r.name.startsWith("color-"))

  function colorTable(filter: (name: string) => boolean, title: string): string {
    const filtered = colorRows.filter((r) => filter(r.name.slice("color-".length)))
    if (filtered.length === 0) return ""
    const body = filtered
      .map((r) => {
        const bare = r.name.slice("color-".length)
        const lightSwatch = isColor(r.lightResolved) ? r.lightResolved : null
        const darkSwatch = isColor(r.darkResolved) ? r.darkResolved : null
        return `| \`--${bare}\` | ${swatch(lightSwatch, darkSwatch, r.lightRaw, r.darkRaw)} | \`${r.lightRaw}\` | \`${r.darkRaw}\` | \`${r.tailwind}\` |`
      })
      .join("\n")
    return `### ${title}\n\n| Token | Swatch (light · dark) | Light value | Dark value | Tailwind |\n|---|---|---|---|---|\n${body}\n`
  }

  const isSurface = (n: string) => n.startsWith("surface-")
  const isText = (n: string) => n.startsWith("text-")
  const isTradingState = (n: string) =>
    /^(long|short|liquidation|success|warning|info|danger|neutral)(-|$)/.test(n)
  const isChart = (n: string) => n.startsWith("chart-")
  const isSidebar = (n: string) => n.startsWith("sidebar")
  const isCoreAlias = (n: string) =>
    !isSurface(n) && !isText(n) && !isTradingState(n) && !isChart(n) && !isSidebar(n)

  const sections = [
    colorTable(isCoreAlias, "Core aliases"),
    colorTable(isSurface, "Surface roles"),
    colorTable(isText, "Text and icon roles"),
    colorTable(isTradingState, "Trading-state and semantic colors"),
    colorTable(isChart, "Chart colors"),
    colorTable(isSidebar, "Sidebar colors"),
  ]
    .filter(Boolean)
    .join("\n")

  function scaleTable(prefix: string, title: string): string {
    const filtered = scaleRows.filter((r) => r.name.startsWith(prefix))
    if (filtered.length === 0) return ""
    const body = filtered
      .map(
        (r) =>
          `| \`--${r.name}\` | ${preview(r.name, r.lightRaw)} | \`${r.lightRaw}\` | \`${r.tailwind}\` | ${r.comment ?? "—"} |`,
      )
      .join("\n")
    return `### ${title}\n\n| Token | Preview | Value | Tailwind | Notes |\n|---|---|---|---|---|\n${body}\n`
  }

  const scaleSections = [
    scaleTable("radius-", "Radius scale"),
    scaleTable("font-", "Fonts"),
    scaleTable("text-", "Micro-typography scale"),
    scaleTable("spacing-", "Spacing scale"),
    scaleTable("height-", "Control heights"),
    scaleTable("gutter-", "Page gutters"),
  ]
    .filter(Boolean)
    .join("\n")

  const total = rows.length

  const mdx = `---
title: Design tokens
description: Every token in the app-wide theme, its light and dark values, and the Tailwind utility it powers.
updated: 2026-08-25
status: stable
---

This page is generated from [\`packages/ui/src/styles/globals.css\`](https://github.com/SO4-Markets/interface/blob/main/packages/ui/src/styles/globals.css) — the \`@theme inline\` block plus the \`:root\` and \`.dark\` values it resolves to. It cannot drift from the source: \`bun run --cwd apps/docs check:tokens:generated\` (wired into CI) fails the build if this file is out of date. See [Design system](/developers/design-system) for what these roles mean and when to reach for each one; see [\`DESIGN.md\`](https://github.com/SO4-Markets/interface/blob/main/DESIGN.md) for the full written contract.

${total} tokens, in both themes. A dashed swatch means one of two things, distinguished by the raw value column: the token is not defined in that theme at all (\`—\`), or it resolves through the excluded GMX palette (see below) and so cannot be rendered here — see [Design system](/developers/design-system#one-theme-so-far) for what that means for \`surface-*\` and \`text-*\` in light mode specifically.

The \`--color-gmx-*\` palette and its landing-only typography/button utilities are excluded from this page. DESIGN.md documents them as source material for the GrantFox 3 landing theme, not general-purpose tokens — see [\`docs/gf_3/001_theme_update.md\`](https://github.com/SO4-Markets/interface/blob/main/docs/gf_3/001_theme_update.md).

## Colors

${sections}
## Scales

${scaleSections}`

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })

  if (process.argv.includes("--check")) {
    const current = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, "utf-8") : ""
    if (current !== mdx) {
      console.error(
        "Design token reference is stale. Run: bun run generate:design-tokens",
      )
      process.exit(1)
    }
    console.log(`Design token reference matches globals.css (${total} tokens).`)
  } else {
    fs.writeFileSync(OUTPUT_PATH, mdx, "utf-8")
    console.log(`✓ Generated ${OUTPUT_PATH} (${total} tokens)`)
  }
}

generate().catch((err) => {
  console.error("Generation failed:", err)
  process.exit(1)
})
