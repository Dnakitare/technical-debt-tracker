import { test, expect } from "@playwright/test"

test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Password Reset", () => {
  test("forgot-password page renders correctly", async ({ page }) => {
    await page.goto("/forgot-password")

    await expect(page.getByText("Reset your password")).toBeVisible()
    await expect(
      page.getByText("Enter your email and we'll send you a reset link")
    ).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Send reset link" })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Back to sign in" })
    ).toBeVisible()
  })

  test("login page has forgot password link", async ({ page }) => {
    await page.goto("/login")

    const forgotLink = page.getByRole("link", { name: "Forgot password?" })
    await expect(forgotLink).toBeVisible()
    await expect(forgotLink).toHaveAttribute("href", "/forgot-password")
  })

  test("forgot-password back link navigates to login", async ({ page }) => {
    await page.goto("/forgot-password")

    await page.getByRole("link", { name: "Back to sign in" }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
