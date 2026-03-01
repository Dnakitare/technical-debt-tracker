import { test, expect } from "@playwright/test"

test.describe("Settings", () => {
  test("settings page loads with form fields", async ({ page }) => {
    await page.goto("/dashboard/settings")

    await expect(page).toHaveURL(/\/dashboard\/settings/)

    // Name and hourly rate fields should be present
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/hourly rate/i)).toBeVisible()
  })

  test("can update name and save", async ({ page }) => {
    await page.goto("/dashboard/settings")

    const nameInput = page.getByLabel(/name/i)
    await nameInput.fill("E2E Test User")

    const saveButton = page.getByRole("button", { name: /save/i })
    await saveButton.click()

    // Wait for toast or success indication
    await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 5000 })
  })

  test("GitHub connection section is visible", async ({ page }) => {
    await page.goto("/dashboard/settings")

    await expect(page.getByText(/github/i).first()).toBeVisible()
  })

  test("Slack integration section is visible", async ({ page }) => {
    await page.goto("/dashboard/settings")

    await expect(page.getByText(/slack/i).first()).toBeVisible()
  })
})
