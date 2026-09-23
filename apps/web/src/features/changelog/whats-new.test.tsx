import { afterEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import {
  
  fetchNewestReleaseVersion,
  readSeenVersion,
  resetWhatsNewCacheForTests,
  shouldShowIndicator,
  useWhatsNewIndicator,
  writeSeenVersion
} from "./whats-new"
import type {SafeStorage} from "./whats-new";

function throwingStorage(): SafeStorage {
  return {
    getItem() {
      throw new DOMException("Access denied")
    },
    setItem() {
      throw new DOMException("Access denied")
    },
  }
}

afterEach(() => {
  resetWhatsNewCacheForTests()
  vi.restoreAllMocks()
})

describe("shouldShowIndicator", () => {
  it("appears for a minor bump", () => {
    expect(shouldShowIndicator("0.4.0", "0.3.9")).toBe(true)
  })

  it("does not appear for a patch bump", () => {
    expect(shouldShowIndicator("0.4.1", "0.4.0")).toBe(false)
  })

  it("appears for a major bump and not for older releases", () => {
    expect(shouldShowIndicator("1.0.0", "0.9.9")).toBe(true)
    expect(shouldShowIndicator("0.4.0", "1.2.3")).toBe(false)
  })

  it("never appears without a stored version or with corrupt data", () => {
    expect(shouldShowIndicator("0.4.0", null)).toBe(false)
    expect(shouldShowIndicator(null, "0.4.0")).toBe(false)
    expect(shouldShowIndicator("not-a-version", "0.4.0")).toBe(false)
    expect(shouldShowIndicator("0.4.0", "garbage")).toBe(false)
  })
})

describe("storage accessors tolerate throwing localStorage", () => {
  it("readSeenVersion returns null instead of throwing", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(readSeenVersion(throwingStorage())).toBeNull()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("writeSeenVersion swallows failures", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => writeSeenVersion("0.4.0", throwingStorage())).not.toThrow()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("ignores corrupt stored values", () => {
    const storage: SafeStorage = {
      getItem: () => "{corrupt json",
      setItem: () => {},
    }
    expect(readSeenVersion(storage)).toBeNull()
  })
})

describe("useWhatsNewIndicator", () => {
  it("shows the dot for a minor bump over the seen version", async () => {
    const seen = vi
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValue("0.3.0") // newest mocked release is 0.4.0

    const { result } = renderHook(() => useWhatsNewIndicator())
    await waitFor(() => expect(result.current).toBe(true))
    expect(seen).toHaveBeenCalledWith("so4:changelog:seen")
  })

  it("stays off for a patch bump", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("0.4.0")

    const { result } = renderHook(() => useWhatsNewIndicator())
    await waitFor(() => expect(result.current).toBe(false))
  })

  it("renders normally with no indicator and no console error when storage throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Access denied")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Access denied")
    })

    const { result } = renderHook(() => useWhatsNewIndicator())
    // Wait for the (cached) version fetch to settle before asserting.
    await waitFor(() => expect(fetchNewestReleaseVersion()).resolves.toBe("0.4.0"))
    expect(result.current).toBe(false)
    expect(consoleError).not.toHaveBeenCalled()
  })
})
