import {
  CHANGELOG_AREAS,
  CHANGELOG_ENTRY_TYPES
  
  
  
} from "../types"
import type {ChangelogArea, ChangelogData, ChangelogEntryType} from "../types";

const CHANGELOG_URL = "/changelog.json"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isChangelogEntryType(
  value: unknown
): value is ChangelogEntryType {
  return (
    typeof value === "string" &&
    CHANGELOG_ENTRY_TYPES.some((entryType) => entryType === value)
  )
}

export function isChangelogArea(value: unknown): value is ChangelogArea {
  return (
    typeof value === "string" && CHANGELOG_AREAS.some((area) => area === value)
  )
}

function isChangelogEntry(value: unknown): boolean {
  if (!isRecord(value)) return false

  return (
    isChangelogEntryType(value.type) &&
    isChangelogArea(value.area) &&
    typeof value.text === "string" &&
    (value.pr === null ||
      (typeof value.pr === "number" && Number.isInteger(value.pr))) &&
    typeof value.breaking === "boolean"
  )
}

export function isChangelogData(value: unknown): value is ChangelogData {
  if (!isRecord(value) || !Array.isArray(value.releases)) return false

  return value.releases.every(
    (release) =>
      isRecord(release) &&
      typeof release.version === "string" &&
      typeof release.date === "string" &&
      typeof release.yanked === "boolean" &&
      Array.isArray(release.entries) &&
      release.entries.every(isChangelogEntry)
  )
}

export async function getChangelog(): Promise<ChangelogData> {
  const response = await fetch(CHANGELOG_URL)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to load changelog`)
  }

  const data: unknown = await response.json()
  if (!isChangelogData(data)) {
    throw new Error("Invalid changelog format: missing or malformed releases")
  }

  return data
}

export const changelogQueryKey = ["changelog"] as const
