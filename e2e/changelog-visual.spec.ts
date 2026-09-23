import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const changelogFixture = JSON.parse(
  readFileSync(join(__dirname, "fixtures", "changelog.json"), "utf-8"),
)

// DX-022: visual regression coverage for /changelog.
//
// Every page state × theme × viewport gets a baseline:
//   states:   default | filtered | searched | empty | error
//   themes:   light | dark
//   viewports desktop 1280×800 | mobile 390×844
//
// Stabilization strategy:
// - The page is fed from the committed fixture at e2e/fixtures/changelog.json
//   (intercepted before any app request), so dates, versions and ordering are
//   byte-identical between runs. The same fixture backs the unit tests.
// - Theme is set via an init script, matching the app's THEME_SCRIPT approach
//   in __root.tsx — no flash of wrong theme lands in a screenshot.
// - The clock is frozen before any page script runs so relative timestamps
//   and animations can never drift.
// - Third-party data sources are stubbed with the same pattern as
//   design-system-visual.spec.ts; nothing meaningful on this page is masked.
//
// Updating baselines:
//   bun run test:e2e -- changelog-visual --update-snapshots

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 }, // iPhone 13-ish
} as const

const THEMES = ["light", "dark"] as const

const STATES = [
  { name: "default", path: "/changelog", status: 200 },
  { name: "filtered", path: "/changelog?type=fixed", status: 200 },
  { name: "searched", path: "/changelog?q=liquidation", status: 200 },
  // A query that matches nothing exercises the "No entries match" state.
  { name: "empty", path: "/changelog?q=zzz-no-such-entry", status: 200 },
  // Feed failure exercises the ErrorState with retry affordance.
  { name: "error", path: "/changelog", status: 500 },
] as const

async function stubExternalNetwork(page: Page) {
  await page.route("**/api.binance.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  )
}

for (const theme of THEMES) {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`changelog ${theme} theme, ${viewportName}`, () => {
      test.use({ viewport, reducedMotion: "reduce" })

      for (const state of STATES) {
        test(state.name, async ({ page }) => {
          await stubExternalNetwork(page)

          await page.route("**/changelog.json", (route) =>
            state.status === 200
              ? route.fulfill({
                  status: 200,
                  contentType: "application/json",
                  body: JSON.stringify(changelogFixture),
                })
              : route.fulfill({
                  status: state.status,
                  contentType: "application/json",
                  body: JSON.stringify({ error: "feed unavailable" }),
                }),
          )

          await page.addInitScript((t) => {
            window.localStorage.setItem("so4-theme", t)
          }, theme)
          await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
          await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"))

          await page.goto(state.path)
          await page.waitForLoadState("networkidle")

          await expect(page).toHaveScreenshot(
            `changelog-${state.name}-${theme}-${viewportName}.png`,
            {
              fullPage: true,
              animations: "disabled",
            },
          )
        })
      }
    })
  }
}
