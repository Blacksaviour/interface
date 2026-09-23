import { create } from "zustand"
import { persist } from "zustand/middleware"

// Issue #685 (OB-038): bounded workspace panel resizing.
//
// Layout is a pure UI preference and is persisted independently of any
// financial/query data — this store never touches TanStack Query's cache
// and TanStack Query never touches this store.

export const CHART_HEIGHT_MIN = 240
export const CHART_HEIGHT_MAX = 900
export const CHART_HEIGHT_DEFAULT = 480

export const TRADE_PANEL_WIDTH_MIN = 280
export const TRADE_PANEL_WIDTH_MAX = 480
export const TRADE_PANEL_WIDTH_DEFAULT = 320

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

export interface LayoutPreferencesState {
  /** Height in px of the chart region within the left column. */
  chartHeight: number
  /** Width in px of the right-hand trade panel column (desktop only). */
  tradePanelWidth: number
  setChartHeight: (value: number) => void
  setTradePanelWidth: (value: number) => void
  resetLayout: () => void
}

export const useLayoutPreferencesStore = create<LayoutPreferencesState>()(
  persist(
    (set) => ({
      chartHeight: CHART_HEIGHT_DEFAULT,
      tradePanelWidth: TRADE_PANEL_WIDTH_DEFAULT,
      setChartHeight: (value) =>
        set({ chartHeight: clamp(value, CHART_HEIGHT_MIN, CHART_HEIGHT_MAX) }),
      setTradePanelWidth: (value) =>
        set({ tradePanelWidth: clamp(value, TRADE_PANEL_WIDTH_MIN, TRADE_PANEL_WIDTH_MAX) }),
      resetLayout: () =>
        set({
          chartHeight: CHART_HEIGHT_DEFAULT,
          tradePanelWidth: TRADE_PANEL_WIDTH_DEFAULT,
        }),
    }),
    {
      name: "trade-layout-preferences",
      // Re-clamp on read so a layout saved on a large screen (or an older
      // build with different bounds) can't restore out-of-bounds on a
      // smaller viewport. The component further clamps chartHeight against
      // the live container size — see useBoundedChartHeight.
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<LayoutPreferencesState>) }
        return {
          ...state,
          chartHeight: clamp(state.chartHeight, CHART_HEIGHT_MIN, CHART_HEIGHT_MAX),
          tradePanelWidth: clamp(state.tradePanelWidth, TRADE_PANEL_WIDTH_MIN, TRADE_PANEL_WIDTH_MAX),
        }
      },
    }
  )
)
