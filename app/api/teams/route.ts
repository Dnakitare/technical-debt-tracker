import { createClient } from "@/lib/supabase/server"
import { createTeamSchema } from "@/lib/validators"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

async function handleGET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: teams, error } = await supabase
      .from("team_members")
      .select("team_id, role, teams(*)")
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(teams)
  } catch (error) {
    console.error("Teams fetch error:", error)
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
    const parsed = createTeamSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")

    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        name: parsed.data.name,
        slug: `${slug}-${Date.now()}`,
        owner_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: user.id,
      role: "owner",
    })

    if (memberError) {
      // Clean up orphaned team
      await supabase.from("teams").delete().eq("id", team.id)
      return NextResponse.json({ error: "Failed to create team membership" }, { status: 500 })
    }

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Team create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET, "api")
export const POST = withRateLimit(handlePOST, "api")
