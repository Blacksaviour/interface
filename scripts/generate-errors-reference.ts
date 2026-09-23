#!/usr/bin/env bun

/**
 * Generate the error reference page from packages/contracts/src/errors.ts —
 * the single place apps/web maps Soroban/RPC errors to user-facing text
 * (see parseSorobanError). Output: apps/docs/content/reference/errors.mdx
 *
 * Every code and message on this page is read out of errors.ts, not retyped
 * by hand, so it cannot say something apps/web doesn't actually show. Cause
 * and remediation text is curated below, keyed by code, and the generator
 * fails loudly if errors.ts adds or removes a code this file doesn't know
 * about yet — so the page can't silently fall behind the source. Run with
 * --check to verify the committed file still matches (used in CI).
 */

import * as fs from "fs"
import * as path from "path"

// Resolve relative to this file, not process.cwd() — this script is invoked
// both from the repo root and from apps/docs via a relative package.json
// script, which have different working directories.
const REPO_ROOT = path.join(import.meta.dir, "..")
const SOURCE_PATH = path.join(REPO_ROOT, "packages/contracts/src/errors.ts")
const OUTPUT_PATH = path.join(REPO_ROOT, "apps/docs/content/reference/errors.mdx")

function extractNamedConstants(source: string): Record<string, string> {
  const named: Record<string, string> = {}
  const re = /const (\w+)\s*=\s*\n?\s*"((?:[^"\\]|\\.)*)"/g
  let match: RegExpExecArray | null
  while ((match = re.exec(source))) named[match[1]] = match[2]
  return named
}

// The four generic buckets are inline `if (...includes("token")) return "message"`
// checks in parseSorobanError, not object entries — pull the exact message per
// token so this page can't say something apps/web doesn't.
function extractGenericBucketMessage(source: string, token: string): string {
  const re = new RegExp(`includes\\("${token}"\\)[\\s\\S]{0,200}?return\\s+"((?:[^"\\\\]|\\\\.)*)"`)
  const match = source.match(re)
  if (!match) throw new Error(`Could not find generic bucket message for "${token}" in errors.ts`)
  return match[1]
}

function extractFallbackMessage(source: string): string {
  const match = source.match(/const FALLBACK_MESSAGE = "((?:[^"\\]|\\.)*)"/)
  if (!match) throw new Error("Could not find FALLBACK_MESSAGE in errors.ts")
  return match[1]
}

function extractObjectLiteral(
  source: string,
  constName: string,
  namedConstants: Record<string, string>,
): Record<string, string> {
  const start = source.indexOf(`const ${constName}`)
  if (start === -1) throw new Error(`Could not find "const ${constName}" in errors.ts`)
  const braceStart = source.indexOf("{", start)
  let depth = 0
  let i = braceStart
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++
    if (source[i] === "}") {
      depth--
      if (depth === 0) break
    }
  }
  const body = source.slice(braceStart + 1, i)
  const entries: Record<string, string> = {}
  const re = /(\w+):\s*(?:"((?:[^"\\]|\\.)*)"|(\w+))\s*,/g
  let match: RegExpExecArray | null
  while ((match = re.exec(body))) {
    const [, key, literal, identifier] = match
    if (literal !== undefined) {
      entries[key] = literal
    } else if (identifier !== undefined) {
      const resolved = namedConstants[identifier]
      if (resolved === undefined)
        throw new Error(`${constName}.${key} references unresolved identifier "${identifier}"`)
      entries[key] = resolved
    }
  }
  return entries
}

type Entry = {
  anchor: string
  code: string
  category: "Contract error" | "RPC error" | "Generic client error"
  message: string
  cause: string
  action: string
}

// Curated cause/remediation text. Every key here must correspond to a real
// code in errors.ts (checked below) and every code in errors.ts must have an
// entry here — that's what "count asserted against the source" means in
// practice: this map's size equals the source's, or generation fails.
const CONTRACT_CAUSES: Record<string, { cause: string; action: string }> = {
  INSUFFICIENT_COLLATERAL: {
    cause: "The position's collateral is below what the market requires for the requested size and leverage.",
    action: "Add collateral, or reduce position size/leverage, then resubmit.",
  },
  INSUFFICIENT_LIQUIDITY: {
    cause: "The pool backing this market doesn't have enough available liquidity to take the other side of this trade right now.",
    action: "Try a smaller size, or wait — available liquidity changes as other positions open and close.",
  },
  INSUFFICIENT_OUTPUT_AMOUNT: {
    cause: "The trade would have produced less output than the minimum you (or the client) specified, usually because the price moved between quote and execution.",
    action: "Re-quote and resubmit, or widen your slippage tolerance if the move is expected.",
  },
  INVALID_MARKET: {
    cause: "The market address or symbol in the request doesn't match a market this deployment knows about.",
    action: "Confirm the market against /reference/contracts — an address from another network or an outdated build is the usual cause.",
  },
  INVALID_ORDER: {
    cause: "One or more order parameters (size, price, trigger, or their combination) fail the contract's validation rules.",
    action: "Check the specific field the wallet/contract call reports; a zero or negative size and an out-of-range trigger price are the most common causes.",
  },
  INVALID_PRICE: {
    cause: "The submitted or oracle price falls outside the band the contract allows for this operation.",
    action: "Refresh the price and resubmit. If it persists, check /guides/troubleshooting#chart-not-loading — a stale oracle read produces this too.",
  },
  LEVERAGE_TOO_HIGH: {
    cause: "The requested position size relative to collateral exceeds the market's maximum leverage.",
    action: "Reduce size or add collateral to bring effective leverage under the market's cap (see /concepts/margin-and-leverage).",
  },
  MARKET_CLOSED: {
    cause: "The market is temporarily paused (maintenance, oracle outage, or a deliberate freeze) and isn't accepting new operations.",
    action: "Wait for the market to reopen. Existing positions are unaffected by a market being closed to new orders.",
  },
  ORDER_NOT_FOUND: {
    cause: "The order ID no longer exists — it was already executed, cancelled, or never existed on this network.",
    action: "Refresh your open orders list; if you expected it to still be pending, check whether it executed instead.",
  },
  POSITION_NOT_FOUND: {
    cause: "The position ID no longer exists — it was already closed or liquidated, or belongs to a different account/network.",
    action: "Refresh your positions list; check /guides/troubleshooting#position-not-appearing if you expected to see it.",
  },
  SLIPPAGE_EXCEEDED: {
    cause: "The price moved past your slippage tolerance between when the order was submitted and when it executed.",
    action: "Increase slippage tolerance if the move is acceptable to you, or resubmit at the current price.",
  },
  UNAUTHORIZED: {
    cause: "The signing account doesn't have permission for this action — often a mismatch between the connected wallet and the position/order owner.",
    action: "Confirm you're signing with the same address that opened the position or placed the order.",
  },
  ORDER_EXECUTION_FROZEN: {
    cause: "Trading execution is paused network-wide, usually for a scheduled upgrade or an incident response.",
    action: "No action needed — the order is saved and executes automatically once trading resumes. Check /resources/roadmap or the project's status channel for context.",
  },
  CODE_ALREADY_TAKEN: {
    cause: "The referral code you tried to create is already registered by another account.",
    action: "Choose a different code.",
  },
  CODE_NOT_FOUND: {
    cause: "The referral code doesn't exist, or was mistyped.",
    action: "Double-check the code, including case, and that it was entered on the correct network.",
  },
}

const RPC_CAUSES: Record<string, { cause: string; action: string }> = {
  tx_bad_auth: {
    cause: "The transaction's signature doesn't validate — often a stale session after switching accounts in the wallet extension.",
    action: "Reconnect your wallet and resubmit.",
  },
  tx_bad_auth_extra: {
    cause: "The transaction carries signatures the network didn't expect, which usually means it was built for a different transaction envelope.",
    action: "Reconnect your wallet and resubmit; if it persists after a fresh connection, clear the wallet's cached session.",
  },
  tx_bad_seq: {
    cause: "The account's sequence number moved since the transaction was built — another transaction from the same account landed first.",
    action: "Refresh and resubmit; the client will fetch the current sequence number.",
  },
  tx_insufficient_balance: {
    cause: "The signing account doesn't have enough XLM (or the required asset) to cover the transaction.",
    action: "Fund the wallet — see /guides/faucet on testnet — then resubmit.",
  },
  tx_insufficient_fee: {
    cause: "The submitted fee is below the network's current minimum, usually during congestion.",
    action: "Resubmit; the client normally recalculates the fee automatically. Manually raise it if you built the transaction yourself.",
  },
  tx_too_early: {
    cause: "The transaction's time bounds start after the current ledger close time.",
    action: "Rebuild and resubmit — this is a clock/time-bounds mismatch, not something to retry unchanged.",
  },
  tx_too_late: {
    cause: "The transaction's time bounds expired before it was included in a ledger — a slow signature, a stuck approval dialog, or network delay.",
    action: "Resubmit. See /guides/troubleshooting#transaction-stuck-pending if this keeps happening.",
  },
  op_exceeded_work_limit: {
    cause: "The operation needs more compute/resources than a single Soroban transaction is allowed to use, usually because the requested position or batch is very large.",
    action: "Try a smaller size or split the operation into more than one transaction.",
  },
  op_no_account: {
    cause: "The destination account referenced by the operation doesn't exist on this network yet.",
    action: "Confirm the address and network; a new account needs an initial funding operation before it can be a destination.",
  },
  op_underfunded: {
    cause: "The account can't cover this specific operation's requirements, distinct from the overall transaction fee.",
    action: "Fund the wallet — see /guides/faucet on testnet — then resubmit.",
  },
}

const GENERIC_CAUSE_TEXT: Record<string, { token: string; cause: string; action: string }> = {
  simulation_failed: {
    token: "simulation failed",
    cause: "The RPC node couldn't simulate the transaction against current ledger state — often because it would fail on-chain for a reason not captured by a specific code above.",
    action: "Check the transaction's contract call and arguments; if you can't tell why, include the raw RPC response in a bug report (see /guides/troubleshooting).",
  },
  resource_or_budget: {
    token: "resource",
    cause: "The transaction's CPU, memory, or ledger-entry footprint exceeds Soroban's per-transaction resource limits.",
    action: "Reduce position size or split the operation across more than one transaction.",
  },
  timeout_or_try_again: {
    token: "timeout",
    cause: "The RPC node is under load or a Horizon/RPC request timed out before completing.",
    action: "Wait a few seconds and resubmit. If every request times out, the RPC endpoint itself may be degraded — see /guides/troubleshooting.",
  },
  rejected_or_declined: {
    token: "rejected",
    cause: "You declined the signature request in your wallet extension, or closed its approval dialog.",
    action: "No fix needed — resubmit and approve the request if you want the transaction to go through.",
  },
}

async function generate() {
  const source = fs.readFileSync(SOURCE_PATH, "utf-8")
  const namedConstants = extractNamedConstants(source)
  const contractMessages = extractObjectLiteral(source, "CONTRACT_ERROR_MESSAGES", namedConstants)
  const rpcMessages = extractObjectLiteral(source, "RPC_ERROR_MESSAGES", namedConstants)

  const missingContractCauses = Object.keys(contractMessages).filter((k) => !CONTRACT_CAUSES[k])
  const staleContractCauses = Object.keys(CONTRACT_CAUSES).filter((k) => !contractMessages[k])
  const missingRpcCauses = Object.keys(rpcMessages).filter((k) => !RPC_CAUSES[k])
  const staleRpcCauses = Object.keys(RPC_CAUSES).filter((k) => !rpcMessages[k])
  const problems = [
    ...missingContractCauses.map((k) => `errors.ts defines CONTRACT_ERROR_MESSAGES.${k} with no cause/action entry in generate-errors-reference.ts`),
    ...staleContractCauses.map((k) => `generate-errors-reference.ts documents ${k} but errors.ts no longer defines it`),
    ...missingRpcCauses.map((k) => `errors.ts defines RPC_ERROR_MESSAGES.${k} with no cause/action entry in generate-errors-reference.ts`),
    ...staleRpcCauses.map((k) => `generate-errors-reference.ts documents ${k} but errors.ts no longer defines it`),
  ]
  if (problems.length) {
    console.error(problems.join("\n"))
    process.exit(1)
  }

  const contractEntries: Array<Entry> = Object.entries(contractMessages).map(([code, message]) => ({
    anchor: code.toLowerCase().replaceAll("_", "-"),
    code,
    category: "Contract error",
    message,
    cause: CONTRACT_CAUSES[code].cause,
    action: CONTRACT_CAUSES[code].action,
  }))

  const rpcEntries: Array<Entry> = Object.entries(rpcMessages).map(([code, message]) => ({
    anchor: code.toLowerCase().replaceAll("_", "-"),
    code,
    category: "RPC error",
    message,
    cause: RPC_CAUSES[code].cause,
    action: RPC_CAUSES[code].action,
  }))

  const genericEntries: Array<Entry> = Object.entries(GENERIC_CAUSE_TEXT).map(([key, v]) => ({
    anchor: key.replaceAll("_", "-"),
    code: key,
    category: "Generic client error",
    message: extractGenericBucketMessage(source, v.token),
    cause: v.cause,
    action: v.action,
  }))

  const FALLBACK = {
    code: "unmatched",
    message: extractFallbackMessage(source),
    cause: "The error text didn't match any known contract code, RPC code, or generic bucket above.",
    action: 'Resubmit once. If it keeps happening, report it — see "Reporting an error that isn\'t listed" below.',
  }

  const total = contractEntries.length + rpcEntries.length + genericEntries.length + 1

  function table(entries: Array<Entry>): string {
    return entries
      .map(
        (e) =>
          `## \`${e.code}\` {#${e.anchor}}\n\n**What you see:** "${e.message}"\n\n**Likely cause:** ${e.cause}\n\n**What to do:** ${e.action}\n`,
      )
      .join("\n")
  }

  const mdx = `---
title: Error reference
description: Every contract and client error SO4 can surface, the exact on-screen message, its cause, and what to do.
updated: 2026-08-25
status: stable
---

This page is generated from [\`packages/contracts/src/errors.ts\`](https://github.com/SO4-Markets/interface/blob/main/packages/contracts/src/errors.ts) — the single place \`apps/web\` turns a raw contract or RPC error into the text you see on screen (\`parseSorobanError\`). The **What you see** line on every entry below is that exact string, not a paraphrase, so you can search this page by what's on your screen. \`bun run --cwd apps/docs check:errors:generated\` (wired into CI) fails the build if this page and the source disagree. If you arrived from a stuck transaction rather than a specific error code, [/guides/troubleshooting](/guides/troubleshooting) is organised by symptom instead and links back into the entries below.

${total} entries: ${contractEntries.length} contract errors, ${rpcEntries.length} RPC-layer errors, ${genericEntries.length} generic client-side buckets, and one fallback.

## Contract errors

Returned by the Soroban contracts themselves — \`exchange-router\`, \`order-vault\`, and the other bindings in [\`packages/contracts/src/clients\`](https://github.com/SO4-Markets/interface/tree/main/packages/contracts/src/clients) — when a call violates a contract-level rule.

${table(contractEntries)}
## RPC and network errors

Returned by the Stellar RPC node the transaction was submitted to, before or during inclusion in a ledger — these are about the transaction envelope or account state, not contract logic.

${table(rpcEntries)}
## Generic client-side buckets

When the error text doesn't match a specific code above but does match one of these patterns, \`parseSorobanError\` still returns a targeted message instead of the bare fallback.

${table(genericEntries)}
## Fallback {#${FALLBACK.code}}

**What you see:** "${FALLBACK.message}"

**Likely cause:** ${FALLBACK.cause}

**What to do:** ${FALLBACK.action}

## Reporting an error that isn't listed

If you hit an error whose on-screen text isn't the fallback above but also doesn't match anything on this page, that's a gap in this reference, not necessarily a bug — [open an issue](https://github.com/SO4-Markets/interface/issues/new) with the exact on-screen text and, if you have it, the raw RPC/contract response. See [/guides/troubleshooting#collecting-information-for-a-bug-report](/guides/troubleshooting#collecting-information-for-a-bug-report) for what to include — and what never to include.
`

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })

  if (process.argv.includes("--check")) {
    const current = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, "utf-8") : ""
    if (current !== mdx) {
      console.error("Error reference is stale. Run: bun run generate:errors")
      process.exit(1)
    }
    console.log(`Error reference matches errors.ts (${total} entries).`)
  } else {
    fs.writeFileSync(OUTPUT_PATH, mdx, "utf-8")
    console.log(`✓ Generated ${OUTPUT_PATH} (${total} entries)`)
  }
}

generate().catch((err) => {
  console.error("Generation failed:", err)
  process.exit(1)
})
