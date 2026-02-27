import { verifySlackSignature } from "@/lib/slack"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    // Handle URL verification challenge
    if (payload.type === "url_verification") {
      return NextResponse.json({ challenge: payload.challenge })
    }

    // Verify signature for all other events
    const timestamp = request.headers.get("x-slack-request-timestamp") ?? ""
    const signature = request.headers.get("x-slack-signature") ?? ""

    const signingSecret = process.env.SLACK_SIGNING_SECRET
    if (!signingSecret || !verifySlackSignature(signingSecret, signature, timestamp, body)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Acknowledge the event
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Slack event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
