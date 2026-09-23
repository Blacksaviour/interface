import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.route("**/api.binance.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  )
  await page.route("**/oracle.biscotti-proxy-worker.workers.dev/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  )
  await page.routeWebSocket("wss://stream.binance.com:9443/**", (ws) => {
    ws.close()
  })
})

test("mobile menu navigates between app routes and updates content", async ({ page }) => {
  await page.goto("/trade")

  await expect(page.getByRole("tab", { name: "Long" })).toBeVisible()
  await expect(page.getByText("Price", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Open menu" }).click()
  await expect(page.getByRole("link", { name: "Pools" })).toBeVisible()
  await page.getByRole("link", { name: "Pools" }).click()

  await expect(page).toHaveURL(/\/pools$/)
  await expect(page.getByRole("heading", { name: "Pools", level: 1 })).toBeVisible()
  await expect(page.getByRole("table")).toBeVisible()
  await expect(page.getByRole("tab", { name: "Long" })).toBeHidden()
})
