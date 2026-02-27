import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase } from "@/test-utils/mock-supabase"

const mockSupabase = createMockSupabase()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

// Re-import after mock setup
const { GET, POST } = await import("@/app/api/repos/route")

beforeEach(() => {
  vi.clearAllMocks()
  // Reset default auth
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  })
})

describe("GET /api/repos", () => {
  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const res = await GET(new Request("http://localhost/api/repos"))
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.error).toBe("Unauthorized")
  })

  it("returns 400 when no team selected", async () => {
    mockSupabase.from.mockImplementationOnce(() => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { current_team_id: null }, error: null }),
      }
      return chain
    })

    const res = await GET(new Request("http://localhost/api/repos"))
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toBe("No team selected")
  })

  it("returns repos on success", async () => {
    const mockRepos = [
      { id: "repo-1", github_full_name: "org/repo1" },
      { id: "repo-2", github_full_name: "org/repo2" },
    ]

    // First call: users table -> profile with current_team_id
    // Second call: repos table -> list of repos
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // users table
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { current_team_id: "team-1" },
            error: null,
          }),
        }
        return chain
      }
      // repos table
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.order = vi.fn().mockReturnValue(chain)
      Object.defineProperty(chain, "then", {
        value: (resolve: (val: unknown) => void) =>
          resolve({ data: mockRepos, error: null }),
        configurable: true,
      })
      return chain
    })

    const res = await GET(new Request("http://localhost/api/repos"))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual(mockRepos)
  })
})

describe("POST /api/repos", () => {
  const validBody = {
    github_repo_id: 12345,
    github_owner: "org",
    github_name: "repo",
    github_full_name: "org/repo",
    github_url: "https://github.com/org/repo",
    default_branch: "main",
    is_private: false,
    language: "TypeScript",
  }

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const res = await POST(
      new Request("http://localhost/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    )
    expect(res.status).toBe(401)
  })

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new Request("http://localhost/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_owner: "" }),
      })
    )
    expect(res.status).toBe(400)
  })

  it("returns 403 when repo limit reached", async () => {
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // users -> profile with current_team_id
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { current_team_id: "team-1" },
            error: null,
          }),
        }
      }
      if (callCount === 2) {
        // teams -> max_repos
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { max_repos: 3 },
            error: null,
          }),
        }
      }
      // repos count query (head: true)
      const chain: Record<string, unknown> = {}
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.select = vi.fn().mockImplementation((_cols?: string, opts?: { head?: boolean }) => {
        if (opts?.head) {
          return {
            ...chain,
            then: (resolve: (val: unknown) => void) => resolve({ count: 3 }),
          }
        }
        return chain
      })
      Object.defineProperty(chain, "then", {
        value: (resolve: (val: unknown) => void) => resolve({ count: 3, data: null, error: null }),
        configurable: true,
      })
      return chain
    })

    const res = await POST(
      new Request("http://localhost/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    )
    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error).toContain("Repo limit reached")
  })

  it("returns 201 on successful create", async () => {
    const createdRepo = { id: "repo-new", ...validBody, team_id: "team-1" }
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // users -> profile
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { current_team_id: "team-1" },
            error: null,
          }),
        }
      }
      if (callCount === 2) {
        // teams -> max_repos
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { max_repos: 10 },
            error: null,
          }),
        }
      }
      if (callCount === 3) {
        // repos count query
        const chain: Record<string, unknown> = {}
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.select = vi.fn().mockImplementation((_cols?: string, opts?: { head?: boolean }) => {
          if (opts?.head) {
            return {
              ...chain,
              then: (resolve: (val: unknown) => void) => resolve({ count: 2 }),
            }
          }
          return chain
        })
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: unknown) => void) => resolve({ count: 2, data: null, error: null }),
          configurable: true,
        })
        return chain
      }
      // repos insert
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createdRepo,
          error: null,
        }),
      }
    })

    const res = await POST(
      new Request("http://localhost/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    )
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.id).toBe("repo-new")
  })
})
