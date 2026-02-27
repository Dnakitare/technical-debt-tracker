import { describe, it, expect } from "vitest"
import {
  classifyPriority,
  estimateHours,
  calculateDebtCost,
  type DebtItem,
} from "../debt-engine"

describe("classifyPriority", () => {
  it("maps 'critical' label to critical", () => {
    expect(classifyPriority(["critical"])).toBe("critical")
  })

  it("maps 'urgent' label to critical", () => {
    expect(classifyPriority(["urgent"])).toBe("critical")
  })

  it("maps 'p0' label to critical", () => {
    expect(classifyPriority(["p0"])).toBe("critical")
  })

  it("maps 'high' label to high", () => {
    expect(classifyPriority(["high"])).toBe("high")
  })

  it("maps 'p1' label to high", () => {
    expect(classifyPriority(["p1"])).toBe("high")
  })

  it("maps 'medium' label to medium", () => {
    expect(classifyPriority(["medium"])).toBe("medium")
  })

  it("maps 'p2' label to medium", () => {
    expect(classifyPriority(["p2"])).toBe("medium")
  })

  it("maps 'low' label to low", () => {
    expect(classifyPriority(["low"])).toBe("low")
  })

  it("maps 'p3' label to low", () => {
    expect(classifyPriority(["p3"])).toBe("low")
  })

  it("is case insensitive", () => {
    expect(classifyPriority(["CRITICAL"])).toBe("critical")
    expect(classifyPriority(["High"])).toBe("high")
    expect(classifyPriority(["LOW"])).toBe("low")
  })

  it("trims whitespace", () => {
    expect(classifyPriority(["  critical  "])).toBe("critical")
  })

  it("returns first matching label", () => {
    expect(classifyPriority(["low", "critical"])).toBe("low")
  })

  it("defaults to medium for unknown labels", () => {
    expect(classifyPriority(["bug", "enhancement"])).toBe("medium")
  })

  it("defaults to medium for empty labels", () => {
    expect(classifyPriority([])).toBe("medium")
  })
})

describe("estimateHours", () => {
  it("returns 16 for critical", () => {
    expect(estimateHours("critical")).toBe(16)
  })

  it("returns 8 for high", () => {
    expect(estimateHours("high")).toBe(8)
  })

  it("returns 4 for medium", () => {
    expect(estimateHours("medium")).toBe(4)
  })

  it("returns 2 for low", () => {
    expect(estimateHours("low")).toBe(2)
  })
})

describe("calculateDebtCost", () => {
  it("returns zeroed summary for empty array", () => {
    const result = calculateDebtCost([])
    expect(result.totalIssues).toBe(0)
    expect(result.criticalIssues).toBe(0)
    expect(result.highIssues).toBe(0)
    expect(result.mediumIssues).toBe(0)
    expect(result.lowIssues).toBe(0)
    expect(result.estimatedHours).toBe(0)
    expect(result.estimatedCostUsd).toBe(0)
  })

  it("counts issues by priority correctly", () => {
    const items: DebtItem[] = [
      { title: "a", labels: [], createdAt: "", priority: "critical", estimatedHours: 16 },
      { title: "b", labels: [], createdAt: "", priority: "critical", estimatedHours: 16 },
      { title: "c", labels: [], createdAt: "", priority: "high", estimatedHours: 8 },
      { title: "d", labels: [], createdAt: "", priority: "medium", estimatedHours: 4 },
      { title: "e", labels: [], createdAt: "", priority: "low", estimatedHours: 2 },
    ]
    const result = calculateDebtCost(items)
    expect(result.totalIssues).toBe(5)
    expect(result.criticalIssues).toBe(2)
    expect(result.highIssues).toBe(1)
    expect(result.mediumIssues).toBe(1)
    expect(result.lowIssues).toBe(1)
    expect(result.estimatedHours).toBe(46)
    expect(result.estimatedCostUsd).toBe(4600) // 46 * 100 default rate
  })

  it("uses custom hourly rate", () => {
    const items: DebtItem[] = [
      { title: "a", labels: [], createdAt: "", priority: "medium", estimatedHours: 4 },
    ]
    const result = calculateDebtCost(items, 200)
    expect(result.estimatedCostUsd).toBe(800)
  })

  it("preserves default fields", () => {
    const result = calculateDebtCost([])
    expect(result.todoCount).toBe(0)
    expect(result.avgPrAgeDays).toBeNull()
    expect(result.staleBranches).toBe(0)
    expect(result.issuesOpened).toBe(0)
    expect(result.issuesClosed).toBe(0)
  })
})
