"use client"

import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        className="flex min-h-screen items-center justify-center bg-zinc-50"
      >
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">
            Something went wrong
          </h1>
          {error.digest && (
            <p className="mt-2 text-sm text-zinc-500">
              Error ID: {error.digest}
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={reset}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try again
            </button>
            <a
              href="/"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
