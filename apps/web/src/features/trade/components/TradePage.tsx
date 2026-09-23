import { useEffect, useRef, useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import { AppShell } from "@workspace/ui/components/app-shell"
import { useTradeState } from "../hooks/useTradeState"
import { useOrderEventPolling } from "../hooks/useOrderEventPolling"
import { Navbar } from "../../../ui/Navbar"
import { TVChart } from "./chart/TVChart"
import { TradePanel } from "./trade-panel/TradePanel"
import { BottomTabs } from "./positions/BottomTabs"
import { CircuitBreakerBanner } from "./CircuitBreakerBanner"
import { saveReferralCode } from "@/lib/contracts"

const tradeRoute = getRouteApi("/trade")

export function TradePage() {
  const trade = useTradeState()
  const { setToTokenAddress, setTradeType } = trade

  useOrderEventPolling()

  // Pre-fill the form from a shared deeplink (e.g. /trade?market=BTC&type=long).
  const search = tradeRoute.useSearch()
  const navigate = tradeRoute.useNavigate()
  const [activePanel, setActivePanel] = useState<"positions" | "orders" | "trades" | "claims">(search.panel ?? "positions")
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

  useEffect(() => setActivePanel(search.panel ?? "positions"), [search.panel])

  function handlePanelChange(panel: "positions" | "orders" | "trades" | "claims") {
    setActivePanel(panel)
    void navigate({ search: (previous) => ({ ...previous, panel }) })
  }

  return (
    <AppShell
      variant="full"
      navbar={<Navbar variant="app" />}
      banner={<CircuitBreakerBanner symbol={trade.toTokenAddress} />}
      className="overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:px-6">
        {/* ── Left: Chart + Bottom Tabs ──────────────────────────────── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          {/* Chart takes the majority of height */}
          <div className="min-h-0 min-w-0 flex-1">
            <TVChart symbol={trade.toTokenAddress} onSelectToken={trade.setToTokenAddress} />
          </div>

          <aside className="flex min-h-40 w-full shrink-0 flex-col overflow-hidden border-t border-border lg:min-h-0 lg:w-64 lg:border-t-0 lg:border-inline-start">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide">Market depth</h2>
              <span className="text-xs text-muted-foreground">Reference data</span>
            </div>
            <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted-foreground">
              Executable order-book depth is unavailable until a verified matching source is connected.
            </div>
          </aside>

          {/* Bottom tabs: Positions / Orders / Trades / Claims */}
          <div className="h-64 shrink-0 overflow-auto border-t border-border lg:border-t-0">
            <BottomTabs
              value={activePanel}
              onValueChange={handlePanelChange}
              onSelectPosition={(pos) =>
                trade.setActivePosition({
                  isLong: pos.isLong,
                  marketAddress: pos.marketAddress,
                  indexToken: pos.indexToken,
                  collateralToken: pos.collateralToken,
                })
              }
            />
          </div>
        </div>

        {/* ── Right: Trade Panel ─────────────────────────────────────── */}
        <div className="w-full shrink-0 overflow-x-hidden overflow-y-auto border-t border-border lg:border-t-0 lg:border-inline-start lg:w-80">
          <TradePanel trade={trade} />
        </div>
      </div>
    </AppShell>
  )
}
