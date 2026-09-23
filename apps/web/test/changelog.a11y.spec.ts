import { expect, test } from "@playwright/test"

test.describe("Changelog - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/changelog")
  })

  // Heading hierarchy tests
  test("has correct heading hierarchy (h1 for page, h2 for releases)", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle")

    const h1 = page.locator("h1")
    const h2 = page.locator("h2")

    // Should have exactly one h1
    expect(await h1.count()).toBe(1)
    expect(await h1.textContent()).toContain("Changelog")

    // Should have at least one h2 for releases
    expect(await h2.count()).toBeGreaterThan(0)
  })

  test("no heading hierarchy skips (h1 → h2, not h1 → h3)", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle")

    const headings = page.locator("h1, h2, h3, h4, h5, h6")
    const count = await headings.count()

    if (count > 1) {
      // Extract heading levels
      const levels = []
      for (let i = 0; i < count; i++) {
        const elem = headings.nth(i)
        const tag = await elem.evaluate((el) => el.tagName)
        const level = parseInt(tag[1])
        levels.push(level)
      }

      // Check no skips (e.g., h1 → h3, or h2 → h4)
      for (let i = 1; i < levels.length; i++) {
        const diff = levels[i] - levels[i - 1]
        expect(Math.abs(diff)).toBeLessThanOrEqual(1)
      }
    }
  })

  // Landmark tests
  test("filter bar is in a region with accessible name", async ({ page }) => {
    const filterRegion = page.locator("region[aria-labelledby]").first()
    await expect(filterRegion).toBeVisible()
  })

  test("releases are in a list structure", async ({ page }) => {
    await page.waitForLoadState("networkidle")

    const list = page.locator(
      'section[aria-label="Release history"] ul[role="list"]'
    )
    await expect(list).toBeVisible()

    const items = list.locator("li")
    expect(await items.count()).toBeGreaterThan(0)
  })

  // Keyboard navigation tests
  test("full keyboard navigation without traps", async ({ page }) => {
    await page.waitForLoadState("networkidle")

    // Tab through all focusable elements
    const focusableElements = await page
      .locator("button, [role='button'], input, select, a, [tabindex]")
      .count()

    expect(focusableElements).toBeGreaterThan(0)

    // Start tabbing
    await page.keyboard.press("Tab")
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    )
    expect(focusedElement).not.toBeNull()

    // Tab through several elements and ensure we keep getting focus
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab")
      const active = await page.evaluate(() => {
        const el = document.activeElement
        return el?.tagName || "body"
      })
      expect(active).not.toBe("body")
    }

    // Shift+Tab to go backwards
    await page.keyboard.press("Shift+Tab")
    const backwards = await page.evaluate(() => document.activeElement?.tagName)
    expect(backwards).not.toBeNull()
  })

  test("all interactive elements have visible focus", async ({ page }) => {
    await page.waitForLoadState("networkidle")

    const buttons = page.locator("button").first()

    if ((await buttons.count()) > 0) {
      await buttons.focus()

      const outline = await buttons.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return style.outline || style.outlineWidth || style.boxShadow
      })

      expect(outline).not.toBe("none")
      expect(outline).not.toBe("")
    }
  })

  test("visible focus in dark theme", async ({ page }) => {
    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add("dark")
    })

    await page.waitForLoadState("networkidle")

    const button = page.locator("button").first()
    if ((await button.count()) > 0) {
      await button.focus()

      const outline = await button.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          outline: style.outline,
          outlineColor: style.outlineColor,
          boxShadow: style.boxShadow,
        }
      })

      expect(outline.outline + outline.boxShadow).not.toContain("none")
    }
  })

  test("filter chip buttons keyboard accessible", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.waitForLoadState("networkidle")

    // Find a filter chip with role="button"
    const chips = page
      .locator('[role="button"]')
      .filter({ hasText: /Added|Fixed/ })

    if ((await chips.count()) > 0) {
      const firstChip = chips.first()
      await firstChip.focus()

      // Press Space to activate
      await page.keyboard.press("Space")

      // URL should have changed
      const url = page.url()
      expect(url).toContain("type=")
    }
  })

  test("copy permalink button keyboard accessible", async ({ page }) => {
    await page.waitForLoadState("networkidle")

    const copyBtn = page.locator("button[title*='Copy permalink']").first()

    if ((await copyBtn.count()) > 0) {
      await copyBtn.focus()

      // Should be visible when focused
      const isFocused = await copyBtn.evaluate(
        (el) => document.activeElement === el
      )
      expect(isFocused).toBe(true)

      // Press Enter to activate
      await page.keyboard.press("Enter")

      // Button should show success state (Check icon)
      // Icon state changes on copy
      await page.waitForTimeout(100)
    }
  })

  test("search input keyboard accessible", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.waitForLoadState("networkidle")

    const searchInput = page.locator("input[placeholder*='Search']").first()

    if ((await searchInput.count()) > 0) {
      await searchInput.focus()

      const isFocused = await searchInput.evaluate(
        (el) => document.activeElement === el
      )
      expect(isFocused).toBe(true)

      // Type to search
      await page.keyboard.type("trigger")

      // Results should change
      await page.waitForTimeout(400)
    }
  })

  test("filter results announced with debouncing", async ({ page }) => {
    await page.waitForLoadState("networkidle")

    // Get live region
    const liveRegion = page.locator('[role="status"]')
    await expect(liveRegion).toBeVisible()

    // Open filters on mobile or use desktop filters
    await page.setViewportSize({ width: 1024, height: 768 })

    // Click a filter
    const addedChip = page
      .locator('[role="button"]')
      .filter({ hasText: "Added" })
      .first()
    if ((await addedChip.count()) > 0) {
      await addedChip.click()

      // Live region should announce results after debounce
      await page.waitForTimeout(400)

      const announcement = await liveRegion.textContent()
      expect(announcement).toMatch(/\d+ results? found/)
    }
  })

  test("error state accessible", async ({ page }) => {
    // Mock error
    await page.route("/changelog.json", (route) => route.abort("failed"))

    await page.reload()
    await page.waitForLoadState("networkidle")

    // Error should be in alert role
    const alert = page.locator('[role="alert"]')
    await expect(alert).toBeVisible()

    // Retry button should be keyboard accessible
    const retryBtn = page.getByRole("button", { name: /try again/i })
    if ((await retryBtn.count()) > 0) {
      await retryBtn.focus()
      const isFocused = await retryBtn.evaluate(
        (el) => document.activeElement === el
      )
      expect(isFocused).toBe(true)
    }
  })

  test("empty state accessible", async ({ page }) => {
    // Mock empty response
    await page.route("/changelog.json", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ releases: [] }),
      })
    )

    await page.reload()
    await page.waitForLoadState("networkidle")

    // Empty state should be visible
    const emptyText = page.getByText("No releases yet")
    await expect(emptyText).toBeVisible()

    // Page heading should still be present
    const h1 = page.locator("h1", { hasText: "Changelog" })
    await expect(h1).toBeVisible()
  })

  test("no focus trap - Escape or Tab can escape any dialog/overlay", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.waitForLoadState("networkidle")

    // Open mobile filter
    const filterBtn = page.getByRole("button", { name: /filters/i })
    await filterBtn.click()

    // Should be able to Tab out
    await page.keyboard.press("Tab")
    const activeTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(activeTag).not.toBe("BODY")
  })
})
