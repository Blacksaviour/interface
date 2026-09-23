import type { ChangelogData } from "./types"

/**
 * Shape guard for both generated files (/changelog.json and
 * /changelog.archive.json). Unknown extra fields are tolerated so the render
 * shape can evolve without breaking older deployed bundles.
 */
export function validateChangelogData(data: unknown): data is ChangelogData {
  if (!data || typeof data !== "object") return false
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.releases)) return false
  return obj.releases.every(
    (r: unknown) =>
      r &&
      typeof r === "object" &&
      typeof (r as Record<string, unknown>).version === "string" &&
      typeof (r as Record<string, unknown>).date === "string" &&
      typeof (r as Record<string, unknown>).yanked === "boolean" &&
      Array.isArray((r as Record<string, unknown>).entries)
  )
}
