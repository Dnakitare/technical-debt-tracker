import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const pages = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Repos", path: "/dashboard/repos" },
  { name: "Team", path: "/dashboard/team" },
  { name: "Settings", path: "/dashboard/settings" },
  { name: "Billing", path: "/dashboard/billing" },
]

for (const { name, path } of pages) {
  test(`${name} page has no accessibility violations`, async ({ page }) => {
    await page.goto(path)

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })
}
