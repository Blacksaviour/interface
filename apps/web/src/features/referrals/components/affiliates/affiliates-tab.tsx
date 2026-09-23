import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { NumericText } from "@workspace/ui/components/numeric"
import { Skeleton } from "@workspace/ui/components/skeleton"
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
import { useAffiliateReferrals } from "../../hooks/use-referrals-data"
import { useReferralCode } from "../../queries/useReferralCode"
import { useReferralStats } from "../../queries/useReferralStats"
import { useReferralTier } from "../../queries/useReferralTier"
import { createAffiliateCode, validateReferralCode } from "../../lib/referrals"
import { TIERS } from "../../data/tiers"
import { TimePeriodFilter } from "../shared/time-period-filter"
import { StatChartCard } from "../shared/stat-chart-card"
import { TierProgress } from "../shared/tier-progress"
import type { TimePeriod } from "../../hooks/use-referrals-data"
import { formatAddress, formatUsd } from "@/shared/lib/format"
import { queryKeys } from "@/shared/lib/query-keys"
import { useWalletStore } from "@/features/wallet/store/wallet-store"

// ── Create code wizard ──────────────────────────────────────────────────────

function CreateCodeForm({ onSuccess }: { onSuccess: () => void }) {
  const account = useWalletStore((state) => state.address)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!account) {
      setError("Connect your wallet first")
      return
    }
    const err = validateReferralCode(code)
    if (err) { setError(err); return }
    setError(null)
    setPending(true)
    try {
      await createAffiliateCode(account, code.toUpperCase().trim())
      onSuccess()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create code")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* How it works */}
      <div className="mb-6 flex gap-4 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <p className="text-13 font-semibold">Create a code and start earning commissions</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Earn up to <span className="font-semibold text-violet-400">15%</span> of trading fees
            from every user who joins with your code. Tier up as your referrals grow.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="affiliate-code" className="text-xs font-medium text-muted-foreground">
            Choose your referral code
          </label>
          <div className="flex gap-2">
            <input
              id="affiliate-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))
                setError(null)
              }}
              placeholder="e.g. MYCODE123"
              maxLength={16}
              autoComplete="off"
              spellCheck={false}
              className="flex h-9 w-full rounded-lg border border-border bg-muted/30 px-3 font-mono text-13 tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              render={<label htmlFor="affiliate-code" />}
            >
              {pending ? "Creating…" : "Create"}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            {error
              ? <p className="text-11 text-destructive">{error}</p>
              : <p className="text-11 text-muted-foreground">Letters, numbers, and underscores only. Max 16 chars.</p>
            }
            <span className="text-11 tabular-nums text-muted-foreground/50">{code.length}/16</span>
          </div>
        </div>
      </form>

      {/* Tier table */}
      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-3 text-11 font-semibold uppercase tracking-wider text-muted-foreground">
          Commission tiers
        </p>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/25 text-left">
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Tier</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Volume (30d)</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Commission</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Trader discount</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier, i) => (
                <tr key={tier.level} className={cn("border-b border-border/40 last:border-b-0", i % 2 === 0 ? "" : "bg-muted/10")}>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-10 font-semibold ring-1", tier.colorClass, tier.ringClass)}>
                      {tier.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {tier.minVolumeUsd === 0 ? "Any" : `≥ ${formatUsd(tier.minVolumeUsd, { compact: true })}`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-violet-400">
                    {tier.affiliateCommissionPct}%
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-400">
                    {tier.traderDiscountPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard (when code exists) ────────────────────────────────────────────

function ReferralsTable() {
  const { data: referrals = [], isLoading } = useAffiliateReferrals()

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border px-5 py-3.5">
        <h3 className="text-13 font-semibold">Referrals</h3>
      </div>
      {isLoading ? (
        <LoadingState rows={2} label="Loading referrals" />
      ) : referrals.length === 0 ? (
        <EmptyState
          title="No referrals yet"
          description="Share your code to start earning commissions"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableHeadRow>
              <TableHead>Account</TableHead>
              <TableHead align="right">Volume</TableHead>
              <TableHead align="right">Commission</TableHead>
              <TableHead>Since</TableHead>
            </TableHeadRow>
          </TableHeader>
          <TableBody>
            {referrals.map((r) => (
              <TableRow key={r.account}>
                <TableCell className="py-3">
                  <NumericText>{formatAddress(r.account)}</NumericText>
                </TableCell>
                <TableCell align="right" className="py-3">
                  <NumericText>{formatUsd(r.volumeUsd, { compact: true })}</NumericText>
                </TableCell>
                <TableCell align="right" className="py-3">
                  <NumericText role="accent">
                    {formatUsd(r.commissionUsd, { compact: true })}
                  </NumericText>
                </TableCell>
                <TableCell className="py-3 text-muted-foreground">{r.registeredAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export function AffiliatesTab() {
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState<TimePeriod>("total")
  const { data: code, isLoading: codeLoading } = useReferralCode()
  const { data: tier } = useReferralTier()
  const { data: stats, isLoading: statsLoading } = useReferralStats(code ?? null, period)
  const hasCode = Boolean(code)
  const isLoading = codeLoading || statsLoading

  function handleCodeCreated() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.referrals.code(null) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.referrals.stats(code ?? null, period) })
  }

  if (!hasCode && !codeLoading) {
    return <CreateCodeForm onSuccess={handleCodeCreated} />
  }

  return (
    <div className="space-y-5">
      {/* Tier progress */}
      <TierProgress tier={tier ?? 1} volumeUsd={stats?.totalVolumeUsd ?? 0} />

      {/* Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-13 font-semibold">Overview</h2>
          <TimePeriodFilter value={period} onChange={setPeriod} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col justify-center gap-1 rounded-xl border border-border bg-card px-5 py-4">
              <span className="text-11 text-muted-foreground">Total referrals</span>
              <span className="text-22 font-semibold tabular-nums">{stats?.totalTraders ?? 0}</span>
            </div>
            <StatChartCard
              title="Referred volume"
              tooltip="Total trading volume generated by your referrals"
              value={stats?.totalVolumeUsd ?? 0}
              period={period}
              accent="blue"
            />
            <StatChartCard
              title="Commissions"
              tooltip="Total fees earned from your referrals' trades"
              value={stats?.totalRebatesUsd ?? 0}
              period={period}
              accent="green"
            />
          </div>
        )}
      </div>

      <ReferralsTable />
    </div>
  )
}
