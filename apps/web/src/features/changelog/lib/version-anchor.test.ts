import { describe, expect, it } from "vitest"
import {
  isReleaseHash,
  releasePermalink,
  versionToAnchorId,
} from "./version-anchor"

describe("versionToAnchorId", () => {
  it.each([
    ["0.4.0", "v0-4-0"],
    ["12.34.56", "v12-34-56"],
    ["2.0.0-rc.12", "v2-0-0-rc-12"],
    ["1.5.0-beta.2+build.9", "v1-5-0-beta-2-build-9"],
  ])("maps %s to %s", (version, anchor) => {
    expect(versionToAnchorId(version)).toBe(anchor)
  })

  it.each(["", "v0.4.0", "0.4", "0.4.0/unsafe"])(
    "rejects malformed version %s",
    (version) => {
      expect(() => versionToAnchorId(version)).toThrow()
    }
  )
})

it("builds an absolute URL that round-trips to the release hash", () => {
  const permalink = releasePermalink("0.4.0", "https://so4.market")
  const url = new URL(permalink)

  expect(url.href).toBe("https://so4.market/changelog#v0-4-0")
  expect(isReleaseHash(url.hash)).toBe(true)
})
