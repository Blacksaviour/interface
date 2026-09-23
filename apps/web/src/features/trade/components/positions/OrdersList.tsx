import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { DataTable } from "@workspace/ui/components/data-table"
import { StatusBadge } from "@workspace/ui/components/status-badge"
import { Numeric } from "@workspace/ui/components/numeric"
import { useOrdersWithIndexer } from "../../hooks/useOrdersWithIndexer"
import { cancelOrder } from "../../lib/stellar"
import type { Column } from "@workspace/ui/components/data-table"
import type { OrderWithIndexer } from "../../hooks/useOrdersWithIndexer"
import type { OrderKey } from "@/lib/contracts"

function toOrderKey(order: OrderWithIndexer): OrderKey {
  return order.key
}

export function OrdersList() {
  const { data: orders = [], isLoading, isDisabled } = useOrdersWithIndexer()
  const [cancelling, setCancelling] = useState<string | null>(null)

  async function handleCancel(order: OrderWithIndexer) {
    setCancelling(order.key)
    try {
      await cancelOrder(order.account, toOrderKey(order))
    } finally {
      setCancelling(null)
    }
  }

  const columns: Array<Column<OrderWithIndexer>> = [
    {
      id: "market",
      header: "Market",
      accessor: (o) => (
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{o.marketName}</span>
          <StatusBadge variant={o.isLong ? "success" : "danger"}>
            {o.isLong ? "Long" : "Short"}
          </StatusBadge>
          {o.status === "frozen" && (
            <StatusBadge variant="warning">Frozen</StatusBadge>
          )}
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      accessor: (o) => <span className="text-muted-foreground">{o.orderType}</span>,
    },
    {
      id: "size",
      header: "Size",
      accessor: (o) => <Numeric value={o.sizeUsd} format="usd" />,
    },
    {
      id: "trigger",
      header: "Trigger",
      accessor: (o) => <Numeric value={o.triggerPrice} format="usd" />,
    },
    {
      id: "created",
      header: "Created",
      accessor: (o) => (
        <span className="text-muted-foreground">
          {new Date(o.updatedAt).toLocaleTimeString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      accessor: (o) => (
        <Button
          size="xs"
          variant="outline"
          disabled={cancelling === o.key}
          onClick={() => void handleCancel(o)}
        >
          {cancelling === o.key ? "\u2026" : "Cancel"}
        </Button>
      ),
    },
  ]

  return (
    <>
      {isDisabled && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-500">
          ⚠️ Indexer disabled - Order history unavailable. Showing live contract data only.
        </div>
      )}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage={isDisabled ? "Indexer disabled - showing contract-only data" : "No open orders"}
        keyExtractor={(o) => o.key}
      />
    </>
  )
}
