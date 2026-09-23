import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { LoadingButton } from "@workspace/ui/components/loading-button"
import { Stat } from "@workspace/ui/components/stat"
import { useUserSO4Stats } from "../../hooks/use-earn-data"
import { compoundRewards, vestEsSO4 } from "../../lib/earn"
import { formatToken } from "@/shared/lib/format"
import { useWalletStore } from "@/features/wallet/store/wallet-store"

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-prose space-y-1.5">
          <h3 className="text-13 font-semibold">{title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          {children && <div className="pt-2">{children}</div>}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  )
}

export function AdditionalOpportunitiesTab() {
  const { data: so4Stats, isLoading } = useUserSO4Stats()
  const { address } = useWalletStore()
  const [vestPending, setVestPending] = useState(false)
  const [compoundPending, setCompoundPending] = useState(false)

  async function handleVest() {
    if (!address) return
    setVestPending(true)
    try {
      // TODO: open vesting modal with amount input + confirmation
      await vestEsSO4(address, so4Stats.esSO4Balance)
    } finally {
      setVestPending(false)
    }
  }

  async function handleCompound() {
    if (!address) return
    setCompoundPending(true)
    try {
      await compoundRewards(address)
    } finally {
      setCompoundPending(false)
    }
  }

  const hasEsSO4 = so4Stats.esSO4Balance > 0
  const hasMultiplierPoints = so4Stats.multiplierPoints > 0

  return (
    <div className="space-y-4">
      {/* esSO4 Vesting */}
      <SectionCard
        title="esSO4 Vesting"
        description="Convert esSO4 (escrowed SO4) into SO4 tokens over a 12-month linear vesting period. Tokens unlock gradually — claim anytime."
        action={
          <LoadingButton
            size="lg"
            variant="outline"
            className="h-8 text-xs"
            disabled={vestPending || !hasEsSO4}
            onClick={() => void handleVest()}
          >
            Vest now
          </LoadingButton>
        }
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Stat
            label="esSO4 balance"
            value={formatToken(so4Stats.esSO4Balance, "esSO4", { minDecimals: 2 })}
            size="md"
            isLoading={isLoading}
          />
          <Stat label="Vesting duration" value="12 months" size="md" />
          <Stat label="Conversion rate" value="1 esSO4 → 1 SO4" size="md" />
        </div>
      </SectionCard>

      {/* Multiplier Points */}
      <SectionCard
        title="Multiplier Points"
        description="Stake SO4 continuously to earn Multiplier Points (MPs). MPs boost your staking power proportionally, increasing your fee-reward share without additional token exposure or sell pressure."
        action={
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={compoundPending || !hasMultiplierPoints}
            onClick={() => void handleCompound()}
          >
            Compound
          </Button>
        }
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Stat
            label="Multiplier Points"
            value={formatToken(so4Stats.multiplierPoints, "MP", { minDecimals: 2 })}
            role="accent"
            size="md"
            isLoading={isLoading}
          />
          <Stat label="Boost cap" value="100% of base APR" size="md" />
          <Stat label="Accrual rate" value="100% APR on staked SO4" size="md" />
        </div>
      </SectionCard>

      {/* Referrals */}
      <SectionCard
        title="Referrals"
        description="Share your referral code to earn fee discounts and rebates. Referrers receive a percentage of their referees' trading fees, paid in USDC every epoch."
        action={
          <Link to="/referrals">
            <Button size="sm" variant="outline" className="h-8 text-xs">
              Go to Referrals →
            </Button>
          </Link>
        }
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Stat label="Referrer rebate" value="5% of referee fees" size="md" />
          <Stat label="Referee discount" value="5% fee reduction" size="md" />
          <Stat label="Paid in" value="USDC weekly" size="md" />
        </div>
      </SectionCard>
    </div>
  )
}
