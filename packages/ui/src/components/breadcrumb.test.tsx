import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { axe } from "vitest-axe"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "./breadcrumb"

describe("Breadcrumb", () => {
  it("renders a nav with an ordered list", () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/pools">Pools</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>,
    )
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument()
    expect(screen.getByRole("list")).toBeInTheDocument()
  })

  it("marks the current page with aria-current", () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/pools">Pools</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>
          <BreadcrumbLink as="span">GM Markets</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>,
    )
    const current = screen.getByText("GM Markets")
    expect(current.closest("li")).toHaveAttribute("aria-current", "page")
  })

  it("renders separators between items", () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>
          <BreadcrumbLink as="span">Settings</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>,
    )
    const separators = container.querySelectorAll("[data-slot='breadcrumb-separator']")
    expect(separators).toHaveLength(1)
  })

  it("collapses middle items when maxItems is exceeded", () => {
    render(
      <Breadcrumb maxItems={2}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/pools">Pools</BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>
          <BreadcrumbLink as="span">GM Markets</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>,
    )
    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("GM Markets")).toBeInTheDocument()
    expect(screen.queryByText("Pools")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "More pages" })).toBeInTheDocument()
  })

  it("does not collapse when within maxItems", () => {
    render(
      <Breadcrumb maxItems={5}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>
          <BreadcrumbLink as="span">Page</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>,
    )
    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Page")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "More pages" })).not.toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/pools">Pools</BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>
          <BreadcrumbLink as="span">GM Markets</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
