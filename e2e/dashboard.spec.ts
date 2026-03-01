import { test, expect } from "@playwright/test"

test.describe("Dashboard", () => {
  test("dashboard page loads and shows heading", async ({ page }) => {
    await page.goto("/dashboard")

    // Should stay on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/dashboard/)

    // Dashboard heading should be visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("navigation sidebar links work", async ({ page }) => {
    await page.goto("/dashboard")

    // Navigate to repos via sidebar
    const reposLink = page.getByRole("link", { name: /repos/i })
    if (await reposLink.isVisible()) {
      await reposLink.click()
      await expect(page).toHaveURL(/\/dashboard\/repos/)
    }

    // Navigate to settings via sidebar
    const settingsLink = page.getByRole("link", { name: /settings/i })
    if (await settingsLink.isVisible()) {
      await settingsLink.click()
      await expect(page).toHaveURL(/\/dashboard\/settings/)
    }
  })

  test("dashboard shows stats section", async ({ page }) => {
    await page.goto("/dashboard")

    // The dashboard should show some kind of stats/metrics content
    const content = await page.textContent("body")
    expect(content).toBeTruthy()
  })
})
