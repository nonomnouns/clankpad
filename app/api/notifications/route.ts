import type { NextRequest } from "next/server"
import { getNotificationTokens, removeNotificationToken } from "@/lib/supabaseClient"
import { getCachedNotificationToken, removeCachedNotificationToken } from "@/lib/kvClient"
import { z } from "zod"

const notificationSchema = z.object({
  fid: z.number(),
  title: z.string().max(32),
  body: z.string().max(128),
  notificationId: z.string().max(128),
})

async function removeInvalidToken(fid: number) {
  try {
    await Promise.all([removeNotificationToken(fid), removeCachedNotificationToken(fid)])
  } catch (error) {
    console.error("Failed to remove invalid token:", error)
  }
}

type NotificationData = {
  fid: number
  notificationId: string
  title: string
  body: string
  targetUrl: string
}

async function sendNotification(url: string, token: string, data: NotificationData, skipRateLimit = false) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        tokens: [token],
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.result) {
      const { successfulTokens, invalidTokens, rateLimitedTokens } = result.result

      if (invalidTokens?.length > 0) {
        await Promise.all(invalidTokens.map(() => removeInvalidToken(data.fid)))
      }

      if (successfulTokens?.length > 0) {
        return true
      }

      if (rateLimitedTokens?.length > 0 && !skipRateLimit) {
        throw new Error("Rate limited")
      }

      if (skipRateLimit && rateLimitedTokens?.length > 0) {
        return true
      }
    }

    return false
  } catch (error: unknown) {
    console.error("Failed to send notification:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const skipRateLimit = request.headers.get("X-Skip-Rate-Limit") === "true"
    const body = await request.json()
    const result = notificationSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        {
          success: false,
          errors: result.error.errors,
        },
        { status: 400 },
      )
    }

    const { fid, title, body: notifBody, notificationId } = result.data

    const cached = await getCachedNotificationToken(fid)
    if (cached) {
      const { token, url } = cached
      const success = await sendNotification(
        url,
        token,
        {
          fid,
          notificationId,
          title,
          body: notifBody,
          targetUrl: process.env.NEXT_PUBLIC_URL!,
        },
        skipRateLimit,
      )

      if (success) {
        return Response.json({ success: true })
      }
    }

    const tokens = await getNotificationTokens(fid)
    if (!tokens.length) {
      return new Response("No notification tokens found", { status: 404 })
    }

    const results = await Promise.allSettled(
      tokens.map(({ token, url }) =>
        sendNotification(
          url,
          token,
          {
            fid,
            notificationId,
            title,
            body: notifBody,
            targetUrl: process.env.NEXT_PUBLIC_URL!,
          },
          skipRateLimit,
        ),
      ),
    )

    const successful = results.some((result) => result.status === "fulfilled" && result.value === true)

    if (!successful) {
      throw new Error("All notification attempts failed")
    }

    return Response.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Rate limited" && !request.headers.get("X-Skip-Rate-Limit")) {
      return Response.json(
        {
          success: false,
          error: "Rate limited. Please try again later.",
        },
        { status: 429 },
      )
    }

    console.error("Failed to send notification:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

