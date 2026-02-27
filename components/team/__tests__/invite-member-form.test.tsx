import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { InviteMemberForm } from "../invite-member-form"
import { server } from "@/test-utils/msw-server"
import { http, HttpResponse } from "msw"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}))

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("InviteMemberForm", () => {
  it("renders email input, role select, and invite button", () => {
    render(<InviteMemberForm teamId="team-1" />)

    expect(screen.getAllByLabelText(/email/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByLabelText(/role/i).length).toBeGreaterThanOrEqual(1)
    const buttons = screen.getAllByRole("button")
    expect(buttons.some((b) => b.textContent?.match(/invite/i))).toBe(true)
  })

  it("submits correct payload", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.post("/api/teams/:teamId/members", async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ status: "added" }, { status: 201 })
      })
    )

    render(<InviteMemberForm teamId="team-1" />)

    const emailInputs = screen.getAllByLabelText(/email/i)
    const roleSelects = screen.getAllByLabelText(/role/i)
    const submitButtons = screen.getAllByRole("button").filter((b) => b.textContent?.match(/invite/i))

    await user.type(emailInputs[0], "alice@example.com")
    await user.selectOptions(roleSelects[0], "admin")
    await user.click(submitButtons[0])

    await waitFor(() => {
      expect(capturedBody).toEqual({ email: "alice@example.com", role: "admin" })
    })
  })
})
