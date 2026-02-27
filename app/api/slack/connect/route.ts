import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { SLACK_SCOPES } from "@/lib/constants"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

async function handleGET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientId = process.env.SLACK_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: "Slack not configured" }, { status: 500 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/slack/oauth`
    const scopes = SLACK_SCOPES
    const state = user.id // Use user ID as state for verification

    const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

    return NextResponse.redirect(url)
  } catch (error) {
    console.error("Slack connect error:", error)
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

    const { data: profile } = await supabase
      .from("users")
      .select("current_team_id")
      .eq("id", user.id)
      .single()

    if (!profile?.current_team_id) {
      return NextResponse.json({ error: "No team selected" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("teams")
      .update({
        slack_team_id: null,
        slack_bot_token: null,
        slack_channel_id: null,
        slack_webhook_url: null,
      })
      .eq("id", profile.current_team_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Slack disconnect error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGET, "auth")
export const DELETE = withRateLimit(handleDELETE, "auth")
