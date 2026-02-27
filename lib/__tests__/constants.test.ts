import { describe, it, expect } from "vitest"
import { PLANS, PLAN_FEATURES, DEFAULT_HOURLY_RATE, EXPORT_ENABLED_PLANS, canExport } from "../constants"
import type { PlanKey } from "../constants"

describe("PLANS", () => {
  it("contains all expected plan keys", () => {
    const keys = Object.keys(PLANS) as PlanKey[]
    expect(keys).toEqual(["free", "starter", "pro", "enterprise"])
  })

  it("free plan has correct limits", () => {
    expect(PLANS.free.price).toBe(0)
    expect(PLANS.free.maxRepos).toBe(1)
    expect(PLANS.free.maxMembers).toBe(1)
    expect(PLANS.free.stripePriceId).toBeNull()
  })

  it("starter plan has correct limits", () => {
    expect(PLANS.starter.price).toBe(19)
    expect(PLANS.starter.maxRepos).toBe(5)
    expect(PLANS.starter.maxMembers).toBe(5)
  })

  it("pro plan has correct limits", () => {
    expect(PLANS.pro.price).toBe(39)
    expect(PLANS.pro.maxRepos).toBe(25)
    expect(PLANS.pro.maxMembers).toBe(25)
  })

  it("enterprise plan has unlimited repos and members", () => {
    expect(PLANS.enterprise.price).toBe(99)
    expect(PLANS.enterprise.maxRepos).toBe(-1)
    expect(PLANS.enterprise.maxMembers).toBe(-1)
  })

  it("plan prices are ordered correctly", () => {
    expect(PLANS.free.price).toBeLessThan(PLANS.starter.price)
    expect(PLANS.starter.price).toBeLessThan(PLANS.pro.price)
    expect(PLANS.pro.price).toBeLessThan(PLANS.enterprise.price)
  })
})

describe("PLAN_FEATURES", () => {
  it("has features for every plan", () => {
    const planKeys = Object.keys(PLANS) as PlanKey[]
    for (const key of planKeys) {
      expect(PLAN_FEATURES[key]).toBeDefined()
      expect(PLAN_FEATURES[key].length).toBeGreaterThan(0)
    }
  })

  it("higher plans have more features", () => {
    expect(PLAN_FEATURES.starter.length).toBeGreaterThanOrEqual(
      PLAN_FEATURES.free.length
    )
    expect(PLAN_FEATURES.pro.length).toBeGreaterThanOrEqual(
      PLAN_FEATURES.starter.length
    )
    expect(PLAN_FEATURES.enterprise.length).toBeGreaterThanOrEqual(
      PLAN_FEATURES.pro.length
    )
  })
})

describe("DEFAULT_HOURLY_RATE", () => {
  it("is 100", () => {
    expect(DEFAULT_HOURLY_RATE).toBe(100)
  })
})

describe("canExport", () => {
  it("returns true for pro and enterprise", () => {
    expect(canExport("pro")).toBe(true)
    expect(canExport("enterprise")).toBe(true)
  })

  it("returns false for free and starter", () => {
    expect(canExport("free")).toBe(false)
    expect(canExport("starter")).toBe(false)
  })

  it("EXPORT_ENABLED_PLANS matches canExport behavior", () => {
    const planKeys: PlanKey[] = ["free", "starter", "pro", "enterprise"]
    for (const plan of planKeys) {
      expect(canExport(plan)).toBe(EXPORT_ENABLED_PLANS.includes(plan))
    }
  })
})
