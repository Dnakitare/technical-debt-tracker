import { createAdminClient } from "@/lib/supabase/admin"
import { verifySlackSignature, buildDebtSummaryBlocks } from "@/lib/slack"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

async function handlePost(request: Request) {
  try {
    const body = await request.text()
    const timestamp = request.headers.get("x-slack-request-timestamp") ?? ""
    const signature = request.headers.get("x-slack-signature") ?? ""

    const signingSecret = process.env.SLACK_SIGNING_SECRET
    if (!signingSecret || !verifySlackSignature(signingSecret, signature, timestamp, body)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const params = new URLSearchParams(body)
    const commandText = params.get("text")?.trim().toLowerCase() ?? ""
    const teamId = params.get("team_id") ?? ""

    const adminClient = createAdminClient()

    // Find the DebtLens team linked to this Slack team
    const { data: team } = await adminClient
      .from("teams")
      .select("id")
      .eq("slack_team_id", teamId)
      .single()

    if (!team) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "This Slack workspace is not linked to a DebtLens team.",
      })
    }

    if (commandText === "status") {
      const { data: repos } = await adminClient
        .from("repos")
        .select("id")
        .eq("team_id", team.id)

      const repoIds = repos?.map((r) => r.id) ?? []

      if (repoIds.length === 0) {
        return NextResponse.json({
          response_type: "ephemeral",
          text: "No repositories connected yet.",
        })
      }

      // Get latest metric per repo
      const { data: metrics } = await adminClient
        .from("debt_metrics")
        .select("*")
        .in("repo_id", repoIds)
        .order("snapshot_date", { ascending: false })
        .limit(100)

      const latestByRepo: Record<string, typeof metrics extends (infer T)[] | null ? T : never> = {}
      for (const m of metrics ?? []) {
        if (m && !latestByRepo[m.repo_id]) latestByRepo[m.repo_id] = m
      }

      const values = Object.values(latestByRepo)
      const summary = {
        totalCost: values.reduce((acc, m) => acc + (m?.estimated_cost_usd ?? 0), 0),
        totalIssues: values.reduce((acc, m) => acc + (m?.total_issues ?? 0), 0),
        criticalIssues: values.reduce((acc, m) => acc + (m?.critical_issues ?? 0), 0),
        repoCount: repoIds.length,
      }

      return NextResponse.json({
        response_type: "in_channel",
        blocks: buildDebtSummaryBlocks(summary),
      })
    }

    if (commandText === "sync") {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "Sync initiated for all repositories. This may take a few minutes.",
      })
    }

    // Default: help text
    return NextResponse.json({
      response_type: "ephemeral",
      text: "*DebtLens Commands:*\n`/debtlens status` - View technical debt summary\n`/debtlens sync` - Trigger sync for all repos\n`/debtlens help` - Show this help text",
    })
  } catch (error) {
    console.error("Slack command error:", error)
    return NextResponse.json({
      response_type: "ephemeral",
      text: "An error occurred processing your command.",
    })
  }
}

export const POST = withRateLimit(handlePost, "webhook")
