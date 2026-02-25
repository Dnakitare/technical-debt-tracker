import Link from "next/link"
import { BarChart3 } from "lucide-react"

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-zinc-400" />
        <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Not found
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist in the dashboard.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
