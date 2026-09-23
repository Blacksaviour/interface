import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { findMatches, highlightMatches, matchesQuery } from "./utils.search"
import { HighlightedText } from "./components/HighlightedText"

describe("Search utilities", () => {
  describe("matchesQuery", () => {
    it("matches exact substrings", () => {
      expect(matchesQuery("Trigger orders", "trigger")).toBe(true)
      expect(matchesQuery("Trigger orders", "orders")).toBe(true)
    })

    it("is case-insensitive", () => {
      expect(matchesQuery("Trigger Orders", "TRIGGER")).toBe(true)
      expect(matchesQuery("trigger orders", "ORDERS")).toBe(true)
    })

    it("is diacritic-insensitive", () => {
      expect(matchesQuery("Café", "cafe")).toBe(true)
      expect(matchesQuery("naïve", "naive")).toBe(true)
    })

    it("returns true for empty query", () => {
      expect(matchesQuery("anything", "")).toBe(true)
    })

    it("returns false for non-matching text", () => {
      expect(matchesQuery("Trigger orders", "xyz")).toBe(false)
    })
  })

  describe("findMatches", () => {
    it("finds single match", () => {
      const matches = findMatches("Trigger orders", "trigger")
      expect(matches.length).toBeGreaterThan(0)
      expect(matches[0].start).toBeLessThan(matches[0].end)
    })

    it("finds multiple matches", () => {
      const matches = findMatches("test test test", "test")
      expect(matches.length).toBeGreaterThanOrEqual(3)
    })

    it("returns empty array for no matches", () => {
      const matches = findMatches("hello world", "xyz")
      expect(matches).toEqual([])
    })

    it("returns empty array for empty query", () => {
      const matches = findMatches("hello world", "")
      expect(matches).toEqual([])
    })
  })

  describe("highlightMatches", () => {
    it("returns text unchanged for empty query", () => {
      const segments = highlightMatches("hello world", "")
      expect(segments).toEqual([["hello world", false]])
    })

    it("highlights single match", () => {
      const segments = highlightMatches("Trigger orders", "trigger")
      expect(segments.length).toBeGreaterThan(1)
      expect(segments.some(([_, isMatch]) => isMatch)).toBe(true)
    })

    it("handles no matches gracefully", () => {
      const segments = highlightMatches("hello world", "xyz")
      expect(segments).toEqual([["hello world", false]])
    })

    it("returns unmatched segments as well", () => {
      const segments = highlightMatches("the quick brown fox", "quick")
      const unmatched = segments.filter(([_, isMatch]) => !isMatch)
      expect(unmatched.length).toBeGreaterThan(0)
    })
  })
})

describe("HighlightedText component", () => {
  it("renders text without highlighting when no query", () => {
    const { container } = render(<HighlightedText text="hello world" />)
    expect(container.textContent).toBe("hello world")
  })

  it("renders highlighted segments", () => {
    const { container } = render(
      <HighlightedText text="Trigger orders" query="trigger" />
    )
    const mark = container.querySelector("mark")
    expect(mark).toBeTruthy()
  })

  it("highlights case-insensitively", () => {
    const { container } = render(
      <HighlightedText text="TRIGGER orders" query="trigger" />
    )
    const mark = container.querySelector("mark")
    expect(mark).toBeTruthy()
  })

  it("preserves non-highlighted text", () => {
    const { container } = render(
      <HighlightedText text="hello world" query="world" />
    )
    expect(container.textContent).toBe("hello world")
    expect(container.querySelector("mark")).toBeTruthy()
  })

  it("applies custom className", () => {
    const { container } = render(
      <HighlightedText text="hello" className="custom-class" />
    )
    expect(container.querySelector("span.custom-class")).toBeTruthy()
  })

  it("highlights multiple occurrences", () => {
    const { container } = render(
      <HighlightedText text="test test test" query="test" />
    )
    const marks = container.querySelectorAll("mark")
    expect(marks.length).toBeGreaterThanOrEqual(3)
  })
})

describe("Search in changelog context", () => {
  it("composes search with other filters", () => {
    const entries = [
      {
        type: "added" as const,
        area: "trade" as const,
        text: "Trigger orders",
        pr: 1,
        breaking: false,
      },
      {
        type: "fixed" as const,
        area: "pools" as const,
        text: "Pool APY calculation",
        pr: 2,
        breaking: false,
      },
    ]

    // Filter by type AND search
    const filtered = entries.filter(
      (e) => e.type === "added" && matchesQuery(e.text, "trigger")
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0].text).toBe("Trigger orders")
  })

  it("handles search with special characters", () => {
    const text = "Fixed: pool#123 issue"
    expect(matchesQuery(text, "pool#123")).toBe(true)
    expect(matchesQuery(text, "pool")).toBe(true)
  })

  it("handles search across version numbers", () => {
    expect(matchesQuery("0.4.0", "0.4")).toBe(true)
    expect(matchesQuery("v0.4.0", "4")).toBe(true)
  })
})
