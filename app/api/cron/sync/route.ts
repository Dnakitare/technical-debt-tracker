import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncRepo } from "@/lib/sync-repo"
import { SYNC_INTERVALS, DEFAULT_HOURLY_RATE } from "@/lib/constants"
import type { PlanKey } from "@/lib/constants"
import { captureApiError } from "@/lib/api-error"

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("CRON_SECRET is not configured")
    return NextResponse.json({ error: "Not configured" }, { status: 500 })
  }

  const authHeader = request.headers.get("authorization") ?? ""
  const expected = `Bearer ${cronSecret}`
  let authorized = false
  try {
    authorized =
      authHeader.length === expected.length &&
      timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  } catch {
    authorized = false
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Fetch all repos with their team plan and owner's github token
  const { data: repos, error: reposError } = await adminClient
    .from("repos")
    .select(`
      id,
      github_owner,
      github_name,
      github_full_name,
      team_id,
      last_synced_at,
      user_id,
      teams!inner(plan),
      users!inner(github_token, hourly_rate)
    `)

  if (reposError) {
    captureApiError("Cron sync: failed to fetch repos", reposError)
    return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 })
  }

  const now = Date.now()
  let synced = 0
  let skipped = 0
  const errors: string[] = []

  interface CronRepoTeam { plan: PlanKey }
  interface CronRepoUser { github_token: string | null; hourly_rate: number | null }

  for (const repo of repos ?? []) {
    const team = repo.teams as unknown as CronRepoTeam
    const user = repo.users as unknown as CronRepoUser

    if (!user?.github_token) {
      skipped++
      continue
    }

    const plan = team?.plan ?? "free"
    const intervalMs = (SYNC_INTERVALS[plan] ?? SYNC_INTERVALS.free) * 60 * 1000

    if (repo.last_synced_at) {
      const lastSynced = new Date(repo.last_synced_at).getTime()
      if (now - lastSynced < intervalMs) {
        skipped++
        continue
      }
    }

    try {
      await syncRepo({
        repoId: repo.id,
        githubToken: user.github_token,
        hourlyRate: user.hourly_rate ?? DEFAULT_HOURLY_RATE,
        teamId: repo.team_id,
        repo: {
          github_owner: repo.github_owner,
          github_name: repo.github_name,
          github_full_name: repo.github_full_name,
        },
      })
      synced++
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push(`${repo.github_full_name}: ${message}`)
    }
  }

  return NextResponse.json({ synced, skipped, errors })
}
