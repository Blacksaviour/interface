import { useState } from "react"
import { Alert } from "@workspace/ui/components/alert"
import { Card } from "@workspace/ui/components/card"
import { LoadingButton } from "@workspace/ui/components/loading-button"
import { Separator } from "@workspace/ui/components/separator"
import { Stat } from "@workspace/ui/components/stat"
import { useEarnStats } from "../../hooks/use-earn-data"
import { claimRewards } from "../../lib/earn"
import { formatPct, formatUsd } from "@/shared/lib/format"


function InfoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="mt-[1px] shrink-0"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  )
}

export function RewardsBar() {
  const [bannerOpen, setBannerOpen] = useState(true)
  const { data: stats, isLoading } = useEarnStats()
  const [claiming, setClaiming] = useState(false)

  async function handleClaim() {
    setClaiming(true)
    try {
      // TODO: pass real wallet account address from wallet context
      await claimRewards("DUMMY_ACCOUNT")
    } finally {
      setClaiming(false)
    }
  }

  const hasPendingRewards = stats.totalPendingRewardsUsd > 0

  return (
    <div className="space-y-3">
      {bannerOpen && (
        <Alert variant="info" className="rounded-xl">
          <InfoIcon />
          <p className="flex-1 text-xs leading-relaxed">
            Protocol fees are accumulating in the Treasury for SO4 buybacks. Rewards will be
            distributed to stakers proportional to staking power{" "}
            <span className="font-medium">(duration × amount staked)</span> when the buyback
            threshold is reached.
          </p>
          <button
            aria-label="Dismiss"
            onClick={() => setBannerOpen(false)}
            className="mt-0.5 shrink-0 opacity-50 transition-opacity hover:opacity-100"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </Alert>
      )}

      <Card className="flex flex-wrap items-center gap-x-8 gap-y-4 px-6 py-4">
        <Stat
          label="Total investment value"
          value={formatUsd(stats.totalInvestmentUsd)}
          isLoading={isLoading}
        />

        <Separator orientation="vertical" className="h-8" />

        <Stat
          label="Total earned"
          value={formatUsd(stats.totalEarnedUsd)}
          role={stats.totalEarnedUsd > 0 ? "positive" : "neutral"}
          isLoading={isLoading}
        />

        <Separator orientation="vertical" className="h-8" />

        <Stat
          label="Total pending rewards"
          value={formatUsd(stats.totalPendingRewardsUsd)}
          role={hasPendingRewards ? "positive" : "neutral"}
          isLoading={isLoading}
        />

        <Separator orientation="vertical" className="h-8" />

        <Stat
          label="Staking Power Share"
          value={formatPct(stats.stakingPowerSharePct, { sign: false })}
          isLoading={isLoading}
        />

        <div className="ms-auto">
          <LoadingButton
            variant="outline"
            size="lg"
            isLoading={claiming}
            loadingText="Claiming…"
            disabled={!hasPendingRewards}
            onClick={() => void handleClaim()}
            className="h-9 gap-2 text-xs"
          >
            <GiftIcon />
            Claim rewards
          </LoadingButton>
        </div>
      </Card>
    </div>
  )
}
