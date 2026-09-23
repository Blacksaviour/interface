import { readFileSync } from "node:fs"

const REPO = "SO4-Markets/interface"
const BACKLOG = new URL("../docs/design-system-wave-backlog.md", import.meta.url)
const publish = process.argv.includes("--publish")

type BacklogIssue = {
  key: string
  title: string
  body: string
  complexity: "Trivial" | "Medium" | "High"
  suggestedLabels: string[]
}

function runGh(args: string[]) {
  const result = Bun.spawnSync(["gh", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  })

  if (result.exitCode !== 0) {
    const error = result.stderr.toString().trim()
    throw new Error(`gh ${args[0]} failed: ${error}`)
  }

  return result.stdout.toString().trim()
}

function parseBacklog(markdown: string): BacklogIssue[] {
  const issuePattern =
    /^### (DS-\d{3}): (.+)\n\n([\s\S]*?)(?=^### DS-\d{3}:|^---$|^## Recommended Wave activation)/gm
  const issues: BacklogIssue[] = []

  for (const match of markdown.matchAll(issuePattern)) {
    const [, key, title, rawBody] = match
    const complexity = rawBody.match(/\*\*Complexity:\*\* (Trivial|Medium|High)/)?.[1]
    const labelsLine = rawBody.match(/\*\*Suggested labels:\*\* (.+)/)?.[1] ?? ""

    if (!complexity) {
      throw new Error(`Missing complexity for ${key}`)
    }

    const body = rawBody
      .replace(/\*\*Suggested labels:\*\* .+\n/, "")
      .trim()

    issues.push({
      key,
      title: `${key}: ${title}`,
      body,
      complexity,
      suggestedLabels: [...labelsLine.matchAll(/`([^`]+)`/g)].map(
        (label) => label[1]
      ),
    })
  }

  return issues
}

function labelsFor(issue: BacklogIssue) {
  const labels = new Set(["Stellar Wave", "design-system", "help wanted"])

  if (issue.complexity === "Trivial") {
    labels.add("priority:low")
    labels.add("good first issue")
  } else if (issue.complexity === "Medium") {
    labels.add("priority:medium")
  } else {
    labels.add("priority:high")
  }

  if (
    issue.suggestedLabels.includes("testing") ||
    issue.suggestedLabels.includes("playwright")
  ) {
    labels.add("type:testing")
  } else if (
    issue.suggestedLabels.includes("refactor") ||
    /^Restyle|^Refine|^Unify|^Audit/.test(issue.title.replace(/^DS-\d{3}: /, ""))
  ) {
    labels.add("type:refactor")
  } else if (issue.suggestedLabels.includes("documentation")) {
    labels.add("documentation")
  } else {
    labels.add("type:feature")
  }

  return [...labels]
}

const issues = parseBacklog(readFileSync(BACKLOG, "utf8"))

if (issues.length !== 50) {
  throw new Error(`Expected 50 backlog issues, found ${issues.length}`)
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
    "500",
    "--json",
    "title,url",
  ])
) as Array<{ title: string; url: string }>
const existingByTitle = new Map(existing.map((issue) => [issue.title, issue.url]))

let created = 0
let skipped = 0

for (const issue of issues) {
  const duplicateUrl = existingByTitle.get(issue.title)
  if (duplicateUrl) {
    console.log(`SKIP ${issue.key} ${duplicateUrl}`)
    skipped += 1
    continue
  }

  if (!publish) {
    console.log(`DRY  ${issue.title} [${labelsFor(issue).join(", ")}]`)
    continue
  }

  const args = [
    "issue",
    "create",
    "--repo",
    REPO,
    "--title",
    issue.title,
    "--body",
    issue.body,
  ]

  for (const label of labelsFor(issue)) {
    args.push("--label", label)
  }

  const url = runGh(args)
  console.log(`NEW  ${issue.key} ${url}`)
  existingByTitle.set(issue.title, url)
  created += 1
}

console.log(
  publish
    ? `Complete: ${created} created, ${skipped} already existed.`
    : `Dry run: ${issues.length - skipped} to create, ${skipped} already existed.`
)
