import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { axe } from "vitest-axe"
import { KeyboardShortcut } from "./keyboard-shortcut"

describe("KeyboardShortcut", () => {
  it("renders nothing when keys are not provided", () => {
    const { container } = render(<KeyboardShortcut />)
    expect(container.firstChild).toBeNull()
  })

  it("renders single key", () => {
    render(<KeyboardShortcut keys={["Enter"]} />)
    expect(screen.getByLabelText("Enter")).toBeInTheDocument()
  })

  it("renders multiple keys with plus separator", () => {
    const { container } = render(<KeyboardShortcut keys={["Mod", "K"]} />)
    const kbd = container.querySelector("kbd")
    expect(kbd?.textContent).toContain("+")
  })

  it("provides accessible label with all keys", () => {
    render(<KeyboardShortcut keys={["Mod", "Alt", "K"]} />)
    const kbd = screen.getByLabelText(/Ctrl .* Alt .* K/)
    expect(kbd).toHaveAttribute("aria-label")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<KeyboardShortcut keys={["Mod", "K"]} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("supports presentation variants", () => {
    const { rerender, container } = render(
      <KeyboardShortcut keys={["Mod", "K"]} presentation="compact" />
    )
    let kbd = container.querySelector("kbd")
    expect(kbd?.className).toContain("gap-0.5")

    rerender(<KeyboardShortcut keys={["Mod", "K"]} presentation="grouped" />)
    kbd = container.querySelector("kbd")
    expect(kbd?.className).toContain("gap-1")
  })

  it("accepts custom className", () => {
    const { container } = render(
      <KeyboardShortcut keys={["K"]} className="custom-class" />
    )
    const kbd = container.querySelector("kbd")
    expect(kbd?.className).toContain("custom-class")
  })

  it("normalizes modifiers for readability", () => {
    render(<KeyboardShortcut keys={["mod", "shift", "enter"]} platform="mac" />)
    const kbd = screen.getByLabelText("⌘ + ⇧ + ⏎")
    expect(kbd).toBeInTheDocument()
  })
})
