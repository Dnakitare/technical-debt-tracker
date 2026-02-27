import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { Users, Mail } from "lucide-react"
import { InviteMemberForm } from "@/components/team/invite-member-form"
import { RemoveMemberButton } from "@/components/team/remove-member-button"
import { CancelInviteButton } from "@/components/team/cancel-invite-button"

interface MemberWithUser {
  id: string
  user_id: string
  role: string
  joined_at: string | null
  users: {
    email: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

export const metadata: Metadata = { title: "Team" }

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("current_team_id")
    .eq("id", user!.id)
    .single()

  const teamId = profile?.current_team_id ?? ""

  // Fetch current user's role
  const { data: currentMember } = teamId
    ? await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user!.id)
        .single()
    : { data: null }

  const isAdminOrOwner = currentMember?.role === "owner" || currentMember?.role === "admin"

  const { data: members } = teamId
    ? await supabase
        .from("team_members")
        .select("*, users(email, full_name, avatar_url)")
        .eq("team_id", teamId)
        .returns<MemberWithUser[]>()
    : { data: [] as MemberWithUser[] }

  // Fetch pending invites
  const { data: invites } = teamId
    ? await supabase
        .from("team_invites")
        .select("*")
        .eq("team_id", teamId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Team
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage team members and roles
          </p>
        </div>
      </div>

      {isAdminOrOwner && teamId && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Invite a Member
          </h2>
          <InviteMemberForm teamId={teamId} />
        </div>
      )}

      {members && members.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Joined
                </th>
                {isAdminOrOwner && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {member.users?.full_name?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {member.users?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {member.users?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 capitalize dark:bg-zinc-800 dark:text-zinc-300">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {member.joined_at
                      ? new Date(member.joined_at).toLocaleDateString()
                      : "Pending"}
                  </td>
                  {isAdminOrOwner && (
                    <td className="px-6 py-4 text-right">
                      <RemoveMemberButton
                        teamId={teamId}
                        userId={member.user_id}
                        isOwner={member.role === "owner"}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <Users className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            No team members
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Invite team members to collaborate.
          </p>
        </div>
      )}

      {/* Pending invites */}
      {invites && invites.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Pending Invites
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {invite.email}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Invited as{" "}
                        <span className="capitalize">{invite.role}</span>
                        {" · "}
                        {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {isAdminOrOwner && (
                    <CancelInviteButton teamId={teamId} inviteId={invite.id} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
