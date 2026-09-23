"use client"

import * as React from "react"

import { CopyButton } from "@workspace/ui/components/copy-button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

type ExplorerNetwork = "testnet" | "mainnet"

type IdentifierType = "account" | "contract" | "transaction"

interface AddressDisplayProps extends React.ComponentProps<"span"> {
  /** The complete identifier (address, contract ID, or tx hash). */
  value: string
  /** What kind of identifier this is — drives explorer URL path. */
  type?: IdentifierType
  /** Number of characters to show at each end when truncated. @default 4 */
  visibleChars?: number
  /** Show the full value without truncation. @default false */
  full?: boolean
  /** Show a copy button. @default true */
  copyable?: boolean
  /** Link to a block explorer. @default false */
  explorerLink?: boolean
  /** Network for explorer URLs. @default "testnet" */
  network?: ExplorerNetwork
}

const STELLAR_ADDRESS_RE = /^[GC][A-Z2-7]{55}$/
const TX_HASH_RE = /^[a-f0-9]{64}$/i

function isValidIdentifier(value: string, type: IdentifierType): boolean {
  switch (type) {
    case "account":
      return STELLAR_ADDRESS_RE.test(value) && value.startsWith("G")
    case "contract":
      return STELLAR_ADDRESS_RE.test(value) && value.startsWith("C")
    case "transaction":
      return TX_HASH_RE.test(value)
  }
}

function explorerBaseUrl(network: ExplorerNetwork): string {
  return network === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet"
}

function explorerUrl(
  value: string,
  type: IdentifierType,
  network: ExplorerNetwork,
): string | null {
  if (!isValidIdentifier(value, type)) return null

  const base = explorerBaseUrl(network)
  switch (type) {
    case "account":
      return `${base}/account/${value}`
    case "contract":
      return `${base}/contract/${value}`
    case "transaction":
      return `${base}/tx/${value}`
  }
}

function truncate(value: string, chars: number): string {
  if (value.length <= chars * 2 + 1) return value
  return `${value.slice(0, chars)}…${value.slice(-chars)}`
}

function AddressDisplay({
  value,
  type = "account",
  visibleChars = 4,
  full = false,
  copyable = true,
  explorerLink = false,
  network = "testnet",
  className,
  ...props
}: AddressDisplayProps) {
  const displayed = full ? value : truncate(value, visibleChars)
  const href =
    explorerLink ? explorerUrl(value, type, network) : null

  const textElement = (
    <span
      className="font-mono tabular-nums"
      aria-label={value}
    >
      {displayed}
    </span>
  )

  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline-offset-4 hover:underline"
    >
      {textElement}
    </a>
  ) : !full && displayed !== value ? (
    <Tooltip>
      <TooltipTrigger
        render={<span className="cursor-default" />}
      >
        {textElement}
      </TooltipTrigger>
      <TooltipContent>
        <span className="font-mono text-xs break-all">{value}</span>
      </TooltipContent>
    </Tooltip>
  ) : (
    textElement
  )

  return (
    <span
      data-slot="address-display"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {content}
      {copyable && (
        <CopyButton
          value={value}
          label={`Copy ${type}`}
          tone="ghost"
        />
      )}
    </span>
  )
}

function HashDisplay(
  props: Omit<AddressDisplayProps, "type"> & { type?: "transaction" },
) {
  return <AddressDisplay {...props} type="transaction" />
}

export { AddressDisplay, HashDisplay, truncate, isValidIdentifier, explorerUrl }
export type { AddressDisplayProps, IdentifierType, ExplorerNetwork }
