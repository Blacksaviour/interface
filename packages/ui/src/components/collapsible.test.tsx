import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible"

describe("Collapsible", () => {
  it("connects the trigger to its region with aria relationships", () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
        <CollapsibleContent>
          <button type="button">Nested action</button>
        </CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByRole("button", { name: "Advanced settings" })
    const contentId = trigger.getAttribute("aria-controls")
    const content = document.getElementById(contentId ?? "")

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(content?.tagName).toBe("SECTION")
    expect(content).toHaveAttribute("aria-labelledby", trigger.id)
    expect(content).toHaveAttribute("aria-hidden", "false")
  })

  it("toggles open and closed with pointer and keyboard input", async () => {
    const user = userEvent.setup()
    render(
      <Collapsible>
        <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
        <CollapsibleContent>
          <button type="button">Nested action</button>
        </CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByRole("button", { name: "Advanced settings" })

    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")

    trigger.focus()
    await user.keyboard("{Enter}")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("supports controlled state", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <Collapsible open={false} onOpenChange={onOpenChange}>
        <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
        <CollapsibleContent>
          <button type="button">Nested action</button>
        </CollapsibleContent>
      </Collapsible>
    )

    await user.click(screen.getByRole("button", { name: "Advanced settings" }))

    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("keeps focusable content available without stealing focus from the trigger", async () => {
    const user = userEvent.setup()
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
        <CollapsibleContent>
          <input aria-label="Fee override" />
        </CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByRole("button", { name: "Advanced settings" })
    const input = screen.getByLabelText("Fee override")

    trigger.focus()
    await user.click(input)

    expect(input).toHaveFocus()
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })
})
