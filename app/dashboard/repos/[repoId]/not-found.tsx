import Link from "next/link"
import { GitBranch, ArrowLeft } from "lucide-react"

export default function RepoNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <GitBranch className="mx-auto h-12 w-12 text-zinc-400" />
        <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Repository not found
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This repository may have been removed or you don&apos;t have access.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/repos"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Repositories
          </Link>
        </div>
      </div>
    </div>
  )
}
