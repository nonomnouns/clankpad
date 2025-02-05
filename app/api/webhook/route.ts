import { type NextRequest, NextResponse } from "next/server"
import { parseWebhookEvent, verifyAppKeyWithNeynar } from "@farcaster/frame-node"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()

    try {
      // Parse and validate the webhook event
      const data = await parseWebhookEvent(body, verifyAppKeyWithNeynar)

      switch (data.event.event) {
        case "frame_added":
          if (data.event.notificationDetails) {
            const { token, url } = data.event.notificationDetails
            // Store token in Supabase
            await supabase.from("notification_tokens").upsert({ fid: data.fid, token, url })

            // Send welcome notification
            await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                notificationId: `welcome:${data.fid}`,
                title: "Welcome to Clankpad! 👋",
                body: "Thanks for adding Clankpad. You will receive notifications for successful token creations and announcements.",
                targetUrl: process.env.NEXT_PUBLIC_URL!,
                tokens: [token],
              }),
            })
          }
          break

        case "frame_removed":
          // Remove token from Supabase
          await supabase.from("notification_tokens").delete().match({ fid: data.fid })
          break

        // Handle other events as needed
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      if (typeof error === "object" && error !== null && "name" in error && typeof error.name === "string" && error.name.startsWith("VerifyJsonFarcasterSignature.")) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 401 })
      }
      throw error
    }
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

