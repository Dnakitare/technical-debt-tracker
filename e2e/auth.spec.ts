import { test, expect } from "@playwright/test"

test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Authentication", () => {
  test("unauthenticated user visiting /dashboard is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login")

    await expect(page.getByText("Welcome back")).toBeVisible()
    await expect(page.getByText("Sign in to your account")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible()
    await expect(page.getByText("Continue with GitHub")).toBeVisible()
  })

  test("login page has sign up link", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible()
  })
})
