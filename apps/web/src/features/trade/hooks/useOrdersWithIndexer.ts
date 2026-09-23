/**
 * apps/web/src/features/trade/hooks/useOrdersWithIndexer.ts
 *
 * Enhanced orders hook that uses SubQuery for order history and status.
 * Includes frozen, cancelled, and executed states from indexer.
 */

import { useAccountOrders } from "./useAccountOrders"
import { useOrders } from "./useOrders"
import type { Order as ContractOrder, OrderType } from "./useOrders"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { INDEXER_CONFIG } from "@/app/config/indexer"

export type OrderWithIndexer = ContractOrder & {
  frozenTimestamp?: Date | null
  frozenTransactionHash?: string | null
  executedTimestamp?: Date | null
  executedTransactionHash?: string | null
  cancelledTimestamp?: Date | null
  cancelledTransactionHash?: string | null
  cancellationReason?: string | null
}

/**
 * Enhanced useOrders that uses SubQuery for order status and history.
 * Falls back to contract-only data when indexer is disabled.
 */
export function useOrdersWithIndexer() {
  const account = useWalletStore((state) => state.address)
  
  // Get indexed orders from SubQuery
  const { data: indexedOrders = [], isLoading: isLoadingIndexer, isDisabled } = useAccountOrders(account)
  
  // Get contract orders as fallback
  const { data: contractOrders = [], isLoading: isLoadingContract } = useOrders()
  
  // If indexer is disabled, return contract-only data
  if (isDisabled || !INDEXER_CONFIG.enabled) {
    return {
      data: contractOrders,
      isLoading: isLoadingContract,
      isDisabled: true,
    }
  }
  
  // Map indexed orders to the expected format
  const enhancedOrders: Array<OrderWithIndexer> = indexedOrders
    .filter(o => o.status === "created" || o.status === "updated" || o.status === "frozen")
    .map((indexedOrder) => {
      const sizeUsd = parseFloat(indexedOrder.sizeDeltaUsd ?? "0") / 1e30
      const triggerPrice = parseFloat(indexedOrder.triggerPrice ?? "0") / 1e30
      
      return {
        key: indexedOrder.key,
        account: indexedOrder.account,
        marketAddress: indexedOrder.market.key,
        marketName: indexedOrder.market.name ?? indexedOrder.market.key,
        collateralToken: indexedOrder.collateralToken?.address ?? "",
        // The indexer types these as plain strings; the filter above already
        // narrowed status to the three values mapped here.
        orderType: indexedOrder.orderType as OrderType,
        status: indexedOrder.status === "frozen" ? "frozen" : "active",
        isLong: indexedOrder.isLong ?? false,
        sizeUsd,
        triggerPrice,
        acceptablePrice: parseFloat(indexedOrder.acceptablePrice ?? "0") / 1e30,
        updatedAt: (indexedOrder.updatedTimestamp ?? indexedOrder.createdTimestamp)?.getTime() ?? Date.now(),
        frozenTimestamp: indexedOrder.frozenTimestamp,
        frozenTransactionHash: indexedOrder.frozenTransactionHash,
        executedTimestamp: indexedOrder.executedTimestamp,
        executedTransactionHash: indexedOrder.executedTransactionHash,
        cancelledTimestamp: indexedOrder.cancelledTimestamp,
        cancelledTransactionHash: indexedOrder.cancelledTransactionHash,
        cancellationReason: indexedOrder.cancellationReason,
      }
    })
  
  return {
    data: enhancedOrders,
    isLoading: isLoadingIndexer,
    isDisabled: false,
  }
}
