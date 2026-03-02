"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function RemoveMemberButton({
  teamId,
  userId,
  isOwner,
}: {
  teamId: string
  userId: string
  isOwner: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)
  const router = useRouter()

  async function handleRemove() {
    setRemoving(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Remove failed")
      }

      toast.success("Member removed")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remove failed")
    } finally {
      setRemoving(false)
      setConfirming(false)
    }
  }

  if (isOwner) {
    return (
      <span className="text-xs text-zinc-500">Owner</span>
    )
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleRemove}
          disabled={removing}
          aria-label="Confirm remove member"
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
        >
          {removing ? "Removing..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={removing}
          aria-label="Cancel remove"
          className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Remove team member"
      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
    >
      Remove
    </button>
  )
}
