import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase } from "@/test-utils/mock-supabase"

const mockSupabase = createMockSupabase()
const mockAdminClient = createMockSupabase()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue(mockAdminClient),
}))

const { POST, DELETE } = await import("@/app/api/teams/[teamId]/members/route")

function makeContext(teamId: string) {
  return { params: Promise.resolve({ teamId }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  })
})

describe("POST /api/teams/[teamId]/members", () => {
  const validBody = { email: "invite@example.com", role: "member" }

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const res = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      }),
      makeContext("team-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 403 when caller is not admin/owner", async () => {
    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "viewer" },
        error: null,
      }),
    }))

    const res = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      }),
      makeContext("team-1")
    )
    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error).toBe("Forbidden")
  })

  it("returns 400 for invalid body", async () => {
    // First call: callerMember check -> owner
    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "owner" },
        error: null,
      }),
    }))

    const res = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
      makeContext("team-1")
    )
    expect(res.status).toBe(400)
  })

  it("returns 201 when adding existing user", async () => {
    let supabaseCallCount = 0
    mockSupabase.from.mockImplementation(() => {
      supabaseCallCount++
      if (supabaseCallCount === 1) {
        // callerMember check
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "owner" },
            error: null,
          }),
        }
      }
      if (supabaseCallCount === 2) {
        // member count query
        const chain: Record<string, unknown> = {}
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.select = vi.fn().mockImplementation((_cols?: string, opts?: { head?: boolean }) => {
          if (opts?.head) {
            return {
              ...chain,
              then: (resolve: (val: unknown) => void) => resolve({ count: 1 }),
            }
          }
          return chain
        })
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: unknown) => void) => resolve({ count: 1, data: null, error: null }),
          configurable: true,
        })
        return chain
      }
      if (supabaseCallCount === 3) {
        // teams -> max_members
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { max_members: 10 },
            error: null,
          }),
        }
      }
      // existingMember check
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      }
    })

    // Admin client: lookup user by email -> found
    let adminCallCount = 0
    mockAdminClient.from.mockImplementation(() => {
      adminCallCount++
      if (adminCallCount === 1) {
        // user lookup by email
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "user-2" },
            error: null,
          }),
        }
      }
      // insert team_member
      const chain: Record<string, unknown> = {}
      chain.insert = vi.fn().mockReturnValue(chain)
      Object.defineProperty(chain, "then", {
        value: (resolve: (val: unknown) => void) => resolve({ error: null }),
        configurable: true,
      })
      return chain
    })

    const res = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      }),
      makeContext("team-1")
    )
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.status).toBe("added")
  })
})

describe("DELETE /api/teams/[teamId]/members", () => {
  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const res = await DELETE(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-2" }),
      }),
      makeContext("team-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 400 when userId missing", async () => {
    // Caller check -> admin (authorized)
    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "admin" },
        error: null,
      }),
    }))

    const res = await DELETE(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      makeContext("team-1")
    )
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toBe("userId required")
  })

  it("returns 403 when trying to remove team owner", async () => {
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // caller check -> owner (authorized)
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "owner" },
            error: null,
          }),
        }
      }
      // target member -> owner role
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "owner" },
          error: null,
        }),
      }
    })

    const res = await DELETE(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-owner" }),
      }),
      makeContext("team-1")
    )
    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error).toBe("Cannot remove the team owner")
  })

  it("returns 403 when caller is not admin/owner", async () => {
    // First call: caller check -> viewer (not admin/owner)
    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "viewer" },
        error: null,
      }),
    }))

    const res = await DELETE(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-2" }),
      }),
      makeContext("team-1")
    )
    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error).toBe("Forbidden")
  })

  it("returns success when admin removes a member", async () => {
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // caller check -> admin
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "admin" },
            error: null,
          }),
        }
      }
      if (callCount === 2) {
        // target member -> member role
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "member" },
            error: null,
          }),
        }
      }
      // delete operation
      const chain: Record<string, unknown> = {}
      chain.delete = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      Object.defineProperty(chain, "then", {
        value: (resolve: (val: unknown) => void) => resolve({ error: null }),
        configurable: true,
      })
      return chain
    })

    const res = await DELETE(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-2" }),
      }),
      makeContext("team-1")
    )
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
