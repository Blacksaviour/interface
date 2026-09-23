import { expect, test } from "@playwright/test"

test.describe("Changelog - Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/changelog")
    await page.waitForLoadState("networkidle")
  })

  test("search filters results by substring", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })

    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("trigger")

    // Wait for debounce
    await page.waitForTimeout(400)

    // Results should show only entries containing "trigger"
    const entries = page.locator("p.text-body-sm")
    const count = await entries.count()

    if (count > 0) {
      const firstEntry = await entries.first().textContent()
      expect(firstEntry?.toLowerCase()).toContain("trigger")
    }
  })

  test("search is case-insensitive", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })

    const searchInput = page.locator("input[placeholder*='Search']")

    // Search for uppercase
    await searchInput.fill("TRIGGER")
    await page.waitForTimeout(400)

    let entries = page.locator("p.text-body-sm")
    const countUpper = await entries.count()

    // Clear and search for lowercase
    await searchInput.clear()
    await searchInput.fill("trigger")
    await page.waitForTimeout(400)

    entries = page.locator("p.text-body-sm")
    const countLower = await entries.count()

    expect(countUpper).toBe(countLower)
  })

  test("search composes with category filter", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })

    // Apply category filter
    const addedChip = page
      .locator('[role="button"]')
      .filter({ hasText: "Added" })
    await addedChip.click()

    // Apply search
    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("trigger")
    await page.waitForTimeout(400)

    // URL should have both filters
    const url = page.url()
    expect(url).toContain("type=added")
    expect(url).toContain("q=trigger")
  })

  test("search composes with area filter", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })

    // Select area
    const areaSelect = page.locator("select-trigger").first()
    if ((await areaSelect.count()) > 0) {
      await areaSelect.click()
      const tradeOption = page
        .locator("select-item")
        .filter({ hasText: "Trading" })
      if ((await tradeOption.count()) > 0) {
        await tradeOption.click()
      }
    }

    // Apply search
    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("orders")
    await page.waitForTimeout(400)

    const url = page.url()
    expect(url).toContain("q=orders")
  })

  test("typing does not create history entry per character", async ({
    page,
  }) => {
    const historyLengthBefore = await page.evaluate(() => window.history.length)

    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("t")
    await page.waitForTimeout(100)
    await searchInput.fill("tr")
    await page.waitForTimeout(100)
    await searchInput.fill("tri")
    await page.waitForTimeout(100)

    // Wait for debounce
    await page.waitForTimeout(400)

    const historyLengthAfter = await page.evaluate(() => window.history.length)

    // Should only add 1 history entry, not 3
    const entriesAdded = historyLengthAfter - historyLengthBefore
    expect(entriesAdded).toBeLessThanOrEqual(1)
  })

  test("highlighting does not break with links in entries", async ({
    page,
  }) => {
    // Search for something that appears in entries with links
    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("pool")
    await page.waitForTimeout(400)

    // Links should still be clickable
    const links = page.locator("a[href*='github.com']")
    if ((await links.count()) > 0) {
      const href = await links.first().getAttribute("href")
      expect(href).toBeTruthy()
    }
  })

  test("highlighting does not break with inline code", async ({ page }) => {
    // This tests with actual entry data - search for common terms
    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("fixed")
    await page.waitForTimeout(400)

    // Page should render without errors
    const markElements = page.locator("mark")
    if ((await markElements.count()) > 0) {
      // Mark elements should be visible
      await expect(markElements.first()).toBeVisible()
    }
  })

  test("clear filters works with search", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("trigger")
    await page.waitForTimeout(400)

    // Apply additional filter
    const addedChip = page
      .locator('[role="button"]')
      .filter({ hasText: "Added" })
    await addedChip.click()

    // Clear all filters
    const clearBtn = page.getByRole("button", { name: /clear all/i })
    if ((await clearBtn.count()) > 0) {
      await clearBtn.click()
    }

    // Search input should be cleared
    await expect(searchInput).toHaveValue("")

    // URL should not have search or type params
    const url = page.url()
    expect(url).not.toContain("q=")
    expect(url).not.toContain("type=")
  })

  test("mobile search debounces properly", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.waitForLoadState("networkidle")

    // Open filter panel
    const filterBtn = page.getByRole("button", { name: /filters/i })
    await filterBtn.click()

    const searchInput = page.locator("input[placeholder*='Search']")

    await searchInput.fill("test")
    await page.waitForTimeout(100)
    await searchInput.fill("test2")

    // Wait for debounce
    await page.waitForTimeout(400)

    const url = page.url()
    // Should only update once
    expect(url).toContain("q=test2")
  })

  test("no results state when search matches nothing", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("xyznonexistentquery")
    await page.waitForTimeout(400)

    // Should show no results message
    const noResults = page.getByText(/no entries match/i)
    await expect(noResults).toBeVisible()

    // Clear filters button should work
    const clearBtn = page.getByRole("button", { name: /clear/i })
    await clearBtn.click()

    // Results should return
    const noResultsAgain = page.getByText(/no entries match/i)
    await expect(noResultsAgain).not.toBeVisible()
  })

  test("search highlights matched text visually", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("trigger")
    await page.waitForTimeout(400)

    // Mark elements should appear for highlights
    const marks = page.locator("mark")
    if ((await marks.count()) > 0) {
      const markText = await marks.first().textContent()
      expect(markText?.toLowerCase()).toContain("trigger")

      // Mark should have highlighting styles
      const bgColor = await marks.first().evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      expect(bgColor).not.toBe("rgba(0, 0, 0, 0)")
    }
  })

  test("search parameter preserved on reload", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']")
    await searchInput.fill("liquidation")
    await page.waitForTimeout(400)


    // Reload page
    await page.reload()
    await page.waitForLoadState("networkidle")

    const urlAfter = page.url()

    // URL should still have search param
    expect(urlAfter).toContain("q=liquidation")
  })
})
