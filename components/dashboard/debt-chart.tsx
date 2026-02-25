"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format, parseISO } from "date-fns"

interface DebtMetric {
  snapshot_date: string
  estimated_cost_usd: number
  total_issues: number
}

export function DebtChart({ metrics }: { metrics: DebtMetric[] }) {
  if (metrics.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No data yet. Sync a repository to see trends.
      </div>
    )
  }

  const chartData = [...metrics]
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map((m) => ({
      date: format(parseISO(m.snapshot_date), "MMM d"),
      cost: m.estimated_cost_usd,
      issues: m.total_issues,
    }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="date" fontSize={12} stroke="#71717a" />
        <YAxis
          fontSize={12}
          stroke="#71717a"
          tickFormatter={(v) => `$${v.toLocaleString()}`}
        />
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString()}`, "Cost"]}
        />
        <Line
          type="monotone"
          dataKey="cost"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
