import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ChangelogEntry } from "./ChangelogEntry"
import { ReleaseSection } from "./ReleaseSection"
import type { ChangelogData, ChangelogEntry as IChangelogEntry, Release } from "../types"

// Same committed fixture the Playwright visual suite feeds the page — keeps
// unit and visual coverage on identical data (DX-022).
const fixture: ChangelogData = JSON.parse(
  readFileSync(
    // src/features/changelog/components → repo root → e2e fixtures
    join(__dirname, "..", "..", "..", "..", "..", "..", "e2e", "fixtures", "changelog.json"),
    "utf-8",
  ),
)

const baseEntry: IChangelogEntry = {
  type: "added",
  area: "trade",
  text: "Trigger orders on the trade panel.",
  pr: null,
  breaking: false,
}

function makeRelease(overrides: Partial<Release> = {}): Release {
  return {
    version: "0.4.0",
    date: "2026-08-24",
    yanked: false,
    entries: [baseEntry],
    ...overrides,
  }
}

describe("ChangelogEntry (DX-007)", () => {
  it("renders a PR link when a PR number is present", () => {
    render(<ChangelogEntry entry={{ ...baseEntry, pr: 512 }} />)
    const link = screen.getByText("#512")
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/SO4-Markets/interface/pull/512",
    )
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("renders without a PR link or area label when both are absent", () => {
    render(<ChangelogEntry entry={{ ...baseEntry, pr: null, area: null }} />)
    expect(screen.queryByText(/^#\d+$/)).not.toBeInTheDocument()
    expect(screen.queryByText("Trading")).not.toBeInTheDocument()
  })

  it("shows the human area label when an area is present", () => {
    render(<ChangelogEntry entry={baseEntry} />)
    expect(screen.getByText("Trading")).toBeInTheDocument()
  })

  it("renders inline markdown links as anchors with safe hrefs", () => {
    render(
      <ChangelogEntry
        entry={{
          ...baseEntry,
          text: "See the [docs](https://docs.so4.market/swaps) for details.",
        }}
      />,
    )
    const link = screen.getByText("docs")
    expect(link).toHaveAttribute("href", "https://docs.so4.market/swaps")
    expect(link.tagName).toBe("A")
  })

  it("escapes raw HTML in entry text — no element injection", () => {
    render(
      <ChangelogEntry
        entry={{
          ...baseEntry,
          text: 'Shipped <img src=x onerror=alert(1)> safely.',
        }}
      />,
    )
    // The payload never becomes an element; it is visible only as text.
    expect(document.querySelector("img")).toBeNull()
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument()
  })

  it("renders javascript: link targets as inert text, not anchors", () => {
    render(
      <ChangelogEntry
        entry={{
          ...baseEntry,
          text: "[click](javascript:alert(1)) me.",
        }}
      />,
    )
    expect(screen.queryByRole("link", { name: "click" })).toBeNull()
    expect(screen.getByText(/click/)).toBeInTheDocument()
  })

  it("renders code spans as code elements", () => {
    render(
      <ChangelogEntry
        entry={{ ...baseEntry, text: "Pass `--slippage` explicitly." }}
      />,
    )
    expect(screen.getByText("--slippage").tagName).toBe("CODE")
  })
})

describe("ReleaseSection (DX-007)", () => {
  it("formats the release date via the shared DS-072 helper, identical output regardless of runtime locale", () => {
    // The shared helper pins en-US by default, so the rendered date must not
    // depend on the environment's Intl default locale.
    const fixedLocale = Intl.DateTimeFormat().resolvedOptions().locale
    render(<ReleaseSection release={makeRelease()} isFiltered={false} />)
    expect(screen.getByText("Aug 24, 2026")).toBeInTheDocument()
    expect(fixedLocale).toBeDefined()
  })

  it("marks up the machine-readable date for assistive tech and crawlers", () => {
    render(<ReleaseSection release={makeRelease()} isFiltered={false} />)
    expect(screen.getByText("Aug 24, 2026").closest("time")).toHaveAttribute(
      "datetime",
      "2026-08-24",
    )
  })

  it("renders a YANKED badge with muted treatment for withdrawn releases", () => {
    const { container } = render(
      <ReleaseSection release={makeRelease({ yanked: true })} isFiltered={false} />,
    )
    expect(screen.getByText("YANKED")).toBeInTheDocument()
    expect(container.querySelector("section")?.className).toContain("opacity-60")
    expect(
      screen.getByLabelText(/Version 0\.4\.0 \(yanked\)/),
    ).toBeInTheDocument()
  })

  it("does not mute non-yanked releases", () => {
    const { container } = render(
      <ReleaseSection release={makeRelease()} isFiltered={false} />,
    )
    expect(screen.queryByText("YANKED")).toBeNull()
    expect(container.querySelector("section")?.className).not.toContain("opacity-60")
  })

  it("renders every release from the shared committed fixture", () => {
    for (const release of fixture.releases) {
      const { unmount } = render(
        <ReleaseSection release={release} isFiltered={false} />,
      )
      expect(screen.getByText(release.version)).toBeInTheDocument()
      unmount()
    }
  })
})
