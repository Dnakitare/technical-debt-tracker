import * as Sentry from "@sentry/nextjs"
import { logger } from "./logger"

export function captureApiError(context: string, error: unknown): void {
  logger.error(context, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })

  const err = error instanceof Error ? error : new Error(String(error))
  Sentry.captureException(err, {
    tags: { context },
  })
}
