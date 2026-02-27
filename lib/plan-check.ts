import { createClient } from "@/lib/supabase/server"
import { PLANS, type PlanKey } from "@/lib/constants"
export { canExport } from "@/lib/constants"

const validPlans = Object.keys(PLANS) as PlanKey[]

function isValidPlan(value: unknown): value is PlanKey {
  return typeof value === "string" && validPlans.includes(value as PlanKey)
}

export async function getTeamPlan(userId: string): Promise<{ plan: PlanKey; teamId: string } | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("users")
    .select("current_team_id")
    .eq("id", userId)
    .single()

  if (!profile?.current_team_id) return null

  const { data: team } = await supabase
    .from("teams")
    .select("plan")
    .eq("id", profile.current_team_id)
    .single()

  if (!team) return null

  const plan = isValidPlan(team.plan) ? team.plan : "free"
  return { plan, teamId: profile.current_team_id }
}
