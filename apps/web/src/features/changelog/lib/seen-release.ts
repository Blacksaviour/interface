export const SEEN_RELEASE_KEY = "so4:changelog:seen"

function parseCoreVersion(version: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export function readSeenRelease(storage: Storage): string | null {
  try {
    return storage.getItem(SEEN_RELEASE_KEY)
  } catch {
    return null
  }
}

export function markReleaseSeen(storage: Storage, version: string): void {
  try {
    storage.setItem(SEEN_RELEASE_KEY, version)
  } catch {
    // Storage may be unavailable in private browsing. Dismissal still succeeds.
  }
}

export function hasUnseenFeatureRelease(
  newestVersion: string,
  seenVersion: string | null
): boolean {
  if (seenVersion === null) return false

  const newest = parseCoreVersion(newestVersion)
  const seen = parseCoreVersion(seenVersion)
  if (!newest || !seen || newest[2] !== 0) return false

  return newest[0] > seen[0] || (newest[0] === seen[0] && newest[1] > seen[1])
}
