import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AnimatedTitle } from "./animated-title"

type ChangeListener = () => void

function motionPreference(initialMatches = false) {
  let matches = initialMatches
  let listener: ChangeListener | undefined
  const query = {
    get matches() {
      return matches
    },
    addEventListener: vi.fn((_event: string, next: ChangeListener) => {
      listener = next
    }),
    removeEventListener: vi.fn(),
  }

  vi.stubGlobal("matchMedia", () => query)

  return {
    reduceMotion() {
      matches = true
      listener?.()
    },
    query,
  }
}

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("AnimatedTitle", () => {
  it("cleans up both the hold interval and an in-flight transition", () => {
    vi.useFakeTimers()
    motionPreference()
    const { unmount } = render(<AnimatedTitle />)

    act(() => vi.advanceTimersByTime(2500))
    expect(screen.getByText("with up to 50x leverage")).toHaveStyle({
      animation: "var(--animate-title-out)",
    })
    expect(vi.getTimerCount()).toBe(2)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("stops immediately when reduced motion is enabled after load", () => {
    vi.useFakeTimers()
    const preference = motionPreference()
    render(<AnimatedTitle />)

    act(() => vi.advanceTimersByTime(2500))
    act(() => preference.reduceMotion())

    expect(screen.getByText("with up to 50x leverage")).toHaveStyle({
      animation: "none",
    })
    expect(vi.getTimerCount()).toBe(0)
    expect(preference.query.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    )
  })
})
