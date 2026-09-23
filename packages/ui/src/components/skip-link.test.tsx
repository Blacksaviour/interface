import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe } from "vitest-axe"

import { MAIN_CONTENT_ID, SkipLink } from "./skip-link"

const listeners: Array<(event: MouseEvent) => void> = []

/** Records clicks at the document level — after React's delegated handler. */
function trackClicks() {
  const seen: Array<MouseEvent> = []
  const listener = (event: MouseEvent) => seen.push(event)
  document.addEventListener("click", listener)
  listeners.push(listener)
  return { last: () => seen.at(-1) }
}

afterEach(() => {
  for (const listener of listeners.splice(0)) {
    document.removeEventListener("click", listener)
  }
})

function Page({ targetId = MAIN_CONTENT_ID }: { targetId?: string }) {
  return (
    <>
      <SkipLink targetId={targetId} />
      <nav>
        <a href="/pools">Pools</a>
        <a href="/earn">Earn</a>
      </nav>
      <main id={targetId}>
        <h1>Pools</h1>
      </main>
    </>
  )
}

describe("SkipLink", () => {
  it("labels itself and points at the main region", () => {
    render(<SkipLink />)
    const link = screen.getByRole("link", { name: "Skip to main content" })
    expect(link).toHaveAttribute("href", `#${MAIN_CONTENT_ID}`)
    expect(link).toHaveAttribute("data-slot", "skip-link")
  })

  it("is hidden until focused", () => {
    render(<SkipLink />)
    const link = screen.getByRole("link")
    expect(link).toHaveClass("sr-only")
    // Revealing happens through `focus:` so it needs no state and cannot shift
    // the layout of the shell it sits in.
    expect(link.className).toContain("focus:fixed")
    expect(link.className).toContain("focus:[clip:auto]")
  })

  it("is the first keyboard-focusable element on the page", async () => {
    const user = userEvent.setup()
    render(<Page />)

    await user.tab()
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveFocus()
  })

  it("moves focus to the main region when activated", async () => {
    const user = userEvent.setup()
    render(<Page />)

    await user.tab()
    await user.keyboard("{Enter}")

    const main = document.getElementById(MAIN_CONTENT_ID)
    expect(main).toHaveFocus()
    // Focusable on demand, but never a tab stop.
    expect(main).toHaveAttribute("tabindex", "-1")
  })

  it("does not navigate to the hash when the target exists", async () => {
    const user = userEvent.setup()
    render(<Page />)

    // Listen on the document, i.e. after React's own delegated handler, so the
    // assertion sees the final state of the event.
    const events = trackClicks()
    await user.click(screen.getByRole("link", { name: "Skip to main content" }))

    expect(events.last()?.defaultPrevented).toBe(true)
  })

  it("respects an existing tabindex on the target", async () => {
    const user = userEvent.setup()
    render(
      <>
        <SkipLink />
        <main id={MAIN_CONTENT_ID} tabIndex={0}>
          Content
        </main>
      </>
    )

    await user.click(screen.getByRole("link"))
    expect(document.getElementById(MAIN_CONTENT_ID)).toHaveAttribute(
      "tabindex",
      "0"
    )
  })

  it("falls back to native hash behaviour when the target is missing", async () => {
    const user = userEvent.setup()
    render(<SkipLink targetId="does-not-exist" />)

    const events = trackClicks()
    await user.click(screen.getByRole("link"))

    expect(events.last()?.defaultPrevented).toBe(false)
  })

  it("supports a custom target and label", async () => {
    const user = userEvent.setup()
    render(
      <>
        <SkipLink targetId="orders">Skip to orders</SkipLink>
        <section id="orders">Orders</section>
      </>
    )

    await user.click(screen.getByRole("link", { name: "Skip to orders" }))
    expect(document.getElementById("orders")).toHaveFocus()
  })

  it("still runs a caller-supplied onClick", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <>
        <SkipLink onClick={onClick} />
        <main id={MAIN_CONTENT_ID}>Content</main>
      </>
    )

    await user.click(screen.getByRole("link"))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<Page />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
