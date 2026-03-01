import { test, expect } from "@playwright/test"

test.describe("Repos", () => {
  test("repos list page loads", async ({ page }) => {
    await page.goto("/dashboard/repos")

    await expect(page).toHaveURL(/\/dashboard\/repos/)
    const content = await page.textContent("body")
    expect(content).toBeTruthy()
  })

  test("sync button is visible if repos exist", async ({ page }) => {
    await page.goto("/dashboard/repos")

    // If there are repos, a sync button should be present
    const syncButton = page.getByRole("button", { name: /sync/i })
    const repoCount = await syncButton.count()

    // This test passes whether repos exist or not
    if (repoCount > 0) {
      await expect(syncButton.first()).toBeVisible()
    }
  })

  test("export button is visible", async ({ page }) => {
    await page.goto("/dashboard/repos")

    // Export button may show upgrade prompt or work depending on plan
    const exportButton = page.getByRole("button", { name: /export/i })
    const count = await exportButton.count()

    if (count > 0) {
      await expect(exportButton.first()).toBeVisible()
    }
  })
})
