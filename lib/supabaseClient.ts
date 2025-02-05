import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type Announcement = {
  id: number
  title: string
  text: string
  created_at: string
  cast_url?: string
}

export type NotificationToken = {
  fid: number
  token: string
  url: string
  created_at: string
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getAnnouncements() {
  const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as Announcement[]
}

export async function getLatestAnnouncement() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) throw error
  return data as Announcement
}

export async function getLatestAnnouncements(limit = 5) {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Announcement[]
}

export async function saveNotificationToken(token: Omit<NotificationToken, "created_at">) {
  const { error } = await supabase
    .from("notification_tokens")
    .upsert([{ ...token, created_at: new Date().toISOString() }])

  if (error) throw error
}

export async function removeNotificationToken(fid: number) {
  const { error } = await supabase.from("notification_tokens").delete().eq("fid", fid)

  if (error) throw error
}

export async function getNotificationTokens(fid: number) {
  const { data, error } = await supabase.from("notification_tokens").select("*").eq("fid", fid)

  if (error) throw error
  return data as NotificationToken[]
}

