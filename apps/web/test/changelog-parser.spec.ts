import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { compareVersionsDesc, parseChangelog } from "../../../scripts/changelog/parse"
import type { ChangelogData } from "../../../scripts/changelog/parse"

const fixture = readFileSync(
  join(__dirname, "fixtures", "changelog.fixture.md"),
  "utf-8",
)

describe("parseChangelog (DX-005)", () => {
  it("parses the fixture into the asserted snapshot", () => {
    const data = parseChangelog(fixture)
    expect(data).toEqual({
      releases: [
        {
          version: "0.10.0",
          date: "2026-08-24",
          yanked: false,
          entries: [
            {
              type: "added",
              area: null,
              text: "Trigger orders on the trade panel with `take-profit` and stop-loss.",
              pr: 512,
              breaking: false,
            },
            {
              type: "added",
              area: null,
              text: "Order payload now requires a `slippage` field.",
              pr: 515,
              breaking: true,
            },
            {
              type: "fixed",
              area: null,
              text: "Liquidation price line no longer drifts after a theme switch.",
              pr: 514,
              breaking: false,
            },
            {
              type: "fixed",
              area: null,
              text: "Pool APY calculation handles zero-volume periods.",
              pr: null,
              breaking: false,
            },
          ],
        },
        {
          version: "0.9.0",
          date: "2026-08-20",
          yanked: true,
          entries: [
            {
              type: "changed",
              area: null,
              text: "Withdrawn release: gas estimation rework.",
              pr: 501,
              breaking: false,
            },
          ],
        },
        {
          version: "0.3.2",
          date: "2026-08-11",
          yanked: false,
          entries: [
            {
              type: "added",
              area: "trade",
              text: "Long and short perpetual positions with market, limit, and trigger order types.",
              pr: null,
              breaking: false,
            },
            {
              type: "added",
              area: null,
              text: "**Chart:** Real-time price feed with candlestick charting.",
              pr: null,
              breaking: false,
            },
            { type: "security", area: null, text: "Patched dependency audit findings.", pr: null, breaking: false },
          ],
        },
      ],
    })
  })

  it("sorts releases newest-first by SemVer, not string order (0.10.0 above 0.9.0)", () => {
    const data = parseChangelog(fixture)
    expect(data.releases.map((r) => r.version)).toEqual([
      "0.10.0",
      "0.9.0",
      "0.3.2",
    ])
    expect(compareVersionsDesc("0.10.0", "0.9.0")).toBe(-1)
    expect(compareVersionsDesc("1.0.0-beta.1", "1.0.0")).toBe(1)
  })

  it("tolerates missing PR links, absent areas, yanked markers, and prose intros without throwing", () => {
    const data = parseChangelog(fixture)
    // Missing PR link
    expect(data.releases[0].entries[3].pr).toBeNull()
    // Yanked marker parsed
    expect(data.releases[1].yanked).toBe(true)
    // Hand-written historical entry maps **Core Trading:** to an area...
    expect(data.releases[2].entries[0].area).toBe("trade")
    // ...while unknown labels like **Chart:** keep their text and get no area.
    expect(data.releases[2].entries[1].area).toBeNull()
    // Pre-tooling prose intro under the release heading is skipped.
    expect(
      data.releases[2].entries.some((e) => e.text.includes("tooling-era")),
    ).toBe(false)
  })

  it("skips [Unreleased] entirely", () => {
    const data = parseChangelog(fixture)
    expect(data.releases.some((r) => r.version === "Unreleased")).toBe(false)
  })

  it.each([
    ["## [not-a-version] - 2026-08-24\n\n### Added\n\n- thing.\n", 1],
    ["# Changelog\n\n## [0.4.0] - August 24\n\n### Added\n\n- x.\n", 3],
    [
      "# Changelog\n\n## [0.4.0] - 2026-08-24\n\n### Renamed\n\n- x.\n",
      5,
    ],
  ])("fails loudly on malformed input with the offending line number", (md, line) => {
    expect(() => parseChangelog(md)).toThrow(`line ${line}`)
  })

  it("round-trips against the committed app data shape", () => {
    const data: ChangelogData = parseChangelog(fixture)
    for (const release of data.releases) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      for (const entry of release.entries) {
        expect([
          "added",
          "changed",
          "deprecated",
          "removed",
          "fixed",
          "security",
        ]).toContain(entry.type)
      }
    }
  })
})
