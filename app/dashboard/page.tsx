import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils"
import { BarChart3, TrendingDown, AlertTriangle, Clock } from "lucide-react"
import { DebtChart } from "@/components/dashboard/debt-chart"

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
    }),
    { cost: 0, issues: 0, critical: 0, hours: 0 }
  )

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
  ]

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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Debt Cost Trend
        </h2>
        <DebtChart metrics={metrics ?? []} />
      </div>

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
            href="/dashboard/repos"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Connect Repository
          </a>
        </div>
      )}
    </div>
  )
}
