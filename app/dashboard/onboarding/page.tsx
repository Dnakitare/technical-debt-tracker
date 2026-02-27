"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, ArrowRight, ArrowLeft, Github, FolderGit2, RefreshCw, Rocket } from "lucide-react"

const STEPS = [
  { label: "Workspace", icon: FolderGit2 },
  { label: "GitHub", icon: Github },
  { label: "Repos", icon: FolderGit2 },
  { label: "Sync", icon: RefreshCw },
  { label: "Done", icon: Rocket },
]

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: string
  html_url: string
  default_branch: string
  language: string | null
  private: boolean
}

interface ConnectedRepo {
  id: string
  github_full_name: string
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Step 1: Workspace
  const [teamName, setTeamName] = useState("")
  const [teamId, setTeamId] = useState("")

  // Step 2: GitHub
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [githubToken, setGithubToken] = useState("")
  const [githubChecking, setGithubChecking] = useState(true)

  // Step 3: Repos
  const [availableRepos, setAvailableRepos] = useState<GitHubRepo[]>([])
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(new Set())
  const [connectedRepos, setConnectedRepos] = useState<ConnectedRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)

  // Step 4: Sync
  const [syncProgress, setSyncProgress] = useState<Record<string, "pending" | "syncing" | "done" | "error">>({})

  useEffect(() => {
    const controller = new AbortController()
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || controller.signal.aborted) return

      const { data: profile } = await supabase
        .from("users")
        .select("current_team_id")
        .eq("id", user.id)
        .single()

      if (controller.signal.aborted) return

      if (profile?.current_team_id) {
        setTeamId(profile.current_team_id)
        const { data: team } = await supabase
          .from("teams")
          .select("name")
          .eq("id", profile.current_team_id)
          .single()
        if (team && !controller.signal.aborted) setTeamName(team.name)
      }

      // Check GitHub
      try {
        const res = await fetch("/api/github/token", { signal: controller.signal })
        const data = await res.json()
        setGithubConnected(data.connected)
        setGithubUsername(data.github_username)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
      } finally {
        if (!controller.signal.aborted) setGithubChecking(false)
      }
    }
    init()
    return () => controller.abort()
  }, [supabase])

  async function handleUpdateTeamName() {
    if (!teamName.trim() || !teamId) return
    setLoading(true)
    const { error } = await supabase
      .from("teams")
      .update({ name: teamName.trim() })
      .eq("id", teamId)
    if (error) toast.error(error.message)
    else toast.success("Workspace name updated")
    setLoading(false)
  }

  async function handleConnectGithub(e: React.FormEvent) {
    e.preventDefault()
    if (!githubToken.trim()) return
    setLoading(true)

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
      setLoading(false)
    }
  }

  const fetchAvailableRepos = useCallback(async () => {
    setLoadingRepos(true)
    try {
      const res = await fetch("/api/github/repos")
      if (res.ok) {
        const data = await res.json()
        setAvailableRepos(data)
      }
    } catch {
      toast.error("Failed to fetch repos")
    } finally {
      setLoadingRepos(false)
    }
  }, [])

  useEffect(() => {
    if (step === 2 && githubConnected) {
      fetchAvailableRepos()
    }
  }, [step, githubConnected, fetchAvailableRepos])

  function toggleRepo(repoId: number) {
    setSelectedRepoIds((prev) => {
      const next = new Set(prev)
      if (next.has(repoId)) next.delete(repoId)
      else next.add(repoId)
      return next
    })
  }

  async function handleConnectRepos() {
    setLoading(true)
    const newlyConnected: ConnectedRepo[] = []

    for (const repo of availableRepos.filter((r) => selectedRepoIds.has(r.id))) {
      try {
        const res = await fetch("/api/repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            github_repo_id: repo.id,
            github_owner: repo.owner,
            github_name: repo.name,
            github_full_name: repo.full_name,
            github_url: repo.html_url,
            default_branch: repo.default_branch,
            is_private: repo.private,
            language: repo.language,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          newlyConnected.push({ id: data.id, github_full_name: repo.full_name })
        }
      } catch {
        toast.error(`Failed to connect ${repo.full_name}`)
      }
    }

    setConnectedRepos(newlyConnected)
    setLoading(false)
    toast.success(`Connected ${newlyConnected.length} repo(s)`)
  }

  async function handleSyncAll() {
    const progress: Record<string, "pending" | "syncing" | "done" | "error"> = {}
    for (const repo of connectedRepos) {
      progress[repo.id] = "pending"
    }
    setSyncProgress(progress)

    for (const repo of connectedRepos) {
      setSyncProgress((prev) => ({ ...prev, [repo.id]: "syncing" }))
      try {
        const res = await fetch(`/api/repos/${repo.id}/sync`, { method: "POST" })
        if (res.ok) {
          setSyncProgress((prev) => ({ ...prev, [repo.id]: "done" }))
        } else {
          setSyncProgress((prev) => ({ ...prev, [repo.id]: "error" }))
        }
      } catch {
        setSyncProgress((prev) => ({ ...prev, [repo.id]: "error" }))
      }
    }
  }

  useEffect(() => {
    if (step === 3 && connectedRepos.length > 0 && Object.keys(syncProgress).length === 0) {
      handleSyncAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  async function handleComplete() {
    setLoading(true)
    try {
      await fetch("/api/onboarding/complete", { method: "POST" })
      router.push("/dashboard")
    } catch {
      toast.error("Failed to complete onboarding")
    } finally {
      setLoading(false)
    }
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0: return !!teamName.trim()
      case 1: return githubConnected
      case 2: return selectedRepoIds.size > 0 || connectedRepos.length > 0
      case 3: return Object.values(syncProgress).every((s) => s === "done" || s === "error")
      default: return true
    }
  }

  async function handleNext() {
    if (step === 0 && teamName.trim()) {
      await handleUpdateTeamName()
    }
    if (step === 2 && connectedRepos.length === 0 && selectedRepoIds.size > 0) {
      await handleConnectRepos()
    }
    if (step === 4) {
      await handleComplete()
      return
    }
    setStep((s) => Math.min(s + 1, 4))
  }

  const allSyncsDone = Object.values(syncProgress).length > 0 &&
    Object.values(syncProgress).every((s) => s === "done" || s === "error")

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome to DebtLens
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Let&apos;s set up your workspace in a few steps.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i < step
                  ? "bg-blue-600 text-white"
                  : i === step
                    ? "border-2 border-blue-600 text-blue-600"
                    : "border-2 border-zinc-300 text-zinc-400 dark:border-zinc-700"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`hidden text-xs sm:inline ${i === step ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-400"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 ${i < step ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Name your workspace</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your team workspace organizes repos and members.
            </p>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Acme Engineering"
              className="mt-4 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Connect GitHub</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              We need access to your GitHub repos to analyze technical debt.
            </p>

            {githubChecking ? (
              <p className="mt-4 text-sm text-zinc-500">Checking connection...</p>
            ) : githubConnected ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Connected as {githubUsername}
                </span>
              </div>
            ) : (
              <form onSubmit={handleConnectGithub} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="onboarding-github-token" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Personal Access Token
                  </label>
                  <input
                    id="onboarding-github-token"
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Create a token at GitHub &rarr; Settings &rarr; Developer settings &rarr; Personal access tokens. Select the <strong>repo</strong> and <strong>read:user</strong> scopes.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !githubToken.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Connecting..." : "Connect GitHub"}
                </button>
              </form>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Select repositories</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Choose at least one repository to track.
            </p>

            {loadingRepos ? (
              <p className="mt-4 text-sm text-zinc-500">Loading repositories...</p>
            ) : (
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                {availableRepos.map((repo) => (
                  <label
                    key={repo.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRepoIds.has(repo.id)}
                      onChange={() => toggleRepo(repo.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{repo.full_name}</p>
                      {repo.language && (
                        <p className="text-xs text-zinc-500">{repo.language}</p>
                      )}
                    </div>
                    {repo.private && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        Private
                      </span>
                    )}
                  </label>
                ))}
                {availableRepos.length === 0 && (
                  <p className="text-sm text-zinc-500">No repositories found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Initial sync</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Analyzing your repositories for technical debt...
            </p>

            <div className="mt-4 space-y-3">
              {connectedRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <span className="text-sm text-zinc-900 dark:text-zinc-50">{repo.github_full_name}</span>
                  <span className={`text-xs font-medium ${
                    syncProgress[repo.id] === "done"
                      ? "text-green-600"
                      : syncProgress[repo.id] === "syncing"
                        ? "text-blue-600"
                        : syncProgress[repo.id] === "error"
                          ? "text-red-600"
                          : "text-zinc-400"
                  }`}>
                    {syncProgress[repo.id] === "done" && "Completed"}
                    {syncProgress[repo.id] === "syncing" && "Syncing..."}
                    {syncProgress[repo.id] === "error" && "Failed"}
                    {syncProgress[repo.id] === "pending" && "Pending"}
                  </span>
                </div>
              ))}
            </div>

            {allSyncsDone && (
              <p className="mt-4 text-sm text-green-600">All syncs completed!</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <Rocket className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">You&apos;re all set!</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your workspace is ready. You connected {connectedRepos.length} repo(s).
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canAdvance() || loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {step === 4 ? "Go to Dashboard" : "Next"}
          {step < 4 && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
