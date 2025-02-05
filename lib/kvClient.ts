import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function testConnection() {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error("Redis connection error:", error)
    return false
  }
}

const LAST_SEEN_KEY = (fid: number) => `last_seen_announcement:${fid}`

export async function getLastSeenAnnouncementId(fid: number): Promise<number | null> {
  const id = await redis.get<number>(LAST_SEEN_KEY(fid))
  return id
}

export async function setLastSeenAnnouncementId(fid: number, announcementId: number) {
  await redis.set(LAST_SEEN_KEY(fid), announcementId)
}

export async function cacheNotificationToken(fid: number, token: string, url: string) {
  const key = `notification_token:${fid}`
  await redis.set(key, { token, url }, { ex: 60 * 60 * 24 })
}

export async function getCachedNotificationToken(fid: number) {
  const key = `notification_token:${fid}`
  return redis.get<{ token: string; url: string }>(key)
}

export async function removeCachedNotificationToken(fid: number): Promise<void> {
  const key = `notification_token:${fid}`
  await redis.del(key)
}

