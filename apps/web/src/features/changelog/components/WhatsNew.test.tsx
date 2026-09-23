import { afterEach, describe, expect, it, vi } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { SEEN_RELEASE_KEY } from "../lib/seen-release"
import { WhatsNew } from "./WhatsNew"
import { server } from "@/test/msw/server"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.ComponentProps<"a"> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

const release = {
  releases: [
    {
      version: "0.4.0",
      date: "2026-08-24",
      yanked: false,
      entries: [
        {
          type: "added",
          area: "trade",
          text: "Trigger orders are now available.",
          pr: 512,
          breaking: false,
        },
      ],
    },
  ],
}

afterEach(() => {
  localStorage.clear()
})

function renderWhatsNew() {
  server.use(http.get("/changelog.json", () => HttpResponse.json(release)))
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <WhatsNew />
    </QueryClientProvider>
  )
}

describe("WhatsNew", () => {
  it("never opens for an unseen release without a user action", async () => {
    localStorage.setItem(SEEN_RELEASE_KEY, "0.3.0")
    renderWhatsNew()

    await screen.findByLabelText("Unseen release")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens on request and exposes the mobile drawer variant", async () => {
    const user = userEvent.setup()
    renderWhatsNew()

    await user.click(screen.getByRole("button", { name: /what's new/i }))

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAttribute("data-mobile-variant", "drawer")
    expect(screen.getByText(/Version 0.4.0/)).toBeInTheDocument()
    expect(
      screen.getByText("Trigger orders are now available.")
    ).toBeInTheDocument()
  })

  it("dismisses with Escape, marks the version seen, and restores focus", async () => {
    const user = userEvent.setup()
    localStorage.setItem(SEEN_RELEASE_KEY, "0.3.0")
    renderWhatsNew()
    const trigger = screen.getByRole("button", { name: /what's new/i })

    await user.click(trigger)
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(localStorage.getItem(SEEN_RELEASE_KEY)).toBe("0.4.0")
    expect(trigger).toHaveFocus()
  })

  it("opens from the Alt+N keyboard shortcut", async () => {
    const user = userEvent.setup()
    renderWhatsNew()

    await user.keyboard("{Alt>}n{/Alt}")

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })
})
