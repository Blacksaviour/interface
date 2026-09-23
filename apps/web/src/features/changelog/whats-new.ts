import { useEffect, useState } from "react"

/**
 * DX-016: "what's new" indicator state.
 *
 * The newest release version is compared against
 * localStorage["so4:changelog:seen"]. Only major and minor releases raise the
 * indicator; patch releases never do. Every storage access is wrapped in
 * try/catch — absent or unreadable localStorage means NO indicator, never a
 * false positive on every page load in a private window.
 */

export const SEEN_STORAGE_KEY = "so4:changelog:seen"

export interface SafeStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export const browserStorage: SafeStorage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Storage unavailable (private mode, quota, disabled): the indicator
      // silently stays off. Never surface this to the user.
    }
  },
}

function isVersion(value: unknown): value is string {
  return typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value)
}

function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  if (!isVersion(version)) return null
  const [major, minor, patch] = version.split(".").map(Number)
  return { major, minor, patch }
}

/** Read the last acknowledged version. Unreadable or corrupt data → null. */
export function readSeenVersion(storage: SafeStorage = browserStorage): string | null {
  try {
    const raw = storage.getItem(SEEN_STORAGE_KEY)
    return isVersion(raw) ? raw : null
  } catch {
    return null
  }
}

/** Persist the last acknowledged version. Failures are swallowed by design. */
export function writeSeenVersion(version: string, storage: SafeStorage = browserStorage): void {
  try {
    storage.setItem(SEEN_STORAGE_KEY, version)
  } catch {
    // Storage unavailable (private mode, quota, disabled): nothing to clear.
  }
}

/**
 * True when `newest` is a major or minor bump over `seen`. A missing seen
 * version means this browser never opted into tracking — no indicator.
 */
export function shouldShowIndicator(newest: string | null, seen: string | null): boolean {
  const next = parseVersion(newest ?? "")
  const prev = parseVersion(seen ?? "")
  if (!next || !prev) return false
  return next.major > prev.major || (next.major === prev.major && next.minor > prev.minor)
}

let newestPromise: Promise<string | null> | null = null

/** Test hook: forget the memoised fetch between tests. */
export function resetWhatsNewCacheForTests(): void {
  newestPromise = null
}

/**
 * Newest release version from /changelog.json, fetched once per session and
 * resolved to null on any failure — the navbar must never break over this.
 */
export function fetchNewestReleaseVersion(): Promise<string | null> {
  if (!newestPromise) {
    newestPromise = (async () => {
      try {
        const res = await fetch("/changelog.json")
        if (!res.ok) return null
        const json = await res.json()
        const newest = json?.releases?.[0]?.version
        return isVersion(newest) ? newest : null
      } catch {
        return null
      }
    })()
  }
  return newestPromise
}

/**
 * Should the navbar show the dot right now? Storage failures resolve to
 * "no", so an environment without localStorage renders normally.
 */
export function useWhatsNewIndicator(storage: SafeStorage = browserStorage): boolean {
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    let active = true
    // Read synchronously up-front: a throwing accessor must never produce a dot.
    const seen = readSeenVersion(storage)
    fetchNewestReleaseVersion().then((newest) => {
      if (active) setIsNew(shouldShowIndicator(newest, seen))
    })
    return () => {
      active = false
    }
  }, [storage])

  return isNew
}
