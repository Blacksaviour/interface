import { describe, expect, it } from "vitest"
import { getPlatform, isEditableTarget, matchesShortcut } from "./shortcuts"

describe("docs shortcuts", () => {
  it("uses platform modifier conventions", () => {
    expect(getPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(
      "mac"
    )
    expect(getPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(
      "windows"
    )
    expect(getPlatform("Mozilla/5.0 (X11; Linux x86_64)")).toBe("linux")
  })

  it("matches Mod to Command on macOS", () => {
    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true })
    expect(matchesShortcut(event, ["Mod", "K"], "mac")).toBe(true)
  })

  it("matches Mod to Control on Windows and Linux", () => {
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
    expect(matchesShortcut(event, ["Mod", "K"], "windows")).toBe(true)
    expect(matchesShortcut(event, ["Mod", "K"], "linux")).toBe(true)
  })

  it("does not treat plain keys as modified shortcuts", () => {
    const event = new KeyboardEvent("keydown", { key: "?", ctrlKey: true })
    expect(matchesShortcut(event, ["?"], "windows")).toBe(false)
  })

  it("detects input, textarea, and contenteditable targets", () => {
    const input = document.createElement("input")
    const textarea = document.createElement("textarea")
    const editable = document.createElement("div")
    editable.contentEditable = "true"

    expect(isEditableTarget(input)).toBe(true)
    expect(isEditableTarget(textarea)).toBe(true)
    expect(isEditableTarget(editable)).toBe(true)
  })
})
