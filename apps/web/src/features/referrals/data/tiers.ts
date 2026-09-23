export type Tier = {
  level: 1 | 2 | 3
  label: string
  /** Monthly referred volume threshold in USD to reach this tier */
  minVolumeUsd: number
  traderDiscountPct: number
  affiliateCommissionPct: number
  /**
   * Decorative metallic tint layered on the shared `Badge` primitive. Tier
   * identity is brand colour, not a status role, so it stays data-driven here
   * instead of becoming a semantic token.
   */
  badgeClass: string
  /** Background + text tint used alongside `ringClass` for the compact pill variant. */
  colorClass: string
  /** Ring color paired with `colorClass` for the compact pill variant. */
  ringClass: string
}

export const TIERS: Array<Tier> = [
  {
    level: 1,
    label: "Bronze",
    minVolumeUsd: 0,
    traderDiscountPct: 5,
    affiliateCommissionPct: 5,
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    colorClass: "bg-orange-500/10 text-orange-400",
    ringClass: "ring-orange-500/30",
  },
  {
    level: 2,
    label: "Silver",
    minVolumeUsd: 2_500,
    traderDiscountPct: 5,
    affiliateCommissionPct: 10,
    badgeClass: "border-slate-400/30 bg-slate-500/10 text-slate-300",
    colorClass: "bg-slate-500/10 text-slate-300",
    ringClass: "ring-slate-400/30",
  },
  {
    level: 3,
    label: "Gold",
    minVolumeUsd: 25_000,
    traderDiscountPct: 5,
    affiliateCommissionPct: 15,
    badgeClass: "border-yellow-400/30 bg-yellow-500/10 text-yellow-400",
    colorClass: "bg-yellow-500/10 text-yellow-400",
    ringClass: "ring-yellow-400/30",
  },
]

export function getTierByLevel(level: 1 | 2 | 3): Tier {
  return TIERS[level - 1]
}

export function getTierFromVolume(volumeUsd: number): Tier {
  return [...TIERS].reverse().find((t) => volumeUsd >= t.minVolumeUsd) ?? TIERS[0]
}

export function getNextTier(current: 1 | 2 | 3): Tier | null {
  return TIERS[current] ?? null
}
