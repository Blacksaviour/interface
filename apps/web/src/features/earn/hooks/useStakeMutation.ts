import { useMutation } from "@tanstack/react-query"
import { stakeSO4, unstakeSO4 } from "../lib/earn"
import { useWalletStore } from "@/features/wallet/store/wallet-store"

export function useStakeMutation() {
  const { address } = useWalletStore()

  return useMutation({
    // `durationMultiplier` is part of the caller-facing contract but the
    // staking contract currently only accepts account & amount, so it is
    // accepted and ignored rather than dropped from the type.
    mutationFn: ({
      action,
      amount,
    }: {
      action: "stake" | "unstake"
      amount: number
      durationMultiplier?: number
    }) => {
      if (!address) throw new Error("Wallet not connected")

      if (action === "stake") {
        return stakeSO4(address, amount)
      } else {
        return unstakeSO4(address, amount)
      }
    },
  })
}
