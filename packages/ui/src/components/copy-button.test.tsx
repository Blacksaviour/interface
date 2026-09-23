import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe } from "vitest-axe"
import { CopyButton } from "./copy-button"

describe("CopyButton", () => {
  let originalClipboard: PropertyDescriptor | undefined
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard")
    writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.useRealTimers()
    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", originalClipboard)
    } else {
      delete (navigator as { clipboard?: Clipboard }).clipboard
    }
    vi.restoreAllMocks()
  })

  it("has no accessibility violations in icon-only mode", async () => {
    const { container } = render(
      <CopyButton value="GABC123" label="Copy address" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no accessibility violations with visible label", async () => {
    const { container } = render(
      <CopyButton value="GABC123" label="Copy address">
        Copy
      </CopyButton>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("uses label as accessible name in icon-only mode", () => {
    render(<CopyButton value="GABC123" label="Copy address" />)
    expect(
      screen.getByRole("button", { name: "Copy address" })
    ).toBeInTheDocument()
  })

  it("copies value to clipboard on click", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const clipboardWrite = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined)
    render(<CopyButton value="GABC123" label="Copy" />)

    await user.click(screen.getByRole("button", { name: "Copy" }))

    expect(clipboardWrite).toHaveBeenCalledWith("GABC123")
  })

  it("announces success politely", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CopyButton value="test" label="Copy" />)

    await user.click(screen.getByRole("button", { name: "Copy" }))

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("Copied!")
  })

  it("shows failure state when clipboard rejects", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied")
    )
    render(<CopyButton value="test" label="Copy" />)

    await user.click(screen.getByRole("button", { name: "Copy" }))

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("Failed to copy")
  })

  it("resets state after timeout", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CopyButton value="test" label="Copy" resetAfter={500} />)

    await user.click(screen.getByRole("button", { name: "Copy" }))
    expect(screen.getByRole("status")).toHaveTextContent("Copied!")

    act(() => vi.advanceTimersByTime(500))

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("does not fire when disabled", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const clipboardWrite = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined)
    render(<CopyButton value="test" label="Copy" disabled />)

    await user.click(screen.getByRole("button", { name: "Copy" }))
    expect(clipboardWrite).not.toHaveBeenCalled()
  })
})
