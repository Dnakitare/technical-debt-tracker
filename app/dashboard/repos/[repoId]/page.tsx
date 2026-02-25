import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, AlertTriangle, DollarSign, Clock, ListChecks, GitPullRequest } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { SyncButton } from "@/components/repos/sync-button"
import { PriorityBreakdownChart } from "@/components/repos/priority-breakdown-chart"
import { RepoTrendChart } from "@/components/repos/repo-trend-chart"
import { DeleteRepoButton } from "@/components/repos/delete-repo-button"

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ repoId: string }>
}) {
  const { repoId } = await params
  const supabase = await createClient()

  const { data: repo } = await supabase
    .from("repos")
    .select("*")
    .eq("id", repoId)
    .single()

  if (!repo) notFound()

  const { data: latestMetric } = await supabase
    .from("debt_metrics")
    .select("*")
    .eq("repo_id", repoId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single()

  const { data: snapshots } = await supabase
    .from("debt_metrics")
    .select("snapshot_date, estimated_cost_usd, total_issues")
    .eq("repo_id", repoId)
    .order("snapshot_date", { ascending: false })
    .limit(30)

  const hasMetrics = !!latestMetric

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/repos"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Repositories
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {repo.github_full_name}
            </h1>
            <a
              href={repo.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
          </div>
          <SyncButton repoId={repo.id} />
        </div>
      </div>

      {hasMetrics ? (
        <>
          {/* Stat cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Issues</p>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatNumber(latestMetric.total_issues)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Estimated Cost</p>
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(latestMetric.estimated_cost_usd)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Estimated Hours</p>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {latestMetric.estimated_hours?.toFixed(0) ?? "0"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">TODO Count</p>
                <ListChecks className="h-5 w-5 text-purple-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatNumber(latestMetric.todo_count)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Avg PR Age</p>
                <GitPullRequest className="h-5 w-5 text-orange-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {latestMetric.avg_pr_age_days != null
                  ? `${latestMetric.avg_pr_age_days.toFixed(1)}d`
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Priority Breakdown
              </h2>
              <PriorityBreakdownChart
                critical={latestMetric.critical_issues}
                high={latestMetric.high_issues}
                medium={latestMetric.medium_issues}
                low={latestMetric.low_issues}
              />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Trend (Last 30 Snapshots)
              </h2>
              <RepoTrendChart metrics={snapshots ?? []} />
            </div>
          </div>
        </>
      ) : (
        <div className="mb-8 rounded-xl border-2 border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <AlertTriangle className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            No metrics yet
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sync this repository to generate debt metrics.
          </p>
        </div>
      )}

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-zinc-900">
        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Danger Zone
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Permanently remove this repository and all its metrics data.
        </p>
        <DeleteRepoButton repoId={repo.id} />
      </div>
    </div>
  )
}
