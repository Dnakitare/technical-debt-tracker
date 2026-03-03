import { test, expect } from "@playwright/test"

test.describe("Account Deletion", () => {
  test("settings page shows danger zone section", async ({ page }) => {
    await page.goto("/dashboard/settings")

    await expect(page.getByText("Danger Zone")).toBeVisible()
    await expect(
      page.getByText("Permanently delete your account")
    ).toBeVisible()
    await expect(page.getByLabel(/type delete to confirm/i)).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Delete Account" })
    ).toBeVisible()
  })

  test("delete button is disabled until DELETE is typed", async ({ page }) => {
    await page.goto("/dashboard/settings")

    const deleteButton = page.getByRole("button", { name: "Delete Account" })
    await expect(deleteButton).toBeDisabled()

    const input = page.getByLabel(/type delete to confirm/i)
    await input.fill("DELETE")
    await expect(deleteButton).toBeEnabled()
  })

  test("delete button remains disabled with wrong text", async ({ page }) => {
    await page.goto("/dashboard/settings")

    const deleteButton = page.getByRole("button", { name: "Delete Account" })
    const input = page.getByLabel(/type delete to confirm/i)

    await input.fill("delete")
    await expect(deleteButton).toBeDisabled()

    await input.fill("DELET")
    await expect(deleteButton).toBeDisabled()
  })
})
