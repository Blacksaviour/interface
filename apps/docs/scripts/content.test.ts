import { describe, expect, test } from "bun:test"

import { headingEntries, internalLinks, parsePage } from "./content"

describe("documentation content helpers", () => {
  test("parses frontmatter and stable heading anchors", () => {
    const page = parsePage(
      "/tmp/content/resources/example.mdx",
      "---\ntitle: Example\ndescription: A sufficiently descriptive example page for the content parser test.\nupdated: 2026-08-24\nstatus: stable\nlanding: [one]\n---\n## One {#one}\n\nAnswer [link](/concepts/risk).",
    )
    expect(page.frontmatter.landing).toEqual(["one"])
    expect(headingEntries(page.body)[0]?.id).toBe("one")
    expect(internalLinks(page.body)).toEqual(["/concepts/risk"])
  })
})
