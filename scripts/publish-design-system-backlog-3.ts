import { readFileSync } from "node:fs"

const REPO = "SO4-Markets/interface"
const BACKLOG = new URL("../docs/design-system-backlog-3.md", import.meta.url)
const publish = process.argv.includes("--publish")

function runGh(args: string[]) {
  const result = Bun.spawnSync(["gh", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  })

  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim())
  }

  return result.stdout.toString().trim()
}

const markdown = readFileSync(BACKLOG, "utf8")
const pattern =
  /### (DS-(?:07[6-9]|08[0-5])): (.+)\n\n([\s\S]*?)(?=\n### DS-|$)/g
const issues = [...markdown.matchAll(pattern)].map((match) => ({
  key: match[1],
  title: `${match[1]}: ${match[2]}`,
  body: match[3].trim(),
}))

if (issues.length !== 10) {
  throw new Error(`Expected 10 issues, found ${issues.length}`)
}

for (const issue of issues) {
  const existing = runGh([
    "issue",
    "list",
    "--repo",
    REPO,
    "--state",
    "all",
    "--search",
    `"${issue.title}" in:title`,
    "--limit",
    "10",
    "--json",
    "title,url",
  ])
  const exact = (
    JSON.parse(existing) as Array<{ title: string; url: string }>
  ).find((candidate) => candidate.title === issue.title)

  if (exact) {
    console.log(`SKIP ${issue.key} ${exact.url}`)
    continue
  }

  if (!publish) {
    console.log(`DRY  ${issue.title} (${issue.body.length} chars)`)
    continue
  }

  // Intentionally omit all label arguments.
  const url = runGh([
    "issue",
    "create",
    "--repo",
    REPO,
    "--title",
    issue.title,
    "--body",
    issue.body,
  ])
  console.log(`NEW  ${issue.key} ${url}`)
}
