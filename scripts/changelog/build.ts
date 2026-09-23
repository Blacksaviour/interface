/**
 * DX-005 parser + publisher: turns the human artifact (CHANGELOG.md) into the
 * machine surfaces the web app consumes, in ONE parse pass:
 *
 *   apps/web/public/changelog.json          recent window (RECENT_WINDOW releases)
 *   apps/web/public/changelog.archive.json  everything older (DX-012)
 *   apps/web/public/feed.json               JSON Feed 1.1 (DX-015), all releases
 *
 * Determinism contract: regenerating twice over an unchanged CHANGELOG.md must
 * produce byte-identical output. No clocks, no randomness — every date comes
 * from the source document and object key order is fixed by construction.
 *
 * Usage: bun run changelog:build
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { renderInlineMarkdown } from "./lib/markdown.ts";

const repoRoot = join(import.meta.dir, "..", "..");
const changelogPath = join(repoRoot, "CHANGELOG.md");
const webPublicDir = join(repoRoot, "apps", "web", "public");

/** How many releases ship in the initial payload (spec §5). */
const RECENT_WINDOW = 10;

const SITE_URL = "https://so4.market";
const GITHUB_REPO = "https://github.com/SO4-Markets/interface";
const FEED_TITLE = "SO4 Market Releases";
const FEED_DESCRIPTION =
  "Release notes for SO4 Market: what shipped, newest first.";

const TYPE_ORDER = [
  "added",
  "changed",
  "deprecated",
  "removed",
  "fixed",
  "security",
] as const;

export type ChangelogEntryType = (typeof TYPE_ORDER)[number];

export interface ParsedEntry {
  type: ChangelogEntryType;
  area: string;
  text: string;
  pr: number | null;
  breaking: boolean;
}

export interface ParsedRelease {
  version: string;
  date: string;
  yanked: boolean;
  entries: ParsedEntry[];
}

export interface ChangelogFile {
  releases: ParsedRelease[];
  hasArchive?: boolean;
}

/**
 * Entry-line metadata convention
 * ------------------------------
 * CHANGELOG.md stays the human artifact; structured metadata rides along in a
 * trailing HTML comment that renders invisibly on GitHub:
 *
 *     - Fixed a drift. ([#514](…)) <!-- so4: area=trade -->
 *     - Changed a shape. ([#520](…)) <!-- so4: area=wallet breaking -->
 *
 * `breaking` is a bare flag; `area` takes one of the nine known areas.
 * Entries without a comment (hand-written history) get area "general".
 */
const META_COMMENT = /<!--\s*so4:\s*([^>]*?)\s*-->\s*$/;
const PR_LINK = /\[#(\d+)\]\(([^)]+)\)/g;

export function parseMetadataComment(line: string): {
  text: string;
  area: string | null;
  breaking: boolean;
} {
  const match = line.match(META_COMMENT);
  if (!match) return { text: line.trim(), area: null, breaking: false };

  const area: { value: string | null } = { value: null };
  let breaking = false;
  for (const token of match[1].split(/\s+/).filter(Boolean)) {
    const [key, value] = token.split("=");
    if (key === "area" && value) area.value = value;
    else if (key === "breaking" && value === undefined) breaking = true;
    else if (key === "breaking") breaking = value === "true";
  }
  return {
    text: line.slice(0, match.index).trim(),
    area: area.value,
    breaking,
  };
}

export function parseChangelog(source: string): ParsedRelease[] {
  const releases: ParsedRelease[] = [];

  const sectionRe = /^## \[(.+?)\] - (\d{4}-\d{2}-\d{2})( \(yanked\))?\s*$/gm;
  const linkRefsMatch = source.match(/\n\[[^\]]+\]: .*/);
  const linkRefsIndex = linkRefsMatch?.index ?? source.length;

  let header: RegExpExecArray | null;
  const headers: Array<RegExpExecArray> = [];
  while ((header = sectionRe.exec(source)) !== null) headers.push(header);

  for (let i = 0; i < headers.length; i++) {
    const [, version, date, yankedFlag] = headers[i];
    const bodyStart = headers[i].index + headers[i][0].length;
    const bodyEnd = Math.min(
      i + 1 < headers.length ? headers[i + 1].index : source.length,
      linkRefsIndex,
    );
    const body = source.slice(bodyStart, bodyEnd);

    const entries: ParsedEntry[] = [];
    let currentType: ChangelogEntryType | null = null;

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();

      const heading = line.match(/^### (.+?)\s*$/);
      if (heading) {
        const candidate = heading[1].toLowerCase() as ChangelogEntryType;
        currentType = TYPE_ORDER.includes(candidate) ? candidate : null;
        continue;
      }

      if (!line.startsWith("- ") || !currentType) continue;

      const { text, area, breaking } = parseMetadataComment(
        line.slice(2),
      );
      if (!text) continue;

      let pr: number | null = null;
      PR_LINK.lastIndex = 0;
      const prMatch = PR_LINK.exec(text);
      if (prMatch) pr = Number(prMatch[1]);

      entries.push({
        type: currentType,
        area: area ?? "general",
        text,
        pr,
        breaking,
      });
    }

    releases.push({
      version,
      date,
      yanked: Boolean(yankedFlag),
      entries,
    });
  }

  return releases;
}

function createAnchor(version: string): string {
  return `#v${version.replace(/\./g, "-")}`;
}

/** Inline-markdown → HTML for one release, mirroring its CHANGELOG section. */
export function releaseToHtml(release: ParsedRelease): string {
  const parts: Array<string> = [];
  const grouped = new Map<ChangelogEntryType, ParsedEntry[]>();

  for (const entry of release.entries) {
    const list = grouped.get(entry.type) ?? [];
    list.push(entry);
    grouped.set(entry.type, list);
  }

  for (const type of TYPE_ORDER) {
    const groupEntries = grouped.get(type);
    if (!groupEntries?.length) continue;
    parts.push(`<h2>${type[0].toUpperCase()}${type.slice(1)}</h2>`);
    parts.push("<ul>");
    for (const entry of groupEntries) {
      let item = renderInlineMarkdown(entry.text);
      if (entry.pr !== null) {
        item += ` (<a href="${prUrl(entry.pr)}">#${entry.pr}</a>)`;
      }
      parts.push(`<li>${item}</li>`);
    }
    parts.push("</ul>");
  }
  return parts.join("\n");
}

function prUrl(pr: number): string {
  return `${GITHUB_REPO}/pull/${pr}`;
}

function serialize(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

async function emit(path: string, contents: string): Promise<number> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf-8");
  return Buffer.byteLength(contents);
}

function buildFeed(releases: ParsedRelease[]): string {
  return serialize({
    version: "https://jsonfeed.org/version/1.1",
    title: FEED_TITLE,
    home_page_url: `${SITE_URL}/`,
    feed_url: `${SITE_URL}/feed.json`,
    description: FEED_DESCRIPTION,
    language: "en",
    items: releases.map((release) => ({
      id: `${SITE_URL}/changelog${createAnchor(release.version)}`,
      url: `${SITE_URL}/changelog${createAnchor(release.version)}`,
      title: `Version ${release.version}`,
      content_html: releaseToHtml(release),
      date_published: `${release.date}T00:00:00Z`,
      _so4: {
        version: release.version,
        yanked: release.yanked,
        breaking: release.entries.some((entry) => entry.breaking),
        entries: release.entries.map((entry) => ({
          type: entry.type,
          area: entry.area,
          pr: entry.pr,
          breaking: entry.breaking,
        })),
      },
    })),
  });
}

async function main(): Promise<void> {
  const source = await readFile(changelogPath, "utf-8");
  const releases = parseChangelog(source);

  if (releases.length === 0) {
    console.error("✗ No releases found in CHANGELOG.md");
    process.exit(1);
  }

  // Newest first is the document order; keep it verbatim everywhere.
  const recent = releases.slice(0, RECENT_WINDOW);
  const archive = releases.slice(RECENT_WINDOW);

  const changelogJson = serialize({
    releases: recent,
    ...(archive.length > 0 ? { hasArchive: true } : {}),
  } satisfies ChangelogFile);
  const archiveJson = serialize({ releases: archive } satisfies ChangelogFile);
  const feedJson = buildFeed(releases);

  const sizes = await Promise.all([
    emit(join(webPublicDir, "changelog.json"), changelogJson),
    emit(join(webPublicDir, "changelog.archive.json"), archiveJson),
    emit(join(webPublicDir, "feed.json"), feedJson),
  ]);

  console.log(`✓ Parsed ${releases.length} release(s): ${recent.length} recent, ${archive.length} archived`);
  console.log(`✓ apps/web/public/changelog.json (${sizes[0]} bytes)`);
  console.log(`✓ apps/web/public/changelog.archive.json (${sizes[1]} bytes)`);
  console.log(`✓ apps/web/public/feed.json (${sizes[2]} bytes)`);
}

const invokedDirectly = process.argv[1]?.endsWith("build.ts");
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
