import { Sidebar } from "@/components/layout/sidebar"
import { PaymentWarningBanner } from "@/components/billing/payment-warning-banner"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let showPaymentWarning = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("current_team_id")
        .eq("id", user.id)
        .single()

      if (profile?.current_team_id) {
        const { data: team } = await supabase
          .from("teams")
          .select("subscription_status")
          .eq("id", profile.current_team_id)
          .single()

        showPaymentWarning = team?.subscription_status === "past_due"
      }
    }
  } catch {
    // Silently handle — don't break the layout if this check fails
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          {showPaymentWarning && <PaymentWarningBanner />}
          {children}
        </div>
      </main>
    </div>
  )
}
