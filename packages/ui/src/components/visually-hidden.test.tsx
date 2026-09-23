import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe } from "vitest-axe"

import { VisuallyHidden } from "./visually-hidden"

describe("VisuallyHidden", () => {
  it("keeps content in the accessibility tree", () => {
    render(<VisuallyHidden>Delete position</VisuallyHidden>)
    expect(screen.getByText("Delete position")).toBeInTheDocument()
  })

  it("renders a span by default", () => {
    render(<VisuallyHidden>Hidden</VisuallyHidden>)
    expect(screen.getByText("Hidden").tagName).toBe("SPAN")
  })

  it("marks the element with its slot", () => {
    render(<VisuallyHidden>Hidden</VisuallyHidden>)
    expect(screen.getByText("Hidden")).toHaveAttribute(
      "data-slot",
      "visually-hidden"
    )
  })

  it("clips content out of flow so layout is unaffected", () => {
    render(<VisuallyHidden>Hidden</VisuallyHidden>)
    // `sr-only` is absolutely positioned and 1x1px — it cannot take part in
    // the surrounding layout.
    expect(screen.getByText("Hidden")).toHaveClass("sr-only")
  })

  it("preserves semantic elements passed via render", () => {
    render(<VisuallyHidden render={<h2 />}>Open positions</VisuallyHidden>)
    expect(
      screen.getByRole("heading", { level: 2, name: "Open positions" })
    ).toBeInTheDocument()
  })

  it("wraps semantic elements without losing the hidden treatment", () => {
    render(<VisuallyHidden render={<h2 />}>Open positions</VisuallyHidden>)
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("sr-only")
  })

  it("merges caller classes", () => {
    render(<VisuallyHidden className="custom">Hidden</VisuallyHidden>)
    expect(screen.getByText("Hidden")).toHaveClass("custom")
  })

  it("is not focusable by default", () => {
    render(<VisuallyHidden>Hidden</VisuallyHidden>)
    expect(screen.getByText("Hidden")).not.toHaveAttribute("data-focusable")
  })

  it("keeps interactive content reachable by keyboard when focusable", async () => {
    const user = userEvent.setup()
    render(
      <VisuallyHidden focusable>
        <a href="#main-content">Jump to content</a>
      </VisuallyHidden>
    )

    await user.tab()
    expect(screen.getByRole("link", { name: "Jump to content" })).toHaveFocus()
  })

  it("reveals focusable content while focus is inside it", () => {
    render(
      <VisuallyHidden focusable>
        <a href="#main-content">Jump to content</a>
      </VisuallyHidden>
    )

    const wrapper = screen.getByRole("link").parentElement
    expect(wrapper).toHaveAttribute("data-focusable", "true")
    // The reveal is applied through `focus-within:` so it never depends on
    // React state, and stays absolutely positioned while visible.
    expect(wrapper?.className).toContain("focus-within:size-auto")
    expect(wrapper?.className).toContain("focus-within:[clip:auto]")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <button type="button">
        <span aria-hidden="true">×</span>
        <VisuallyHidden>Close</VisuallyHidden>
      </button>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
