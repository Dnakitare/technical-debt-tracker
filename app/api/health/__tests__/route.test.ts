import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFrom = vi.fn()

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}))

const { GET } = await import("@/app/api/health/route")

beforeEach(() => {
  vi.clearAllMocks()
  // Clear environment for each test
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
})

describe("GET /api/health", () => {
  it("returns ok when Supabase is healthy", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ error: null }),
    })

    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe("ok")
    expect(body.checks.supabase.status).toBe("ok")
    expect(typeof body.checks.supabase.latencyMs).toBe("number")
    expect(body.timestamp).toBeDefined()
  })

  it("returns 503 when Supabase is unhealthy", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        error: { message: "connection refused" },
      }),
    })

    const res = await GET()
    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.status).toBe("degraded")
    expect(body.checks.supabase.status).toBe("error")
    expect(body.checks.supabase.error).toBe("connection refused")
  })

  it("skips Redis check when not configured", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ error: null }),
    })

    const res = await GET()
    const body = await res.json()

    expect(body.checks.redis).toBeUndefined()
  })

  it("includes Redis check when configured", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com"
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token"

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ error: null }),
    })

    // Mock fetch for Redis ping
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    const res = await GET()
    const body = await res.json()

    expect(body.checks.redis).toBeDefined()
    expect(body.checks.redis.status).toBe("ok")

    global.fetch = originalFetch
  })
})
