import { useRef, useState } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CommandMenu  } from "@workspace/ui/components/command-menu"
import type {CommandMenuGroup} from "@workspace/ui/components/command-menu";

const openBilling = vi.fn()
const openSettings = vi.fn()

const groups: Array<CommandMenuGroup> = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "billing",
        label: "Open billing",
        description: "Manage invoices and payment methods",
        shortcut: ["⌘", "B"],
        onSelect: openBilling,
      },
      {
        id: "settings",
        label: "Open settings",
        description: "Manage account preferences",
        shortcut: ["⌘", ","],
        onSelect: openSettings,
      },
    ],
  },
]

function CommandMenuHarness() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Open commands
      </button>
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        query={query}
        onQueryChange={setQuery}
        groups={groups}
        triggerRef={triggerRef}
      />
    </>
  )
}

afterEach(() => {
  cleanup()
  openBilling.mockClear()
  openSettings.mockClear()
})

describe("CommandMenu", () => {
  it("opens with focus in the search input", async () => {
    const user = userEvent.setup()
    render(<CommandMenuHarness />)

    const trigger = screen.getByRole("button", { name: "Open commands" })
    await user.click(trigger)

    expect(document.activeElement).toBe(
      screen.getByRole("combobox", { name: "Search commands" }),
    )
  })

  it("filters grouped results from the controlled query", async () => {
    const user = userEvent.setup()
    render(<CommandMenuHarness />)
    await user.click(screen.getByRole("button", { name: "Open commands" }))

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "billing")

    expect(screen.getByText("Open billing")).toBeTruthy()
    expect(screen.queryByText("Open settings")).toBeNull()
  })

  it("activates the highlighted result with keyboard input", async () => {
    const user = userEvent.setup()
    render(<CommandMenuHarness />)
    await user.click(screen.getByRole("button", { name: "Open commands" }))

    const input = screen.getByRole("combobox", { name: "Search commands" })
    await user.type(input, "billing")
    await user.keyboard("{ArrowDown}{Enter}")

    expect(openBilling).toHaveBeenCalledOnce()
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("shows the shared empty state for no matches", async () => {
    const user = userEvent.setup()
    render(<CommandMenuHarness />)
    await user.click(screen.getByRole("button", { name: "Open commands" }))

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "unknown")

    expect(screen.getByText("No commands found")).toBeTruthy()
    expect(screen.getByText("Try a different search term.")).toBeTruthy()
  })

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup()
    render(<CommandMenuHarness />)
    const trigger = screen.getByRole("button", { name: "Open commands" })
    await user.click(trigger)

    await user.keyboard("{Escape}")

    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})
