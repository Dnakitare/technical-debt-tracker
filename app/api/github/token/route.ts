import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createOctokit } from "@/lib/github"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

async function handleGET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("github_token, github_username")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      connected: !!profile?.github_token,
      github_username: profile?.github_username ?? null,
    })
  } catch (error) {
    console.error("GitHub token check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handlePOST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const token = body.token

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Validate the token against GitHub
    const octokit = createOctokit(token)
    let githubUsername: string
    try {
      const { data: ghUser } = await octokit.rest.users.getAuthenticated()
      githubUsername = ghUser.login
    } catch {
      return NextResponse.json({ error: "Invalid GitHub token" }, { status: 400 })
    }

    // Store token using admin client to bypass RLS
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("users")
      .update({ github_token: token, github_username: githubUsername })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      connected: true,
      github_username: githubUsername,
    })
  } catch (error) {
    console.error("GitHub token save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleDELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("users")
      .update({ github_token: null, github_username: null })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ connected: false, github_username: null })
  } catch (error) {
    console.error("GitHub token delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET, "auth")
export const POST = withRateLimit(handlePOST, "auth")
export const DELETE = withRateLimit(handleDELETE, "auth")
