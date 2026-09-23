import { useEffect, useRef, useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import { useTradeState } from "../hooks/useTradeState"
import { useOrderEventPolling } from "../hooks/useOrderEventPolling"
import { useBoundedChartHeight } from "../hooks/useBoundedChartHeight"
import { useLayoutPreferencesStore } from "../store/layout-preferences-store"
import { AppShell } from "@workspace/ui/components/app-shell"
import { Button } from "@workspace/ui/components/button"
import { ResizeHandle } from "@workspace/ui/components/resize-handle"
import { cn } from "@workspace/ui/lib/utils"
import { Navbar } from "../../../ui/Navbar"
import { TVChart } from "./chart/TVChart"
import { TradePanel } from "./trade-panel/TradePanel"
import { BottomTabs } from "./positions/BottomTabs"
import { CircuitBreakerBanner } from "./CircuitBreakerBanner"
import { PanelErrorBoundary } from "./PanelErrorBoundary"
import { MobileTradeNav, mobileViewClassName, type MobileTradeView } from "./MobileTradeNav"
import { saveReferralCode } from "@/lib/contracts"

const tradeRoute = getRouteApi("/trade")

export function TradePage() {
  const trade = useTradeState()
  const { setToTokenAddress, setTradeType } = trade

  useOrderEventPolling()

  // Pre-fill the form from a shared deeplink (e.g. /trade?market=BTC&type=long).
  const search = tradeRoute.useSearch()
  const appliedDeeplink = useRef(false)
  useEffect(() => {
    if (appliedDeeplink.current) return
    if (!search.market && !search.type) return
    appliedDeeplink.current = true
    if (search.market) setToTokenAddress(search.market)
    if (search.type) setTradeType(search.type === "long" ? "Long" : "Short")
  }, [search.market, search.type, setToTokenAddress, setTradeType])

  useEffect(() => {
    if (!search.ref) return
    const normalized = search.ref.toUpperCase().trim()
    if (!normalized) return
    saveReferralCode(normalized)
  }, [search.ref])

  // ── Desktop workspace resizing (OB-038) ─────────────────────────────────
  const leftColumnRef = useRef<HTMLDivElement>(null)
  const { chartHeight, tradePanelWidth, setChartHeight, setTradePanelWidth, resetLayout } =
    useLayoutPreferencesStore()
  const boundedChartHeight = useBoundedChartHeight(leftColumnRef, chartHeight)

  // ── Mobile chart/book/trade navigation (OB-037) ─────────────────────────
  const [mobileView, setMobileView] = useState<MobileTradeView>("chart")

  return (
    <AppShell
      variant="full"
      navbar={<Navbar variant="app" />}
      banner={<CircuitBreakerBanner symbol={trade.toTokenAddress} />}
      className="overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:px-6">
        {/* ── Chart + Bottom Tabs column ─────────────────────────────── */}
        <div ref={leftColumnRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            id="mobile-trade-view-chart"
            className={cn(
              "min-h-0 flex-1 flex-col lg:flex-none lg:h-[var(--chart-height)]",
              mobileViewClassName("chart", mobileView)
            )}
            style={{ ["--chart-height" as string]: `${boundedChartHeight}px` }}
          >
            <PanelErrorBoundary panel="chart">
              <TVChart symbol={trade.toTokenAddress} onSelectToken={trade.setToTokenAddress} />
            </PanelErrorBoundary>
          </div>

          <ResizeHandle
            orientation="horizontal"
            label="Resize chart height"
            value={boundedChartHeight}
            min={240}
            max={900}
            onChange={setChartHeight}
            onReset={resetLayout}
            className="hidden lg:block"
          />

          {/* Bottom tabs: Positions / Orders / Trades / Claims */}
          <div
            id="mobile-trade-view-positions"
            className={cn(
              "min-h-0 flex-1 flex-col overflow-auto border-t border-border lg:border-t-0",
              mobileViewClassName("positions", mobileView)
            )}
          >
            <PanelErrorBoundary panel="positions and orders">
              <BottomTabs
                onSelectPosition={(pos) =>
                  trade.setActivePosition({
                    isLong: pos.isLong,
                    marketAddress: pos.marketAddress,
                    indexToken: pos.indexToken,
                    collateralToken: pos.collateralToken,
                  })
                }
              />
            </PanelErrorBoundary>
          </div>
        </div>

        <ResizeHandle
          orientation="vertical"
          label="Resize trade panel width"
          value={tradePanelWidth}
          min={280}
          max={480}
          onChange={setTradePanelWidth}
          onReset={resetLayout}
          className="hidden lg:block"
        />

        {/* ── Trade Panel ─────────────────────────────────────────────── */}
        <div
          id="mobile-trade-view-trade"
          className={cn(
            "w-full min-h-0 flex-col overflow-x-hidden overflow-y-auto border-t border-border lg:w-[var(--trade-panel-width)] lg:border-t-0 lg:shrink-0",
            mobileViewClassName("trade", mobileView)
          )}
          style={{ ["--trade-panel-width" as string]: `${tradePanelWidth}px` }}
        >
          <PanelErrorBoundary panel="order ticket">
            <TradePanel trade={trade} />
          </PanelErrorBoundary>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-1.5 max-lg:hidden">
        <Button variant="ghost" size="sm" onClick={resetLayout}>
          Reset layout
        </Button>
      </div>

      <MobileTradeNav active={mobileView} onChange={setMobileView} className="lg:hidden" />
    </AppShell>
  )
}
