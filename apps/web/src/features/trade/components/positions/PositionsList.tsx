import { useEffect, useRef, useState } from "react"
import { toast } from "@workspace/ui/components/toast"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { DataTable } from "@workspace/ui/components/data-table"
import { StatusBadge } from "@workspace/ui/components/status-badge"
import { Numeric } from "@workspace/ui/components/numeric"
import { usePositionsWithIndexer } from "../../hooks/usePositionsWithIndexer"
import { useFundingRate } from "../../hooks/useFundingRate"
import { claimFundingFees, createDecreaseOrder } from "../../lib/stellar"
import { queryKeys } from "../../lib/query-keys"
import { CollateralDialog } from "./CollateralDialog"
import type { Column } from "@workspace/ui/components/data-table"
import type { Position } from "../../hooks/usePositions"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { TokenIcon } from "@/shared/components/TokenIcon"

type Props = {
  onSelectPosition?: (position: Position) => void
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0m"
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function useFundingCountdown(nextEpochTs: number | undefined): string {
  const [remaining, setRemaining] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (nextEpochTs === undefined) return

    function tick() {
      setRemaining(Math.max(0, nextEpochTs! - Date.now()))
    }

    tick()
    intervalRef.current = setInterval(tick, 1000)

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [nextEpochTs])

  return formatCountdown(remaining)
}

export function PositionsList({ onSelectPosition }: Props) {
  const { data: positions = [], isLoading, isDisabled } = usePositionsWithIndexer()
  const { data: fundingRate } = useFundingRate()
  const countdown = useFundingCountdown((fundingRate as any)?.nextEpochTs)
  const account = useWalletStore((state) => state.address)
  const queryClient = useQueryClient()
  const [closing, setClosing] = useState<string | null>(null)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [dialogPosition, setDialogPosition] = useState<Position | null>(null)
  const [dialogMode, setDialogMode] = useState<"add" | "remove" | null>(null)

  async function handleClose(position: Position) {
    setClosing(position.key)
    try {
      // 1% slippage: for a long close we sell at min_price, so acceptable = markPrice * 0.99
      // for a short close we buy back at max_price, so acceptable = markPrice * 1.01
      const closeAcceptablePrice = position.isLong
        ? position.markPrice * 0.99
        : position.markPrice * 1.01

      await createDecreaseOrder({
        account: position.account,
        positionKey: position.key,
        marketAddress: position.marketAddress,
        collateralToken: position.collateralToken,
        collateralDeltaAmount: 0, // 0 = let contract return all collateral on full close
        sizeDeltaUsd: position.sizeUsd,
        sizeDeltaUsdRaw: position.sizeInUsdRaw, // exact bigint avoids float64 precision loss
        isLong: position.isLong,
        acceptablePrice: closeAcceptablePrice,
        orderType: "MarketDecrease",
        receiveToken: position.collateralToken,
      })
      if (account) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.positions("stellar-mainnet", account),
        })
      }
    } finally {
      setClosing(null)
    }
  }

  function handleShare(position: Position) {
    const url = `${window.location.origin}/trade?market=${encodeURIComponent(position.indexToken)}&type=${position.isLong ? "long" : "short"}`
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Position link copied", { description: url }),
      () => toast.error("Could not copy link to clipboard"),
    )
  }

  async function handleClaim(position: Position) {
    setClaiming(position.key)
    try {
      await claimFundingFees(position.account, [position.marketAddress], [position.collateralToken])
      if (account) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.positions("stellar-mainnet", account),
        })
      }
    } finally {
      setClaiming(null)
    }
  }

  const columns: Array<Column<Position>> = [
    {
      id: "market",
      header: "Market",
      accessor: (p) => (
        <div className="flex items-center gap-1.5">
          <TokenIcon symbol={p.indexToken} size={20} />
          <span className="font-medium">{p.marketName}</span>
          <StatusBadge variant={p.isLong ? "success" : "danger"}>
            {p.isLong ? "Long" : "Short"}
          </StatusBadge>
        </div>
      ),
    },
    {
      id: "size",
      header: "Size",
      accessor: (p) => <Numeric value={p.sizeUsd} format="usd" role="neutral" />,
    },
    {
      id: "collateral",
      header: "Collateral",
      accessor: (p) => <Numeric value={p.collateralUsd} format="usd" role="neutral" />,
    },
    {
      id: "entry",
      header: "Entry",
      accessor: (p) => <Numeric value={p.entryPrice} format="usd" role="neutral" />,
    },
    {
      id: "mark",
      header: "Mark",
      accessor: (p) => <Numeric value={p.markPrice} format="usd" role="neutral" />,
    },
    {
      id: "liq",
      header: "Liq.",
      accessor: (p) => {
        const closeToLiq = Math.abs(p.markPrice - p.liquidationPrice) / p.markPrice <= 0.1
        return <Numeric value={p.liquidationPrice} format="usd" role={closeToLiq ? "danger" : "neutral"} />
      },
    },
    {
      id: "pnl",
      header: "PnL",
      accessor: (p) => {
        const role = p.pnlAfterFees >= 0 ? "positive" : "negative"
        return (
          <>
            <Numeric value={p.pnlAfterFees} format="usd" role={role} />
            {" "}
            <Numeric value={p.pnlPercent} format="pct" role={role} />
          </>
        )
      },
    },
    {
      id: "funding-fee",
      header: "Funding Fee",
      accessor: (p) =>
        p.fundingFeeUsd > 0 ? (
          <Numeric value={p.fundingFeeUsd} format="usd" role="positive" />
        ) : (
          <span className="text-muted-foreground">&mdash;</span>
        ),
    },
    {
      id: "next-funding",
      header: "Next Funding",
      accessor: () => (
        <span className="font-mono tabular-nums text-muted-foreground">{countdown}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      accessor: (p) => (
        <div className="flex items-center gap-1">
          <Button
            size="xs"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              handleShare(p)
            }}
          >
            Share
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              setDialogPosition(p)
              setDialogMode("add")
            }}
          >
            + Collateral
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              setDialogPosition(p)
              setDialogMode("remove")
            }}
          >
            - Collateral
          </Button>
          {p.fundingFeeUsd > 0 && (
            <Button
              size="xs"
              variant="outline"
              disabled={claiming === p.key}
              onClick={(e) => {
                e.stopPropagation()
                void handleClaim(p)
              }}
            >
              {claiming === p.key ? "\u2026" : "Claim"}
            </Button>
          )}
          <Button
            size="xs"
            variant="outline"
            disabled={closing === p.key}
            onClick={(e) => {
              e.stopPropagation()
              void handleClose(p)
            }}
          >
            {closing === p.key ? "\u2026" : "Close"}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      {isDisabled && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-500">
          ⚠️ Indexer disabled - Historical data unavailable. Showing live contract data only.
        </div>
      )}
      <DataTable
        columns={columns}
        data={positions}
        isLoading={isLoading}
        emptyMessage="No open positions"
        emptyAction={
          <div className="flex flex-col items-center gap-2">
            {isDisabled && (
              <p className="text-xs text-amber-500">
                ⚠️ Indexer disabled - showing contract-only data
              </p>
            )}
            <p className="text-xs text-muted-foreground">Start trading to open your first position</p>
            <a href="/trade" className="text-xs text-primary hover:text-primary/80 font-medium">
              Start trading →
            </a>
          </div>
        }
        keyExtractor={(p) => p.key}
        onRowClick={onSelectPosition ? (p) => onSelectPosition(p) : undefined}
      />
      <CollateralDialog
        position={dialogPosition}
        mode={dialogMode}
        open={dialogPosition !== null}
        onClose={() => {
          setDialogPosition(null)
          setDialogMode(null)
        }}
      />
    </>
  )
}

