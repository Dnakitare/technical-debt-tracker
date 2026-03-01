import type { SupabaseClient } from "@supabase/supabase-js"

type Role = "owner" | "admin" | "member" | "viewer"

interface TeamMember {
  role: Role
  team_id: string
}

/**
 * Verify the user is a member of the team that owns the given repo.
 * Returns the member record (with role) or null if not a member.
 */
export async function verifyRepoAccess(
  supabase: SupabaseClient,
  userId: string,
  repoTeamId: string
): Promise<TeamMember | null> {
  const { data: member } = await supabase
    .from("team_members")
    .select("role, team_id")
    .eq("team_id", repoTeamId)
    .eq("user_id", userId)
    .single()

  return member as TeamMember | null
}

/**
 * Check if the role has write access (owner or admin).
 */
export function hasWriteAccess(role: Role): boolean {
  return role === "owner" || role === "admin"
}
