import Link from "next/link"
import { ArrowRight, BarChart3, GitBranch, DollarSign } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              DebtLens
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            Know the true cost of
            <br />
            <span className="text-blue-600">technical debt</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Connect your GitHub repos and get instant visibility into your
            technical debt. Track costs, prioritize fixes, and make data-driven
            engineering decisions.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <GitBranch className="mb-4 h-10 w-10 text-blue-600" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Git Integration
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Connect your GitHub repos with one click. We analyze issues,
                PRs, and code comments to find technical debt.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <DollarSign className="mb-4 h-10 w-10 text-green-600" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Cost Estimation
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Translate debt items into dollar amounts using configurable
                hourly rates and priority-based estimates.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <BarChart3 className="mb-4 h-10 w-10 text-purple-600" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Trend Dashboard
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Visualize debt over time, spot trends, and track progress as
                your team pays down debt sprint by sprint.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} DebtLens. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
