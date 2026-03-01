import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase } from "@/test-utils/mock-supabase"

const mockSupabase = createMockSupabase()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

const mockVerifyRepoAccess = vi.fn()
const mockHasWriteAccess = vi.fn()

vi.mock("@/lib/auth-check", () => ({
  verifyRepoAccess: (...args: unknown[]) => mockVerifyRepoAccess(...args),
  hasWriteAccess: (...args: unknown[]) => mockHasWriteAccess(...args),
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
  // Default: user is an admin member of the repo's team
  mockVerifyRepoAccess.mockResolvedValue({ role: "admin", team_id: "team-1" })
  mockHasWriteAccess.mockReturnValue(true)
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

  it("returns 403 when user is not a team member", async () => {
    const mockRepo = { id: "repo-1", team_id: "team-1", github_full_name: "org/repo" }

    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRepo, error: null }),
    }))

    mockVerifyRepoAccess.mockResolvedValueOnce(null)

    const res = await GET(
      new Request("http://localhost/api/repos/repo-1"),
      makeContext("repo-1")
    )
    expect(res.status).toBe(403)
  })

  it("returns repo on success", async () => {
    const mockRepo = { id: "repo-1", team_id: "team-1", github_full_name: "org/repo" }

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

  it("returns 403 when user is not a team member", async () => {
    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { team_id: "team-1" }, error: null }),
    }))

    mockVerifyRepoAccess.mockResolvedValueOnce(null)

    const res = await DELETE(
      new Request("http://localhost/api/repos/repo-1", { method: "DELETE" }),
      makeContext("repo-1")
    )
    expect(res.status).toBe(403)
  })

  it("returns 403 when user lacks write access", async () => {
    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { team_id: "team-1" }, error: null }),
    }))

    mockVerifyRepoAccess.mockResolvedValueOnce({ role: "viewer", team_id: "team-1" })
    mockHasWriteAccess.mockReturnValueOnce(false)

    const res = await DELETE(
      new Request("http://localhost/api/repos/repo-1", { method: "DELETE" }),
      makeContext("repo-1")
    )
    expect(res.status).toBe(403)
  })

  it("returns success on delete", async () => {
    // First from() call: select repo to get team_id
    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { team_id: "team-1" }, error: null }),
    }))

    // Second from() call: delete repo
    const deleteChain: Record<string, unknown> = {}
    deleteChain.delete = vi.fn().mockReturnValue(deleteChain)
    deleteChain.eq = vi.fn().mockReturnValue(deleteChain)
    Object.defineProperty(deleteChain, "then", {
      value: (resolve: (val: unknown) => void) => resolve({ error: null }),
      configurable: true,
    })

    mockSupabase.from.mockImplementationOnce(() => deleteChain)

    const res = await DELETE(
      new Request("http://localhost/api/repos/repo-1", { method: "DELETE" }),
      makeContext("repo-1")
    )
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it("returns 500 on delete error", async () => {
    // First from() call: select repo
    mockSupabase.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { team_id: "team-1" }, error: null }),
    }))

    // Second from() call: delete fails
    const deleteChain: Record<string, unknown> = {}
    deleteChain.delete = vi.fn().mockReturnValue(deleteChain)
    deleteChain.eq = vi.fn().mockReturnValue(deleteChain)
    Object.defineProperty(deleteChain, "then", {
      value: (resolve: (val: unknown) => void) =>
        resolve({ error: { message: "RLS violation" } }),
      configurable: true,
    })

    mockSupabase.from.mockImplementationOnce(() => deleteChain)

    const res = await DELETE(
      new Request("http://localhost/api/repos/repo-1", { method: "DELETE" }),
      makeContext("repo-1")
    )
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error).toBe("RLS violation")
  })
})
