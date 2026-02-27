import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createHmac } from "crypto"
import { verifySlackSignature, buildDebtSummaryBlocks } from "@/lib/slack"

describe("verifySlackSignature", () => {
  const secret = "test-signing-secret"
  const body = "token=abc&command=%2Fdebtlens&text=status"

  function makeValidSignature(timestamp: string) {
    const sigBase = `v0:${timestamp}:${body}`
    return "v0=" + createHmac("sha256", secret).update(sigBase).digest("hex")
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns true for a valid signature within time window", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = makeValidSignature(timestamp)

    expect(verifySlackSignature(secret, signature, timestamp, body)).toBe(true)
  })

  it("returns false for an expired timestamp", () => {
    const sixMinutesAgo = (Math.floor(Date.now() / 1000) - 360).toString()
    const signature = makeValidSignature(sixMinutesAgo)

    expect(verifySlackSignature(secret, signature, sixMinutesAgo, body)).toBe(false)
  })

  it("returns false for an invalid signature", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()

    expect(verifySlackSignature(secret, "v0=invalid", timestamp, body)).toBe(false)
  })

  it("returns false for wrong secret", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = makeValidSignature(timestamp)

    expect(verifySlackSignature("wrong-secret", signature, timestamp, body)).toBe(false)
  })

  it("returns false for mismatched body", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = makeValidSignature(timestamp)

    expect(verifySlackSignature(secret, signature, timestamp, "different-body")).toBe(false)
  })

  it("returns false for signature with different length (timingSafeEqual throws)", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()

    expect(verifySlackSignature(secret, "v0=short", timestamp, body)).toBe(false)
  })
})

describe("buildDebtSummaryBlocks", () => {
  it("returns header and section blocks", () => {
    const summary = {
      totalCost: 15000,
      totalIssues: 42,
      criticalIssues: 5,
      repoCount: 3,
    }

    const blocks = buildDebtSummaryBlocks(summary)

    expect(blocks).toHaveLength(2)
    expect(blocks[0].type).toBe("header")
    expect(blocks[1].type).toBe("section")
  })

  it("includes formatted cost, issues, critical, and repo count", () => {
    const summary = {
      totalCost: 25000,
      totalIssues: 100,
      criticalIssues: 10,
      repoCount: 7,
    }

    const blocks = buildDebtSummaryBlocks(summary)
    const fields = (blocks[1] as { fields: { text: string }[] }).fields

    expect(fields[0].text).toContain("25,000")
    expect(fields[1].text).toContain("100")
    expect(fields[2].text).toContain("10")
    expect(fields[3].text).toContain("7")
  })

  it("handles zero values", () => {
    const summary = {
      totalCost: 0,
      totalIssues: 0,
      criticalIssues: 0,
      repoCount: 0,
    }

    const blocks = buildDebtSummaryBlocks(summary)
    const fields = (blocks[1] as { fields: { text: string }[] }).fields

    expect(fields[0].text).toContain("0")
    expect(fields[1].text).toContain("0")
  })
})
