import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SyncButton } from "../sync-button"
import { server } from "@/test-utils/msw-server"
import { http, HttpResponse } from "msw"

import { vi } from "vitest"
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}))

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("SyncButton", () => {
  it("renders with Sync text", () => {
    render(<SyncButton repoId="repo-1" />)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThanOrEqual(1)
    expect(buttons[0]).toHaveTextContent(/sync/i)
  })

  it("shows syncing state on click", async () => {
    const user = userEvent.setup()

    server.use(
      http.post("/api/repos/:repoId/sync", async () => {
        await new Promise((r) => setTimeout(r, 100))
        return HttpResponse.json({ success: true })
      })
    )

    render(<SyncButton repoId="repo-1" />)
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[0])

    await waitFor(() => {
      expect(buttons[0]).toHaveTextContent(/syncing/i)
    })
  })

  it("handles sync error gracefully", async () => {
    const user = userEvent.setup()

    server.use(
      http.post("/api/repos/:repoId/sync", () => {
        return HttpResponse.json({ error: "Sync failed" }, { status: 500 })
      })
    )

    render(<SyncButton repoId="repo-1" />)
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[0])

    await waitFor(() => {
      expect(buttons[0]).toHaveTextContent(/sync/i)
      expect(buttons[0]).not.toBeDisabled()
    })
  })
})
