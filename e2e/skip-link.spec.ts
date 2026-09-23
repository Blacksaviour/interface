import { expect, test } from "@playwright/test"

// Skip link + post-navigation focus (DS-078).
//
// Prerequisites for local runs outside CI:
//   npx playwright install --with-deps chromium

const MAIN = "#main-content"

test("skip link is the first tab stop and becomes visible on focus", async ({ page }) => {
  await page.goto("/pools")

  const skipLink = page.getByRole("link", { name: "Skip to main content" })
  await expect(skipLink).toBeAttached()

  // `sr-only` clips the link to 1x1px until it takes focus, so the box size is
  // what actually distinguishes "hidden" from "revealed".
  const clipped = await skipLink.boundingBox()
  expect(clipped?.width ?? 0).toBeLessThanOrEqual(2)

  await page.keyboard.press("Tab")
  await expect(skipLink).toBeFocused()

  const revealed = await skipLink.boundingBox()
  expect(revealed?.width ?? 0).toBeGreaterThan(50)
  await expect(skipLink).toBeInViewport()
})

test("activating the skip link focuses the main region without touching the URL", async ({
  page,
}) => {
  await page.goto("/pools")
  const url = page.url()

  await page.keyboard.press("Tab")
  await page.keyboard.press("Enter")

  await expect(page.locator(MAIN)).toBeFocused()
  expect(page.url()).toBe(url)

  // The next tab stop is inside the page content, not back in the navbar.
  await page.keyboard.press("Tab")
  const insideMain = await page.evaluate(() => {
    const active = document.activeElement
    const main = document.querySelector("#main-content")
    return Boolean(active && main && main.contains(active))
  })
  expect(insideMain).toBe(true)
})

test("route navigation moves focus to the new page heading and announces it", async ({
  page,
}) => {
  await page.goto("/pools")
  await expect(page.getByRole("heading", { level: 1, name: /pools/i })).toBeVisible()

  await page.getByRole("link", { name: "Earn", exact: true }).first().click()

  const heading = page.getByRole("heading", { level: 1, name: /earn/i })
  await expect(heading).toBeFocused()

  // Announced once, in the single polite region the announcer owns.
  const region = page.locator("[data-slot='live-region']")
  await expect(region).toHaveCount(1)
  await expect(region).toHaveAttribute("aria-live", "polite")
  await expect(region).toHaveText(/earn/i)
})

test("pointer navigation does not draw a focus ring on the new page", async ({
  page,
}) => {
  await page.goto("/pools")

  await page.getByRole("link", { name: "Referrals", exact: true }).first().click()
  await expect(page.getByRole("heading", { level: 1, name: /referrals/i })).toBeFocused()

  // Focus is handed over programmatically, which never matches :focus-visible —
  // so a mouse user sees no outline even though the heading holds focus.
  const focusVisible = await page.evaluate(
    () => document.activeElement?.matches(":focus-visible") ?? false
  )
  expect(focusVisible).toBe(false)
})
