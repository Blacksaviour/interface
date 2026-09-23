import { readdir, readFile, writeFile, unlink } from "fs/promises";
import { join, dirname } from "path";
import { execSync } from "child_process";

interface ChangelogEntry {
  type: string;
  area: string;
  pr: number;
  breaking: boolean;
  body: string;
}

const VALID_TYPES = ["added", "changed", "deprecated", "removed", "fixed", "security"];
const TYPE_ORDER = ["added", "changed", "deprecated", "removed", "fixed", "security"];
const VALID_AREAS = [
  "trade",
  "pools",
  "earn",
  "referrals",
  "faucet",
  "wallet",
  "docs",
  "ci",
  "internal",
];
const CONVENTIONAL_COMMIT_PREFIXES = [
  "feat:",
  "fix:",
  "chore:",
  "docs:",
  "refactor:",
  "test:",
  "perf:",
  "build:",
  "ci:",
];

function isValidSemVer(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

function compareVersions(v1: string, v2: string): number {
  const [major1, minor1, patch1] = v1.split(".").map(Number);
  const [major2, minor2, patch2] = v2.split(".").map(Number);

  if (major1 !== major2) return major1 - major2;
  if (minor1 !== minor2) return minor1 - minor2;
  return patch1 - patch2;
}

async function validateEntry(
  filename: string,
  content: string
): Promise<{ valid: boolean; errors: string[]; entry?: ChangelogEntry }> {
  const errors: string[] = [];

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
  if (!frontmatterMatch) {
    errors.push(`${filename}: Missing or malformed frontmatter`);
    return { valid: false, errors };
  }

  const [, frontmatterStr, body] = frontmatterMatch;
  let entry: Partial<ChangelogEntry> = {};

  const lines = frontmatterStr.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();

    if (key === "type") entry.type = value;
    else if (key === "area") entry.area = value;
    else if (key === "pr") {
      const prNum = parseInt(value, 10);
      if (!isNaN(prNum) && prNum > 0) entry.pr = prNum;
    } else if (key === "breaking") {
      const lower = value.toLowerCase();
      if (lower === "true") entry.breaking = true;
      else if (lower === "false") entry.breaking = false;
    }
  }

  if (!entry.type || !VALID_TYPES.includes(entry.type)) {
    errors.push(`${filename}: Invalid or missing type`);
  }
  if (!entry.area || !VALID_AREAS.includes(entry.area)) {
    errors.push(`${filename}: Invalid or missing area`);
  }
  if (!entry.pr || entry.pr <= 0) {
    errors.push(`${filename}: Invalid or missing pr`);
  }
  if (entry.breaking === undefined) {
    errors.push(`${filename}: Missing breaking`);
  }

  entry.body = body.trim();
  const trimmedBody = entry.body;
  if (!trimmedBody || trimmedBody.length > 500 || !trimmedBody.endsWith(".")) {
    errors.push(`${filename}: Invalid body`);
  }
  if (
    CONVENTIONAL_COMMIT_PREFIXES.some((prefix) =>
      trimmedBody.toLowerCase().startsWith(prefix.toLowerCase())
    )
  ) {
    errors.push(`${filename}: Body starts with conventional commit prefix`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    entry: entry as ChangelogEntry,
  };
}

async function getLatestVersion(changelogContent: string): Promise<string | null> {
  const match = changelogContent.match(/^## \[(\d+\.\d+\.\d+)\]/m);
  return match ? match[1] : null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatChangelogEntry(entry: ChangelogEntry): string {
  const link = entry.pr ? ` ([#${entry.pr}](https://github.com/SO4-Markets/interface/pull/${entry.pr}))` : "";
  // Structured metadata rides along in an HTML comment so the DX-005 parser
  // (scripts/changelog/build.ts) can recover area/breaking. It renders
  // invisibly on GitHub and keeps CHANGELOG.md the human artifact.
  const meta = `<!-- so4: area=${entry.area}${entry.breaking ? " breaking" : ""} -->`;
  return `- ${entry.body}${link} ${meta}`;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const version = args.find((a) => !a.startsWith("--"));

  if (!version) {
    console.error("Usage: bun run changelog:release <version> [--dry-run]");
    console.error("Example: bun run changelog:release 0.2.0");
    process.exit(1);
  }

  if (!isValidSemVer(version)) {
    console.error(
      `✗ Invalid version: "${version}". Must be valid SemVer (e.g., 0.2.0)`
    );
    process.exit(1);
  }

  // Check for dirty working tree
  if (!dryRun) {
    try {
      const status = execSync("git status --porcelain", { encoding: "utf-8" });
      if (status.trim()) {
        console.error(
          "✗ Working tree is dirty. Commit or stash changes before releasing."
        );
        process.exit(1);
      }
    } catch (error) {
      console.error("✗ Not a git repository or git command failed");
      process.exit(1);
    }
  }

  // Read existing CHANGELOG.md
  const changelogPath = join(process.cwd(), "CHANGELOG.md");
  let changelogContent = "";
  try {
    changelogContent = await readFile(changelogPath, "utf-8");
  } catch (error) {
    console.error(`✗ Could not read CHANGELOG.md: ${error}`);
    process.exit(1);
  }

  // Validate version is greater than latest
  const latestVersion = await getLatestVersion(changelogContent);
  if (latestVersion && compareVersions(version, latestVersion) <= 0) {
    console.error(
      `✗ Version ${version} must be greater than latest version ${latestVersion}`
    );
    process.exit(1);
  }

  // Read and validate all pending entries
  const changelogDir = join(process.cwd(), ".changelog", "unreleased");
  const files = await readdir(changelogDir);
  const entryFiles = files.filter(
    (f) => f.endsWith(".md") && f !== "README.md" && f !== "TEMPLATE.md"
  );

  const entries: ChangelogEntry[] = [];
  const validationErrors: string[] = [];

  for (const filename of entryFiles) {
    const filepath = join(changelogDir, filename);
    const content = await readFile(filepath, "utf-8");
    const { valid, errors, entry } = await validateEntry(filename, content);

    if (!valid) {
      validationErrors.push(...errors);
    } else if (entry) {
      entries.push(entry);
    }
  }

  if (validationErrors.length > 0) {
    console.error("✗ Changelog validation failed:\n");
    validationErrors.forEach((error) => console.error(`  ${error}`));
    process.exit(1);
  }

  // Group entries by type, maintaining order
  const grouped: Record<string, ChangelogEntry[]> = {};
  TYPE_ORDER.forEach((type) => {
    grouped[type] = entries.filter((e) => e.type === type);
  });

  // Build new version section
  const today = formatDate(new Date());
  let newSection = `\n## [${version}] - ${today}\n`;

  for (const type of TYPE_ORDER) {
    const typeEntries = grouped[type];
    if (typeEntries.length === 0) continue;

    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    newSection += `\n### ${typeLabel}\n\n`;
    typeEntries.forEach((entry) => {
      newSection += formatChangelogEntry(entry) + "\n";
    });
  }

  // Insert new section after [Unreleased] section
  const unreleaseMatch = changelogContent.match(/(\## \[Unreleased\][\s\S]*?)(\n## \[|\n\[)/);
  if (!unreleaseMatch) {
    console.error(
      "✗ Could not find [Unreleased] section in CHANGELOG.md"
    );
    process.exit(1);
  }

  // Extract link-reference definitions at the end
  const linkRefsMatch = changelogContent.match(/\n(\[.+\]: .+)$/m);
  let linkRefs = "";
  let contentWithoutRefs = changelogContent;
  if (linkRefsMatch) {
    linkRefs = linkRefsMatch[1];
    contentWithoutRefs = changelogContent.replace(/\n\[.+\]: .+$/m, "");
  }

  // Build new link references
  let newLinkRefs = linkRefs || "";
  if (!newLinkRefs.includes(`[${version}]:`)) {
    const prevVersion = latestVersion || "HEAD";
    const compareLink = `\n[${version}]: https://github.com/SO4-Markets/interface/compare/v${prevVersion}...v${version}`;

    // Update the Unreleased link if it exists
    newLinkRefs = newLinkRefs.replace(
      /\[Unreleased\]: .*?compare\/(.+?)\.\.\.HEAD/,
      `[Unreleased]: https://github.com/SO4-Markets/interface/compare/v${version}...HEAD`
    );
    if (!newLinkRefs.includes("[Unreleased]:")) {
      newLinkRefs = `[Unreleased]: https://github.com/SO4-Markets/interface/compare/v${version}...HEAD\n` + newLinkRefs;
    }
    newLinkRefs += compareLink;
  }

  // Build final changelog
  const insertPoint = unreleaseMatch.index! + unreleaseMatch[1].length;
  const finalContent =
    contentWithoutRefs.slice(0, insertPoint) +
    newSection +
    contentWithoutRefs.slice(insertPoint) +
    "\n" +
    newLinkRefs;

  if (dryRun) {
    console.log("=== DRY RUN: Would write the following to CHANGELOG.md ===\n");
    console.log(newSection);
    console.log("\n=== Link references ===\n");
    console.log(newLinkRefs);
    console.log("\n✓ Dry run complete — no files were modified");
    process.exit(0);
  }

  // Write updated CHANGELOG.md
  await writeFile(changelogPath, finalContent, "utf-8");

  // Delete consumed entry files
  for (const filename of entryFiles) {
    const filepath = join(changelogDir, filename);
    await unlink(filepath);
  }

  console.log(`✓ Released ${version} with ${entries.length} entry(ies)`);
  console.log(
    `✓ Deleted ${entryFiles.length} entry file(s) from .changelog/unreleased/`
  );
  console.log("✓ Updated CHANGELOG.md");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
