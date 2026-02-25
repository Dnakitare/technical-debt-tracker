import { createClient } from "@/lib/supabase/server"
import { fetchRepoIssues, fetchRepoPullRequests, searchCodeForDebt } from "@/lib/github"
import { classifyPriority, estimateHours, calculateDebtCost } from "@/lib/debt-engine"
import type { DebtItem } from "@/lib/debt-engine"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: repo } = await supabase
      .from("repos")
      .select("*")
      .eq("id", repoId)
      .single()

    if (!repo) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("github_token, hourly_rate")
      .eq("id", user.id)
      .single()

    if (!profile?.github_token) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 })
    }

    // Admin client for repo status updates (bypasses RLS)
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Mark as syncing
    await adminClient
      .from("repos")
      .update({ sync_status: "syncing" })
      .eq("id", repoId)

    try {
      const debtLabels = ["tech-debt", "technical-debt", "debt", "refactor", "cleanup"]
      const issues = await fetchRepoIssues(
        profile.github_token,
        repo.github_owner,
        repo.github_name,
        debtLabels
      )

      const prs = await fetchRepoPullRequests(
        profile.github_token,
        repo.github_owner,
        repo.github_name
      )

      const todoCount = await searchCodeForDebt(
        profile.github_token,
        repo.github_owner,
        repo.github_name
      )

      const debtItems: DebtItem[] = issues.map((issue) => {
        const labels = issue.labels
          .map((l) => (typeof l === "string" ? l : l.name ?? ""))
          .filter(Boolean)
        const priority = classifyPriority(labels)
        return {
          title: issue.title,
          labels,
          createdAt: issue.created_at,
          priority,
          estimatedHours: estimateHours(priority),
        }
      })

      const summary = calculateDebtCost(debtItems, profile.hourly_rate ?? 100)

      // Calculate PR age
      const now = new Date()
      const prAges = prs.map((pr) => {
        const created = new Date(pr.created_at)
        return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      })
      const avgPrAge = prAges.length > 0
        ? prAges.reduce((a, b) => a + b, 0) / prAges.length
        : null

      await adminClient.from("debt_metrics").upsert({
        repo_id: repoId,
        snapshot_date: new Date().toISOString().split("T")[0],
        total_issues: summary.totalIssues,
        critical_issues: summary.criticalIssues,
        high_issues: summary.highIssues,
        medium_issues: summary.mediumIssues,
        low_issues: summary.lowIssues,
        estimated_hours: summary.estimatedHours,
        estimated_cost_usd: summary.estimatedCostUsd,
        avg_pr_age_days: avgPrAge ? parseFloat(avgPrAge.toFixed(2)) : null,
        todo_count: todoCount,
      }, { onConflict: "repo_id,snapshot_date" })

      // Mark sync complete
      await adminClient
        .from("repos")
        .update({
          sync_status: "completed",
          last_synced_at: new Date().toISOString(),
          sync_error: null,
        })
        .eq("id", repoId)

      return NextResponse.json({ success: true, summary })
    } catch (syncError) {
      await adminClient
        .from("repos")
        .update({
          sync_status: "failed",
          sync_error: syncError instanceof Error ? syncError.message : "Unknown error",
        })
        .eq("id", repoId)

      throw syncError
    }
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
