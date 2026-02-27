import type { PlanKey } from "@/lib/constants"

export function canExport(plan: PlanKey): boolean {
  return plan === "pro" || plan === "enterprise"
}
