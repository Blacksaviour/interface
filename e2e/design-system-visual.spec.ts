import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

// DS-047: visual regression coverage for the component gallery and main
// routes, across both themes and desktop/mobile widths.
//
// Stabilization strategy:
// - Theme is set via an init script (before any page script runs), matching
//   the app's own THEME_SCRIPT approach in __root.tsx — avoids a flash of
//   the wrong theme landing in the screenshot.
// - Third-party/network data sources (Binance REST/WS, the oracle proxy)
//   are stubbed with empty-but-valid responses, the same pattern used by
//   e2e/trade.spec.ts and e2e/pools.spec.ts — the app already falls back
//   gracefully to empty/static data when these are unavailable.
// - `animations: "disabled"` on every toHaveScreenshot() call freezes CSS
//   transitions/animations at their end state, so timing never causes a
//   flaky diff.
// - `waitForLoadState("networkidle")` before each screenshot gives any
//   remaining async rendering (e.g. faucet's background balance fetch,
//   which faucet.spec.ts notes loads after first paint) time to settle.
//
// Updating baselines: see the "Visual regression" section in DESIGN.md —
// short version, run
//   bun run test:e2e -- design-system-visual --update-snapshots
// and review the resulting diff under
// e2e/design-system-visual.spec.ts-snapshots/ in your PR.

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 }, // iPhone 13-ish
} as const

const THEMES = ["light", "dark"] as const
const DIRECTIONS = ["ltr", "rtl"] as const

const ROUTES = [
  { name: "gallery", path: "/gallery" },
  { name: "landing", path: "/" },
  { name: "trade", path: "/trade" },
  { name: "pools", path: "/pools" },
  { name: "earn", path: "/earn" },
  { name: "referrals", path: "/referrals" },
  { name: "faucet", path: "/faucet" },
] as const

async function stubExternalNetwork(page: Page) {
  await page.route("**/api.binance.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  )
  await page.route("**/oracle.biscotti-proxy-worker.workers.dev/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  )
  // Same "close immediately" approach as trade.spec.ts — the app already
  // falls back to REST polling when no live-bar message ever arrives.
  await page.routeWebSocket("wss://stream.binance.com:9443/**", (ws) => {
    ws.close()
  })
}

for (const theme of THEMES) {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${theme} theme, ${viewportName}`, () => {
      // reducedMotion: "reduce" *should* stop JS-timer-driven animations
      // that `animations: "disabled"` can't freeze (e.g. the landing
      // hero's word-rotation interval and the community marquee), but
      // this Chrome Headless Shell build doesn't reflect it in
      // matchMedia() or CSS @media queries (verified: both read false
      // even with this set) — kept anyway as the semantically correct
      // setting for engines that do honor it. The actual freeze comes
      // from page.clock below, which stops those timers from ever firing
      // by fixing the clock before any script runs.
      test.use({ viewport, reducedMotion: "reduce" })

      test.beforeEach(async ({ page }) => {
        await stubExternalNetwork(page)
        await page.addInitScript((t) => {
          window.localStorage.setItem("so4-theme", t)
        }, theme)
        await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
        await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"))
      })

      for (const route of ROUTES) {
        test(`${route.name}`, async ({ page }) => {
          await page.goto(route.path)
          await page.waitForLoadState("networkidle")

          await expect(page).toHaveScreenshot(`${route.name}-${theme}-${viewportName}.png`, {
            fullPage: true,
            animations: "disabled",
          })
        })
      }
    })
  }
}

// RTL gallery fixtures — the gallery has a direction toggle, so take
// screenshots in both directions to verify RTL layout correctness.
for (const theme of THEMES) {
  for (const direction of DIRECTIONS) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      test.describe(`${theme} theme, ${direction}, ${viewportName}`, () => {
        test.use({ viewport, reducedMotion: "reduce" })

        test.beforeEach(async ({ page }) => {
          await stubExternalNetwork(page)
          await page.addInitScript(({ t, d }: { t: string; d: string }) => {
            window.localStorage.setItem("so4-theme", t)
            window.localStorage.setItem("so4-direction", d)
          }, { t: theme, d: direction })
        })

        test(`gallery`, async ({ page }) => {
          await page.goto("/gallery")
          await page.waitForLoadState("networkidle")

          await expect(page).toHaveScreenshot(`gallery-${theme}-${direction}-${viewportName}.png`, {
            fullPage: true,
            animations: "disabled",
          })
        })
      })
    }
  }
}
