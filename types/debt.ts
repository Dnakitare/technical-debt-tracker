export interface DebtItem {
  title: string
  labels: string[]
  createdAt: string
  priority: "critical" | "high" | "medium" | "low"
  estimatedHours: number
}

export interface DebtSnapshot {
  date: string
  totalIssues: number
  estimatedCost: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export interface RepoDebtOverview {
  repoId: string
  repoName: string
  currentCost: number
  costTrend: number // percentage change from previous snapshot
  issueCount: number
  lastSynced: string | null
  syncStatus: "pending" | "syncing" | "completed" | "failed"
}
