import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: repo, error } = await supabase
      .from("repos")
      .select("*")
      .eq("id", repoId)
      .single()

    if (error || !repo) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 })
    }

    return NextResponse.json(repo)
  } catch (error) {
    console.error("Repo fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("repos")
      .delete()
      .eq("id", repoId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Repo delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
