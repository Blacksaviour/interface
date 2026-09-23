export type Platform = "mac" | "windows" | "linux"

export interface DocsShortcut {
  id: "search" | "sidebar" | "previous" | "next" | "list"
  label: string
  keys: Array<string>
}

export const docsShortcuts: Array<DocsShortcut> = [
  { id: "search", label: "Open search", keys: ["Mod", "K"] },
  { id: "sidebar", label: "Focus sidebar", keys: ["Mod", "Shift", "S"] },
  { id: "previous", label: "Previous page", keys: ["Alt", "ArrowLeft"] },
  { id: "next", label: "Next page", keys: ["Alt", "ArrowRight"] },
  { id: "list", label: "Show shortcuts", keys: ["?"] },
]

export function getPlatform(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent
): Platform {
  if (/Mac|iPhone|iPad|iPod/.test(userAgent)) return "mac"
  if (/Windows/.test(userAgent)) return "windows"
  return "linux"
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    target.isContentEditable ||
    target.contentEditable === "true" ||
    target.getAttribute("contenteditable") === "true" ||
    target.closest("[contenteditable='true']") !== null
  )
}

export function matchesShortcut(
  event: KeyboardEvent,
  keys: Array<string>,
  platform: Platform
): boolean {
  const normalizedKey = event.key.toLowerCase()
  const wantsMod = keys.some((key) => key.toLowerCase() === "mod")
  const wantsShift = keys.some((key) => key.toLowerCase() === "shift")
  const wantsAlt = keys.some((key) => key.toLowerCase() === "alt")
  const nonModifier = keys.find(
    (key) =>
      !["mod", "shift", "alt", "ctrl", "cmd", "meta"].includes(
        key.toLowerCase()
      )
  )

  if (wantsMod && (platform === "mac" ? !event.metaKey : !event.ctrlKey))
    return false
  if (!wantsMod && (event.metaKey || event.ctrlKey)) return false
  if (event.shiftKey !== wantsShift) return false
  if (event.altKey !== wantsAlt) return false
  if (!nonModifier) return false

  return normalizedKey === nonModifier.toLowerCase()
}
