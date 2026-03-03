import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase } from "@/test-utils/mock-supabase"

const mockSupabase = createMockSupabase()
const mockAdminClient = createMockSupabase()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    ...mockAdminClient,
    auth: {
      ...mockAdminClient.auth,
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
    },
  }),
}))

const mockStripeCancelSub = vi.fn().mockResolvedValue({})
const mockStripeListSubs = vi.fn().mockResolvedValue({ data: [] })

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn().mockReturnValue({
    subscriptions: {
      cancel: (...args: unknown[]) => mockStripeCancelSub(...args),
      list: (...args: unknown[]) => mockStripeListSubs(...args),
    },
  }),
}))

const { DELETE } = await import("@/app/api/account/route")

beforeEach(() => {
  vi.clearAllMocks()
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  })
})

describe("DELETE /api/account", () => {
  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const res = await DELETE(
      new Request("http://localhost/api/account", { method: "DELETE" })
    )
    expect(res.status).toBe(401)
  })

  it("deletes user and returns success", async () => {
    let adminCallCount = 0
    mockAdminClient.from.mockImplementation(() => {
      adminCallCount++
      if (adminCallCount === 1) {
        // profile query (stripe_customer_id)
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: null },
            error: null,
          }),
        }
      }
      if (adminCallCount === 2) {
        // owned teams query
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: (resolve: (val: unknown) => void) => resolve({ data: [], error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    const res = await DELETE(
      new Request("http://localhost/api/account", { method: "DELETE" })
    )
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it("cancels Stripe subscriptions for owned teams", async () => {
    let adminCallCount = 0
    mockAdminClient.from.mockImplementation(() => {
      adminCallCount++
      if (adminCallCount === 1) {
        // profile query
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: "cus_123" },
            error: null,
          }),
        }
      }
      if (adminCallCount === 2) {
        // owned teams query
        const chain: Record<string, unknown> = {}
        chain.select = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: unknown) => void) =>
            resolve({ data: [{ team_id: "team-1" }], error: null }),
          configurable: true,
        })
        return chain
      }
      if (adminCallCount === 3) {
        // team stripe_subscription_id query
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { stripe_subscription_id: "sub_abc" },
            error: null,
          }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    const res = await DELETE(
      new Request("http://localhost/api/account", { method: "DELETE" })
    )
    expect(res.status).toBe(200)
    expect(mockStripeCancelSub).toHaveBeenCalledWith("sub_abc")
  })
})
