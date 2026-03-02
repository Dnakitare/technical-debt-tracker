import { createClient } from "@/lib/supabase/server"
import { verifyRepoAccess } from "@/lib/auth-check"
import { METRICS_HISTORY_LIMIT } from "@/lib/constants"
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

    const { data: repo } = await supabase
      .from("repos")
      .select("team_id")
      .eq("id", repoId)
      .single()

    if (!repo) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 })
    }

    const member = await verifyRepoAccess(supabase, user.id, repo.team_id)
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: metrics, error } = await supabase
      .from("debt_metrics")
      .select("*")
      .eq("repo_id", repoId)
      .order("snapshot_date", { ascending: false })
      .limit(METRICS_HISTORY_LIMIT)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(metrics)
  } catch (error) {
    captureApiError("Metrics fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET, "api")
