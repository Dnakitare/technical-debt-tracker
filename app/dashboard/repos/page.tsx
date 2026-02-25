import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { GitBranch, ExternalLink } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { SyncButton } from "@/components/repos/sync-button"

export const metadata: Metadata = { title: "Repositories" }

export default async function ReposPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("current_team_id")
    .eq("id", user!.id)
    .single()

  const { data: repos } = await supabase
    .from("repos")
    .select("*")
    .eq("team_id", profile?.current_team_id ?? "")
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Repositories
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage your connected GitHub repositories
          </p>
        </div>
        <a
          href="/dashboard/repos/connect"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Connect Repo
        </a>
      </div>

      {repos && repos.length > 0 ? (
        <div className="space-y-4">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-4">
                <GitBranch className="h-8 w-8 text-zinc-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/repos/${repo.id}`}
                      className="font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
                    >
                      {repo.github_full_name}
                    </Link>
                    <a
                      href={repo.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
                    {repo.language && <span>{repo.language}</span>}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        repo.sync_status === "completed"
                          ? "bg-green-100 text-green-800"
                          : repo.sync_status === "syncing"
                            ? "bg-blue-100 text-blue-800"
                            : repo.sync_status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {repo.sync_status}
                    </span>
                    {repo.last_synced_at && (
                      <span>
                        Synced {formatRelativeTime(repo.last_synced_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <SyncButton repoId={repo.id} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <GitBranch className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            No repositories yet
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Connect a GitHub repository to start analyzing technical debt.
          </p>
        </div>
      )}
    </div>
  )
}
