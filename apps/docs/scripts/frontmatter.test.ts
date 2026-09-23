import { describe, expect, test } from "bun:test"

import { validateFrontmatter, type Frontmatter } from "../src/lib/frontmatter"

describe("frontmatter schema", () => {
  const valid: Frontmatter = {
    title: "Placing your first trade",
    description:
      "Connect a wallet, pick a market, and submit a market order in a few steps.",
    updated: "2026-08-24",
    status: "stable",
  }

  test("accepts valid frontmatter", () => {
    expect(validateFrontmatter("test.mdx", valid)).toEqual(valid)
  })

  test("accepts optional fields", () => {
    const data = {
      ...valid,
      sidebarLabel: "First trade",
      order: 10,
      tags: ["trading", "onboarding"],
    }
    expect(validateFrontmatter("test.mdx", data)).toEqual(data)
  })

  test("rejects missing title", () => {
    const data = { description: valid.description, updated: valid.updated, status: valid.status }
    expect(() => validateFrontmatter("test.mdx", data)).toThrow("test.mdx")
  })

  test("rejects title > 60 chars", () => {
    const data = { ...valid, title: "x".repeat(61) }
    expect(() => validateFrontmatter("test.mdx", data)).toThrow(
      "title must be ≤ 60 characters",
    )
  })

  test("rejects description < 50 chars", () => {
    const data = { ...valid, description: "Too short." }
    expect(() => validateFrontmatter("test.mdx", data)).toThrow(
      "description must be 50–160 characters",
    )
  })

  test("rejects description > 160 chars", () => {
    const data = { ...valid, description: "x".repeat(161) }
    expect(() => validateFrontmatter("test.mdx", data)).toThrow(
      "description must be 50–160 characters",
    )
  })

  test("rejects non-ISO date", () => {
    const data = { ...valid, updated: "2026/08/24" }
    expect(() => validateFrontmatter("test.mdx", data)).toThrow(
      "updated must be an ISO date",
    )
  })

  test("rejects invalid status", () => {
    const data = { ...valid, status: "published" }
    expect(() => validateFrontmatter("test.mdx", data)).toThrow()
  })

  test("rejects missing description", () => {
    const data = { title: valid.title, updated: valid.updated, status: valid.status }
    expect(() => validateFrontmatter("test.mdx", data)).toThrow("test.mdx")
  })

  test("names the file in the error", () => {
    const data = { title: "", description: valid.description, updated: valid.updated, status: valid.status }
    expect(() => validateFrontmatter("my-page.mdx", data)).toThrow(
      "my-page.mdx",
    )
  })
})
