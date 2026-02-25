import { createClient } from "@/lib/supabase/server"
import { connectRepoSchema } from "@/lib/validators"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("current_team_id")
      .eq("id", user.id)
      .single()

    if (!profile?.current_team_id) {
      return NextResponse.json({ error: "No team selected" }, { status: 400 })
    }

    const { data: repos, error } = await supabase
      .from("repos")
      .select("*")
      .eq("team_id", profile.current_team_id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(repos)
  } catch (error) {
    console.error("Repos fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = connectRepoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("current_team_id")
      .eq("id", user.id)
      .single()

    if (!profile?.current_team_id) {
      return NextResponse.json({ error: "No team selected" }, { status: 400 })
    }

    const { data: team } = await supabase
      .from("teams")
      .select("max_repos")
      .eq("id", profile.current_team_id)
      .single()

    const { count } = await supabase
      .from("repos")
      .select("*", { count: "exact", head: true })
      .eq("team_id", profile.current_team_id)

    if (team && team.max_repos > 0 && (count ?? 0) >= team.max_repos) {
      return NextResponse.json(
        { error: "Repo limit reached. Upgrade your plan." },
        { status: 403 }
      )
    }

    const { data: repo, error } = await supabase
      .from("repos")
      .insert({
        team_id: profile.current_team_id,
        ...parsed.data,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(repo, { status: 201 })
  } catch (error) {
    console.error("Repo create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
