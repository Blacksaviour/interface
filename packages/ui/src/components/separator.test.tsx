import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { axe } from "vitest-axe"

import { Divider, Separator, separatorVariants } from "./separator"

describe("Separator", () => {
  it("exposes the separator role and horizontal orientation by default", () => {
    render(<Separator />)
    const separator = screen.getByRole("separator")
    expect(separator).toHaveAttribute("aria-orientation", "horizontal")
    expect(separator).toHaveAttribute("data-orientation", "horizontal")
  })

  it("exposes vertical orientation", () => {
    render(<Separator orientation="vertical" />)
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical"
    )
  })

  it("sizes itself per orientation", () => {
    const { rerender } = render(<Separator />)
    expect(screen.getByRole("separator")).toHaveClass("h-px", "w-full")

    rerender(<Separator orientation="vertical" />)
    const vertical = screen.getByRole("separator")
    // Stretches in a flex row, and stays visible when the parent has no height.
    expect(vertical).toHaveClass("w-px", "self-stretch", "min-h-4")
  })

  it("hides decorative separators from assistive technology", () => {
    const { container } = render(<Separator decorative />)
    expect(screen.queryByRole("separator")).toBeNull()

    const separator = container.querySelector("[data-slot='separator']")
    expect(separator).toHaveAttribute("role", "none")
    expect(separator).toHaveAttribute("aria-hidden", "true")
    expect(separator).toHaveAttribute("data-decorative", "true")
    expect(separator).not.toHaveAttribute("aria-orientation")
  })

  it("applies each tone", () => {
    const { rerender } = render(<Separator tone="subtle" />)
    expect(screen.getByRole("separator")).toHaveClass("bg-border/50")

    rerender(<Separator tone="default" />)
    expect(screen.getByRole("separator")).toHaveClass("bg-border")

    rerender(<Separator tone="strong" />)
    expect(screen.getByRole("separator")).toHaveClass("bg-text-tertiary")
  })

  it("merges caller classes", () => {
    render(<Separator className="my-4" />)
    expect(screen.getByRole("separator")).toHaveClass("my-4")
  })

  it("produces classes for every tone/orientation pair", () => {
    for (const tone of ["subtle", "default", "strong"] as const) {
      for (const orientation of ["horizontal", "vertical"] as const) {
        expect(separatorVariants({ tone, orientation })).toBeTruthy()
      }
    }
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <div>
        <p>Above</p>
        <Separator />
        <p>Below</p>
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe("Divider", () => {
  it("renders its label as text", () => {
    render(<Divider label="or" />)
    expect(screen.getByText("or")).toBeInTheDocument()
  })

  it("splits the rule around a centered label", () => {
    const { container } = render(<Divider label="or" />)
    const divider = container.querySelector("[data-slot='divider']")
    expect(divider).toHaveAttribute("data-align", "center")
    expect(container.querySelectorAll("[data-slot='separator']")).toHaveLength(2)
  })

  it("keeps a single rule for start and end alignment", () => {
    const { container, rerender } = render(<Divider label="Advanced" align="start" />)
    expect(container.querySelectorAll("[data-slot='separator']")).toHaveLength(1)
    expect(container.querySelector("[data-slot='divider']")).toHaveAttribute(
      "data-align",
      "start"
    )

    rerender(<Divider label="Advanced" align="end" />)
    expect(container.querySelectorAll("[data-slot='separator']")).toHaveLength(1)
  })

  it("keeps its rules out of the accessibility tree", () => {
    render(<Divider label="or" />)
    expect(screen.queryByRole("separator")).toBeNull()
  })

  it("uses a contrast-checked label token", () => {
    const { container } = render(<Divider label="or" />)
    expect(container.querySelector("[data-slot='divider-label']")).toHaveClass(
      "text-text-secondary"
    )
  })

  it("falls back to a plain decorative separator without a label", () => {
    const { container } = render(<Divider />)
    expect(container.querySelector("[data-slot='divider']")).toBeNull()
    expect(container.querySelector("[data-slot='separator']")).toHaveAttribute(
      "aria-hidden",
      "true"
    )
  })

  it("passes the tone through to its rules", () => {
    const { container } = render(<Divider label="or" tone="subtle" />)
    expect(container.querySelector("[data-slot='separator']")).toHaveClass(
      "bg-border/50"
    )
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <form>
        <Divider label="or" />
      </form>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
