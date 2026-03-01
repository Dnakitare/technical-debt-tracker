import { describe, it, expect, vi, beforeEach } from "vitest"
import { syncRepo } from "@/lib/sync-repo"

// Mock dependencies
vi.mock("@/lib/github", () => ({
  fetchRepoIssues: vi.fn(),
  fetchRepoPullRequests: vi.fn(),
  searchCodeForDebt: vi.fn(),
}))

vi.mock("@/lib/debt-engine", () => ({
  classifyPriority: vi.fn(() => "medium"),
  estimateHours: vi.fn(() => 4),
  calculateDebtCost: vi.fn(() => ({
    totalIssues: 2,
    criticalIssues: 0,
    highIssues: 1,
    mediumIssues: 1,
    lowIssues: 0,
    estimatedHours: 8,
    estimatedCostUsd: 800,
  })),
}))

const mockFrom = vi.fn()
const mockAdminClient = { from: mockFrom }

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}))

vi.mock("@/lib/slack", () => ({
  createSlackClient: vi.fn(() => ({
    chat: { postMessage: vi.fn() },
  })),
  buildDebtSummaryBlocks: vi.fn(() => []),
}))

import { fetchRepoIssues, fetchRepoPullRequests, searchCodeForDebt } from "@/lib/github"
import { createSlackClient } from "@/lib/slack"

const defaultParams = {
  repoId: "repo-123",
  githubToken: "ghp_test",
  hourlyRate: 100,
  teamId: "team-456",
  repo: {
    github_owner: "testorg",
    github_name: "testrepo",
    github_full_name: "testorg/testrepo",
  },
}

function setupMockChain(returnValue: unknown = {}) {
  const chain = {
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
  }
  return chain
}

describe("syncRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(fetchRepoIssues).mockResolvedValue([
      {
        title: "Fix tech debt",
        labels: [{ name: "tech-debt" }],
        created_at: "2025-01-01T00:00:00Z",
      },
    ] as never)

    vi.mocked(fetchRepoPullRequests).mockResolvedValue([
      { created_at: "2025-01-10T00:00:00Z" },
    ] as never)

    vi.mocked(searchCodeForDebt).mockResolvedValue(5)

    // Setup mock chains for each from() call
    const updateChain = setupMockChain()
    const upsertChain = setupMockChain()
    const selectChain = setupMockChain({ data: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === "repos") {
        return updateChain
      }
      if (table === "debt_metrics") {
        return upsertChain
      }
      if (table === "teams") {
        return selectChain
      }
      return updateChain
    })
  })

  it("returns success with summary after sync", async () => {
    const result = await syncRepo(defaultParams)

    expect(result.success).toBe(true)
    expect(result.summary).toEqual({
      totalIssues: 2,
      criticalIssues: 0,
      highIssues: 1,
      mediumIssues: 1,
      lowIssues: 0,
      estimatedHours: 8,
      estimatedCostUsd: 800,
    })
  })

  it("marks repo as syncing then completed", async () => {
    await syncRepo(defaultParams)

    // Should have called from("repos") at least twice: once for syncing, once for completed
    const reposCalls = mockFrom.mock.calls.filter(
      (call: unknown[]) => call[0] === "repos"
    )
    expect(reposCalls.length).toBeGreaterThanOrEqual(2)
  })

  it("upserts debt metrics", async () => {
    await syncRepo(defaultParams)

    expect(mockFrom).toHaveBeenCalledWith("debt_metrics")
  })

  it("sends Slack notification when team has slack configured", async () => {
    const selectChain = setupMockChain({
      data: { slack_bot_token: "xoxb-test", slack_channel_id: "C123" },
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "teams") return selectChain
      return setupMockChain()
    })

    await syncRepo(defaultParams)

    expect(createSlackClient).toHaveBeenCalledWith("xoxb-test")
  })

  it("does not fail if Slack notification errors", async () => {
    const mockPostMessage = vi.fn().mockRejectedValue(new Error("Slack API error"))
    vi.mocked(createSlackClient).mockReturnValue({
      chat: { postMessage: mockPostMessage },
    } as never)

    const selectChain = setupMockChain({
      data: { slack_bot_token: "xoxb-test", slack_channel_id: "C123" },
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "teams") return selectChain
      return setupMockChain()
    })

    const result = await syncRepo(defaultParams)
    expect(result.success).toBe(true)
  })

  it("marks repo as failed and rethrows on sync error", async () => {
    vi.mocked(fetchRepoIssues).mockRejectedValue(new Error("GitHub API down"))

    const updateChain = setupMockChain()
    mockFrom.mockReturnValue(updateChain)

    await expect(syncRepo(defaultParams)).rejects.toThrow("GitHub API down")
    // Should have called repos update with failed status
    expect(mockFrom).toHaveBeenCalledWith("repos")
  })
})
