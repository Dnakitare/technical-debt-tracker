import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"
import { captureApiError } from "@/lib/api-error"

async function handleGET(
  _request: Request,
  context: unknown
) {
  const { params } = context as { params: Promise<{ teamId: string }> }
  try {
    const { teamId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: invites, error } = await supabase
      .from("team_invites")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(invites)
  } catch (error) {
    captureApiError("Invites fetch error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleDELETE(
  request: Request,
  context: unknown
) {
  const { params } = context as { params: Promise<{ teamId: string }> }
  try {
    const { teamId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check caller is admin/owner
    const { data: callerMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single()

    if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { inviteId } = await request.json()

    if (!inviteId) {
      return NextResponse.json({ error: "inviteId required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("team_invites")
      .delete()
      .eq("id", inviteId)
      .eq("team_id", teamId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    captureApiError("Invite cancel error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET, "api")
export const DELETE = withRateLimit(handleDELETE, "api")
