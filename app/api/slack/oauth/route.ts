import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

async function handleGet(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // user ID

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?slack=error`
      )
    }

    // Verify the authenticated user matches the state param
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?slack=error`
      )
    }

    const clientId = process.env.SLACK_CLIENT_ID!
    const clientSecret = process.env.SLACK_CLIENT_SECRET!
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
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?slack=error`
      )
    }

    // Get user's team
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminClient
      .from("users")
      .select("current_team_id")
      .eq("id", state)
      .single()

    if (!profile?.current_team_id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?slack=error`
      )
    }

    // Store Slack credentials
    await adminClient
      .from("teams")
      .update({
        slack_bot_token: tokenData.access_token,
        slack_team_id: tokenData.team?.id ?? null,
        slack_channel_id: tokenData.incoming_webhook?.channel_id ?? null,
        slack_webhook_url: tokenData.incoming_webhook?.url ?? null,
      })
      .eq("id", profile.current_team_id)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?slack=connected`
    )
  } catch (error) {
    console.error("Slack OAuth callback error:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?slack=error`
    )
  }
}

export const GET = withRateLimit(handleGet, "auth")
