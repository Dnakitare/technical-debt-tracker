"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Lock, Globe, Star } from "lucide-react"
import { toast } from "sonner"

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: string
  description: string | null
  html_url: string
  default_branch: string
  language: string | null
  stargazers_count: number
  private: boolean
}

interface ConnectedRepo {
  github_repo_id: number
}

export default function ConnectRepoPage() {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [connectedIds, setConnectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [connecting, setConnecting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const [reposResult, connectedResult] = await Promise.allSettled([
          fetch("/api/github/repos", { signal: controller.signal }),
          fetch("/api/repos", { signal: controller.signal }),
        ])

        if (reposResult.status === "rejected" || !reposResult.value.ok) {
          if (reposResult.status === "fulfilled") {
            const data = await reposResult.value.json()
            setError(data.error ?? "Failed to fetch GitHub repos")
          } else {
            setError("Failed to fetch GitHub repos")
          }
          return
        }

        const reposData: GitHubRepo[] = await reposResult.value.json()
        setRepos(reposData)

        if (connectedResult.status === "fulfilled" && connectedResult.value.ok) {
          const connectedData: ConnectedRepo[] = await connectedResult.value.json()
          setConnectedIds(
            new Set(connectedData.map((r) => r.github_repo_id))
          )
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError("Failed to load repositories")
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  const filtered = repos.filter(
    (repo) =>
      repo.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description?.toLowerCase().includes(search.toLowerCase()) ??
        false)
  )

  async function handleConnect(repo: GitHubRepo) {
    setConnecting(repo.id)
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

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to connect repo")
      } else {
        setConnectedIds((prev) => new Set([...prev, repo.id]))
        toast.success(`Connected ${repo.full_name}`)
        router.refresh()
      }
    } catch {
      toast.error("Failed to connect repo")
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/repos"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Repositories
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Connect a Repository
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Select a GitHub repository to start tracking technical debt.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-500" aria-live="polite">
          Loading repositories...
        </div>
      ) : error ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
          <p className="mt-2 text-sm text-zinc-500">
            Make sure you&apos;ve connected your GitHub account in{" "}
            <Link
              href="/dashboard/settings"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Settings
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories..."
              aria-label="Search repositories"
              className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No repositories found.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((repo) => {
                const isConnected = connectedIds.has(repo.id)
                return (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {repo.private ? (
                          <Lock className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                        ) : (
                          <Globe className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                        )}
                        <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                          {repo.full_name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                        {repo.language && <span>{repo.language}</span>}
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stargazers_count}
                        </span>
                      </div>
                      {repo.description && (
                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleConnect(repo)}
                      disabled={isConnected || connecting === repo.id}
                      className={`ml-4 flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${
                        isConnected
                          ? "cursor-default border border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
                          : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      }`}
                    >
                      {isConnected
                        ? "Connected"
                        : connecting === repo.id
                          ? "Connecting..."
                          : "Connect"}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
