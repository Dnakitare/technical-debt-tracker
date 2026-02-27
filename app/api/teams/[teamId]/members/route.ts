import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { inviteMemberSchema } from "@/lib/validators"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

async function handlePOST(
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

    const body = await request.json()
    const parsed = inviteMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, role } = parsed.data

    // Check member limit
    const { count: memberCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)

    const { data: team } = await supabase
      .from("teams")
      .select("max_members")
      .eq("id", teamId)
      .single()

    if (team && memberCount != null && memberCount >= team.max_members) {
      return NextResponse.json(
        { error: "Team member limit reached. Upgrade your plan to add more members." },
        { status: 403 }
      )
    }

    // Look up user by email using admin client
    const admin = createAdminClient()
    const { data: existingUser } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", existingUser.id)
        .single()

      if (existingMember) {
        return NextResponse.json({ error: "User is already a team member" }, { status: 409 })
      }

      // Add directly as team member
      const { error: insertError } = await admin
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: existingUser.id,
          role,
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ status: "added" }, { status: 201 })
    } else {
      // Check for existing pending invite
      const { data: existingInvite } = await supabase
        .from("team_invites")
        .select("id")
        .eq("team_id", teamId)
        .eq("email", email)
        .eq("status", "pending")
        .single()

      if (existingInvite) {
        return NextResponse.json({ error: "Invite already pending for this email" }, { status: 409 })
      }

      // Create pending invite
      const { error: inviteError } = await admin
        .from("team_invites")
        .insert({
          team_id: teamId,
          email,
          role,
          invited_by: user.id,
          status: "pending",
        })

      if (inviteError) {
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
      }

      return NextResponse.json({ status: "invited" }, { status: 201 })
    }
  } catch (error) {
    console.error("Member invite error:", error)
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

    // Check caller is admin/owner first
    const { data: callerMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single()

    if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    // Check target member exists and is not the owner
    const { data: targetMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the team owner" }, { status: 403 })
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Member remove error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withRateLimit(handlePOST, "api")
export const DELETE = withRateLimit(handleDELETE, "api")
