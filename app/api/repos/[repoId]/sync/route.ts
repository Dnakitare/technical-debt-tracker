import { createClient } from "@/lib/supabase/server"
import { verifyRepoAccess } from "@/lib/auth-check"
import { syncRepo } from "@/lib/sync-repo"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"
import { captureApiError } from "@/lib/api-error"

async function handlePOST(
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
      .select("*")
      .eq("id", repoId)
      .single()

    if (!repo) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 })
    }

    const member = await verifyRepoAccess(supabase, user.id, repo.team_id)
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("github_token, hourly_rate")
      .eq("id", user.id)
      .single()

    if (!profile?.github_token) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 })
    }

    const result = await syncRepo({
      repoId,
      githubToken: profile.github_token,
      hourlyRate: profile.hourly_rate ?? 100,
      teamId: repo.team_id,
      repo: {
        github_owner: repo.github_owner,
        github_name: repo.github_name,
        github_full_name: repo.github_full_name,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    captureApiError("Sync error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withRateLimit(handlePOST, "sync")
