import { DEFAULT_HOURLY_RATE } from "./constants"

export interface DebtItem {
  title: string
  labels: string[]
  createdAt: string
  priority: "critical" | "high" | "medium" | "low"
  estimatedHours: number
}

export interface DebtSummary {
  totalIssues: number
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  lowIssues: number
  estimatedHours: number
  estimatedCostUsd: number
  todoCount: number
  avgPrAgeDays: number | null
  staleBranches: number
  issuesOpened: number
  issuesClosed: number
}

const PRIORITY_LABELS: Record<string, DebtItem["priority"]> = {
  critical: "critical",
  urgent: "critical",
  "p0": "critical",
  high: "high",
  "p1": "high",
  medium: "medium",
  "p2": "medium",
  low: "low",
  "p3": "low",
}

const HOURS_BY_PRIORITY: Record<DebtItem["priority"], number> = {
  critical: 16,
  high: 8,
  medium: 4,
  low: 2,
}

export function classifyPriority(labels: string[]): DebtItem["priority"] {
  for (const label of labels) {
    const normalized = label.toLowerCase().trim()
    if (normalized in PRIORITY_LABELS) {
      return PRIORITY_LABELS[normalized]
    }
  }
  return "medium"
}

export function estimateHours(priority: DebtItem["priority"]): number {
  return HOURS_BY_PRIORITY[priority]
}

export function calculateDebtCost(
  items: DebtItem[],
  hourlyRate: number = DEFAULT_HOURLY_RATE
): DebtSummary {
  const summary: DebtSummary = {
    totalIssues: items.length,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
    estimatedHours: 0,
    estimatedCostUsd: 0,
    todoCount: 0,
    avgPrAgeDays: null,
    staleBranches: 0,
    issuesOpened: 0,
    issuesClosed: 0,
  }

  for (const item of items) {
    switch (item.priority) {
      case "critical":
        summary.criticalIssues++
        break
      case "high":
        summary.highIssues++
        break
      case "medium":
        summary.mediumIssues++
        break
      case "low":
        summary.lowIssues++
        break
    }
    summary.estimatedHours += item.estimatedHours
  }

  summary.estimatedCostUsd = summary.estimatedHours * hourlyRate
  return summary
}
