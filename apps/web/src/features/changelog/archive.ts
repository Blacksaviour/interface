import { validateChangelogData } from "./validate"
import type { Release } from "./types"

/**
 * DX-012: the archive (/changelog.archive.json) is fetched at most once per
 * session. The successful response is memoised module-wide so remounting the
 * page — or filtering from another mount — never re-downloads it. A failed
 * fetch clears the cache so a retry (button or filter change) can succeed.
 */

let archivePromise: Promise<Array<Release>> | null = null

/** Test hook: forget the cached archive between tests. */
export function resetArchiveCacheForTests(): void {
  archivePromise = null
}

export function loadArchiveOnce(): Promise<Array<Release>> {
  if (!archivePromise) {
    archivePromise = fetchArchive().catch((error) => {
      archivePromise = null
      throw error
    })
  }
  return archivePromise
}

async function fetchArchive(): Promise<Array<Release>> {
  const res = await fetch("/changelog.archive.json")
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to load older releases`)
  }
  const json: unknown = await res.json()
  if (!validateChangelogData(json)) {
    throw new Error("Invalid changelog format: missing or malformed releases")
  }
  return json.releases
}
