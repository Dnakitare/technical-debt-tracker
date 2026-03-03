"use client"

import { useState } from "react"
import { toast } from "sonner"

export function SubscriptionStatusBanner({
  status,
}: {
  status: string | null
}) {
  const [loading, setLoading] = useState(false)

  if (!status || status === "active" || status === "trialing") {
    return null
  }

  async function handleManageBilling() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error("Failed to open billing portal")
    } finally {
      setLoading(false)
    }
  }

  if (status === "past_due") {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Your payment is past due. Please update your payment method to avoid service interruption.
          </p>
          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="ml-4 shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Update Payment"}
          </button>
        </div>
      </div>
    )
  }

  if (status === "canceled") {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Your subscription has been canceled. You&apos;ll retain access until the end of your billing period.
        </p>
      </div>
    )
  }

  return null
}
