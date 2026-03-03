"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const ROLES = ["admin", "member", "viewer"] as const

export function RoleSelector({
  teamId,
  userId,
  currentRole,
  isOwner,
  callerRole,
}: {
  teamId: string
  userId: string
  currentRole: string
  isOwner: boolean
  callerRole: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (isOwner) {
    return (
      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 capitalize dark:bg-zinc-800 dark:text-zinc-300">
        owner
      </span>
    )
  }

  async function handleChange(newRole: string) {
    if (newRole === currentRole) return
    setLoading(true)

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to update role")
      } else {
        toast.success(`Role updated to ${newRole}`)
        router.refresh()
      }
    } catch {
      toast.error("Failed to update role")
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={currentRole}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      aria-label={`Change role for member`}
      className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 capitalize disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    >
      {ROLES.map((role) => (
        <option
          key={role}
          value={role}
          disabled={callerRole === "admin" && role === "admin"}
        >
          {role}
        </option>
      ))}
    </select>
  )
}
