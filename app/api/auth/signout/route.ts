import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"

async function handlePOST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL!))
}

export const POST = withRateLimit(handlePOST, "auth")
