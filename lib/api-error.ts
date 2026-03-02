import * as Sentry from "@sentry/nextjs"

export function captureApiError(context: string, error: unknown): void {
  console.error(`${context}:`, error)

  const err = error instanceof Error ? error : new Error(String(error))
  Sentry.captureException(err, {
    tags: { context },
  })
}
