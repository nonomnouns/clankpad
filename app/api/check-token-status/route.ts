import { type NextRequest, NextResponse } from "next/server"
import { checkTokenStatus, updateTokenStatus } from "@/lib/clankpad"

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY
const CLANKPAD_FID = 912361
const NEYNAR_V1_API = "https://hub-api.neynar.com/v1"

if (!NEYNAR_API_KEY) {
  throw new Error("Missing NEYNAR_API_KEY environment variable")
}

interface Cast {
  data: {
    castAddBody: {
      text: string
    }
    fid: number
    hash?: string
  }
}

interface Reply {
  author: { fid: number }
  text: string
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get("ticker")
  const fid = searchParams.get("fid")

  if (!ticker || !fid) {
    return NextResponse.json({ error: "Missing ticker or fid" }, { status: 400 })
  }

  try {
    // First check our database for existing status
    const currentStatus = await checkTokenStatus(ticker, parseInt(fid))
    
    // If we already have a final status, return it
    if (currentStatus.status === "success" || currentStatus.status === "failed") {
      return NextResponse.json(currentStatus)
    }

    // Get user's recent casts using v1 API directly
    const userCastsResponse = await fetch(
      `${NEYNAR_V1_API}/castsByFid?fid=${parseInt(fid)}&pageSize=10&reverse=true`,
      {
        headers: {
          accept: "application/json",
          "x-api-key": NEYNAR_API_KEY!,
        },
      }
    )
    const userCastsData = await userCastsResponse.json()

    // Find the token creation request cast
    const tokenRequestCast: Cast | undefined = userCastsData.messages.find((cast: Cast) => 
      cast.data.castAddBody.text.includes(`Hey @clankpad`) && 
      cast.data.castAddBody.text.includes(`Ticker: ${ticker}`)
    )

    if (!tokenRequestCast) {
      return NextResponse.json({ status: "pending" })
    }

    // Get conversation for the token request cast using v2 API
    const conversationResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/cast/conversation?identifier=${tokenRequestCast.data.hash}&type=hash&reply_depth=5`,
      {
        headers: {
          accept: "application/json",
          "x-api-key": NEYNAR_API_KEY!,
        },
      }
    )
    const conversationData = await conversationResponse.json()

    // Find Clankpad's response in the conversation
    const directReplies: Reply[] = conversationData.conversation.cast.direct_replies
    const clankpadResponse = directReplies.find(
      (reply) => reply.author.fid === CLANKPAD_FID
    )

    if (!clankpadResponse) {
      return NextResponse.json({ status: "pending" })
    }

    const responseText = clankpadResponse.text.toLowerCase()
    let status: "success" | "failed"
    const message = clankpadResponse.text
    
    // Check for success patterns
    if (
      responseText.includes("has been created") || 
      responseText.includes("has been added to the competition") ||
      responseText.includes("🎉")
    ) {
      status = "success"
      
      // Send success notification
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: parseInt(fid),
          notificationId: `token-created:${ticker}`,
          title: "Token Created Successfully! 🎉",
          body: `Your token ${ticker} has been created and added to the competition.`
        })
      })
    } else {
      status = "failed"
      
      // Send failure notification
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: parseInt(fid),
          notificationId: `token-failed:${ticker}`,
          title: "Token Creation Failed",
          body: `We couldn't create your token ${ticker}. ${message}`
        })
      })
    }

    // Update status in our database
    await updateTokenStatus(ticker, parseInt(fid), status, message)
    
    return NextResponse.json({ status, message })
  } catch (error) {
    console.error("Error checking token status:", error)
    return NextResponse.json({ error: "Failed to check token status" }, { status: 500 })
  }
}

