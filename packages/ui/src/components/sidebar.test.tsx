import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { Sidebar } from "./sidebar"
import type { NavSection } from "./sidebar"

const SECTIONS: Array<NavSection> = [
  {
    label: "Getting Started",
    pages: [
      { label: "Introduction", href: "/get-started/introduction" },
      { label: "Quickstart", href: "/get-started/quickstart" },
    ],
  },
  {
    label: "Concepts",
    pages: [
      { label: "Risk", href: "/concepts/risk" },
      { label: "Liquidation", href: "/concepts/liquidation" },
    ],
  },
]

const STORAGE: Record<string, string> = {}
const mockStorage = {
  getItem: vi.fn((key: string) => STORAGE[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    STORAGE[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete STORAGE[key]
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(STORAGE)) delete STORAGE[key]
  }),
  get length() {
    return Object.keys(STORAGE).length
  },
  key: vi.fn((_index: number) => null),
}

describe("Sidebar", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockStorage)
    mockStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("renders all sections and items", () => {
    render(<Sidebar sections={SECTIONS} currentPath="/concepts/risk" />)
    expect(screen.getByText("Getting Started")).toBeInTheDocument()
    expect(screen.getByText("Concepts")).toBeInTheDocument()
    expect(screen.getByText("Introduction")).toBeInTheDocument()
    expect(screen.getByText("Risk")).toBeInTheDocument()
  })

  test("marks active item with aria-current", () => {
    render(<Sidebar sections={SECTIONS} currentPath="/concepts/risk" />)
    const active = screen.getByText("Risk")
    expect(active).toHaveAttribute("aria-current", "page")
  })

  test("non-active items do not have aria-current", () => {
    render(<Sidebar sections={SECTIONS} currentPath="/concepts/risk" />)
    const item = screen.getByText("Introduction")
    expect(item).not.toHaveAttribute("aria-current")
  })

  test("section with active item is expanded", () => {
    render(<Sidebar sections={SECTIONS} currentPath="/concepts/risk" />)
    const concepts = screen.getByText("Concepts").closest("[data-section]")
    expect(concepts).toHaveAttribute("aria-expanded", "true")
  })

  test("clicking section toggles expand/collapse", async () => {
    const user = userEvent.setup()
    render(<Sidebar sections={SECTIONS} currentPath="/" />)

    const gettingStarted = screen.getByText("Getting Started")
    await user.click(gettingStarted)

    const section = gettingStarted.closest("[data-section]")
    expect(section).toHaveAttribute("aria-expanded", "false")

    await user.click(gettingStarted)
    expect(section).toHaveAttribute("aria-expanded", "true")
  })

  test("collapse state persists in localStorage", async () => {
    const user = userEvent.setup()
    render(<Sidebar sections={SECTIONS} currentPath="/" />)

    await user.click(screen.getByText("Concepts"))

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "docs-sidebar-collapse",
      expect.any(String),
    )
    const stored = JSON.parse(
      mockStorage.setItem.mock.calls.find(
        (call: Array<unknown>) => call[0] === "docs-sidebar-collapse",
      )?.[1] ?? "[]",
    )
    expect(stored).toContain("Concepts")
  })

  test("keyboard navigation: arrow down moves focus", async () => {
    const user = userEvent.setup()
    render(<Sidebar sections={SECTIONS} currentPath="/" />)

    const firstItem = screen.getByText("Getting Started")
    firstItem.focus()
    await user.keyboard("{ArrowDown}")

    expect(document.activeElement).toBe(screen.getByText("Introduction"))
  })

  test("keyboard navigation: arrow up moves focus", async () => {
    const user = userEvent.setup()
    render(<Sidebar sections={SECTIONS} currentPath="/" />)

    const intro = screen.getByText("Introduction")
    intro.focus()
    await user.keyboard("{ArrowUp}")

    expect(document.activeElement).toBe(screen.getByText("Getting Started"))
  })

  test("keyboard navigation: Home goes to first item", async () => {
    const user = userEvent.setup()
    render(<Sidebar sections={SECTIONS} currentPath="/" />)

    const risk = screen.getByText("Risk")
    risk.focus()
    await user.keyboard("{Home}")

    expect(document.activeElement).toBe(screen.getByText("Getting Started"))
  })

  test("keyboard navigation: End goes to last item", async () => {
    const user = userEvent.setup()
    render(<Sidebar sections={SECTIONS} currentPath="/" />)

    const gettingStarted = screen.getByText("Getting Started")
    gettingStarted.focus()
    await user.keyboard("{End}")

    expect(document.activeElement).toBe(screen.getByText("Liquidation"))
  })
})
