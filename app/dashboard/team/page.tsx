import { createClient } from "@/lib/supabase/server"
import { Users } from "lucide-react"

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("current_team_id")
    .eq("id", user!.id)
    .single()

  const { data: members } = profile?.current_team_id
    ? await supabase
        .from("team_members")
        .select("*, users(email, full_name, avatar_url)")
        .eq("team_id", profile.current_team_id)
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
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {(member.users as { full_name: string | null })?.full_name?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {(member.users as { full_name: string | null })?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {(member.users as { email: string })?.email}
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
    </div>
  )
}
