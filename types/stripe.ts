export interface SubscriptionInfo {
  plan: "free" | "starter" | "pro" | "enterprise"
  status: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid"
  periodEnd: string | null
  maxRepos: number
  maxMembers: number
}

export interface CheckoutSessionRequest {
  priceId: string
  teamId: string
}
