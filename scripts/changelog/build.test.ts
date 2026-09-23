import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  parseChangelog,
  parseMetadataComment,
  releaseToHtml,
} from "./build.ts";

const repoRoot = join(import.meta.dir, "..", "..");

describe("parseMetadataComment", () => {
  it("extracts area and the breaking flag", () => {
    const { text, area, breaking } = parseMetadataComment(
      "Changed a shape. ([#520](https://example.com)) <!-- so4: area=wallet breaking -->"
    );
    expect(text).toBe("Changed a shape. ([#520](https://example.com))");
    expect(area).toBe("wallet");
    expect(breaking).toBe(true);
  });

  it("returns null area for entries without a comment", () => {
    const { text, area, breaking } = parseMetadataComment("Legacy entry.");
    expect(text).toBe("Legacy entry.");
    expect(area).toBeNull();
    expect(breaking).toBe(false);
  });
});

describe("parseChangelog", () => {
  it("parses every release from the real CHANGELOG.md with stable structure", async () => {
    const source = await readFile(join(repoRoot, "CHANGELOG.md"), "utf-8");
    const releases = parseChangelog(source);

    expect(releases.length).toBeGreaterThan(1);
    for (const release of releases) {
      expect(release.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const entry of release.entries) {
        expect([
          "added",
          "changed",
          "deprecated",
          "removed",
          "fixed",
          "security",
        ]).toContain(entry.type);
        expect(entry.breaking).toBeTypeOf("boolean");
        expect(entry.text.length).toBeGreaterThan(0);
      }
    }
  });

  it("is deterministic", () => {
    const source = [
      "# Changelog",
      "",
      "## [0.2.0] - 2026-01-02",
      "",
      "### Fixed",
      "",
      "- B fix. ([#2](https://github.com/SO4-Markets/interface/pull/2)) <!-- so4: area=pools -->",
      "",
      "## [0.1.0] - 2026-01-01",
      "",
      "### Added",
      "",
      "- A thing.",
      "",
      "[0.1.0]: https://github.com/SO4-Markets/interface/releases/tag/v0.1.0",
    ].join("\n");

    expect(JSON.stringify(parseChangelog(source))).toBe(
      JSON.stringify(parseChangelog(source))
    );
  });
});

describe("releaseToHtml", () => {
  it("escapes entry text and renders PR links", () => {
    const html = releaseToHtml({
      version: "9.9.9",
      date: "2026-08-25",
      yanked: false,
      entries: [
        {
          type: "fixed",
          area: "trade",
          text: "Escapes <script> & **bold** works.",
          pr: 42,
          breaking: false,
        },
      ],
    });
    expect(html).toContain("<h2>Fixed</h2>");
    expect(html).toContain("&lt;script&gt; &amp;");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://github.com/SO4-Markets/interface/pull/42"');
    expect(html).not.toContain("<script>");
  });
});
