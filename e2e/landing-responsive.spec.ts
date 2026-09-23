import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

// GF3-002 acceptance: the landing page is responsive at 390px / 768px /
// 1440px. design-system-visual.spec.ts already covers 390 (mobile) and
// 1280 (desktop) for every route; this file adds the two widths that
// acceptance names but that suite doesn't have — 768 (tablet) and 1440 —
// scoped to `/` only, so the rest of the app's baseline set is untouched.
//
// 768 matters most: it is the one band where the hero feature grid is at
// `sm:grid-cols-2` while the row-span/col-span rules that shape the
// desktop layout (`lg:`) have not applied yet.

const WIDTHS = {
  tablet: { width: 768, height: 1024 },
  wide: { width: 1440, height: 900 },
} as const

async function stubExternalNetwork(page: Page) {
  await page.route("**/api.binance.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  )
  await page.route("**/oracle.biscotti-proxy-worker.workers.dev/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  )
  await page.routeWebSocket("wss://stream.binance.com:9443/**", (ws) => {
    ws.close()
  })
}

for (const [name, viewport] of Object.entries(WIDTHS)) {
  test.describe(`landing, ${name}`, () => {
    test.use({ viewport, reducedMotion: "reduce" })

    test.beforeEach(async ({ page }) => {
      await stubExternalNetwork(page)
      // Pauses the hero's word-rotation interval so it can't advance
      // mid-screenshot — see the note in design-system-visual.spec.ts.
      await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
      await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"))
    })

    test("renders", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await expect(page).toHaveScreenshot(`landing-${name}.png`, {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("does not scroll horizontally", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      // A landing section overflowing its viewport width is the classic
      // responsive regression; assert it directly rather than relying on
      // a reviewer spotting it in a full-page screenshot.
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(overflows).toBe(false)
    })
  })
}
