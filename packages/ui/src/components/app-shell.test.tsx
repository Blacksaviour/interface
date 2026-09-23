import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe } from "vitest-axe"
import { AppShell } from "./app-shell"

describe("AppShell", () => {
  it("renders children within the content area", () => {
    render(
      <AppShell navbar={<nav data-testid="navbar" />}>
        <p data-testid="content">Page content</p>
      </AppShell>
    )
    expect(screen.getByTestId("navbar")).toBeInTheDocument()
    expect(screen.getByTestId("content")).toBeInTheDocument()
  })

  it("renders banner when provided", () => {
    render(
      <AppShell navbar={<nav />} banner={<div data-testid="banner" />}>
        Content
      </AppShell>
    )
    expect(screen.getByTestId("banner")).toBeInTheDocument()
  })

  it("applies full variant class", () => {
    const { container } = render(
      <AppShell variant="full" navbar={<nav />}>
        Content
      </AppShell>
    )
    const shell = container.querySelector("[data-slot='app-shell']")
    expect(shell).toHaveAttribute("data-variant", "full")
  })

  it("applies constrained variant class by default", () => {
    const { container } = render(
      <AppShell navbar={<nav />}>
        Content
      </AppShell>
    )
    const shell = container.querySelector("[data-slot='app-shell']")
    expect(shell).toHaveAttribute("data-variant", "constrained")
  })

  it("accepts a custom maxWidth", () => {
    const { container } = render(
      <AppShell maxWidth="2xl" navbar={<nav />}>
        Content
      </AppShell>
    )
    const content = container.querySelector("[data-slot='app-shell-content']")
    expect(content).toBeTruthy()
  })

  it("renders the content area as the main landmark", () => {
    render(
      <AppShell navbar={<nav />}>
        <h1>Pools</h1>
      </AppShell>
    )
    const main = screen.getByRole("main")
    expect(main).toHaveAttribute("id", "main-content")
    // Programmatically focusable for the skip link and post-navigation focus,
    // without becoming a tab stop.
    expect(main).toHaveAttribute("tabindex", "-1")
  })

  it("accepts a custom main id", () => {
    render(
      <AppShell navbar={<nav />} mainId="page-content">
        Content
      </AppShell>
    )
    expect(screen.getByRole("main")).toHaveAttribute("id", "page-content")
  })

  it("renders the skip link ahead of the navbar", async () => {
    const user = userEvent.setup()
    render(
      <AppShell navbar={<nav><a href="/pools">Pools</a></nav>}>
        <h1>Pools</h1>
      </AppShell>
    )

    await user.tab()
    expect(
      screen.getByRole("link", { name: "Skip to main content" })
    ).toHaveFocus()
  })

  it("skips the skip link and landmark when nested", () => {
    render(
      <AppShell navbar={<nav />} skipLink={false} landmark={false}>
        Content
      </AppShell>
    )
    expect(screen.queryByRole("link", { name: /skip to main content/i })).toBeNull()
    expect(screen.queryByRole("main")).toBeNull()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AppShell navbar={<nav aria-label="Main" />}>
        <h1>Content</h1>
      </AppShell>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})