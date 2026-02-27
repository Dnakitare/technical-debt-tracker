"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

export default function SettingsPage() {
  const [fullName, setFullName] = useState("")
  const [hourlyRate, setHourlyRate] = useState(100)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()

  // GitHub connection state
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [githubToken, setGithubToken] = useState("")
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubChecking, setGithubChecking] = useState(true)

  // Slack connection state
  const [slackConnected, setSlackConnected] = useState(false)
  const [slackTeamId, setSlackTeamId] = useState<string | null>(null)
  const [slackChannelId, setSlackChannelId] = useState<string | null>(null)
  const [slackLoading, setSlackLoading] = useState(false)

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

  // Show Slack connection result from OAuth redirect
  useEffect(() => {
    const slackParam = searchParams.get("slack")
    if (slackParam === "connected") {
      toast.success("Slack connected successfully!")
    } else if (slackParam === "error") {
      toast.error("Failed to connect Slack")
    }
  }, [searchParams])

  // Check Slack connection
  useEffect(() => {
    async function checkSlack() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("users")
        .select("current_team_id")
        .eq("id", user.id)
        .single()

      if (profile?.current_team_id) {
        const { data: team } = await supabase
          .from("teams")
          .select("slack_team_id, slack_channel_id")
          .eq("id", profile.current_team_id)
          .single()

        if (team?.slack_team_id) {
          setSlackConnected(true)
          setSlackTeamId(team.slack_team_id)
          setSlackChannelId(team.slack_channel_id)
        }
      }
    }
    checkSlack()
  }, [supabase])

  useEffect(() => {
    async function checkGithub() {
      try {
        const res = await fetch("/api/github/token")
        const data = await res.json()
        setGithubConnected(data.connected)
        setGithubUsername(data.github_username)
      } catch {
        // ignore
      } finally {
        setGithubChecking(false)
      }
    }
    checkGithub()
  }, [])

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

  async function handleConnectGithub(e: React.FormEvent) {
    e.preventDefault()
    if (!githubToken.trim()) return
    setGithubLoading(true)

    try {
      const res = await fetch("/api/github/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: githubToken }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Failed to connect GitHub")
      } else {
        setGithubConnected(true)
        setGithubUsername(data.github_username)
        setGithubToken("")
        toast.success(`Connected as ${data.github_username}`)
      }
    } catch {
      toast.error("Failed to connect GitHub")
    } finally {
      setGithubLoading(false)
    }
  }

  async function handleDisconnectSlack() {
    setSlackLoading(true)
    try {
      const res = await fetch("/api/slack/connect", { method: "DELETE" })
      if (res.ok) {
        setSlackConnected(false)
        setSlackTeamId(null)
        setSlackChannelId(null)
        toast.success("Slack disconnected")
      } else {
        toast.error("Failed to disconnect Slack")
      }
    } catch {
      toast.error("Failed to disconnect Slack")
    } finally {
      setSlackLoading(false)
    }
  }

  async function handleDisconnectGithub() {
    setGithubLoading(true)
    try {
      const res = await fetch("/api/github/token", { method: "DELETE" })
      if (res.ok) {
        setGithubConnected(false)
        setGithubUsername(null)
        toast.success("GitHub disconnected")
      } else {
        toast.error("Failed to disconnect GitHub")
      }
    } catch {
      toast.error("Failed to disconnect GitHub")
    } finally {
      setGithubLoading(false)
    }
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

      {/* GitHub Connection */}
      <div className="mt-8 max-w-lg rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          GitHub Connection
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Connect your GitHub account to analyze repositories.
        </p>

        {githubChecking ? (
          <p className="mt-4 text-sm text-zinc-500">Checking connection...</p>
        ) : githubConnected ? (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Connected as {githubUsername}
              </span>
            </div>
            <button
              onClick={handleDisconnectGithub}
              disabled={githubLoading}
              className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              {githubLoading ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnectGithub} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="github-token"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Personal Access Token
              </label>
              <input
                id="github-token"
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Create a token at GitHub &rarr; Settings &rarr; Developer
                settings &rarr; Personal access tokens &rarr; Tokens (classic).
                Select the <strong>repo</strong> and <strong>read:user</strong>{" "}
                scopes.
              </p>
            </div>
            <button
              type="submit"
              disabled={githubLoading || !githubToken.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {githubLoading ? "Connecting..." : "Connect GitHub"}
            </button>
          </form>
        )}
      </div>

      {/* Slack Integration */}
      <div className="mt-8 max-w-lg rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Slack Integration
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Get notifications in Slack when repos are synced and use slash commands.
        </p>

        {slackConnected ? (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Connected to Slack workspace
              </span>
            </div>
            {slackTeamId && (
              <p className="mt-1 text-xs text-zinc-500">Team ID: {slackTeamId}</p>
            )}
            {slackChannelId && (
              <p className="text-xs text-zinc-500">Channel ID: {slackChannelId}</p>
            )}
            <button
              onClick={handleDisconnectSlack}
              disabled={slackLoading}
              className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              {slackLoading ? "Disconnecting..." : "Disconnect Slack"}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <a
              href="/api/slack/connect"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Connect Slack
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
