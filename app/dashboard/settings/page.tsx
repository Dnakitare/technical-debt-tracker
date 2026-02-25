"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function SettingsPage() {
  const [fullName, setFullName] = useState("")
  const [hourlyRate, setHourlyRate] = useState(100)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("users")
        .select("full_name, hourly_rate")
        .eq("id", user.id)
        .single()

      if (data) {
        setFullName(data.full_name ?? "")
        setHourlyRate(data.hourly_rate ?? 100)
      }
    }
    loadProfile()
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName, hourly_rate: hourlyRate })
      .eq("id", user.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Settings saved")
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your account settings and preferences
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="max-w-lg space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>

        <div>
          <label
            htmlFor="rate"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Default Hourly Rate (USD)
          </label>
          <input
            id="rate"
            type="number"
            min={0}
            max={10000}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Used to calculate the dollar cost of technical debt items.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  )
}
