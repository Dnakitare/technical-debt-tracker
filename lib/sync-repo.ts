import { MS_PER_DAY } from "@/lib/constants"
import { fetchRepoIssues, fetchRepoPullRequests, searchCodeForDebt } from "@/lib/github"
import { classifyPriority, estimateHours, calculateDebtCost } from "@/lib/debt-engine"
import type { DebtItem } from "@/lib/debt-engine"
import { createAdminClient } from "@/lib/supabase/admin"
import { createSlackClient, buildDebtSummaryBlocks } from "@/lib/slack"

interface SyncRepoParams {
  repoId: string
  githubToken: string
  hourlyRate: number
  teamId: string
  repo: {
    github_owner: string
    github_name: string
    github_full_name: string
  }
}

interface SyncResult {
  success: true
  summary: {
    totalIssues: number
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
    estimatedHours: number
    estimatedCostUsd: number
  }
}

export async function syncRepo({
  repoId,
  githubToken,
  hourlyRate,
  teamId,
  repo,
}: SyncRepoParams): Promise<SyncResult> {
  const adminClient = createAdminClient()

  // Mark as syncing
  await adminClient
    .from("repos")
    .update({ sync_status: "syncing" })
    .eq("id", repoId)

  try {
    const debtLabels = ["tech-debt", "technical-debt", "debt", "refactor", "cleanup"]
    const issues = await fetchRepoIssues(
      githubToken,
      repo.github_owner,
      repo.github_name,
      debtLabels
    )

    const prs = await fetchRepoPullRequests(
      githubToken,
      repo.github_owner,
      repo.github_name
    )

    const todoCount = await searchCodeForDebt(
      githubToken,
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

    const summary = calculateDebtCost(debtItems, hourlyRate)

    // Calculate PR age
    const now = new Date()
    const prAges = prs.map((pr) => {
      const created = new Date(pr.created_at)
      return (now.getTime() - created.getTime()) / MS_PER_DAY
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

    // Send Slack notification (non-blocking)
    try {
      const { data: team } = await adminClient
        .from("teams")
        .select("slack_bot_token, slack_channel_id")
        .eq("id", teamId)
        .single()

      if (team?.slack_bot_token && team?.slack_channel_id) {
        const slack = createSlackClient(team.slack_bot_token)
        await slack.chat.postMessage({
          channel: team.slack_channel_id,
          text: `Sync completed for ${repo.github_full_name}`,
          blocks: buildDebtSummaryBlocks({
            totalCost: summary.estimatedCostUsd,
            totalIssues: summary.totalIssues,
            criticalIssues: summary.criticalIssues,
            repoCount: 1,
          }),
        })
      }
    } catch (slackError) {
      console.error("Slack notification error:", slackError)
    }

    return { success: true, summary }
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
}
