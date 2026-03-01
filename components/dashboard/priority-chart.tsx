"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format, parseISO } from "date-fns"

interface PriorityData {
  snapshot_date: string
  critical_issues: number
  high_issues: number
  medium_issues: number
  low_issues: number
}

export function PriorityChart({ data }: { data: PriorityData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No priority data yet. Sync a repository to see breakdown.
      </div>
    )
  }

  const chartData = [...data]
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map((d) => ({
      date: format(parseISO(d.snapshot_date), "MMM d"),
      Critical: d.critical_issues,
      High: d.high_issues,
      Medium: d.medium_issues,
      Low: d.low_issues,
    }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} role="img" aria-label="Issue priority breakdown over time">
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="date" fontSize={12} stroke="#71717a" />
        <YAxis fontSize={12} stroke="#71717a" />
        <Tooltip />
        <Legend />
        <Bar dataKey="Critical" stackId="a" fill="#dc2626" />
        <Bar dataKey="High" stackId="a" fill="#f59e0b" />
        <Bar dataKey="Medium" stackId="a" fill="#3b82f6" />
        <Bar dataKey="Low" stackId="a" fill="#6b7280" />
      </BarChart>
    </ResponsiveContainer>
  )
}
