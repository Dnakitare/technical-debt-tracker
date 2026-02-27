"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function SyncButton({ repoId }: { repoId: string }) {
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch(`/api/repos/${repoId}/sync`, { method: "POST" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Sync failed")
      }
      toast.success("Repository synced successfully")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      aria-label={syncing ? "Syncing repository" : "Sync repository"}
      className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync"}
    </button>
  )
}
