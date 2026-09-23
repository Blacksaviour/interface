import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { typeToVariant } from "../utils"
import { ChangelogCategoryBadge } from "./ChangelogCategoryBadge"

describe("changelog category badges", () => {
  it.each([
    ["added", "success"],
    ["changed", "info"],
    ["fixed", "info-subtle"],
    ["deprecated", "muted"],
    ["removed", "danger-subtle"],
    ["security", "warning"],
  ] as const)("maps %s to %s", (type, variant) => {
    expect(typeToVariant(type)).toBe(variant)
  })

  it("composes the breaking marker with a category", () => {
    render(<ChangelogCategoryBadge type="added" breaking />)

    expect(screen.getByText("Added")).toBeInTheDocument()
    expect(screen.getByText("Breaking")).toBeInTheDocument()
  })
})
