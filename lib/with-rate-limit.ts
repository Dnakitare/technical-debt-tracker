import { NextResponse } from "next/server"
import { getRateLimiter, type RateLimitTier } from "./rate-limit"

type RouteHandler = (
  request: Request,
  context?: unknown
) => Promise<NextResponse> | NextResponse

export function withRateLimit(handler: RouteHandler, tier: RateLimitTier): RouteHandler {
  return async (request: Request, context?: unknown) => {
    const limiter = getRateLimiter(tier)

    if (!limiter) {
      if (process.env.NODE_ENV === "production") {
        console.warn(`[rate-limit] No Redis configured — ${tier} tier rate limiting disabled`)
      }
      return handler(request, context)
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous"

    const { success, limit, remaining, reset } = await limiter.limit(ip)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      )
    }

    const response = await handler(request, context)

    response.headers.set("X-RateLimit-Limit", limit.toString())
    response.headers.set("X-RateLimit-Remaining", remaining.toString())
    response.headers.set("X-RateLimit-Reset", reset.toString())

    return response
  }
}
