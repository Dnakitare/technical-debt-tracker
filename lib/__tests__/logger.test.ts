import { describe, it, expect, vi, beforeEach } from "vitest"
import { logger } from "../logger"

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("logger", () => {
  it("logs info messages to console.log", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.info("test message")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain("INFO")
    expect(spy.mock.calls[0][0]).toContain("test message")
  })

  it("logs error messages to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    logger.error("error message")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain("ERROR")
    expect(spy.mock.calls[0][0]).toContain("error message")
  })

  it("logs warn messages to console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
    logger.warn("warning message")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain("WARN")
    expect(spy.mock.calls[0][0]).toContain("warning message")
  })

  it("includes context in output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.info("test", { userId: "123", action: "login" })
    expect(spy).toHaveBeenCalledTimes(1)
    const output = spy.mock.calls[0][0]
    expect(output).toContain("userId")
    expect(output).toContain("123")
  })

  it("includes timestamp in output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.info("test")
    const output = spy.mock.calls[0][0]
    // Should contain ISO timestamp pattern
    expect(output).toMatch(/\d{4}-\d{2}-\d{2}T/)
  })

  it("outputs JSON in production mode", () => {
    const originalEnv = process.env.NODE_ENV
    ;(process.env as Record<string, string>).NODE_ENV = "production"

    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.info("prod message", { key: "value" })

    const output = spy.mock.calls[0][0]
    const parsed = JSON.parse(output)
    expect(parsed.level).toBe("info")
    expect(parsed.message).toBe("prod message")
    expect(parsed.key).toBe("value")
    expect(parsed.timestamp).toBeDefined()

    ;(process.env as Record<string, string>).NODE_ENV = originalEnv!
  })

  it("skips debug in production mode", () => {
    const originalEnv = process.env.NODE_ENV
    ;(process.env as Record<string, string>).NODE_ENV = "production"

    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.debug("debug message")
    expect(spy).not.toHaveBeenCalled()

    ;(process.env as Record<string, string>).NODE_ENV = originalEnv!
  })
})
