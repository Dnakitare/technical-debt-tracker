import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"
import { captureApiError } from "@/lib/api-error"

async function handleDELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's stripe customer ID and owned teams
    const admin = createAdminClient()

    const { data: profile } = await admin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    const { data: ownedTeams } = await admin
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .eq("role", "owner")

    // Cancel Stripe subscriptions for owned teams
    if (ownedTeams && ownedTeams.length > 0) {
      const stripe = getStripe()

      for (const { team_id } of ownedTeams) {
        const { data: team } = await admin
          .from("teams")
          .select("stripe_subscription_id")
          .eq("id", team_id)
          .single()

        if (team?.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(team.stripe_subscription_id)
          } catch (err) {
            captureApiError("Stripe subscription cancel error", err)
          }
        }
      }
    }

    // Cancel any standalone customer subscriptions
    if (profile?.stripe_customer_id) {
      try {
        const stripe = getStripe()
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: "active",
        })
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
      } catch (err) {
        captureApiError("Stripe customer subscription cancel error", err)
      }
    }

    // Delete user — CASCADE handles DB cleanup
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    captureApiError("Account deletion error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const DELETE = withRateLimit(handleDELETE, "auth")
