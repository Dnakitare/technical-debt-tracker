import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase } from "@/test-utils/mock-supabase"

const mockSupabase = createMockSupabase()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

const { GET, POST } = await import("@/app/api/teams/route")

beforeEach(() => {
  vi.clearAllMocks()
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  })
})

describe("GET /api/teams", () => {
  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const res = await GET(new Request("http://localhost/api/teams"))
    expect(res.status).toBe(401)
  })

  it("returns teams on success", async () => {
    const mockTeams = [
      { team_id: "team-1", role: "owner", teams: { name: "My Team" } },
    ]

    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    Object.defineProperty(chain, "then", {
      value: (resolve: (val: unknown) => void) =>
        resolve({ data: mockTeams, error: null }),
      configurable: true,
    })

    mockSupabase.from.mockImplementationOnce(() => chain)

    const res = await GET(new Request("http://localhost/api/teams"))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual(mockTeams)
  })

  it("returns 500 on query error", async () => {
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    Object.defineProperty(chain, "then", {
      value: (resolve: (val: unknown) => void) =>
        resolve({ data: null, error: { message: "DB error" } }),
      configurable: true,
    })

    mockSupabase.from.mockImplementationOnce(() => chain)

    const res = await GET(new Request("http://localhost/api/teams"))
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error).toBe("DB error")
  })
})

describe("POST /api/teams", () => {
  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const res = await POST(
      new Request("http://localhost/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Team" }),
      })
    )
    expect(res.status).toBe(401)
  })

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new Request("http://localhost/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      })
    )
    expect(res.status).toBe(400)
  })

  it("returns 201 on successful create", async () => {
    const createdTeam = { id: "team-new", name: "New Team", slug: "new-team-123" }
    let callCount = 0

    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // teams insert
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: createdTeam, error: null }),
        }
      }
      // team_members insert
      const chain: Record<string, unknown> = {}
      chain.insert = vi.fn().mockReturnValue(chain)
      Object.defineProperty(chain, "then", {
        value: (resolve: (val: unknown) => void) => resolve({ error: null }),
        configurable: true,
      })
      return chain
    })

    const res = await POST(
      new Request("http://localhost/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Team" }),
      })
    )
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.id).toBe("team-new")
    expect(body.name).toBe("New Team")
  })
})
