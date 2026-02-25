import { getStripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = getStripe()

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
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

        let plan: string = "free"
        let maxRepos = 1
        let maxMembers = 1

        if (priceId === process.env.STRIPE_STARTER_PRICE_ID) {
          plan = "starter"
          maxRepos = 5
          maxMembers = 5
        } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
          plan = "pro"
          maxRepos = 25
          maxMembers = 25
        } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
          plan = "enterprise"
          maxRepos = -1
          maxMembers = -1
        }

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
          max_repos: 1,
          max_members: 1,
        })
        .eq("stripe_subscription_id", subscription.id)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subId = (invoice as any).subscription as string | null
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
