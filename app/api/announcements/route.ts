import type { NextRequest } from "next/server"
import { getAnnouncements, getLatestAnnouncement, removeNotificationToken } from "@/lib/supabaseClient"
import {
  getLastSeenAnnouncementId,
  setLastSeenAnnouncementId,
  getCachedNotificationToken,
  removeCachedNotificationToken,
} from "@/lib/kvClient"
import { z } from "zod"

const announcementRequestSchema = z.object({
  fid: z.number(),
})

async function removeInvalidToken(fid: number) {
  try {
    await Promise.all([removeNotificationToken(fid), removeCachedNotificationToken(fid)])
  } catch (error) {
    console.error("Failed to remove invalid token:", error)
  }
}

async function sendAnnouncementNotification(fid: number, announcement: { id: number; title: string; text: string }) {
  const cached = await getCachedNotificationToken(fid)
  if (!cached) return false

  const { token, url } = cached

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationId: `announcement:${announcement.id}`,
        title: announcement.title,
        body: announcement.text,
        targetUrl: process.env.NEXT_PUBLIC_URL!,
        tokens: [token],
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send announcement notification: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.result) {
      const { successfulTokens, invalidTokens, rateLimitedTokens } = result.result

      if (invalidTokens?.length > 0) {
        await Promise.all(invalidTokens.map(() => removeInvalidToken(fid)))
      }

      if (successfulTokens?.length > 0) {
        return true
      }

      if (rateLimitedTokens?.length > 0) {
        throw new Error("Rate limited")
      }
    }

    return false
  } catch (error: unknown) {
    console.error("Failed to send announcement notification:", error)
    if (error instanceof Error && error.message === "Rate limited") {
      throw error
    }
    return false
  }
}

export async function GET() {
  try {
    const announcements = await getAnnouncements()
    return Response.json(announcements)
  } catch (error: unknown) {
    console.error("Failed to get announcements:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = announcementRequestSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        {
          success: false,
          errors: result.error.errors,
        },
        { status: 400 },
      )
    }

    const { fid } = result.data

    const lastSeenId = await getLastSeenAnnouncementId(fid)
    const latestAnnouncement = await getLatestAnnouncement()

    if (!lastSeenId || lastSeenId < latestAnnouncement.id) {
      try {
        const success = await sendAnnouncementNotification(fid, latestAnnouncement)

        if (success) {
          await setLastSeenAnnouncementId(fid, latestAnnouncement.id)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Rate limited") {
          return Response.json(
            {
              success: false,
              error: "Rate limited. Please try again later.",
              lastSeenId,
              latestAnnouncement,
            },
            { status: 429 },
          )
        }
        throw error
      }
    }

    return Response.json({
      success: true,
      lastSeenId,
      latestAnnouncement,
    })
  } catch (error: unknown) {
    console.error("Failed to process announcement:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

