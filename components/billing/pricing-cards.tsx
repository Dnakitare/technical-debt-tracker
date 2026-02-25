"use client"

import { useState } from "react"
import { PLANS, PLAN_FEATURES, type PlanKey } from "@/lib/constants"
import { Check } from "lucide-react"
import { toast } from "sonner"

export function PricingCards({
  currentPlan,
  teamId,
}: {
  currentPlan: string
  teamId: string
}) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSubscribe(planKey: PlanKey) {
    const plan = PLANS[planKey]
    if (!plan.stripePriceId) return

    setLoading(planKey)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.stripePriceId, teamId }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Failed to create checkout session")
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      )
    } finally {
      setLoading(null)
    }
  }

  async function handleManageBilling() {
    setLoading("manage")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error("Failed to open billing portal")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(
        ([key, plan]) => {
          const isCurrent = currentPlan === key
          return (
            <div
              key={key}
              className={`rounded-xl border p-6 ${
                key === "pro"
                  ? "border-blue-600 ring-2 ring-blue-600"
                  : "border-zinc-200 dark:border-zinc-800"
              } bg-white dark:bg-zinc-900`}
            >
              {key === "pro" && (
                <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {plan.name}
              </h3>
              <p className="mt-2">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-zinc-500">/mo</span>
                )}
              </p>
              <ul className="mt-6 space-y-3">
                {PLAN_FEATURES[key].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <button
                    onClick={handleManageBilling}
                    disabled={loading === "manage"}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    {loading === "manage" ? "Loading..." : "Manage Plan"}
                  </button>
                ) : key === "free" ? null : (
                  <button
                    onClick={() => handleSubscribe(key)}
                    disabled={loading === key}
                    className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                      key === "pro"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    }`}
                  >
                    {loading === key ? "Loading..." : "Upgrade"}
                  </button>
                )}
              </div>
            </div>
          )
        }
      )}
    </div>
  )
}
