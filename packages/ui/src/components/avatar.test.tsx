import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { axe } from "vitest-axe"
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "./avatar"

describe("Avatar", () => {
  it("renders with fallback when no image src", () => {
    render(<Avatar fallback="AB" />)
    expect(screen.getByText("AB")).toBeInTheDocument()
  })

  it("renders image when src is provided and loads successfully", () => {
    render(
      <Avatar
        src="https://example.com/avatar.jpg"
        alt="User avatar"
        fallback="AB"
      />
    )
    const img = screen.getByRole("img", { name: "User avatar" })
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg")
  })

  it("falls back to fallback content on image load error", async () => {
    const { rerender } = render(
      <Avatar src="invalid.jpg" alt="User" fallback="AB" />
    )
    const img = screen.getByRole("img", { name: "User" })
    expect(img).toBeInTheDocument()

    fireEvent.error(img)
    rerender(<Avatar src="invalid.jpg" alt="User" fallback="AB" />)
    expect(screen.getByText("AB")).toBeInTheDocument()
  })

  it("supports all size variants", () => {
    const sizes = ["xs", "sm", "md", "lg", "xl", "2xl"] as const
    for (const size of sizes) {
      const { container } = render(<Avatar size={size} fallback="A" />)
      const avatar = container.querySelector("[data-slot='avatar']")
      expect(avatar?.className).toContain(`size-`)
    }
  })

  it("forwards ref properly", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<Avatar ref={ref} fallback="A" />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Avatar src="https://example.com/avatar.jpg" alt="User" fallback="AB" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe("AvatarGroup", () => {
  it("renders multiple avatars", () => {
    render(
      <AvatarGroup>
        <Avatar fallback="A" />
        <Avatar fallback="B" />
        <Avatar fallback="C" />
      </AvatarGroup>
    )
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
    expect(screen.getByText("C")).toBeInTheDocument()
  })

  it("respects max visible avatars", () => {
    render(
      <AvatarGroup max={2}>
        <Avatar fallback="A" />
        <Avatar fallback="B" />
        <Avatar fallback="C" />
        <Avatar fallback="D" />
      </AvatarGroup>
    )
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
    expect(screen.queryByText("C")).not.toBeInTheDocument()
    expect(screen.queryByText("D")).not.toBeInTheDocument()
  })

  it("displays overflow count", () => {
    render(
      <AvatarGroup max={2}>
        <Avatar fallback="A" />
        <Avatar fallback="B" />
        <Avatar fallback="C" />
        <Avatar fallback="D" />
      </AvatarGroup>
    )
    expect(screen.getByText("+2")).toBeInTheDocument()
  })

  it("announces hidden member count with aria-label", () => {
    render(
      <AvatarGroup max={2}>
        <Avatar fallback="A" />
        <Avatar fallback="B" />
        <Avatar fallback="C" />
      </AvatarGroup>
    )
    const group = screen.getByRole("group")
    expect(group).toHaveAttribute(
      "aria-label",
      expect.stringContaining("1 hidden")
    )
  })

  it("forwards ref properly", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(
      <AvatarGroup ref={ref}>
        <Avatar fallback="A" />
      </AvatarGroup>
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("supports custom overlap", () => {
    const { container } = render(
      <AvatarGroup overlap={16}>
        <Avatar fallback="A" />
        <Avatar fallback="B" />
      </AvatarGroup>
    )
    const group = container.querySelector("[data-slot='avatar-group']")
    expect(group).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AvatarGroup max={2}>
        <Avatar fallback="A" />
        <Avatar fallback="B" />
        <Avatar fallback="C" />
      </AvatarGroup>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("does not show count when showCount is false", () => {
    render(
      <AvatarGroup max={2} showCount={false}>
        <Avatar fallback="A" />
        <Avatar fallback="B" />
        <Avatar fallback="C" />
      </AvatarGroup>
    )
    expect(screen.queryByText("+1")).not.toBeInTheDocument()
  })
})
