import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { axe } from "vitest-axe"
import { CALLOUT_VARIANTS, Callout } from "./callout"
import type { CalloutVariant } from "./callout"

describe("Callout", () => {
  test("renders with default variant (note)", () => {
    render(<Callout>This is a note.</Callout>)
    const el = screen.getByRole("status")
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent("Note")
    expect(el).toHaveTextContent("This is a note.")
  })

  test.each(CALLOUT_VARIANTS as unknown as Array<CalloutVariant>)(
    "renders variant %s with visible label",
    (variant) => {
      render(<Callout variant={variant}>Content</Callout>)
      const labelMap: Record<CalloutVariant, string> = {
        note: "Note",
        tip: "Tip",
        warning: "Warning",
        caution: "Caution",
      }
      expect(screen.getByText(labelMap[variant])).toBeInTheDocument()
    },
  )

  test("renders custom title", () => {
    render(<Callout variant="tip" title="Pro tip">Content</Callout>)
    expect(screen.getByText("Pro tip")).toBeInTheDocument()
  })

  test("note variant uses role=status (polite)", () => {
    const { unmount } = render(<Callout variant="note">Note content</Callout>)
    expect(screen.getByRole("status")).toBeInTheDocument()
    unmount()
  })

  test("tip variant uses role=status (polite)", () => {
    const { unmount } = render(<Callout variant="tip">Tip content</Callout>)
    expect(screen.getByRole("status")).toBeInTheDocument()
    unmount()
  })

  test("warning variant uses role=alert (assertive)", () => {
    const { unmount } = render(<Callout variant="warning">Warning content</Callout>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
    unmount()
  })

  test("caution variant uses role=alert (assertive)", () => {
    render(<Callout variant="caution">Caution content</Callout>)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  test("nests children content including code blocks", () => {
    render(
      <Callout variant="note">
        <p>Paragraph</p>
        <pre><code>const x = 1</code></pre>
        <ul><li>Item 1</li><li>Item 2</li></ul>
      </Callout>,
    )
    expect(screen.getByText("Paragraph")).toBeInTheDocument()
    expect(screen.getByText("const x = 1")).toBeInTheDocument()
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(screen.getByText("Item 2")).toBeInTheDocument()
  })

  test("passes axe accessibility audit", async () => {
    const { container } = render(
      <Callout variant="warning" title="Caution">
        This action is irreversible.
      </Callout>,
    )
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })

  test("variant label is visually hidden from sighted users via sr-only", () => {
    render(<Callout variant="note">Content</Callout>)
    const srOnly = screen.getByText("Note")
    expect(srOnly).toHaveClass("sr-only")
  })

  test("variant is discernible without colour (visible label present)", () => {
    for (const variant of CALLOUT_VARIANTS) {
      const { unmount } = render(<Callout variant={variant}>Content</Callout>)
      const labelMap: Record<CalloutVariant, string> = {
        note: "Note",
        tip: "Tip",
        warning: "Warning",
        caution: "Caution",
      }
      expect(screen.getByText(labelMap[variant])).toBeInTheDocument()
      unmount()
    }
  })
})
