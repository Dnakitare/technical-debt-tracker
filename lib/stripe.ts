import Stripe from "stripe"

let stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (typeof window !== "undefined") {
    throw new Error("Stripe should only be used on the server side")
  }
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  }
  return stripe
}
