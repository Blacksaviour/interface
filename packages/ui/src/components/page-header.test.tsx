import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { axe } from "vitest-axe"
import { PageHeader } from "./page-header"

describe("PageHeader", () => {
  it("renders title and description", () => {
    render(<PageHeader title="Pools" description="Manage your liquidity" />)
    expect(screen.getByText("Pools")).toBeInTheDocument()
    expect(screen.getByText("Manage your liquidity")).toBeInTheDocument()
  })

  it("renders actions slot", () => {
    render(
      <PageHeader
        title="Pools"
        actions={<button data-testid="action">Filter</button>}
      />
    )
    expect(screen.getByTestId("action")).toBeInTheDocument()
  })

  it("renders metadata slot", () => {
    render(
      <PageHeader
        title="Pools"
        metadata={<span data-testid="meta">TVL: $0</span>}
      />
    )
    expect(screen.getByTestId("meta")).toBeInTheDocument()
  })

  it("renders tabs slot", () => {
    render(
      <PageHeader
        title="Earn"
        tabs={<div data-testid="tabs">Tab items</div>}
      />
    )
    expect(screen.getByTestId("tabs")).toBeInTheDocument()
  })

  it("renders breadcrumbs slot", () => {
    render(
      <PageHeader
        title="Page"
        breadcrumbs={<span data-testid="breadcrumbs">Home / Page</span>}
      />
    )
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument()
  })

  it("renders children", () => {
    render(
      <PageHeader title="Page">
        <div data-testid="child">Extra content</div>
      </PageHeader>
    )
    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  it("renders title as ReactNode", () => {
    render(
      <PageHeader title={<span data-testid="custom-title">Custom Title</span>} />
    )
    expect(screen.getByTestId("custom-title")).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <PageHeader title="Test Page" description="A test page description" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})