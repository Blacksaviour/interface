import { describe, expect, it, vi } from "vitest"
import {
  SEEN_RELEASE_KEY,
  hasUnseenFeatureRelease,
  markReleaseSeen,
  readSeenRelease,
} from "./seen-release"

describe("seen release storage", () => {
  it("detects only newer major and minor releases", () => {
    expect(hasUnseenFeatureRelease("0.4.0", "0.3.2")).toBe(true)
    expect(hasUnseenFeatureRelease("1.0.0", "0.9.9")).toBe(true)
    expect(hasUnseenFeatureRelease("0.4.1", "0.4.0")).toBe(false)
    expect(hasUnseenFeatureRelease("0.4.0", null)).toBe(false)
  })

  it("reads and writes the stable storage key", () => {
    localStorage.clear()

    markReleaseSeen(localStorage, "0.4.0")
    expect(localStorage.getItem(SEEN_RELEASE_KEY)).toBe("0.4.0")
    expect(readSeenRelease(localStorage)).toBe("0.4.0")
  })

  it("treats unreadable storage as no indicator", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked")
      })

    expect(readSeenRelease(localStorage)).toBeNull()
    getItem.mockRestore()
  })
})
