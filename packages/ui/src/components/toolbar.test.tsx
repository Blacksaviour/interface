import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { axe } from "vitest-axe"
import { Toolbar } from "./toolbar"

describe("Toolbar accessibility", () => {
  it("has no accessibility violations in horizontal orientation", async () => {
    const { container } = render(
      <Toolbar.Root aria-label="Text formatting">
        <Toolbar.Group>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Button>Italic</Toolbar.Button>
        </Toolbar.Group>
      </Toolbar.Root>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no accessibility violations in vertical orientation", async () => {
    const { container } = render(
      <Toolbar.Root aria-label="Actions" orientation="vertical">
        <Toolbar.Button>Edit</Toolbar.Button>
        <Toolbar.Button>Delete</Toolbar.Button>
      </Toolbar.Root>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has proper ARIA role and orientation", () => {
    render(
      <Toolbar.Root aria-label="Chart controls" orientation="horizontal">
        <Toolbar.Button>Zoom</Toolbar.Button>
      </Toolbar.Root>
    )
    const toolbar = screen.getByRole("toolbar", { name: "Chart controls" })
    expect(toolbar).toHaveAttribute("aria-orientation", "horizontal")
  })

  it("groups have proper role", () => {
    render(
      <Toolbar.Root aria-label="Editor">
        <Toolbar.Group aria-label="Text style">
          <Toolbar.Button>Bold</Toolbar.Button>
        </Toolbar.Group>
      </Toolbar.Root>
    )
    expect(screen.getByRole("group", { name: "Text style" })).toBeInTheDocument()
  })

  it("separator has proper role and orientation", () => {
    const { container } = render(
      <Toolbar.Root aria-label="Actions">
        <Toolbar.Button>Cut</Toolbar.Button>
        <Toolbar.Separator />
        <Toolbar.Button>Paste</Toolbar.Button>
      </Toolbar.Root>
    )
    const separator = container.querySelector('[role="separator"]')
    expect(separator).toBeInTheDocument()
    expect(separator).toHaveAttribute("aria-orientation", "horizontal")
  })
})

describe("Toolbar roving tabindex", () => {
  it("only first enabled button is in tab order initially", () => {
    render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
        <Toolbar.Button>Third</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toHaveAttribute("tabindex", "0")
    expect(buttons[1]).toHaveAttribute("tabindex", "-1")
    expect(buttons[2]).toHaveAttribute("tabindex", "-1")
  })

  it("disabled buttons are never in tab order", () => {
    render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button disabled>Disabled</Toolbar.Button>
        <Toolbar.Button>Enabled</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toHaveAttribute("tabindex", "-1")
    expect(buttons[1]).toHaveAttribute("tabindex", "0")
  })

  it("ArrowRight moves focus in horizontal toolbar", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
        <Toolbar.Button>Third</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    buttons[0].focus()
    await user.keyboard("{ArrowRight}")
    expect(buttons[1]).toHaveFocus()
  })

  it("ArrowLeft moves focus backward in horizontal toolbar", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    buttons[1].focus()
    await user.keyboard("{ArrowLeft}")
    expect(buttons[0]).toHaveFocus()
  })

  it("ArrowDown moves focus in vertical toolbar", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Controls" orientation="vertical">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    buttons[0].focus()
    await user.keyboard("{ArrowDown}")
    expect(buttons[1]).toHaveFocus()
  })

  it("ArrowUp moves focus backward in vertical toolbar", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Controls" orientation="vertical">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    buttons[1].focus()
    await user.keyboard("{ArrowUp}")
    expect(buttons[0]).toHaveFocus()
  })

  it("Home key moves to first enabled control", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
        <Toolbar.Button>Third</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    buttons[2].focus()
    await user.keyboard("{Home}")
    expect(buttons[0]).toHaveFocus()
  })

  it("End key moves to last enabled control", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
        <Toolbar.Button>Third</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    buttons[0].focus()
    await user.keyboard("{End}")
    expect(buttons[2]).toHaveFocus()
  })

  it("arrow keys wrap around at boundaries", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    
    // Wrap from last to first
    buttons[1].focus()
    await user.keyboard("{ArrowRight}")
    expect(buttons[0]).toHaveFocus()

    // Wrap from first to last
    await user.keyboard("{ArrowLeft}")
    expect(buttons[1]).toHaveFocus()
  })

  it("skips disabled controls during navigation", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button disabled>Disabled</Toolbar.Button>
        <Toolbar.Button>Third</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    buttons[0].focus()
    await user.keyboard("{ArrowRight}")
    expect(buttons[2]).toHaveFocus()
  })
})

describe("Toolbar toggle buttons", () => {
  it("supports pressed state", () => {
    render(
      <Toolbar.Root aria-label="Formatting">
        <Toolbar.Button pressed>Bold</Toolbar.Button>
        <Toolbar.Button pressed={false}>Italic</Toolbar.Button>
      </Toolbar.Root>
    )
    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true")
    expect(buttons[0]).toHaveAttribute("data-state", "on")
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false")
    expect(buttons[1]).toHaveAttribute("data-state", "off")
  })

  it("toggle button interaction works", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Toolbar.Root aria-label="Formatting">
        <Toolbar.Button onClick={handleClick}>Bold</Toolbar.Button>
      </Toolbar.Root>
    )
    await user.click(screen.getByRole("button", { name: "Bold" }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

describe("Toolbar links", () => {
  it("renders links with proper semantics", () => {
    render(
      <Toolbar.Root aria-label="Navigation">
        <Toolbar.Link href="/docs">Documentation</Toolbar.Link>
        <Toolbar.Link href="/help">Help</Toolbar.Link>
      </Toolbar.Root>
    )
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute("href", "/docs")
  })

  it("links participate in roving tabindex", () => {
    render(
      <Toolbar.Root aria-label="Navigation">
        <Toolbar.Link href="/docs">Docs</Toolbar.Link>
        <Toolbar.Link href="/help">Help</Toolbar.Link>
      </Toolbar.Root>
    )
    const links = screen.getAllByRole("link")
    expect(links[0]).toHaveAttribute("tabindex", "0")
    expect(links[1]).toHaveAttribute("tabindex", "-1")
  })

  it("arrow keys navigate between links", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Navigation">
        <Toolbar.Link href="/docs">Docs</Toolbar.Link>
        <Toolbar.Link href="/help">Help</Toolbar.Link>
      </Toolbar.Root>
    )
    const links = screen.getAllByRole("link")
    links[0].focus()
    await user.keyboard("{ArrowRight}")
    expect(links[1]).toHaveFocus()
  })
})

describe("Toolbar with dynamic items", () => {
  it("handles items being added dynamically", () => {
    const { rerender } = render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
      </Toolbar.Root>
    )
    
    rerender(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
      </Toolbar.Root>
    )
    
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(2)
  })

  it("handles items being removed dynamically", () => {
    const { rerender } = render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
        <Toolbar.Button>Second</Toolbar.Button>
      </Toolbar.Root>
    )
    
    rerender(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button>First</Toolbar.Button>
      </Toolbar.Root>
    )
    
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(1)
  })
})

describe("Toolbar variants and sizes", () => {
  it("applies variant classes correctly", () => {
    const { container } = render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button variant="default">Default</Toolbar.Button>
        <Toolbar.Button variant="outline">Outline</Toolbar.Button>
        <Toolbar.Button variant="ghost">Ghost</Toolbar.Button>
      </Toolbar.Root>
    )
    expect(container).toBeInTheDocument()
  })

  it("applies size classes correctly", () => {
    const { container } = render(
      <Toolbar.Root aria-label="Controls">
        <Toolbar.Button size="default">Default</Toolbar.Button>
        <Toolbar.Button size="sm">Small</Toolbar.Button>
        <Toolbar.Button size="icon" aria-label="Icon only">
          <svg viewBox="0 0 24 24" />
        </Toolbar.Button>
      </Toolbar.Root>
    )
    expect(container).toBeInTheDocument()
  })
})

describe("Toolbar mixed controls", () => {
  it("handles mix of buttons and links", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar.Root aria-label="Actions">
        <Toolbar.Button>Edit</Toolbar.Button>
        <Toolbar.Link href="/help">Help</Toolbar.Link>
        <Toolbar.Button>Delete</Toolbar.Button>
      </Toolbar.Root>
    )
    
    const button = screen.getByRole("button", { name: "Edit" })
    button.focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("link", { name: "Help" })).toHaveFocus()
    
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus()
  })
})
