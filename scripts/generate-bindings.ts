/**
 * Regenerates the typed Soroban contract bindings in packages/contracts.
 *
 * Contract IDs come from packages/contracts/contracts.json, which is committed
 * — this protocol is open source and contract IDs are public on-chain
 * identifiers, so there is nothing to hide behind an environment variable and
 * no local setup needed to run this.
 *
 * Usage:
 *   bun run contracts:gen:all                 # everything in contracts.json
 *   bun run contracts:gen:all exchange-router # just the named binding(s)
 */

import { execFileSync, spawnSync } from "child_process"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")

const CONFIG_PATH = path.join(ROOT, "packages/contracts/contracts.json")

interface BindingEntry {
  name: string
  contractId: string | null
  note?: string
}

interface BindingsConfig {
  network: { name: string; rpcUrl: string; networkPassphrase: string }
  outputDir: string
  bindings: Array<BindingEntry>
}

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`Error: missing bindings config at ${path.relative(ROOT, CONFIG_PATH)}`)
  process.exit(1)
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as BindingsConfig
const { network, outputDir, bindings } = config

// Optional positional filter: regenerate only the named bindings.
const requested = process.argv.slice(2).filter((a) => !a.startsWith("-"))
const unknown = requested.filter((n) => !bindings.some((b) => b.name === n))
if (unknown.length > 0) {
  console.error(`Error: unknown binding(s): ${unknown.join(", ")}`)
  console.error(`Available: ${bindings.map((b) => b.name).join(", ")}`)
  process.exit(1)
}

const selected = requested.length > 0
  ? bindings.filter((b) => requested.includes(b.name))
  : bindings

// The official Stellar CLI is distributed as a native binary (cargo, homebrew,
// or a GitHub release) — there is no official npm package, so it has to already
// be on PATH. Fail with install instructions rather than a raw ENOENT.
if (spawnSync("stellar", ["--version"], { stdio: "ignore" }).status !== 0) {
  console.error(
    "Error: the `stellar` CLI is required but was not found on PATH.\n" +
      "Install it with one of:\n" +
      "  cargo install --locked stellar-cli\n" +
      "  brew install stellar-cli\n" +
      "  https://github.com/stellar/stellar-cli/releases",
  )
  process.exit(1)
}

const outputBaseDir = path.resolve(ROOT, outputDir)
fs.mkdirSync(outputBaseDir, { recursive: true })

console.log(`Network: ${network.name} (${network.rpcUrl})`)

const skipped: Array<BindingEntry> = []
const generated: Array<string> = []

for (const entry of selected) {
  if (!entry.contractId) {
    skipped.push(entry)
    continue
  }

  const target = path.join(outputBaseDir, entry.name)
  console.log(`\nGenerating ${entry.name} (${entry.contractId})...`)

  try {
    // execFileSync (not a shell string) so IDs and paths cannot be
    // reinterpreted by the shell.
    execFileSync(
      "stellar",
      [
        "contract",
        "bindings",
        "typescript",
        "--rpc-url", network.rpcUrl,
        "--network-passphrase", network.networkPassphrase,
        "--contract-id", entry.contractId,
        "--output-dir", target,
        "--overwrite",
      ],
      { stdio: "inherit" },
    )
    generated.push(entry.name)
    console.log(`  ✓ ${path.relative(ROOT, target)}`)
  } catch {
    console.error(`  ✗ Failed to generate bindings for ${entry.name}`)
    process.exit(1)
  }
}

for (const entry of skipped) {
  console.warn(
    `\nSkipped ${entry.name}: no contractId in contracts.json` +
      (entry.note ? ` — ${entry.note}` : ""),
  )
}

console.log(
  `\nDone. Generated ${generated.length} binding(s)` +
    (skipped.length > 0 ? `, skipped ${skipped.length}.` : "."),
)
