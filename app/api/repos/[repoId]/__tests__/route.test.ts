import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase } from "@/test-utils/mock-supabase"

const mockSupabase = createMockSupabase()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

const { GET, DELETE } = await import("@/app/api/repos/[repoId]/route")

function makeContext(repoId: string) {
  return { params: Promise.resolve({ repoId }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  })
})

describe("GET /api/repos/[repoId]", () => {
  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const res = await GET(
      new Request("http://localhost/api/repos/repo-1"),
      makeContext("repo-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns 404 when repo not found", async () => {
    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
    }))

    const res = await GET(
      new Request("http://localhost/api/repos/nonexistent"),
      makeContext("nonexistent")
    )
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.error).toBe("Repo not found")
  })

  it("returns repo on success", async () => {
    const mockRepo = { id: "repo-1", github_full_name: "org/repo" }

    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRepo, error: null }),
    }))

    const res = await GET(
      new Request("http://localhost/api/repos/repo-1"),
      makeContext("repo-1")
    )
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual(mockRepo)
  })
})

describe("DELETE /api/repos/[repoId]", () => {
  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const res = await DELETE(
      new Request("http://localhost/api/repos/repo-1", { method: "DELETE" }),
      makeContext("repo-1")
    )
    expect(res.status).toBe(401)
  })

  it("returns success on delete", async () => {
    const chain: Record<string, unknown> = {}
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    Object.defineProperty(chain, "then", {
      value: (resolve: (val: unknown) => void) => resolve({ error: null }),
      configurable: true,
    })

    mockSupabase.from.mockImplementationOnce(() => chain)

    const res = await DELETE(
      new Request("http://localhost/api/repos/repo-1", { method: "DELETE" }),
      makeContext("repo-1")
    )
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it("returns 500 on delete error", async () => {
    const chain: Record<string, unknown> = {}
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    Object.defineProperty(chain, "then", {
      value: (resolve: (val: unknown) => void) =>
        resolve({ error: { message: "RLS violation" } }),
      configurable: true,
    })

    mockSupabase.from.mockImplementationOnce(() => chain)

    const res = await DELETE(
      new Request("http://localhost/api/repos/repo-1", { method: "DELETE" }),
      makeContext("repo-1")
    )
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error).toBe("RLS violation")
  })
})
