"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

export function PaymentWarningBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
      <p className="text-sm font-medium text-red-800 dark:text-red-200">
        Payment failed &mdash; please{" "}
        <Link
          href="/dashboard/billing"
          className="underline hover:text-red-900 dark:hover:text-red-100"
        >
          update your billing information
        </Link>
        .
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss payment warning"
        className="ml-4 shrink-0 rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
