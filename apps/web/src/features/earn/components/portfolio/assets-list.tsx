import { useState } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { LoadingButton } from "@workspace/ui/components/loading-button"
import { NumericText } from "@workspace/ui/components/numeric"
import { EmptyState, LoadingState } from "@workspace/ui/components/states"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadRow,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Text } from "@workspace/ui/components/text"
import {
  useUserGlvPositions,
  useUserGmPositions,
  useUserSO4Stats,
} from "../../hooks/use-earn-data"
import { unstakeSO4, withdrawGLV, withdrawGM } from "../../lib/earn"
import { ASSET_KIND_BADGE } from "../../lib/badges"
import { formatPct, formatUsd } from "@/shared/lib/format"

function WalletEmptyIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" />
      <path d="M6 3 2 7" opacity="0.4" />
      <path d="M18 3l4 4" opacity="0.4" />
    </svg>
  )
}

function TypeBadge({ kind }: { kind: keyof typeof ASSET_KIND_BADGE }) {
  return <Badge variant={ASSET_KIND_BADGE[kind]}>{kind}</Badge>
}

export function AssetsList() {
  const { data: gmPositions = [], isLoading: gmLoading } = useUserGmPositions()
  const { data: glvPositions = [], isLoading: glvLoading } =
    useUserGlvPositions()
  const { data: so4Stats, isLoading: so4Loading } = useUserSO4Stats()
  const [pending, setPending] = useState<string | null>(null)

  const isLoading = gmLoading || glvLoading || so4Loading
  const hasSO4 = so4Stats.stakedAmount > 0
  const hasAny = hasSO4 || gmPositions.length > 0 || glvPositions.length > 0

  async function runAction(key: string, fn: () => Promise<unknown>) {
    setPending(key)
    try {
      await fn()
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-13 font-semibold">My assets</h2>
      </div>

      {isLoading ? (
        <LoadingState rows={2} label="Loading your assets" />
      ) : !hasAny ? (
        <EmptyState
          icon={<WalletEmptyIcon />}
          title="You have no deposits"
          description="Start earning by depositing into a pool"
          action={
            <Text
              size="sm"
              tone="primary"
              weight="medium"
              render={<a href="#browse-pools" />}
              className="hover:text-primary/80"
            >
              Browse pools →
            </Text>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableHeadRow>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead align="right">APY</TableHead>
              <TableHead align="right">Value</TableHead>
              <TableHead />
            </TableHeadRow>
          </TableHeader>
          <TableBody>
            {hasSO4 && (
              <TableRow>
                <TableCell className="font-medium">SO4</TableCell>
                <TableCell>
                  <TypeBadge kind="Staking" />
                </TableCell>
                <TableCell align="right">
                  <NumericText role="muted">—</NumericText>
                </TableCell>
                <TableCell align="right">
                  <NumericText>
                    {formatUsd(so4Stats.stakedValueUsd)}
                  </NumericText>
                </TableCell>
                <TableCell align="right">
                  <LoadingButton
                    size="xs"
                    variant="outline"
                    isLoading={pending === "so4"}
                    loadingText="Unstaking"
                    onClick={() =>
                      void runAction("so4", () =>
                        unstakeSO4("DUMMY_ACCOUNT", so4Stats.stakedAmount)
                      )
                    }
                  >
                    Unstake
                  </LoadingButton>
                </TableCell>
              </TableRow>
            )}

            {gmPositions.map((pos) => (
              <TableRow key={pos.poolId}>
                <TableCell className="font-medium">{pos.poolName}</TableCell>
                <TableCell>
                  <TypeBadge kind="GM" />
                </TableCell>
                <TableCell align="right">
                  <NumericText role="positive">
                    {formatPct(pos.apy, { sign: false })}
                  </NumericText>
                </TableCell>
                <TableCell align="right">
                  <NumericText>{formatUsd(pos.balanceUsd)}</NumericText>
                </TableCell>
                <TableCell align="right">
                  <LoadingButton
                    size="xs"
                    variant="outline"
                    isLoading={pending === pos.poolId}
                    loadingText="Selling"
                    onClick={() =>
                      void runAction(pos.poolId, () =>
                        withdrawGM(
                          "DUMMY_ACCOUNT",
                          pos.poolName,
                          pos.balanceTokens
                        )
                      )
                    }
                  >
                    Sell
                  </LoadingButton>
                </TableCell>
              </TableRow>
            ))}

            {glvPositions.map((pos) => (
              <TableRow key={pos.vaultId}>
                <TableCell className="font-medium">
                  {pos.vaultName}{" "}
                  <Text tone="muted" render={<span />}>
                    [{pos.displayPair}]
                  </Text>
                </TableCell>
                <TableCell>
                  <TypeBadge kind="GLV" />
                </TableCell>
                <TableCell align="right">
                  <NumericText role="positive">
                    {formatPct(pos.apy, { sign: false })}
                  </NumericText>
                </TableCell>
                <TableCell align="right">
                  <NumericText>{formatUsd(pos.balanceUsd)}</NumericText>
                </TableCell>
                <TableCell align="right">
                  <LoadingButton
                    size="xs"
                    variant="outline"
                    isLoading={pending === pos.vaultId}
                    loadingText="Selling"
                    onClick={() =>
                      void runAction(pos.vaultId, () =>
                        withdrawGLV(
                          "DUMMY_ACCOUNT",
                          `${pos.vaultName} [${pos.displayPair}]`,
                          pos.balanceTokens
                        )
                      )
                    }
                  >
                    Sell
                  </LoadingButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
