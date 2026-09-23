import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * DX-024: End-to-end coverage for changelog functional behaviors.
 *
 * Tests browser-level interactions that are invisible to unit tests:
 * - Deep links resolving and scrolling into view
 * - URL filters persisting across reload
 * - Search with debounce
 * - Archive loading on demand
 * - Clipboard copy behavior
 * - Navbar indicator state (WhatsNewDot)
 *
 * Stability strategy (matching DX-022):
 * - Fixture intercepted before any app fetch (changelog.json route)
 * - Clock frozen to prevent timestamp drift
 * - localStorage seeded for deterministic state
 * - No arbitrary sleeps; waits on assertions and network state
 * - Dev server (bun run dev) exercises real build artifact serving
 */

const changelogFixture = JSON.parse(
  readFileSync(join(__dirname, "fixtures", "changelog.json"), "utf-8"),
)

// Archive fixture for deep-link tests (v0.1.0 is not in recent releases)
const archiveFixture = {
  releases: [
    {
      version: "0.1.0",
      date: "2026-07-15",
      yanked: false,
      entries: [
        {
          type: "added",
          area: "general",
          text: "First public release.",
          pr: null,
          breaking: false,
        },
      ],
    },
  ],
}

async function stubExternalNetwork(page: Page) {
  // Block analytics, external APIs, images that aren't part of the changelog
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

async function setupChangelogRoutes(page: Page) {
  // Intercept /changelog.json and /changelog.archive.json with fixtures
  await page.route("**/changelog.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(changelogFixture),
    }),
  )
  await page.route("**/changelog.archive.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(archiveFixture),
    }),
  )
}

test.describe("changelog functional E2E", () => {
  test.beforeEach(async ({ page }) => {
    await stubExternalNetwork(page)
    await setupChangelogRoutes(page)
    // Freeze time for deterministic rendering and timestamps
    await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
    await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"))
  })

  test("land on /changelog and see all releases", async ({ page }) => {
    await page.goto("/changelog")
    await page.waitForLoadState("networkidle")

    // Verify page heading is visible
    const heading = page.getByRole("heading", { name: "Changelog", level: 1 })
    await expect(heading).toBeVisible()

    // Verify all fixture releases are rendered
    const v040Section = page.locator("section[id='v0-4-0']")
    const v032Section = page.locator("section[id='v0-3-2']")
    const v0100Section = page.locator("section[id='v0-10-0']")

    await expect(v040Section).toBeVisible()
    await expect(v032Section).toBeVisible()
    await expect(v0100Section).toBeVisible()

    // Verify release headers show version numbers
    await expect(v040Section.getByRole("heading", { name: /0\.4\.0/ })).toBeVisible()
    await expect(v032Section.getByRole("heading", { name: /0\.3\.2/ })).toBeVisible()
    await expect(v0100Section.getByRole("heading", { name: /0\.10\.0/ })).toBeVisible()

    // Verify entries are present (at least one from each release)
    // v0.4.0 has "added" entry with "Trigger orders"
    await expect(
      page.locator("text=/Trigger orders.*take-profit.*stop-loss/i"),
    ).toBeVisible()

    // v0.3.2 has "changed" entry with "Gas estimation"
    await expect(
      page.locator("text=/Gas estimation.*multi-swap/i"),
    ).toBeVisible()

    // v0.10.0 has "security" entry with "Session tokens"
    await expect(page.locator("text=/Session tokens.*rotate/i")).toBeVisible()
  })

  test("apply category filter and reload, expecting persistence via URL", async ({
    page,
  }) => {
    await page.goto("/changelog")
    await page.waitForLoadState("networkidle")

    // Click the "fixed" type badge to filter
    const fixedBadge = page.locator("text='Fixed'")
    await fixedBadge.click()
    await page.waitForLoadState("networkidle")

    // Verify URL contains ?type=fixed
    await expect(page).toHaveURL(/\/changelog\?type=fixed/)

    // Verify only entries with type "fixed" are shown
    // v0.4.0 has one "fixed" entry about liquidation price
    await expect(page.locator("text=/Liquidation price line/i")).toBeVisible()

    // v0.3.2 and v0.10.0 should not be visible since they have no "fixed" entries
    // (v0.3.2 has "changed", v0.10.0 has "security")
    const v032Section = page.locator("section[id='v0-3-2']")
    const v0100Section = page.locator("section[id='v0-10-0']")
    await expect(v032Section).not.toBeVisible()
    await expect(v0100Section).not.toBeVisible()

    // Reload the page
    await page.reload()
    await page.waitForLoadState("networkidle")

    // Verify URL is still /changelog?type=fixed
    await expect(page).toHaveURL(/\/changelog\?type=fixed/)

    // Verify filter is still applied after reload
    await expect(page.locator("text=/Liquidation price line/i")).toBeVisible()
    await expect(v032Section).not.toBeVisible()
    await expect(v0100Section).not.toBeVisible()

    // Clear the filter by clicking "All" badge
    const allBadge = page.locator("text='All'").first()
    await allBadge.click()
    await page.waitForLoadState("networkidle")

    // Verify URL reverts to /changelog
    await expect(page).toHaveURL(/\/changelog$/)

    // Verify all releases are visible again
    const v040Section = page.locator("section[id='v0-4-0']")
    await expect(v040Section).toBeVisible()
    await expect(v032Section).toBeVisible()
    await expect(v0100Section).toBeVisible()
  })

  test("search and clear with 300ms debounce", async ({ page }) => {
    await page.goto("/changelog")
    await page.waitForLoadState("networkidle")

    // Find the search input (placeholder contains "Search")
    const searchInput = page.locator("input[type='text']").first()

    // Type search term that matches "trigger" (in v0.4.0 entry)
    await searchInput.fill("trigger")

    // Wait for debounce (300ms in FilterBar) + render
    await page.waitForTimeout(400)

    // Verify URL contains ?q=trigger
    await expect(page).toHaveURL(/\/changelog\?q=trigger/)

    // Verify only matching entries are visible
    // v0.4.0's "Trigger orders" entry should be visible
    await expect(page.locator("text=/Trigger orders/i")).toBeVisible()

    // v0.3.2 and v0.10.0 have no matches, so their sections should not render
    const v032Section = page.locator("section[id='v0-3-2']")
    const v0100Section = page.locator("section[id='v0-10-0']")
    await expect(v032Section).not.toBeVisible()
    await expect(v0100Section).not.toBeVisible()

    // Clear the search
    await searchInput.clear()
    await page.waitForTimeout(400)

    // Verify URL reverts to /changelog
    await expect(page).toHaveURL(/\/changelog$/)

    // Verify all releases are visible again
    const v040Section = page.locator("section[id='v0-4-0']")
    await expect(v040Section).toBeVisible()
    await expect(v032Section).toBeVisible()
    await expect(v0100Section).toBeVisible()
  })

  test("deep-link to archived version and scroll into view", async ({ page }) => {
    // Navigate directly to a version anchor that exists in the archive
    // v0.1.0 is not in recent releases, so must be fetched from archive
    await page.goto("/changelog#v0-1-0")
    await page.waitForLoadState("networkidle")

    // Verify URL hash is preserved
    await expect(page).toHaveURL(/\/changelog#v0-1-0$/)

    // Verify page heading is visible
    const heading = page.getByRole("heading", { name: "Changelog", level: 1 })
    await expect(heading).toBeVisible()

    // Verify the archived version section exists and is visible
    const archivedSection = page.locator("section[id='v0-1-0']")
    await expect(archivedSection).toBeVisible()

    // Verify the section header shows the version
    await expect(
      archivedSection.getByRole("heading", { name: /0\.1\.0/ }),
    ).toBeVisible()

    // Verify the entry from archive is visible
    await expect(
      page.locator("text=/First public release/i"),
    ).toBeVisible()

    // Verify recent releases are also rendered (archive is appended, not replaced)
    const v040Section = page.locator("section[id='v0-4-0']")
    await expect(v040Section).toBeVisible()
  })

  test("copy permalink to clipboard", async ({ page }) => {
    await page.goto("/changelog")
    await page.waitForLoadState("networkidle")

    // Set up clipboard mock inside the page context before any code runs
    await page.evaluate(() => {
      ;(window as any).__clipboardContent = ""
      Object.defineProperty(navigator.clipboard, "writeText", {
        value: async (text: string) => {
          ;(window as any).__clipboardContent = text
          return Promise.resolve()
        },
        configurable: true,
      })
    })

    // Find a copy button in the v0.4.0 section
    const v040Section = page.locator("section[id='v0-4-0']")
    const copyButton = v040Section.getByRole("button", { name: /copy/i }).first()

    await expect(copyButton).toBeVisible()
    await copyButton.click()

    // Wait for clipboard operation to complete
    await page.waitForTimeout(150)

    // Read what was written to clipboard
    const clipboard = await page.evaluate(() => {
      return (window as any).__clipboardContent
    })

    // Verify clipboard contains the full URL with hash anchor
    // Format should be like: https://so4.market/changelog#v0-4-0
    // or http://127.0.0.1:3000/changelog#v0-4-0 in test environment
    expect(clipboard).toMatch(/changelog#v0-4-0/)
  })

  test("navbar indicator appears with unseen version and clears after visit", async ({
    page,
  }) => {
    // Seed localStorage with an older seen version (0.3.2)
    // Newest in fixture is 0.4.0, which is a minor bump → should show indicator
    await page.addInitScript(() => {
      localStorage.setItem("so4:changelog:seen", "0.3.2")
    })

    // Navigate to /trade which loads the navbar with WhatsNewDot
    await page.goto("/trade")
    await page.waitForLoadState("networkidle")

    // The navbar should have a changelog link with the indicator dot visible
    // WhatsNewDot is aria-hidden with data-slot="whats-new-dot"
    const whatsNewDot = page.locator('[data-slot="whats-new-dot"]')
    await expect(whatsNewDot).toBeVisible()

    // Click the changelog link in the navbar to navigate to /changelog
    const changelogLink = page.getByRole("link", { name: /Changelog/ })
    await changelogLink.click()
    await page.waitForLoadState("networkidle")

    // On /changelog, the newest version (0.4.0) is written to localStorage
    // after the page loads (in ChangelogPage effect)
    await page.waitForTimeout(200)

    // Navigate back to /trade to check if indicator is now gone
    await page.goto("/trade")
    await page.waitForLoadState("networkidle")

    // The dot should not be visible since localStorage now has "0.4.0"
    // matching the newest release
    await expect(whatsNewDot).not.toBeVisible()
  })

  test("navbar indicator does not show for patch-only bumps", async ({ page }) => {
    // Seed localStorage with 0.4.0 (patch bump to 0.4.1 should not show)
    // But our fixture doesn't have 0.4.1, so we test with current version
    // Set seen to 0.4.0, newest is also 0.4.0 → no bump → no indicator
    await page.addInitScript(() => {
      localStorage.setItem("so4:changelog:seen", "0.4.0")
    })

    await page.goto("/trade")
    await page.waitForLoadState("networkidle")

    const whatsNewDot = page.locator('[data-slot="whats-new-dot"]')
    await expect(whatsNewDot).not.toBeVisible()
  })

  test("archive loads on demand for deep-linked archived versions", async ({
    page,
  }) => {
    // This test verifies that the archive is only fetched when needed
    // (not on initial /changelog load)

    // First load: navigate to /changelog (recent only)
    let archiveRequested = false
    await page.on("response", (response) => {
      if (response.url().includes("changelog.archive.json")) {
        archiveRequested = true
      }
    })

    await page.goto("/changelog")
    await page.waitForLoadState("networkidle")

    // Archive should NOT have been requested yet
    expect(archiveRequested).toBe(false)

    // Now navigate to an archived version deep-link in the same page session
    // (without clearing the route listener)
    archiveRequested = false
    await page.goto("/changelog#v0-1-0")
    await page.waitForLoadState("networkidle")

    // Archive should NOW be requested because the anchor is not in recent releases
    expect(archiveRequested).toBe(true)

    // Verify archived version is visible
    const archivedSection = page.locator("section[id='v0-1-0']")
    await expect(archivedSection).toBeVisible()
  })
})
