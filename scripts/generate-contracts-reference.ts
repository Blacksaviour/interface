#!/usr/bin/env bun

/**
 * Generate the contracts reference page from contracts.json and contract descriptions.
 * Output: apps/docs/content/reference/contracts.generated.mdx
 *
 * This ensures the contracts page always matches the deployed contract IDs
 * and descriptions are never out of sync. CI verifies the generated file
 * has not drifted.
 */

import * as fs from "fs"
import * as path from "path"

interface ContractBinding {
  name: string
  contractId: string | null
  note?: string
}

interface ContractsConfig {
  network: {
    name: string
    rpcUrl: string
    networkPassphrase: string
  }
  outputDir: string
  bindings: ContractBinding[]
}

async function generate() {
  const contractsJsonPath = path.join(
    process.cwd(),
    "packages/contracts/contracts.json"
  )
  const descriptionsPath = path.join(
    process.cwd(),
    "packages/contracts/contract-descriptions.json"
  )
  const outputPath = path.join(
    process.cwd(),
    "apps/docs/content/reference/contracts.generated.mdx"
  )

  // Read contracts.json
  let contractsConfig: ContractsConfig
  try {
    const content = fs.readFileSync(contractsJsonPath, "utf-8")
    contractsConfig = JSON.parse(content)
  } catch (err) {
    console.error(`Failed to read ${contractsJsonPath}:`, err)
    process.exit(1)
  }

  // Read descriptions
  let descriptions: Record<string, string> = {}
  try {
    const content = fs.readFileSync(descriptionsPath, "utf-8")
    descriptions = JSON.parse(content)
  } catch (err) {
    console.error(`Failed to read ${descriptionsPath}:`, err)
    process.exit(1)
  }

  // Generate MDX rows
  const rows = contractsConfig.bindings
    .map((binding) => {
      const description = descriptions[binding.name] || "No description"
      const network = contractsConfig.network.name
      const explorerUrl =
        binding.contractId && network === "testnet"
          ? `https://stellar.expert/explorer/testnet/contract/${binding.contractId}`
          : null

      if (!binding.contractId) {
        return `| \`${binding.name}\` | Not deployed | — | ${description} |`
      }

      const contractLink = explorerUrl
        ? `<ContractAddress id="${binding.contractId}" />`
        : `\`${binding.contractId}\``

      return `| \`${binding.name}\` | ${contractLink} | [explorer](${explorerUrl}) | ${description} |`
    })
    .join("\n")

  // Generate MDX content
  const mdxContent = `---
title: Contract addresses
description: Deployed SO4 contract IDs per network and their roles.
updated: 2026-08-25
status: stable
---

SO4 contract IDs are source of truth and committed in [\`packages/contracts/contracts.json\`](https://github.com/SO4-Markets/interface/blob/main/packages/contracts/contracts.json). This page is generated on every build; see [Architecture](/developers/architecture) for why.

## Testnet

| Contract | ID | Explorer | Role |
|----------|-------|----------|------|
${rows}

Use these addresses to:
- Call contracts from [TypeScript](/developers/contract-clients)
- Configure the indexer (see [\`apps/s03-indexer/config/contracts.testnet.json\`](https://github.com/SO4-Markets/interface/tree/main/apps/s03-indexer/config))
- Submit transactions with [Freighter](https://www.freighter.app/)

## \`<ContractAddress\` component

Copy a contract ID with one click:

\`\`\`jsx
import { ContractAddress } from "@/components/docs"

<ContractAddress id="CBD6BQSQFROWIIT5QCYN7KL5LJJWUIH7CEWUSZIFMUJO6NPXE6CVGYNW" />
\`\`\`

Renders a copiable link to the contract on Stellar Expert.
`

  // Write the generated file
  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, mdxContent, "utf-8")
    console.log(`✓ Generated ${outputPath}`)
  } catch (err) {
    console.error(`Failed to write ${outputPath}:`, err)
    process.exit(1)
  }
}

generate().catch((err) => {
  console.error("Generation failed:", err)
  process.exit(1)
})
