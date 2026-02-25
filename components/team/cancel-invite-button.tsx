"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CancelInviteButton({
  teamId,
  inviteId,
}: {
  teamId: string
  inviteId: string
}) {
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Cancel failed")
      }

      toast.success("Invite cancelled")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cancel failed")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={cancelling}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
    >
      <X className="h-3 w-3" />
      {cancelling ? "Cancelling..." : "Cancel"}
    </button>
  )
}
