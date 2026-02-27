import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

const mockLimiter = {
  limit: vi.fn(),
}

vi.mock("@/lib/rate-limit", () => ({
  getRateLimiter: vi.fn().mockReturnValue(mockLimiter),
}))

const { withRateLimit } = await import("@/lib/with-rate-limit")
const { getRateLimiter } = await import("@/lib/rate-limit")

beforeEach(() => {
  vi.clearAllMocks()
  ;(getRateLimiter as ReturnType<typeof vi.fn>).mockReturnValue(mockLimiter)
})

describe("withRateLimit", () => {
  const handler = vi.fn().mockResolvedValue(
    NextResponse.json({ ok: true })
  )

  it("calls handler and adds rate limit headers on success", async () => {
    mockLimiter.limit.mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    })

    const wrapped = withRateLimit(handler, "api")
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    })

    const response = await wrapped(request)

    expect(handler).toHaveBeenCalledWith(request, undefined)
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60")
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("59")
    expect(response.headers.has("X-RateLimit-Reset")).toBe(true)
  })

  it("returns 429 with Retry-After when rate limited", async () => {
    const resetTime = Date.now() + 30000
    mockLimiter.limit.mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: resetTime,
    })

    const wrapped = withRateLimit(handler, "api")
    const request = new Request("http://localhost/api/test")

    const response = await wrapped(request)

    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBeTruthy()
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0")

    const body = await response.json()
    expect(body.error).toBe("Too many requests")

    expect(handler).not.toHaveBeenCalled()
  })

  it("passes through to handler when no limiter configured", async () => {
    ;(getRateLimiter as ReturnType<typeof vi.fn>).mockReturnValue(null)

    const wrapped = withRateLimit(handler, "api")
    const request = new Request("http://localhost/api/test")

    const response = await wrapped(request)

    expect(handler).toHaveBeenCalled()
    expect(response.status).toBe(200)
  })

  it("extracts IP from x-forwarded-for header", async () => {
    mockLimiter.limit.mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    })

    const wrapped = withRateLimit(handler, "api")
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2" },
    })

    await wrapped(request)

    expect(mockLimiter.limit).toHaveBeenCalledWith("10.0.0.1")
  })

  it("falls back to x-real-ip header", async () => {
    mockLimiter.limit.mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    })

    const wrapped = withRateLimit(handler, "api")
    const request = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "192.168.1.1" },
    })

    await wrapped(request)

    expect(mockLimiter.limit).toHaveBeenCalledWith("192.168.1.1")
  })

  it("uses 'anonymous' when no IP headers present", async () => {
    mockLimiter.limit.mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    })

    const wrapped = withRateLimit(handler, "api")
    const request = new Request("http://localhost/api/test")

    await wrapped(request)

    expect(mockLimiter.limit).toHaveBeenCalledWith("anonymous")
  })

  it("passes context through to handler", async () => {
    mockLimiter.limit.mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    })

    const context = { params: Promise.resolve({ id: "123" }) }
    const wrapped = withRateLimit(handler, "api")
    const request = new Request("http://localhost/api/test")

    await wrapped(request, context)

    expect(handler).toHaveBeenCalledWith(request, context)
  })
})
