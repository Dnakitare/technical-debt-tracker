import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

type RateLimitTier = "api" | "auth" | "sync" | "webhook"

const TIER_CONFIG: Record<RateLimitTier, { requests: number; window: `${number} ${"ms" | "s" | "m" | "h" | "d"}` }> = {
  api: { requests: 60, window: "1 m" },
  auth: { requests: 10, window: "1 m" },
  sync: { requests: 5, window: "1 m" },
  webhook: { requests: 120, window: "1 m" },
}

function hasRedisConfig(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function createLimiter(tier: RateLimitTier): Ratelimit | null {
  if (!hasRedisConfig()) {
    return null
  }

  const config = TIER_CONFIG[tier]

  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `ratelimit:${tier}`,
  })
}

const limiters: Partial<Record<RateLimitTier, Ratelimit | null>> = {}

export function getRateLimiter(tier: RateLimitTier): Ratelimit | null {
  if (!(tier in limiters)) {
    limiters[tier] = createLimiter(tier)
  }
  return limiters[tier] ?? null
}

export type { RateLimitTier }
