import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface HealthCheck {
  status: "ok" | "error"
  latencyMs: number
  error?: string
}

async function checkSupabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const admin = createAdminClient()
    const { error } = await admin.from("users").select("id").limit(1)
    const latencyMs = Date.now() - start
    if (error) {
      return { status: "error", latencyMs, error: error.message }
    }
    return { status: "ok", latencyMs }
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function checkRedis(): Promise<HealthCheck | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!redisUrl || !redisToken) return null

  const start = Date.now()
  try {
    const res = await fetch(`${redisUrl}/ping`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })
    const latencyMs = Date.now() - start
    if (!res.ok) {
      return { status: "error", latencyMs, error: `HTTP ${res.status}` }
    }
    return { status: "ok", latencyMs }
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function GET() {
  const [supabase, redis] = await Promise.all([
    checkSupabase(),
    checkRedis(),
  ])

  const checks: Record<string, HealthCheck> = { supabase }
  if (redis) checks.redis = redis

  const allOk = Object.values(checks).every((c) => c.status === "ok")

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  )
}
