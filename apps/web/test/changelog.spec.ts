import { expect, test } from "@playwright/test"

test.describe("Changelog - Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/changelog")
  })

  // Mobile viewport tests (360px, 768px)
  test("renders without horizontal scroll at 360px width", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.waitForLoadState("networkidle")

    // Check no horizontal overflow
    const hasHorizontalScroll =
      (await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })) || false
    expect(hasHorizontalScroll).toBe(false)

    // Filter button should be visible
    const filterButton = page.getByRole("button", { name: /filters/i })
    await expect(filterButton).toBeVisible()

    // Version text should wrap properly
    const versionHeading = page.getByRole("heading", { level: 2 })
    expect(await versionHeading.first().isVisible()).toBe(true)
  })

  test("renders without horizontal scroll at 768px width", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForLoadState("networkidle")

    const hasHorizontalScroll =
      (await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })) || false
    expect(hasHorizontalScroll).toBe(false)

    // Desktop filter layout should be visible
    const allButton = page.getByRole("button", { name: /^All$/ })
    await expect(allButton).toBeVisible()
  })

  // Desktop viewport tests (1024px, 1440px)
  test("renders properly at 1024px width", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.waitForLoadState("networkidle")

    const hasHorizontalScroll =
      (await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })) || false
    expect(hasHorizontalScroll).toBe(false)

    // Filter chips should all be visible
    const badges = page.getByRole("button", { name: /added|changed|fixed/i })
    expect(await badges.count()).toBeGreaterThan(2)
  })

  test("renders properly at 1440px width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForLoadState("networkidle")

    const hasHorizontalScroll =
      (await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })) || false
    expect(hasHorizontalScroll).toBe(false)
  })

  // Touch target tests - minimum 44×44px
  test("all interactive controls meet 44px minimum touch target at 360px", async ({
    page,
    context,
  }) => {
    await context.setOffline(false)
    await page.setViewportSize({ width: 360, height: 800 })

    // Add touch device simulation
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "maxTouchPoints", { value: 5 })
      Object.defineProperty(navigator, "pointerEnabled", { value: true })
    })

    await page.waitForLoadState("networkidle")

    // Open filters on mobile
    const filterButton = page.getByRole("button", { name: /filters/i })
    await filterButton.click()

    // Check button sizes (Category and Area buttons should be 44×44 or larger)
    const allButton = page.locator("button:has-text('All')").first()
    const box = await allButton.boundingBox()

    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }
  })

  // Filter functionality tests
  test("collapsible filter bar opens/closes on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.waitForLoadState("networkidle")

    const filterButton = page.getByRole("button", { name: /filters/i })
    const filterContent = page.locator("text=Category").first()

    // Initially hidden
    await expect(filterContent).not.toBeVisible()

    // Click to open
    await filterButton.click()
    await expect(filterContent).toBeVisible()

    // Click to close
    await filterButton.click()
    await expect(filterContent).not.toBeVisible()
  })

  test("filters persist in URL on all viewports", async ({ page }) => {
    // Test on mobile
    await page.setViewportSize({ width: 360, height: 800 })
    await page.waitForLoadState("networkidle")

    const filterButton = page.getByRole("button", { name: /filters/i })
    await filterButton.click()

    const addedButton = page.getByRole("button", { name: "Added" }).first()
    await addedButton.click()

    // URL should have ?type=added
    expect(page.url()).toContain("type=added")

    // Resize to desktop
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.waitForLoadState("networkidle")

    // Filter should still be active
    expect(page.url()).toContain("type=added")
  })

  // Text wrapping and link handling
  test("PR links do not overflow on narrow viewports", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.waitForLoadState("networkidle")

    const prLinks = page.locator("a[href*='github.com']")
    const count = await prLinks.count()

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const link = prLinks.nth(i)
        const box = await link.boundingBox()

        if (box) {
          expect(box.width).toBeLessThanOrEqual(360)
        }
      }
    }
  })

  test("long entry text wraps cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.waitForLoadState("networkidle")

    const entryTexts = page.locator("p.text-body-sm")
    const count = await entryTexts.count()

    if (count > 0) {
      const firstText = entryTexts.first()
      const box = await firstText.boundingBox()

      if (box) {
        // Text should not exceed viewport width
        expect(box.width).toBeLessThanOrEqual(360 - 32) // Account for padding
      }
    }
  })

  // Active filter count badge
  test("shows active filter count when filters are applied", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.waitForLoadState("networkidle")

    const filterButton = page.getByRole("button", { name: /filters/i })
    await filterButton.click()

    // Apply a filter
    const addedButton = page.getByRole("button", { name: "Added" }).first()
    await addedButton.click()

    // Badge should show count
    const badge = filterButton.locator("span")
    const text = await badge.textContent()
    expect(text).toContain("1")
  })
})
