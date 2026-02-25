"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format, parseISO } from "date-fns"

interface MetricSnapshot {
  snapshot_date: string
  estimated_cost_usd: number
  total_issues: number
}

export function RepoTrendChart({ metrics }: { metrics: MetricSnapshot[] }) {
  if (metrics.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-zinc-500">
        No trend data yet.
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
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="date" fontSize={12} stroke="#71717a" />
        <YAxis
          yAxisId="left"
          fontSize={12}
          stroke="#2563eb"
          tickFormatter={(v) => `$${v.toLocaleString()}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          fontSize={12}
          stroke="#f59e0b"
        />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="cost"
          name="Cost ($)"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="issues"
          name="Issues"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
