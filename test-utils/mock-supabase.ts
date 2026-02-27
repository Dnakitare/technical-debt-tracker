import { vi } from "vitest"

interface MockQueryResult {
  data: unknown
  error: null | { message: string }
  count?: number | null
}

function createChainableMock(result: MockQueryResult = { data: null, error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "order", "limit", "single", "maybeSingle",
  ]

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain)
  }

  // Terminal methods return the result
  chain.single = vi.fn().mockResolvedValue(result)
  chain.maybeSingle = vi.fn().mockResolvedValue(result)

  // For non-terminal select with head: true (count queries)
  const originalSelect = chain.select
  chain.select = vi.fn().mockImplementation((_cols?: string, opts?: { count?: string; head?: boolean }) => {
    if (opts?.head) {
      return { ...chain, then: (resolve: (val: { count: number | null }) => void) => resolve({ count: result.count ?? 0 }) }
    }
    return originalSelect()
  })

  // Make the chain thenable (for queries without .single())
  Object.defineProperty(chain, "then", {
    value: (resolve: (val: MockQueryResult) => void) => resolve(result),
    configurable: true,
  })

  return chain
}

export function createMockSupabase(overrides?: {
  user?: { id: string; email?: string } | null
  queryResults?: Record<string, MockQueryResult>
}) {
  const defaultUser = overrides?.user === null ? null : (overrides?.user ?? { id: "user-1", email: "test@example.com" })
  const queryResults = overrides?.queryResults ?? {}

  const fromMock = vi.fn().mockImplementation((table: string) => {
    const result = queryResults[table] ?? { data: null, error: null }
    return createChainableMock(result)
  })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: defaultUser },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: fromMock,
  }
}
