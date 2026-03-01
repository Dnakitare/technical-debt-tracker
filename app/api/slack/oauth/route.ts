import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

const SETTINGS_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings`

async function handleGet(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      return NextResponse.redirect(`${SETTINGS_URL}?slack=error`)
    }

    // State format: "<random_token>:<user_id>"
    const colonIdx = state.indexOf(":")
    if (colonIdx === -1) {
      return NextResponse.redirect(`${SETTINGS_URL}?slack=error`)
    }
    const stateUserId = state.slice(colonIdx + 1)

    // Verify the authenticated user matches the state param
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== stateUserId) {
      return NextResponse.redirect(`${SETTINGS_URL}?slack=error`)
    }

    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      console.error("SLACK_CLIENT_ID or SLACK_CLIENT_SECRET not configured")
      return NextResponse.redirect(`${SETTINGS_URL}?slack=error`)
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/slack/oauth`

    // Exchange code for token
    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.ok) {
      console.error("Slack OAuth error:", tokenData.error)
      return NextResponse.redirect(`${SETTINGS_URL}?slack=error`)
    }

    // Validate webhook URL if present
    const webhookUrl = tokenData.incoming_webhook?.url ?? null
    if (webhookUrl && !webhookUrl.startsWith("https://hooks.slack.com/")) {
      console.error("Slack OAuth: unexpected webhook URL origin")
      return NextResponse.redirect(`${SETTINGS_URL}?slack=error`)
    }

    // Get user's team
    const adminClient = createAdminClient()

    const { data: profile } = await adminClient
      .from("users")
      .select("current_team_id")
      .eq("id", stateUserId)
      .single()

    if (!profile?.current_team_id) {
      return NextResponse.redirect(`${SETTINGS_URL}?slack=error`)
    }

    // Check if this Slack workspace is already linked to another team
    const slackTeamId = tokenData.team?.id ?? null
    if (slackTeamId) {
      const { data: existingTeam } = await adminClient
        .from("teams")
        .select("id")
        .eq("slack_team_id", slackTeamId)
        .neq("id", profile.current_team_id)
        .single()

      if (existingTeam) {
        return NextResponse.redirect(`${SETTINGS_URL}?slack=error&reason=workspace_already_linked`)
      }
    }

    // Store Slack credentials
    await adminClient
      .from("teams")
      .update({
        slack_bot_token: tokenData.access_token,
        slack_team_id: slackTeamId,
        slack_channel_id: tokenData.incoming_webhook?.channel_id ?? null,
        slack_webhook_url: webhookUrl,
      })
      .eq("id", profile.current_team_id)

    return NextResponse.redirect(`${SETTINGS_URL}?slack=connected`)
  } catch (error) {
    console.error("Slack OAuth callback error:", error)
    return NextResponse.redirect(`${SETTINGS_URL}?slack=error`)
  }
}

export const GET = withRateLimit(handleGet, "auth")
