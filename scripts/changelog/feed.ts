// DX-014 — build step: parsed changelog → apps/web/public/changelog.xml.
//
// Emits a valid Atom 1.0 feed (validated against the RFC 4287 required
// element set in apps/web/test/changelog-feed.spec.ts, and checked with
// https://validator.w3.org/feed/ before shipping). One entry per release,
// capped at the most recent 50; yanked releases are excluded because a feed
// is an announcement surface and yanked means "withdrawn".

import { mkdir, readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { parseChangelog, type ChangelogEntry, type Release } from "./parse"
import { escapeXml, tokenizeInline } from "./inline-md"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

export const SITE_URL = "https://so4.market"
export const FEED_ID = `tag:so4.market,2026:changelog`
export const MAX_FEED_RELEASES = 50

function xhtmlForText(nodes: ReturnType<typeof tokenizeInline>): string {
  return nodes
    .map((node) => {
      switch (node.kind) {
        case "text":
          return escapeXml(node.value)
        case "code":
          return `<code>${escapeXml(node.value)}</code>`
        case "bold":
          return `<strong>${xhtmlForText(node.children)}</strong>`
        case "em":
          return `<em>${xhtmlForText(node.children)}</em>`
        case "link":
          return `<a href="${escapeXml(node.href)}">${xhtmlForText(node.children)}</a>`
      }
    })
    .join("")
}

function categoryList(label: string, entries: ChangelogEntry[]): string {
  const items = entries
    .map((e) => {
      const prSuffix = e.pr
        ? ` (<a href="${SITE_URL}/changelog">${escapeXml(`#${e.pr}`)}</a>)`
        : ""
      return `<li>${xhtmlForText(tokenizeInline(e.text))}${prSuffix}</li>`
    })
    .join("")
  return `<h3>${escapeXml(label)}</h3><ul>${items}</ul>`
}

const TYPE_LABELS: Record<string, string> = {
  added: "Added",
  changed: "Changed",
  deprecated: "Deprecated",
  removed: "Removed",
  fixed: "Fixed",
  security: "Security",
}

/** Stable across rebuilds: derived only from committed release data. */
export function entryId(release: Release): string {
  return `tag:so4.market,${release.date}:v${release.version}`
}

function releaseToAtomEntry(release: Release): string {
  const anchor = release.version.replace(/\./g, "-")
  const groups = new Map<string, ChangelogEntry[]>()
  for (const entry of release.entries) {
    const list = groups.get(entry.type) ?? []
    list.push(entry)
    groups.set(entry.type, list)
  }
  const body = [...groups.entries()]
    .map(([type, entries]) =>
      categoryList(TYPE_LABELS[type] ?? type, entries),
    )
    .join("")

  return [
    "    <entry>",
    `      <id>${escapeXml(entryId(release))}</id>`,
    `      <title>Version ${escapeXml(release.version)}${
      release.yanked ? " [YANKED]" : ""
    }</title>`,
    `      <updated>${release.date}T00:00:00Z</updated>`,
    `      <link rel="alternate" href="${SITE_URL}/changelog#v${anchor}" />`,
    `      <content type="xhtml">`,
    `        <div xmlns="http://www.w3.org/1999/xhtml">${body}</div>`,
    `      </content>`,
    "    </entry>",
  ].join("\n")
}

export function buildAtomFeed(data: { releases: Release[] }): string {
  // Newest first already (parser sorts); drop withdrawn releases, then cap.
  const releases = data.releases
    .filter((r) => !r.yanked)
    .slice(0, MAX_FEED_RELEASES)
  const latestDate = releases[0]?.date ?? new Date().toISOString().slice(0, 10)

  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<feed xmlns="http://www.w3.org/2005/Atom">`,
    `  <title>SO4 Market Releases</title>`,
    `  <subtitle>Everything that shipped, newest first.</subtitle>`,
    `  <id>${FEED_ID}</id>`,
    `  <updated>${latestDate}T00:00:00Z</updated>`,
    `  <link rel="self" href="${SITE_URL}/changelog.xml" />`,
    `  <link rel="alternate" href="${SITE_URL}/changelog" />`,
    `  <author><name>SO4 Labs</name></author>`,
    ...releases.map(releaseToAtomEntry),
    `</feed>`,
    ``,
  ].join("\n")
}

async function main() {
  const markdown = await readFile(join(REPO_ROOT, "CHANGELOG.md"), "utf-8")
  const xml = buildAtomFeed(parseChangelog(markdown))
  const outPath = join(REPO_ROOT, "apps", "web", "public", "changelog.xml")
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, xml)
  console.log(
    `✓ changelog.xml → ${outPath.replace(REPO_ROOT, ".")}`,
  )
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (invokedDirectly) {
  main().catch((error) => {
    console.error(`✗ ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  })
}
