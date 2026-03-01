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

export const SYNC_INTERVALS: Record<PlanKey, number> = {
  free: 24 * 60,      // 24 hours in minutes
  starter: 60,        // 1 hour
  pro: 15,            // 15 minutes
  enterprise: 15,     // 15 minutes
}

export const GITHUB_API_PAGE_SIZE = 100
export const METRICS_HISTORY_LIMIT = 30
export const REPO_EXPORT_LIMIT = 365
export const TEAM_EXPORT_LIMIT = 1000
export const MS_PER_DAY = 1000 * 60 * 60 * 24

export const DEBT_KEYWORDS = ["TODO", "FIXME", "HACK", "WORKAROUND", "TECHNICAL DEBT"] as const

export const CSV_HEADER = "date,repository,total_issues,critical,high,medium,low,estimated_hours,estimated_cost_usd,todo_count,avg_pr_age_days"

export const SLACK_SCOPES = "chat:write,commands,incoming-webhook"
export const SLACK_REQUEST_TIMEOUT_SECONDS = 300

export const EXPORT_ENABLED_PLANS: readonly PlanKey[] = ["pro", "enterprise"] as const

export function canExport(plan: PlanKey): boolean {
  return EXPORT_ENABLED_PLANS.includes(plan)
}
