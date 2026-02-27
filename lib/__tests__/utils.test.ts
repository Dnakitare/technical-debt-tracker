import { describe, it, expect, vi, afterEach } from "vitest"
import { cn, formatCurrency, formatNumber, formatRelativeTime } from "../utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("resolves tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra")
  })

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("")
  })
})

describe("formatCurrency", () => {
  it("formats whole numbers", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00")
  })

  it("formats decimals", () => {
    expect(formatCurrency(99.5)).toBe("$99.50")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })
})

describe("formatNumber", () => {
  it("formats with commas", () => {
    expect(formatNumber(1234567)).toBe("1,234,567")
  })

  it("formats small numbers without commas", () => {
    expect(formatNumber(42)).toBe("42")
  })
})

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns relative time string", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"))

    const result = formatRelativeTime("2025-01-14T12:00:00Z")
    expect(result).toContain("ago")
  })

  it("handles recent dates", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"))

    const result = formatRelativeTime("2025-01-15T11:00:00Z")
    expect(result).toContain("ago")
  })
})
