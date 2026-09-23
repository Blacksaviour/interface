import { CHANGELOG_AREAS, CHANGELOG_TYPES, INTERNAL_AREAS } from "./utils"
import { matchesQuery } from "./utils.search"
import type { ChangelogArea, ChangelogEntry, ChangelogEntryType, ChangelogSearch } from "./types"

/**
 * URL search-param validation for /changelog, shared by the route definition
 * and tests. Unknown or invalid values fall back to the defaults (undefined)
 * instead of throwing, so a hand-edited URL can never crash the page (DX-010).
 */
export function validateChangelogSearch(
  search: Record<string, unknown>
): ChangelogSearch {
  const type = CHANGELOG_TYPES.includes(search.type as ChangelogEntryType)
    ? (search.type as ChangelogEntryType)
    : undefined

  const area = CHANGELOG_AREAS.includes(search.area as ChangelogArea)
    ? (search.area as ChangelogArea)
    : undefined

  const q = typeof search.q === "string" && search.q.length > 0
    ? search.q
    : undefined

  const showInternal =
    search.showInternal === true || search.showInternal === "true"
      ? true
      : undefined

  return { type, area, q, showInternal }
}

/**
 * Does an entry survive the current filters? Internal and CI entries are
 * hidden unless explicitly enabled; releases left with zero visible entries
 * are hidden entirely by the caller.
 */
export function entryMatchesFilters(
  entry: ChangelogEntry,
  search: ChangelogSearch
): boolean {
  if (!search.showInternal && entry.area && INTERNAL_AREAS.includes(entry.area)) {
    return false
  }
  if (search.type && entry.type !== search.type) return false
  if (search.area && entry.area !== search.area) return false
  if (search.q && !matchesQuery(entry.text, search.q)) return false
  return true
}
