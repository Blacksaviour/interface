import { describe, expect, it } from "vitest"
import { cleanFormatUsd, percentFormat, shortFormat, shortFormatUsd } from "./formatters"

describe("shortFormat", () => {
  it("leaves values under 1,000 as-is", () => {
    expect(shortFormat(842)).toBe("842")
    expect(shortFormat(0)).toBe("0")
  })

  it("formats thousands as K, trimming a trailing .0", () => {
    expect(shortFormat(230_000)).toBe("230K")
    expect(shortFormat(1_000)).toBe("1K")
  })

  it("formats millions as M, keeping one decimal when not whole", () => {
    expect(shortFormat(5_200_000)).toBe("5.2M")
    expect(shortFormat(2_000_000)).toBe("2M")
  })

  it("formats billions as B", () => {
    expect(shortFormat(1_400_000_000)).toBe("1.4B")
  })

  it("rounds sub-thousand fractional values", () => {
    expect(shortFormat(842.6)).toBe("843")
  })
})

describe("shortFormatUsd", () => {
  it("prefixes shortFormat with a dollar sign", () => {
    expect(shortFormatUsd(230_000)).toBe("$230K")
  })
})

describe("cleanFormatUsd", () => {
  it("space-groups thousands instead of comma-grouping", () => {
    expect(cleanFormatUsd(157_000_000)).toBe("$157 000 000")
  })

  it("rounds to the nearest whole dollar", () => {
    expect(cleanFormatUsd(1_234.6)).toBe("$1 235")
  })
})

describe("percentFormat", () => {
  it("converts a fraction to a two-decimal percentage", () => {
    expect(percentFormat(0.1465)).toBe("14.65%")
    expect(percentFormat(0)).toBe("0.00%")
  })
})
