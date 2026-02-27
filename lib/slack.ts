import { WebClient } from "@slack/web-api"
import { timingSafeEqual, createHmac } from "crypto"

export function createSlackClient(token: string): WebClient {
  return new WebClient(token)
}

export function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5
  if (parseInt(timestamp) < fiveMinutesAgo) {
    return false
  }

  const sigBasestring = `v0:${timestamp}:${body}`
  const mySignature = "v0=" + createHmac("sha256", signingSecret)
    .update(sigBasestring)
    .digest("hex")

  try {
    return timingSafeEqual(
      Buffer.from(mySignature, "utf8"),
      Buffer.from(signature, "utf8")
    )
  } catch {
    return false
  }
}

interface DebtSummary {
  totalCost: number
  totalIssues: number
  criticalIssues: number
  repoCount: number
}

export function buildDebtSummaryBlocks(summary: DebtSummary) {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "DebtLens - Technical Debt Summary",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Estimated Cost:*\n$${summary.totalCost.toLocaleString()}`,
        },
        {
          type: "mrkdwn",
          text: `*Total Issues:*\n${summary.totalIssues}`,
        },
        {
          type: "mrkdwn",
          text: `*Critical Issues:*\n${summary.criticalIssues}`,
        },
        {
          type: "mrkdwn",
          text: `*Repositories:*\n${summary.repoCount}`,
        },
      ],
    },
  ]
}
