import { createClient } from "@/lib/supabase/server"
import { getTeamPlan, canExport, hasActiveSubscription } from "@/lib/plan-check"
import { TEAM_EXPORT_LIMIT, CSV_HEADER } from "@/lib/constants"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

async function handleGET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamPlan = await getTeamPlan(user.id)
    if (!teamPlan || !canExport(teamPlan.plan)) {
      return NextResponse.json({ error: "Upgrade to Pro to export data" }, { status: 403 })
    }

    if (!hasActiveSubscription(teamPlan)) {
      return NextResponse.json({ error: "Subscription expired" }, { status: 403 })
    }

    const { data: repos } = await supabase
      .from("repos")
      .select("id, github_full_name")
      .eq("team_id", teamPlan.teamId)

    if (!repos || repos.length === 0) {
      return NextResponse.json({ error: "No repos to export" }, { status: 404 })
    }

    const repoIds = repos.map((r) => r.id)
    const repoNameMap = Object.fromEntries(repos.map((r) => [r.id, r.github_full_name]))

    const { data: metrics } = await supabase
      .from("debt_metrics")
      .select("*")
      .in("repo_id", repoIds)
      .order("snapshot_date", { ascending: false })
      .limit(TEAM_EXPORT_LIMIT)

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({ error: "No metrics to export" }, { status: 404 })
    }

    const header = CSV_HEADER
    const rows = metrics.map((m) =>
      [
        m.snapshot_date,
        repoNameMap[m.repo_id] ?? m.repo_id,
        m.total_issues,
        m.critical_issues,
        m.high_issues,
        m.medium_issues,
        m.low_issues,
        m.estimated_hours,
        m.estimated_cost_usd,
        m.todo_count,
        m.avg_pr_age_days ?? "",
      ].join(",")
    )

    const csv = [header, ...rows].join("\n")
    const filename = `debtlens-team-export-${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Team export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET, "api")
