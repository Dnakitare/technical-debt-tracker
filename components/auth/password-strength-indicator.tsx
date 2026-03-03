"use client"

import { Check, X } from "lucide-react"

const REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
] as const

const BAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
]

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null

  const passed = REQUIREMENTS.filter((r) => r.test(password)).length

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {REQUIREMENTS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < passed ? BAR_COLORS[passed - 1] : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
      <ul className="space-y-1">
        {REQUIREMENTS.map((req) => {
          const met = req.test(password)
          return (
            <li
              key={req.label}
              className={`flex items-center gap-1.5 text-xs ${
                met
                  ? "text-green-600 dark:text-green-400"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
