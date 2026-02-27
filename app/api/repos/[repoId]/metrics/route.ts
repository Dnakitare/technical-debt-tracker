import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

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

    const { data: metrics, error } = await supabase
      .from("debt_metrics")
      .select("*")
      .eq("repo_id", repoId)
      .order("snapshot_date", { ascending: false })
      .limit(30)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Metrics fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET, "api")
