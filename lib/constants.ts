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

export const DEFAULT_HOURLY_RATE = 100
