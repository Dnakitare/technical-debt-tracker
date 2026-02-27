"use client"

import { Download } from "lucide-react"
import type { PlanKey } from "@/lib/constants"
import { canExport } from "@/lib/plan-check-client"

export function ExportButton({
  repoId,
  plan,
}: {
  repoId?: string
  plan: PlanKey
}) {
  const enabled = canExport(plan)
  const href = repoId ? `/api/repos/${repoId}/export` : "/api/export"

  if (!enabled) {
    return (
      <div className="group relative">
        <button
          disabled
          className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-400 opacity-50 dark:border-zinc-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          Upgrade to Pro to export
        </div>
      </div>
    )
  }

  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </a>
  )
}
