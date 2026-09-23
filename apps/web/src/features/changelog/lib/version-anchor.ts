const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

/** Derive the permanent DOM id used for a release permalink. */
export function versionToAnchorId(version: string): string {
  if (!SEMVER_PATTERN.test(version)) {
    throw new Error(`Invalid changelog version: ${version}`)
  }

  return `v${version.toLowerCase().replace(/[.+]/g, "-")}`
}

export function releasePermalink(version: string, origin: string): string {
  const anchorId = versionToAnchorId(version)
  return new URL(`/changelog#${anchorId}`, origin).href
}

export function isReleaseHash(hash: string): boolean {
  return /^#v\d+-\d+-\d+(?:-[0-9a-z-]+)*$/i.test(hash)
}
