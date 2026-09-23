import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe } from "vitest-axe"

import { LiveRegion, ZERO_WIDTH_SPACE, useAnnouncer } from "./live-region"

function getRegion(container: HTMLElement) {
  const region = container.querySelector("[data-slot='live-region']")
  if (!region) throw new Error("live region not rendered")
  return region
}

/** Drops the re-announcement marker so assertions can compare the words. */
function strip(text: string) {
  return text.split(ZERO_WIDTH_SPACE).join("")
}

describe("LiveRegion", () => {
  it("announces politely by default", () => {
    const { container } = render(<LiveRegion message="3 positions" />)
    const region = getRegion(container)

    expect(region).toHaveAttribute("aria-live", "polite")
    expect(region).toHaveAttribute("role", "status")
    expect(region).toHaveAttribute("aria-atomic", "true")
    expect(region).toHaveTextContent("3 positions")
  })

  it("uses the alert role in assertive mode", () => {
    const { container } = render(
      <LiveRegion mode="assertive" message="Order rejected" />
    )
    const region = getRegion(container)

    expect(region).toHaveAttribute("aria-live", "assertive")
    expect(region).toHaveAttribute("role", "alert")
  })

  it("stays mounted but silent in off mode", () => {
    const { container } = render(<LiveRegion mode="off" message="Idle" />)
    const region = getRegion(container)

    expect(region).toHaveAttribute("aria-live", "off")
    expect(region).not.toHaveAttribute("role")
    expect(region).toHaveTextContent("Idle")
  })

  it("supports non-atomic append-only regions", () => {
    const { container } = render(
      <LiveRegion atomic={false} relevant="additions" message="Fill received" />
    )
    const region = getRegion(container)

    expect(region).toHaveAttribute("aria-atomic", "false")
    expect(region).toHaveAttribute("aria-relevant", "additions")
  })

  it("allows an explicit role override", () => {
    const { container } = render(<LiveRegion role="log" message="Entry" />)
    expect(getRegion(container)).toHaveAttribute("role", "log")
  })

  it("is visually hidden unless a visible fallback is requested", () => {
    const { container, rerender } = render(<LiveRegion message="Saving…" />)
    expect(getRegion(container)).toHaveClass("sr-only")

    rerender(<LiveRegion visible message="Saving…" />)
    expect(getRegion(container)).not.toHaveClass("sr-only")
  })

  it("renders children when no message is given", () => {
    const { container } = render(
      <LiveRegion>
        <span>Custom content</span>
      </LiveRegion>
    )
    expect(getRegion(container)).toHaveTextContent("Custom content")
  })

  it("updates its text when the message changes", () => {
    const { container, rerender } = render(<LiveRegion message="1 result" />)
    expect(getRegion(container)).toHaveTextContent("1 result")

    rerender(<LiveRegion message="2 results" />)
    expect(getRegion(container)).toHaveTextContent("2 results")
  })

  it("leaves identical messages untouched without a new announcement key", () => {
    const { container, rerender } = render(
      <LiveRegion announcementKey={1} message="2 results" />
    )
    const before = getRegion(container).textContent

    rerender(<LiveRegion announcementKey={1} message="2 results" />)
    expect(getRegion(container).textContent).toBe(before)
  })

  it("re-announces an identical message when the announcement key changes", () => {
    const { container, rerender } = render(
      <LiveRegion announcementKey={1} message="2 results" />
    )
    expect(getRegion(container).textContent).toBe("2 results")

    rerender(<LiveRegion announcementKey={2} message="2 results" />)
    expect(getRegion(container).textContent).toBe(
      `2 results${ZERO_WIDTH_SPACE}`
    )

    rerender(<LiveRegion announcementKey={3} message="2 results" />)
    expect(getRegion(container).textContent).toBe("2 results")
  })
})

describe("useAnnouncer", () => {
  function Harness() {
    const { message, announcementKey, announce, clear } = useAnnouncer()
    return (
      <>
        <LiveRegion message={message} announcementKey={announcementKey} />
        <button type="button" onClick={() => announce("Order submitted")}>
          Submit
        </button>
        <button type="button" onClick={clear}>
          Clear
        </button>
      </>
    )
  }

  it("starts empty", () => {
    const { container } = render(<Harness />)
    expect(getRegion(container).textContent).toBe("")
  })

  it("announces and re-announces the same message", async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Submit" }))
    const first = getRegion(container).textContent
    expect(strip(first)).toBe("Order submitted")

    await user.click(screen.getByRole("button", { name: "Submit" }))
    const second = getRegion(container).textContent
    expect(strip(second)).toBe("Order submitted")
    // Same words, different text node — which is what makes a screen reader
    // speak the message a second time.
    expect(second).not.toBe(first)
  })

  it("clears the region", async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Submit" }))
    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(strip(getRegion(container).textContent)).toBe("")
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<Harness />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
