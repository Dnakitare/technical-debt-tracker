import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RoleSelector } from "../role-selector"
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

describe("RoleSelector", () => {
  it("renders static badge for owner", () => {
    const { container } = render(
      <RoleSelector
        teamId="team-1"
        userId="user-1"
        currentRole="owner"
        isOwner={true}
        callerRole="owner"
      />
    )

    expect(container.textContent).toContain("owner")
    expect(container.querySelector("select")).toBeNull()
  })

  it("renders select dropdown for non-owner member", () => {
    const { container } = render(
      <RoleSelector
        teamId="team-1"
        userId="user-2"
        currentRole="member"
        isOwner={false}
        callerRole="owner"
      />
    )

    const select = container.querySelector("select") as HTMLSelectElement
    expect(select).not.toBeNull()
    expect(select.value).toBe("member")
  })

  it("disables admin option when caller is admin", () => {
    const { container } = render(
      <RoleSelector
        teamId="team-1"
        userId="user-2"
        currentRole="member"
        isOwner={false}
        callerRole="admin"
      />
    )

    const select = container.querySelector("select") as HTMLSelectElement
    const options = Array.from(select.options)
    const adminOption = options.find((o) => o.value === "admin")
    expect(adminOption?.disabled).toBe(true)
  })

  it("sends PATCH request on role change", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null

    server.use(
      http.patch("/api/teams/:teamId/members", async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, role: "viewer" })
      })
    )

    const { container } = render(
      <RoleSelector
        teamId="team-1"
        userId="user-2"
        currentRole="member"
        isOwner={false}
        callerRole="owner"
      />
    )

    const select = container.querySelector("select") as HTMLSelectElement
    await user.selectOptions(select, "viewer")

    await waitFor(() => {
      expect(capturedBody).toEqual({ userId: "user-2", role: "viewer" })
    })
  })
})
