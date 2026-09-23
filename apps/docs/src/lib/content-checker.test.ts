import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { describe, expect, it } from "vitest"
import { checkContent, formatDiagnostics } from "./content-checker"

describe("checkContent", () => {
  it("accepts a valid content tree", () => {
    const root = fixture({
      "content/index.mdx": page("Home", {
        body: "![Diagram](/assets/used.png)",
      }),
      "content/guides/alpha.mdx": page("Alpha"),
      "content/guides/beta.mdx": page("Beta"),
      "content/guides/meta.json": JSON.stringify({
        label: "Guides",
        pages: ["alpha", "beta"],
      }),
      "public/assets/used.png": "asset",
    })

    expect(checkContent({ root, today: "2026-08-28" })).toEqual([])
  })

  it("reports frontmatter schema failures", () => {
    const root = fixture({
      "content/index.mdx":
        "---\ntitle: Home\nupdated: 2026-08-28\n---\n# Home\n",
    })

    expect(messages(root)).toContain(
      'frontmatter - missing required field "description"'
    )
  })

  it("checks nav manifests in both directions", () => {
    const root = fixture({
      "content/guides/alpha.mdx": page("Alpha"),
      "content/guides/meta.json": JSON.stringify({
        label: "Guides",
        pages: ["missing"],
      }),
    })

    const output = messages(root)
    expect(output).toContain('nav - manifest is missing page "alpha"')
    expect(output).toContain('nav - manifest lists missing page "missing"')
  })

  it("reports changed explicit slugs", () => {
    const root = fixture({
      "content/guides/alpha.mdx": page("Alpha", {
        extra: "slug: /guides/renamed\n",
      }),
      "content/guides/meta.json": JSON.stringify({
        label: "Guides",
        pages: ["alpha"],
      }),
    })

    expect(messages(root)).toContain(
      'slug - slug must remain stable at "/guides/alpha"'
    )
  })

  it("reports stale updated dates", () => {
    const root = fixture({
      "content/index.mdx": page("Home", { updated: "2025-01-01" }),
    })

    expect(messages(root)).toContain("updated - updated is stale by")
  })

  it("reports filename convention failures", () => {
    const root = fixture({
      "content/Bad Name.mdx": page("Home"),
    })

    expect(messages(root)).toContain(
      "filename - filename must use lowercase kebab-case or index.mdx"
    )
  })

  it("reports orphaned assets", () => {
    const root = fixture({
      "content/index.mdx": page("Home"),
      "public/assets/unused.png": "asset",
    })

    expect(messages(root)).toContain(
      "orphaned-asset - asset is not referenced by any content page"
    )
  })

  it("reports duplicate titles within a section", () => {
    const root = fixture({
      "content/guides/alpha.mdx": page("Same"),
      "content/guides/beta.mdx": page("Same"),
      "content/guides/meta.json": JSON.stringify({
        label: "Guides",
        pages: ["alpha", "beta"],
      }),
    })

    expect(messages(root)).toContain(
      'duplicate-title - title duplicates content/guides/alpha.mdx within section "guides"'
    )
  })

  it("fixes only updated dates and manifest ordering", () => {
    const root = fixture({
      "content/guides/alpha.mdx": page("Alpha", { updated: "2025-01-01" }),
      "content/guides/beta.mdx": page("Beta"),
      "content/guides/meta.json": JSON.stringify(
        { label: "Guides", pages: ["beta", "alpha"] },
        null,
        2
      ),
      "public/assets/unused.png": "asset",
    })

    checkContent({ root, today: "2026-08-28", fix: true })

    expect(
      fs.readFileSync(path.join(root, "content/guides/alpha.mdx"), "utf8")
    ).toContain("updated: 2026-08-28")
    expect(
      fs.readFileSync(path.join(root, "content/guides/meta.json"), "utf8")
    ).toBe(
      `${JSON.stringify({ label: "Guides", pages: ["alpha", "beta"] }, null, 2)}\n`
    )
    expect(
      fs.readFileSync(path.join(root, "public/assets/unused.png"), "utf8")
    ).toBe("asset")
  })
})

function messages(root: string): string {
  return formatDiagnostics(checkContent({ root, today: "2026-08-28" }))
}

function page(
  title: string,
  options: { body?: string; extra?: string; updated?: string } = {}
): string {
  return `---
title: ${title}
description: ${title} documentation page with enough summary text to satisfy the schema rule.
status: stable
updated: ${options.updated ?? "2026-08-28"}
${options.extra ?? ""}---

# ${title}

${options.body ?? "Content."}
`
}

function fixture(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "docs-content-"))
  for (const [name, content] of Object.entries(files)) {
    const absPath = path.join(root, name)
    fs.mkdirSync(path.dirname(absPath), { recursive: true })
    fs.writeFileSync(absPath, content)
  }
  return root
}
