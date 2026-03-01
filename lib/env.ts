/**
 * Environment variable validation.
 * Call validateEnv() at app startup to catch missing configuration early.
 */

interface EnvVar {
  name: string
  required: boolean
  publicClient?: boolean
}

const ENV_VARS: EnvVar[] = [
  // Supabase (required)
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, publicClient: true },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, publicClient: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true },

  // Application
  { name: "NEXT_PUBLIC_SITE_URL", required: true, publicClient: true },

  // Stripe (required for billing)
  { name: "STRIPE_SECRET_KEY", required: false },
  { name: "STRIPE_WEBHOOK_SECRET", required: false },

  // GitHub OAuth (optional)
  { name: "GITHUB_CLIENT_ID", required: false },
  { name: "GITHUB_CLIENT_SECRET", required: false },

  // Slack (optional)
  { name: "SLACK_CLIENT_ID", required: false },
  { name: "SLACK_CLIENT_SECRET", required: false },
  { name: "SLACK_SIGNING_SECRET", required: false },

  // Upstash Redis (optional in dev, recommended in prod)
  { name: "UPSTASH_REDIS_REST_URL", required: false },
  { name: "UPSTASH_REDIS_REST_TOKEN", required: false },

  // Sentry (optional)
  { name: "NEXT_PUBLIC_SENTRY_DSN", required: false, publicClient: true },

  // Cron (optional)
  { name: "CRON_SECRET", required: false },
]

export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = []
  const warnings: string[] = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name]
    if (!value) {
      if (envVar.required) {
        missing.push(envVar.name)
      }
    }
  }

  // Warn about paired env vars where one is set but not the other
  const pairs = [
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"],
    ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  ]

  for (const [a, b] of pairs) {
    const hasA = !!process.env[a]
    const hasB = !!process.env[b]
    if (hasA !== hasB) {
      warnings.push(`${a} is set but ${b} is not (both are needed)`)
    }
  }

  if (process.env.NODE_ENV === "production" && !process.env.UPSTASH_REDIS_REST_URL) {
    warnings.push("UPSTASH_REDIS_REST_URL not set — rate limiting will reject all requests in production")
  }

  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET) {
    warnings.push("CRON_SECRET not set — scheduled sync will not work")
  }

  return { valid: missing.length === 0, missing, warnings }
}

/**
 * Log validation results. Call during server startup.
 */
export function logEnvValidation(): void {
  const { valid, missing, warnings } = validateEnv()

  if (!valid) {
    console.error(`[env] Missing required environment variables: ${missing.join(", ")}`)
  }

  for (const warning of warnings) {
    console.warn(`[env] ${warning}`)
  }
}
