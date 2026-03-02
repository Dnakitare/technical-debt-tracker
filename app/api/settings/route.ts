import { createClient } from "@/lib/supabase/server"
import { updateSettingsSchema } from "@/lib/validators"
import { NextResponse } from "next/server"
import { withRateLimit } from "@/lib/with-rate-limit"
import { captureApiError } from "@/lib/api-error"

async function handlePATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const update: Record<string, unknown> = {}
    if (parsed.data.fullName !== undefined) {
      update.full_name = parsed.data.fullName
    }
    if (parsed.data.hourlyRate !== undefined) {
      update.hourly_rate = parsed.data.hourlyRate
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("users")
      .update(update)
      .eq("id", user.id)
      .select("full_name, hourly_rate")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    captureApiError("Settings update error", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const PATCH = withRateLimit(handlePATCH, "api")
