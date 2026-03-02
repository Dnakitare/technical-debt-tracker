import { createClient } from "@/lib/supabase/server"
import { getTeamPlan, canExport, hasActiveSubscription } from "@/lib/plan-check"
import { REPO_EXPORT_LIMIT, CSV_HEADER } from "@/lib/constants"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"
import { captureApiError } from "@/lib/api-error"

async function handleGET(
  _request: Request,
  context: unknown
) {
  const { params } = context as { params: Promise<{ repoId: string }> }
  try {
    const { repoId } = await params
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

    const { data: repo } = await supabase
      .from("repos")
      .select("github_full_name, team_id")
      .eq("id", repoId)
      .single()

    if (!repo || repo.team_id !== teamPlan.teamId) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 })
    }

    const { data: metrics } = await supabase
      .from("debt_metrics")
      .select("*")
      .eq("repo_id", repoId)
      .order("snapshot_date", { ascending: false })
      .limit(REPO_EXPORT_LIMIT)

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({ error: "No metrics to export" }, { status: 404 })
    }

    const header = CSV_HEADER
    const rows = metrics.map((m) =>
      [
        m.snapshot_date,
        repo?.github_full_name ?? repoId,
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
    const filename = `debtlens-${(repo?.github_full_name ?? repoId).replace(/\//g, "-")}-${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    captureApiError("Export error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET, "api")
