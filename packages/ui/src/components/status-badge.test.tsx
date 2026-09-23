import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StatusBadge, statusBadgeVariants } from "./status-badge"

const variants = [
  "success",
  "warning",
  "danger-subtle",
  "info",
  "info-subtle",
  "muted",
] as const

describe("StatusBadge", () => {
  it.each(variants)("renders the %s semantic variant", (variant) => {
    render(<StatusBadge variant={variant}>{variant}</StatusBadge>)

    expect(screen.getByText(variant)).toHaveAttribute(
      "data-slot",
      "status-badge"
    )
  })

  it("keeps every changelog variant visually distinct", () => {
    const classes = variants.map((variant) => statusBadgeVariants({ variant }))

    expect(new Set(classes).size).toBe(variants.length)
  })
})
