import { createClient } from "@/lib/supabase/server"
import type { PlanKey } from "@/lib/constants"
export { canExport } from "@/lib/constants"

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

  return { plan: team.plan as PlanKey, teamId: profile.current_team_id }
}
