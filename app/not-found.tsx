import Link from "next/link"
import { BarChart3 } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            DebtLens
          </span>
        </div>
        <h1 className="text-7xl font-bold text-zinc-900 dark:text-zinc-50">
          404
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
