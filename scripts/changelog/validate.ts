import { readdir, readFile } from "fs/promises";
import { join } from "path";

interface ChangelogEntry {
  type: string;
  area: string;
  pr: number;
  breaking: boolean;
  body: string;
}

const VALID_TYPES = ["added", "changed", "deprecated", "removed", "fixed", "security"];
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

async function validateEntry(
  filename: string,
  content: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Parse frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
  if (!frontmatterMatch) {
    errors.push(`${filename}: Missing or malformed frontmatter (must start with ---)"`);
    return { valid: false, errors };
  }

  const [, frontmatterStr, body] = frontmatterMatch;

  // Parse YAML frontmatter manually (simple approach for this use case)
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
      if (isNaN(prNum) || prNum <= 0) {
        errors.push(`${filename}: 'pr' must be a positive integer, got "${value}"`);
      } else {
        entry.pr = prNum;
      }
    } else if (key === "breaking") {
      const lower = value.toLowerCase();
      if (lower === "true") entry.breaking = true;
      else if (lower === "false") entry.breaking = false;
      else {
        errors.push(`${filename}: 'breaking' must be true or false, got "${value}"`);
      }
    }
  }

  // Validate required fields
  if (!entry.type) {
    errors.push(`${filename}: Missing 'type' in frontmatter`);
  } else if (!VALID_TYPES.includes(entry.type)) {
    errors.push(
      `${filename}: 'type' must be one of [${VALID_TYPES.join(", ")}], got "${entry.type}"`
    );
  }

  if (!entry.area) {
    errors.push(`${filename}: Missing 'area' in frontmatter`);
  } else if (!VALID_AREAS.includes(entry.area)) {
    errors.push(
      `${filename}: 'area' must be one of [${VALID_AREAS.join(", ")}], got "${entry.area}"`
    );
  }

  if (!entry.pr) {
    errors.push(`${filename}: Missing or invalid 'pr' in frontmatter`);
  }

  if (entry.breaking === undefined) {
    errors.push(`${filename}: Missing 'breaking' in frontmatter`);
  }

  // Validate body
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    errors.push(`${filename}: Body is empty — add a description of the change`);
  } else if (trimmedBody.length > 500) {
    errors.push(
      `${filename}: Body is ${trimmedBody.length} characters, must be under 500`
    );
  } else if (!trimmedBody.endsWith(".")) {
    errors.push(`${filename}: Body must end with a period`);
  } else if (
    CONVENTIONAL_COMMIT_PREFIXES.some((prefix) =>
      trimmedBody.toLowerCase().startsWith(prefix.toLowerCase())
    )
  ) {
    errors.push(
      `${filename}: Body cannot start with a conventional commit prefix (${CONVENTIONAL_COMMIT_PREFIXES.join(", ")})`
    );
  }

  // Validate filename matches {pr}-{name}.md pattern
  const filenameMatch = filename.match(/^(\d+)-(.+)\.md$/);
  if (!filenameMatch) {
    errors.push(
      `${filename}: Filename must match pattern '{pr-number}-{description}.md'`
    );
  } else {
    const [, prFromFilename] = filenameMatch;
    if (entry.pr && parseInt(prFromFilename, 10) !== entry.pr) {
      errors.push(
        `${filename}: PR number in filename (${prFromFilename}) does not match pr in frontmatter (${entry.pr})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function main() {
  const changelogDir = join(process.cwd(), ".changelog", "unreleased");
  let files: string[] = [];

  try {
    files = await readdir(changelogDir);
  } catch (error) {
    console.error(`Error reading .changelog/unreleased: ${error}`);
    process.exit(1);
  }

  // Filter to .md files, exclude README and TEMPLATE
  const entryFiles = files.filter(
    (f) => f.endsWith(".md") && f !== "README.md" && f !== "TEMPLATE.md"
  );

  if (entryFiles.length === 0) {
    console.log("✓ No unreleased entries to validate");
    process.exit(0);
  }

  let allValid = true;
  const allErrors: string[] = [];

  for (const filename of entryFiles) {
    const filepath = join(changelogDir, filename);
    const content = await readFile(filepath, "utf-8");
    const { valid, errors } = await validateEntry(filename, content);

    if (!valid) {
      allValid = false;
      allErrors.push(...errors);
    }
  }

  if (allValid) {
    console.log(`✓ All ${entryFiles.length} changelog entry(ies) are valid`);
    process.exit(0);
  } else {
    console.error("✗ Changelog validation failed:\n");
    allErrors.forEach((error) => console.error(`  ${error}`));
    console.error("\nSee .changelog/unreleased/README.md for the entry format.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
