"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"

interface PriorityBreakdownProps {
  critical: number
  high: number
  medium: number
  low: number
}

const COLORS = [
  { name: "Critical", color: "#dc2626" },
  { name: "High", color: "#f59e0b" },
  { name: "Medium", color: "#3b82f6" },
  { name: "Low", color: "#6b7280" },
]

export function PriorityBreakdownChart({
  critical,
  high,
  medium,
  low,
}: PriorityBreakdownProps) {
  const data = [
    { name: "Critical", value: critical },
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-zinc-500">
        No issues to display.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry) => {
            const colorEntry = COLORS.find((c) => c.name === entry.name)
            return (
              <Cell key={entry.name} fill={colorEntry?.color ?? "#6b7280"} />
            )
          })}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
