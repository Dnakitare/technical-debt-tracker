import { createClient } from "@/lib/supabase/server"
import { fetchUserRepos } from "@/lib/github"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"
import { captureApiError } from "@/lib/api-error"

async function handleGET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("github_token")
      .eq("id", user.id)
      .single()

    if (!profile?.github_token) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 })
    }

    const repos = await fetchUserRepos(profile.github_token)

    const simplified = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner.login,
      description: repo.description,
      html_url: repo.html_url,
      default_branch: repo.default_branch,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      private: repo.private,
    }))

    return NextResponse.json(simplified)
  } catch (error) {
    captureApiError("GitHub repos fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET, "api")
