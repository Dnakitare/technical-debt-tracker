import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PasswordStrengthIndicator } from "../password-strength-indicator"

describe("PasswordStrengthIndicator", () => {
  it("renders nothing when password is empty", () => {
    const { container } = render(<PasswordStrengthIndicator password="" />)
    expect(container.innerHTML).toBe("")
  })

  it("shows all four requirement labels", () => {
    render(<PasswordStrengthIndicator password="a" />)

    expect(screen.getByText("At least 8 characters")).toBeInTheDocument()
    expect(screen.getByText("Uppercase letter")).toBeInTheDocument()
    expect(screen.getByText("Lowercase letter")).toBeInTheDocument()
    expect(screen.getByText("Number")).toBeInTheDocument()
  })

  it("renders four strength bar segments", () => {
    const { container } = render(<PasswordStrengthIndicator password="a" />)
    const bars = container.querySelectorAll(".h-1\\.5.flex-1.rounded-full")
    expect(bars).toHaveLength(4)
  })

  it("shows green bars for all requirements with strong password", () => {
    const { container } = render(<PasswordStrengthIndicator password="StrongP1" />)
    const greenBars = container.querySelectorAll(".bg-green-500")
    expect(greenBars).toHaveLength(4)
  })

  it("shows red bar for single requirement met", () => {
    const { container } = render(<PasswordStrengthIndicator password="a" />)
    // Only lowercase is met, so 1 red bar
    const coloredBars = container.querySelectorAll(".bg-red-500")
    expect(coloredBars).toHaveLength(1)
  })

  it("uses check icon for met requirements", () => {
    const { container } = render(<PasswordStrengthIndicator password="StrongP1" />)
    const checkIcons = container.querySelectorAll(".lucide-check")
    expect(checkIcons.length).toBeGreaterThan(0)
  })

  it("uses x icon for unmet requirements", () => {
    const { container } = render(<PasswordStrengthIndicator password="a" />)
    const xIcons = container.querySelectorAll(".lucide-x")
    expect(xIcons.length).toBeGreaterThan(0)
  })
})
