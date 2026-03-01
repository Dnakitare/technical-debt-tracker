import { getStripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { PLANS, type PlanKey } from "@/lib/constants"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"
import type Stripe from "stripe"

async function handlePost(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const stripe = getStripe()
  const supabaseAdmin = createAdminClient()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      const teamId = session.metadata?.teamId
      const subscriptionId = session.subscription as string

      if (teamId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const periodEnd = subscription.items.data[0]?.current_period_end

        const matchedPlan = (Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).find(
          ([, config]) => config.stripePriceId === priceId
        )
        const plan = matchedPlan?.[0] ?? "free"
        const planConfig = PLANS[plan]
        const maxRepos = planConfig.maxRepos
        const maxMembers = planConfig.maxMembers

        await supabaseAdmin
          .from("teams")
          .update({
            plan,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            subscription_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            max_repos: maxRepos,
            max_members: maxMembers,
          })
          .eq("id", teamId)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object
      const periodEnd = subscription.items.data[0]?.current_period_end

      const { data: teams } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .single()

      if (teams) {
        await supabaseAdmin
          .from("teams")
          .update({
            subscription_status: subscription.status,
            subscription_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          })
          .eq("id", teams.id)
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object
      await supabaseAdmin
        .from("teams")
        .update({
          plan: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
          max_repos: PLANS.free.maxRepos,
          max_members: PLANS.free.maxMembers,
        })
        .eq("stripe_subscription_id", subscription.id)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const sub = invoice.parent?.subscription_details?.subscription ?? null
      const subId = typeof sub === "string" ? sub : sub?.id ?? null
      if (subId) {
        await supabaseAdmin
          .from("teams")
          .update({ subscription_status: "past_due" })
          .eq("stripe_subscription_id", subId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

export const POST = withRateLimit(handlePost, "webhook")
