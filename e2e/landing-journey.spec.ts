import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

const widths = [390, 768, 1440]
const motions = ["no-preference", "reduce"] as const

async function stubExternalNetwork(page: Page) {
  await page.route("**/api.binance.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
  )
  await page.route("**/oracle.biscotti-proxy-worker.workers.dev/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
  )
  await page.routeWebSocket("wss://stream.binance.com:9443/**", (ws) =>
    ws.close()
  )
}

for (const width of widths) {
  for (const reducedMotion of motions) {
    test(`landing journey at ${width}px with ${reducedMotion} motion`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion })
      await stubExternalNetwork(page)
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth
        )
      ).toBe(true)
      for (const label of [
        "Self-custodied",
        "Unified liquidity",
        "Open source",
      ]) {
        await expect(page.getByText(label, { exact: true })).toHaveCount(1)
      }
      const highlights = page.getByText("Self-custodied", { exact: true })
      await highlights.scrollIntoViewIfNeeded()
      await expect(highlights).toBeVisible()

      const question = page.getByRole("button", { name: /what is so4/i })
      await question.scrollIntoViewIfNeeded()
      await question.click()
      await expect(question).toHaveAttribute("aria-expanded", "true")
      await question.click()
      await expect(question).toHaveAttribute("aria-expanded", "false")

      if (width === 390) {
        const menu = page.getByRole("button", { name: "Open menu" })
        await menu.click()
        await expect(
          page.getByRole("dialog", { name: "Site menu" })
        ).toBeVisible()
        await page.keyboard.press("Escape")
        await expect(menu).toBeFocused()
      }

      const cta = page.getByRole("link", { name: "Trade now" })
      await cta.click()
      await expect(page).toHaveURL(/\/trade$/)
      await expect(page.getByRole("tab", { name: "Long" })).toBeVisible()
    })
  }
}
