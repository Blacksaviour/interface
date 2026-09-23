import { describe, it, expect, beforeEach } from "vitest"
import {
  useLayoutPreferencesStore,
  CHART_HEIGHT_DEFAULT,
  CHART_HEIGHT_MIN,
  CHART_HEIGHT_MAX,
  TRADE_PANEL_WIDTH_DEFAULT,
  TRADE_PANEL_WIDTH_MIN,
  TRADE_PANEL_WIDTH_MAX,
} from "./layout-preferences-store"

describe("layout-preferences-store", () => {
  beforeEach(() => {
    localStorage.clear()
    useLayoutPreferencesStore.setState({
      chartHeight: CHART_HEIGHT_DEFAULT,
      tradePanelWidth: TRADE_PANEL_WIDTH_DEFAULT,
    })
  })

  it("has sensible defaults", () => {
    const state = useLayoutPreferencesStore.getState()
    expect(state.chartHeight).toBe(CHART_HEIGHT_DEFAULT)
    expect(state.tradePanelWidth).toBe(TRADE_PANEL_WIDTH_DEFAULT)
  })

  it("clamps chart height to the min/max bounds", () => {
    useLayoutPreferencesStore.getState().setChartHeight(CHART_HEIGHT_MIN - 100)
    expect(useLayoutPreferencesStore.getState().chartHeight).toBe(CHART_HEIGHT_MIN)

    useLayoutPreferencesStore.getState().setChartHeight(CHART_HEIGHT_MAX + 100)
    expect(useLayoutPreferencesStore.getState().chartHeight).toBe(CHART_HEIGHT_MAX)
  })

  it("clamps trade panel width to the min/max bounds", () => {
    useLayoutPreferencesStore.getState().setTradePanelWidth(TRADE_PANEL_WIDTH_MIN - 100)
    expect(useLayoutPreferencesStore.getState().tradePanelWidth).toBe(TRADE_PANEL_WIDTH_MIN)

    useLayoutPreferencesStore.getState().setTradePanelWidth(TRADE_PANEL_WIDTH_MAX + 100)
    expect(useLayoutPreferencesStore.getState().tradePanelWidth).toBe(TRADE_PANEL_WIDTH_MAX)
  })

  it("rejects NaN values by falling back to the minimum bound", () => {
    useLayoutPreferencesStore.getState().setChartHeight(NaN)
    expect(useLayoutPreferencesStore.getState().chartHeight).toBe(CHART_HEIGHT_MIN)
  })

  it("resetLayout restores both dimensions to their defaults", () => {
    useLayoutPreferencesStore.getState().setChartHeight(CHART_HEIGHT_MAX)
    useLayoutPreferencesStore.getState().setTradePanelWidth(TRADE_PANEL_WIDTH_MAX)
    useLayoutPreferencesStore.getState().resetLayout()

    const state = useLayoutPreferencesStore.getState()
    expect(state.chartHeight).toBe(CHART_HEIGHT_DEFAULT)
    expect(state.tradePanelWidth).toBe(TRADE_PANEL_WIDTH_DEFAULT)
  })

  it("persists changes to localStorage", () => {
    useLayoutPreferencesStore.getState().setTradePanelWidth(400)
    const stored = JSON.parse(localStorage.getItem("trade-layout-preferences") || "{}")
    expect(stored.state.tradePanelWidth).toBe(400)
  })
})
