import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { MAX_FEED_RELEASES, buildAtomFeed, entryId } from "../../../scripts/changelog/feed"
import { parseChangelog } from "../../../scripts/changelog/parse"

const fixture = readFileSync(
  join(__dirname, "fixtures", "changelog.fixture.md"),
  "utf-8",
)

function parseXml(xml: string): Document {
  // DOMParser (via jsdom) throws no exceptions — it reports well-formedness
  // through parsererror elements instead.
  const doc = new DOMParser().parseFromString(xml, "application/xml")
  expect(doc.getElementsByTagName("parsererror").length).toBe(0)
  return doc
}

describe("buildAtomFeed (DX-014)", () => {
  it("produces well-formed Atom 1.0 with the required RFC 4287 elements", () => {
    const doc = parseXml(buildAtomFeed(parseChangelog(fixture)))
    const feed = doc.documentElement
    expect(feed.tagName).toBe("feed")
    expect(feed.getAttribute("xmlns")).toBe("http://www.w3.org/2005/Atom")
    for (const tag of ["id", "title", "updated", "link", "author", "entry"]) {
      expect(
        doc.getElementsByTagName(tag).length,
        `missing <${tag}>`,
      ).toBeGreaterThan(0)
    }
  })

  it("has one entry per non-yanked release, capped at the most recent 50", () => {
    const data = parseChangelog(fixture)
    // The fixture's 0.9.0 release is yanked and must not be announced.
    expect(data.releases.length).toBe(3)
    const doc = parseXml(buildAtomFeed(data))
    expect(doc.getElementsByTagName("entry").length).toBe(2)
    expect(doc.getElementsByTagName("title")[2].textContent).not.toContain(
      "0.9.0",
    )

    const many = {
      releases: Array.from({ length: MAX_FEED_RELEASES + 20 }, (_, i) => ({
        version: `1.${i}.0`,
        date: "2026-01-01",
        yanked: false,
        entries: [],
      })),
    }
    expect(parseXml(buildAtomFeed(many)).getElementsByTagName("entry").length)
      .toBe(MAX_FEED_RELEASES)
  })

  it("derives entry ids only from committed data, so two rebuilds agree", () => {
    const data = parseChangelog(fixture)
    expect(entryId(data.releases[0])).toBe("tag:so4.market,2026-08-24:v0.10.0")
    expect(buildAtomFeed(data)).toBe(buildAtomFeed(parseChangelog(fixture)))
  })

  it("converts markdown to escaped XHTML with no raw HTML leak", () => {
    const data = parseChangelog(fixture)
    data.releases[0].entries[0].text =
      'Run `<so4-cli>` for **safe** output. See [docs](https://so4.market/docs) <img src=x onerror=alert(1)>.'
    const xml = buildAtomFeed(data)
    const doc = parseXml(xml)
    expect(doc.getElementsByTagName("content").length).toBeGreaterThan(0)
    const content = new XMLSerializer().serializeToString(
      doc.getElementsByTagName("content")[0],
    )
    expect(content).toContain('type="xhtml"')
    // Markdown constructs became XHTML elements...
    expect(content).toContain("<code>")

    // ...while injection attempts are inert: no img element exists anywhere
    // in the parsed document and the payload survives only as escaped text.
    expect(doc.getElementsByTagName("img").length).toBe(0)
    expect(xml).toContain("&lt;img src=x onerror=alert(1)&gt;.")
    expect(xml).toContain("<code>&lt;so4-cli&gt;</code>")
  })
})
