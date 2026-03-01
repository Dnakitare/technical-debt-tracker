import { test as setup, expect } from "@playwright/test"

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD

  if (!email || !password) {
    throw new Error("E2E_USER_EMAIL and E2E_USER_PASSWORD must be set")
  }

  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()

  // Wait for redirect to dashboard (or onboarding for new users)
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  await page.context().storageState({ path: "e2e/.auth/user.json" })
})
