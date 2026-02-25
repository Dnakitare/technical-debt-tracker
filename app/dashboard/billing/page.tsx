import { createClient } from "@/lib/supabase/server"
import { PLANS } from "@/lib/constants"
import { PricingCards } from "@/components/billing/pricing-cards"

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("current_team_id, stripe_customer_id")
    .eq("id", user!.id)
    .single()

  const { data: team } = profile?.current_team_id
    ? await supabase
        .from("teams")
        .select("*")
        .eq("id", profile.current_team_id)
        .single()
    : { data: null }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Billing
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your subscription and billing details
        </p>
      </div>

      {team && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Current Plan
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 capitalize">
              {team.plan}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {team.max_repos === -1
                ? "Unlimited repos"
                : `${team.max_repos} repos`}{" "}
              &middot;{" "}
              {team.max_members === -1
                ? "Unlimited members"
                : `${team.max_members} members`}
            </span>
          </div>
        </div>
      )}

      <PricingCards
        currentPlan={team?.plan ?? "free"}
        teamId={team?.id ?? ""}
      />
    </div>
  )
}
