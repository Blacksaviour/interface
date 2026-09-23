// DX-005 — CHANGELOG.md → typed release data.
//
// CHANGELOG.md is the human artifact; this module derives the machine shape
// (docs/dx_1/002_changelog.md §4) from it, never the reverse. Hand-written
// historical entries (no area, no PR link), [YANKED] markers and pre-tooling
// prose are all tolerated; only malformed *headings* fail loudly, with the
// offending line number.

export const ENTRY_TYPES = [
  "added",
  "changed",
  "deprecated",
  "removed",
  "fixed",
  "security",
] as const

export type ChangelogEntryType = (typeof ENTRY_TYPES)[number]

export interface ChangelogEntry {
  type: ChangelogEntryType
  area: string | null
  text: string
  pr: number | null
  breaking: boolean
}

export interface Release {
  version: string
  date: string
  yanked: boolean
  entries: ChangelogEntry[]
}

export interface ChangelogData {
  releases: Release[]
}

const CATEGORY_LABELS: Record<string, ChangelogEntryType> = Object.fromEntries(
  ENTRY_TYPES.map((t) => [t.charAt(0).toUpperCase() + t.slice(1), t]),
)

/**
 * Maps a hand-written `**Label:**` prefix onto a known area. Labels that don't
 * correspond to an area (e.g. "**Chart:**") leave the entry text untouched and
 * yield null — pre-tooling entries must parse, not match a vocabulary.
 */
const AREA_SYNONYMS: Record<string, string> = {
  trade: "trade",
  trading: "trade",
  "core trading": "trade",
  pools: "pools",
  earn: "earn",
  "earn & referrals": "earn",
  referrals: "referrals",
  faucet: "faucet",
  wallet: "wallet",
  docs: "docs",
  documentation: "docs",
  ci: "ci",
  internal: "internal",
}

/** Semver comparison, newest first. 0.10.0 > 0.9.0 — never compare raw strings. */
export function compareVersionsDesc(a: string, b: string): number {
  const ka = versionKey(a)
  const kb = versionKey(b)
  if (ka === kb) return 0
  return ka > kb ? -1 : 1
}

function versionKey(v: string): string {
  // Pad each numeric part so lexicographic comparison == numeric comparison.
  const m = v.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(\+[0-9A-Za-z.-]+)?$/,
  )
  if (!m) return v
  const core = [m[1], m[2], m[3]].map((p) => p.padStart(8, "0")).join(".")
  // A prerelease binds lower than the plain release: give the plain release
  // the highest possible suffix and keep the prerelease identifier sortable.
  const pre = m[4] ? `~${m[4]}` : "\uffff"
  return `${core}-${pre}`
}

const RELEASE_HEADING =
  /^## \[(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)\] - (\d{4}-\d{2}-\d{2})(\s+\[YANKED\])?\s*$/

function fail(lineNo: number, message: string): never {
  throw new Error(`CHANGELOG.md line ${lineNo}: ${message}`)
}

function isValidDate(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso
}

interface ParsedLink {
  text: string
  pr: number | null
}

/** Strips a trailing PR reference: `([#512](url))`, `([#512])`, `(#512)`. */
function extractPr(text: string): ParsedLink {
  const patterns = [
    /\s*\(\[#(\d+)\]\([^)]*\)\)\s*$/,
    /\s*\(\[#(\d+)\]\)\s*$/,
    /\s*\(#(\d+)\)\s*$/,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) return { text: text.slice(0, m.index).trimEnd(), pr: Number(m[1]) }
  }
  return { text, pr: null }
}

/** Extracts a leading `**Area:**` prefix when it names a known area. */
function extractArea(text: string): { text: string; area: string | null } {
  const m = text.match(/^\*\*([^*]+):\*\*\s+/)
  if (!m) return { text, area: null }
  const area = AREA_SYNONYMS[m[1].toLowerCase()]
  if (!area) return { text, area: null }
  return { text: text.slice(m[0].length).trimStart(), area }
}

export function parseChangelog(markdown: string): ChangelogData {
  const lines = markdown.split("\n")
  const releases: Release[] = []

  let current: Release | null = null
  let category: ChangelogEntryType | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNo = i + 1

    if (line.startsWith("## ")) {
      if (/^## \[Unreleased\]/.test(line)) {
        current = null
        category = null
        continue
      }
      const m = line.match(RELEASE_HEADING)
      if (!m) {
        fail(lineNo, `malformed release heading "${line.trim()}"`)
      }
      const [, version, date, yankedFlag] = m
      if (!isValidDate(date)) {
        fail(lineNo, `invalid release date "${date}"`)
      }
      current = { version, date, yanked: Boolean(yankedFlag), entries: [] }
      category = null
      releases.push(current)
      continue
    }

    if (!current) continue // Title block or [Unreleased] prose.

    if (line.startsWith("### ")) {
      const label = line.slice(4).trim()
      const type = CATEGORY_LABELS[label]
      if (!type) {
        fail(
          lineNo,
          `unknown category "${label}" — must be one of ${ENTRY_TYPES.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}`,
        )
      }
      category = type
      continue
    }

    const entryMatch = line.match(/^- (.*)$/)
    if (entryMatch && category) {
      let text = entryMatch[1].trim()
      let breaking = false
      const breakingMatch = text.match(/^\*\*(BREAKING[^*]*):\*\*\s*/i)
      if (breakingMatch) {
        breaking = true
        text = text.slice(breakingMatch[0].length)
      }
      const withPr = extractPr(text)
      const withArea = extractArea(withPr.text)
      current.entries.push({
        type: category,
        area: withArea.area,
        text: withArea.text,
        pr: withPr.pr,
        breaking,
      })
    }
    // Anything else inside a release (prose intro, blank lines, link
    // definitions at the file foot) is human content the JSON doesn't carry.
  }

  releases.sort((a, b) => compareVersionsDesc(a.version, b.version))
  return { releases }
}
