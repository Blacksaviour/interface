// No aggregate stats endpoint exists yet (verified against
// apps/web/src/lib/graphql/queries.ts — no platform-wide traders/volume/OI
// query). GMX sources these from useTraders/useTotalVolume/usePoolsData
// (landing/src/pages/Home/hooks/*). Every field stays null until SO4 has an
// equivalent, rendering the "-" loading placeholder exactly like GMX's own
// loading state — not a fabricated number. This is a backend gap, not
// something this frontend pass can close; wire it up once the indexer
// exposes the aggregate.

export type LandingStats = {
  traders: number | null
  openInterest: number | null
  totalVolume: number | null
  liquidityTotal: number | null
  loading: boolean
}

export function useLandingStats(): LandingStats {
  return {
    traders: null,
    openInterest: null,
    totalVolume: null,
    liquidityTotal: null,
    loading: false,
  }
}
