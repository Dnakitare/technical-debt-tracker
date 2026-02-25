export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxRepos: 1,
    maxMembers: 1,
    stripePriceId: null,
  },
  starter: {
    name: "Starter",
    price: 19,
    maxRepos: 5,
    maxMembers: 5,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID ?? null,
  },
  pro: {
    name: "Pro",
    price: 39,
    maxRepos: 25,
    maxMembers: 25,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
  },
  enterprise: {
    name: "Enterprise",
    price: 99,
    maxRepos: -1,
    maxMembers: -1,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null,
  },
} as const

export type PlanKey = keyof typeof PLANS

export const PLAN_FEATURES: Record<PlanKey, string[]> = {
  free: ["1 repository", "1 team member", "Daily sync", "Basic dashboard"],
  starter: [
    "5 repositories",
    "5 team members",
    "Hourly sync",
    "Full dashboard",
    "Email support",
  ],
  pro: [
    "25 repositories",
    "25 team members",
    "Real-time sync",
    "Full dashboard",
    "Priority support",
    "Export reports",
  ],
  enterprise: [
    "Unlimited repositories",
    "Unlimited team members",
    "Real-time sync",
    "Full dashboard",
    "Dedicated support",
    "Export reports",
    "Custom integrations",
  ],
}

export const DEFAULT_HOURLY_RATE = 100
