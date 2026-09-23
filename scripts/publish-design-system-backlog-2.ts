import { readFileSync } from "node:fs"

const REPO = "SO4-Markets/interface"
const BACKLOG = new URL("../docs/design-system-backlog-2.md", import.meta.url)
const publish = process.argv.includes("--publish")
const updateExisting = process.argv.includes("--update-existing")

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
  /### (DS-(?:05[1-9]|06\d|07[0-5])): (.+)\n\n([\s\S]*?)(?=\n### DS-|$)/g
const issues = [...markdown.matchAll(pattern)].map((match) => ({
  key: match[1],
  title: `${match[1]}: ${match[2]}`,
  body: match[3].trim(),
}))

if (issues.length !== 25) {
  throw new Error(`Expected 25 issues, found ${issues.length}`)
}

const existing = JSON.parse(
  runGh([
    "issue",
    "list",
    "--repo",
    REPO,
    "--state",
    "all",
    "--limit",
    "100",
    "--json",
    "number,title,url,body",
  ])
) as Array<{ number: number; title: string; url: string; body: string }>
const existingByTitle = new Map(existing.map((issue) => [issue.title, issue.url]))
const existingNumberByTitle = new Map(
  existing.map((issue) => [issue.title, issue.number])
)
const existingBodyByTitle = new Map(
  existing.map((issue) => [issue.title, issue.body])
)

let created = 0
let skipped = 0

for (const issue of issues) {
  const existingUrl = existingByTitle.get(issue.title)
  if (existingUrl) {
    if (updateExisting) {
      if (existingBodyByTitle.get(issue.title) === issue.body) {
        console.log(`OK   ${issue.key} ${existingUrl}`)
        continue
      }
      const number = existingNumberByTitle.get(issue.title)
      if (!number) {
        throw new Error(`Missing issue number for ${issue.key}`)
      }
      runGh([
        "issue",
        "edit",
        String(number),
        "--repo",
        REPO,
        "--body",
        issue.body,
      ])
      console.log(`EDIT ${issue.key} ${existingUrl}`)
      continue
    }
    console.log(`SKIP ${issue.key} ${existingUrl}`)
    skipped += 1
    continue
  }

  if (!publish) {
    console.log(`DRY  ${issue.title}`)
    continue
  }

  // Deliberately pass no --label arguments. This batch must not enter Drips
  // or acquire any other repository labels.
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
  existingByTitle.set(issue.title, url)
  created += 1
}

console.log(
  publish
    ? `Complete: ${created} created, ${skipped} already existed.`
    : `Dry run: ${issues.length - skipped} to create, ${skipped} already existed.`
)
