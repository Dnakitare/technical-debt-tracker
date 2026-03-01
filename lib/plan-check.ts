import { createClient } from "@/lib/supabase/server"
import { PLANS, type PlanKey } from "@/lib/constants"
export { canExport } from "@/lib/constants"

const validPlans = Object.keys(PLANS) as PlanKey[]

function isValidPlan(value: unknown): value is PlanKey {
  return typeof value === "string" && validPlans.includes(value as PlanKey)
}

interface TeamPlan {
  plan: PlanKey
  teamId: string
  subscriptionStatus: string | null
}

export async function getTeamPlan(userId: string): Promise<TeamPlan | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("users")
    .select("current_team_id")
    .eq("id", userId)
    .single()

  if (!profile?.current_team_id) return null

  const { data: team } = await supabase
    .from("teams")
    .select("plan, subscription_status")
    .eq("id", profile.current_team_id)
    .single()

  if (!team) return null

  const plan = isValidPlan(team.plan) ? team.plan : "free"
  return {
    plan,
    teamId: profile.current_team_id,
    subscriptionStatus: team.subscription_status ?? null,
  }
}

/**
 * Check if a team has an active paid subscription.
 * Free plans are always considered active.
 */
export function hasActiveSubscription(teamPlan: TeamPlan): boolean {
  if (teamPlan.plan === "free") return true
  return teamPlan.subscriptionStatus === "active" || teamPlan.subscriptionStatus === "trialing"
}
