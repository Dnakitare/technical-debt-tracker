import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"
import { BarChart3, TrendingDown, AlertTriangle, Clock, ListChecks, GitPullRequest } from "lucide-react"
import { DebtChart } from "@/components/dashboard/debt-chart"

export const metadata: Metadata = { title: "Dashboard" }
import { PriorityChart } from "@/components/dashboard/priority-chart"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("current_team_id, hourly_rate")
    .eq("id", user!.id)
    .single()

  const { data: repos } = await supabase
    .from("repos")
    .select("id, github_full_name, sync_status, last_synced_at")
    .eq("team_id", profile?.current_team_id ?? "")

  const repoIds = repos?.map((r) => r.id) ?? []

  const { data: metrics } = repoIds.length > 0
    ? await supabase
        .from("debt_metrics")
        .select("*")
        .in("repo_id", repoIds)
        .order("snapshot_date", { ascending: false })
        .limit(100)
    : { data: [] }

  type Metric = NonNullable<typeof metrics>[number]

  const latestMetrics: Record<string, Metric> = {}
  for (const m of metrics ?? []) {
    if (!latestMetrics[m.repo_id]) latestMetrics[m.repo_id] = m
  }

  const totals = Object.values(latestMetrics).reduce(
    (acc, m) => ({
      cost: acc.cost + (m.estimated_cost_usd ?? 0),
      issues: acc.issues + (m.total_issues ?? 0),
      critical: acc.critical + (m.critical_issues ?? 0),
      hours: acc.hours + (m.estimated_hours ?? 0),
      todoCount: acc.todoCount + (m.todo_count ?? 0),
      prAgeSum: acc.prAgeSum + (m.avg_pr_age_days ?? 0) * (m.total_issues ?? 0),
      prAgeWeight: acc.prAgeWeight + (m.avg_pr_age_days != null ? (m.total_issues ?? 0) : 0),
    }),
    { cost: 0, issues: 0, critical: 0, hours: 0, todoCount: 0, prAgeSum: 0, prAgeWeight: 0 }
  )

  const avgPrAge = totals.prAgeWeight > 0 ? totals.prAgeSum / totals.prAgeWeight : null

  const stats = [
    {
      label: "Total Debt Cost",
      value: formatCurrency(totals.cost),
      icon: TrendingDown,
      color: "text-red-600",
    },
    {
      label: "Open Issues",
      value: totals.issues.toString(),
      icon: AlertTriangle,
      color: "text-amber-600",
    },
    {
      label: "Critical Issues",
      value: totals.critical.toString(),
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      label: "Estimated Hours",
      value: totals.hours.toFixed(0),
      icon: Clock,
      color: "text-blue-600",
    },
    {
      label: "TODO Count",
      value: totals.todoCount.toString(),
      icon: ListChecks,
      color: "text-purple-600",
    },
    {
      label: "Avg PR Age",
      value: avgPrAge != null ? `${avgPrAge.toFixed(1)}d` : "N/A",
      icon: GitPullRequest,
      color: "text-orange-600",
    },
  ]

  // Aggregate priority data by date for the priority chart
  const priorityByDate: Record<string, { snapshot_date: string; critical_issues: number; high_issues: number; medium_issues: number; low_issues: number }> = {}
  for (const m of metrics ?? []) {
    if (!priorityByDate[m.snapshot_date]) {
      priorityByDate[m.snapshot_date] = {
        snapshot_date: m.snapshot_date,
        critical_issues: 0,
        high_issues: 0,
        medium_issues: 0,
        low_issues: 0,
      }
    }
    const entry = priorityByDate[m.snapshot_date]
    entry.critical_issues += m.critical_issues ?? 0
    entry.high_issues += m.high_issues ?? 0
    entry.medium_issues += m.medium_issues ?? 0
    entry.low_issues += m.low_issues ?? 0
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Overview of your technical debt across {repos?.length ?? 0} repositories
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {stat.label}
              </p>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Debt Cost Trend
          </h2>
          <DebtChart metrics={metrics ?? []} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Issues by Priority
          </h2>
          <PriorityChart data={Object.values(priorityByDate)} />
        </div>
      </div>

      {/* Per-repo breakdown table */}
      {repos && repos.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Repository Breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Repository</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Issues</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Critical</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Hours</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">TODOs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Synced</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {repos.map((repo) => {
                  const m = latestMetrics[repo.id]
                  return (
                    <tr key={repo.id}>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/repos/${repo.id}`}
                          className="text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
                        >
                          {repo.github_full_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-zinc-700 dark:text-zinc-300">
                        {m?.total_issues ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-zinc-700 dark:text-zinc-300">
                        {m?.critical_issues ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-zinc-700 dark:text-zinc-300">
                        {m ? formatCurrency(m.estimated_cost_usd) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-zinc-700 dark:text-zinc-300">
                        {m?.estimated_hours?.toFixed(0) ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-zinc-700 dark:text-zinc-300">
                        {m?.todo_count ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {repo.last_synced_at
                          ? formatRelativeTime(repo.last_synced_at)
                          : "Never"}
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {repos && repos.length === 0 && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <BarChart3 className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            No repositories connected
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Connect a GitHub repository to start tracking technical debt.
          </p>
          <a
            href="/dashboard/repos/connect"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Connect Repository
          </a>
        </div>
      )}
    </div>
  )
}
