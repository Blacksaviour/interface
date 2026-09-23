import { expect, test } from "@playwright/test"

test.describe("Changelog - States (Loading, Error, Empty)", () => {
  test("displays skeleton loading state initially", async ({ page }) => {
    // Intercept to delay response
    await page.route("/changelog.json", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    const loadPromise = page.goto("/changelog")
    await page.waitForTimeout(100) // Wait for skeleton to render

    // Skeleton should be visible
    const skeleton = page.locator('[role="status"]')
    await expect(skeleton).toBeVisible()

    // Wait for load to complete
    await loadPromise
  })

  test("displays error state on fetch failure", async ({ page }) => {
    // Mock error response
    await page.route("/changelog.json", (route) => {
      route.abort("failed")
    })

    await page.goto("/changelog")

    // Error state should be visible
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText("Failed to load changelog")

    // Retry button should be present
    const retryButton = page.getByRole("button", { name: /try again/i })
    await expect(retryButton).toBeVisible()
  })

  test("retry button refetches on click", async ({ page }) => {
    let requestCount = 0

    await page.route("/changelog.json", (route) => {
      requestCount++
      if (requestCount === 1) {
        route.abort("failed")
      } else {
        route.continue()
      }
    })

    await page.goto("/changelog")

    // Should show error first
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible()

    // Click retry
    const retryButton = page.getByRole("button", { name: /try again/i })
    await retryButton.click()

    // Should load successfully
    await page.waitForLoadState("networkidle")
    const releases = page.locator("h2")
    await expect(releases.first()).toBeVisible()
  })

  test("displays empty state when changelog has no releases", async ({
    page,
  }) => {
    // Mock empty response
    await page.route("/changelog.json", (route) => {
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ releases: [] }),
      })
    })

    await page.goto("/changelog")

    // Empty state should be visible
    const emptyState = page.getByText("No releases yet")
    await expect(emptyState).toBeVisible()
  })

  test("displays error state for malformed JSON", async ({ page }) => {
    await page.route("/changelog.json", (route) => {
      route.fulfill({
        contentType: "application/json",
        body: '{ invalid json',
      })
    })

    await page.goto("/changelog")

    // Should show error, not crash
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible()
  })

  test("displays error state for missing releases field", async ({ page }) => {
    await page.route("/changelog.json", (route) => {
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ someOtherField: [] }),
      })
    })

    await page.goto("/changelog")

    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText("Invalid changelog format")
  })

  test("skeleton matches loaded content height", async ({ page }) => {
    let skeletonHeight: number | null = null
    let contentHeight: number | null = null

    // Measure skeleton
    await page.route("/changelog.json", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 200))
      await route.continue()
    })

    const loadPromise = page.goto("/changelog")
    await page.waitForTimeout(100)

    const skeleton = page.locator('[role="status"]')
    const skeletonBox = await skeleton.boundingBox()
    skeletonHeight = skeletonBox?.height ?? null

    await loadPromise

    // Measure content
    const content = page.locator(".space-y-0").first()
    const contentBox = await content.boundingBox()
    contentHeight = contentBox?.height ?? null

    // Heights should be similar (within reasonable margin for scrolling)
    if (skeletonHeight && contentHeight) {
      const ratio = Math.abs(skeletonHeight - contentHeight) / skeletonHeight
      expect(ratio).toBeLessThan(0.2) // Allow 20% variance
    }
  })

  test("error and empty states show page header", async ({ page }) => {
    // Error state
    await page.route("/changelog.json", (route) => route.abort("failed"))
    await page.goto("/changelog")

    let header = page.getByRole("heading", { name: "Changelog" })
    await expect(header).toBeVisible()

    // Empty state
    await page.goto("/changelog")
    await page.route("/changelog.json", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ releases: [] }),
      })
    )
    await page.reload()

    header = page.getByRole("heading", { name: "Changelog" })
    await expect(header).toBeVisible()
  })

  test("no horizontal scroll in any state", async ({ page }) => {
    const viewportWidth = 360

    // Error state
    await page.setViewportSize({ width: viewportWidth, height: 800 })
    await page.route("/changelog.json", (route) => route.abort("failed"))
    await page.goto("/changelog")

    let hasScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
    expect(hasScroll).toBe(false)

    // Empty state
    await page.route("/changelog.json", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ releases: [] }),
      })
    )
    await page.reload()

    hasScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
    expect(hasScroll).toBe(false)
  })
})
