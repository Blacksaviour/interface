import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { axe } from "vitest-axe"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"

describe("Card", () => {
  it("renders with default variant", () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.querySelector("[data-slot='card']")
    expect(card?.className).toContain("bg-card")
  })

  it("renders all composition parts together", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })

  it("supports all padding variants", () => {
    const { rerender, container } = render(<Card padding="compact">Compact</Card>)
    let card = container.querySelector("[data-slot='card']")
    expect(card?.className).toContain("p-3")

    rerender(<Card padding="default">Default</Card>)
    card = container.querySelector("[data-slot='card']")
    expect(card?.className).toContain("p-4")

    rerender(<Card padding="lg">Large</Card>)
    card = container.querySelector("[data-slot='card']")
    expect(card?.className).toContain("p-6")
  })

  it("supports interactive variant with keyboard focus", () => {
    const { container } = render(<Card variant="interactive">Interactive</Card>)
    const card = container.querySelector("[data-slot='card']")
    expect(card?.className).toContain("interactive")
    expect(card?.className).toContain("hover:")
    expect(card?.className).toContain("focus-visible:")
  })

  it("static cards do not have pointer/hover styling", () => {
    const { container } = render(<Card variant="default">Static</Card>)
    const card = container.querySelector("[data-slot='card']")
    expect(card?.className).not.toContain("hover:bg-surface-interactive")
  })

  it("forwards ref properly", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<Card ref={ref}>Content</Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("composition parts forward refs", () => {
    const headerRef = { current: null as HTMLDivElement | null }
    const titleRef = { current: null as HTMLHeadingElement | null }
    const contentRef = { current: null as HTMLDivElement | null }
    const footerRef = { current: null as HTMLDivElement | null }

    render(
      <>
        <CardHeader ref={headerRef}>Header</CardHeader>
        <CardTitle ref={titleRef}>Title</CardTitle>
        <CardContent ref={contentRef}>Content</CardContent>
        <CardFooter ref={footerRef}>Footer</CardFooter>
      </>
    )

    expect(headerRef.current).toBeInstanceOf(HTMLDivElement)
    expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement)
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement)
    expect(footerRef.current).toBeInstanceOf(HTMLDivElement)
  })
})
