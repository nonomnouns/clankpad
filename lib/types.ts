export interface TokenData {
  ticker: string
  name: string
  image?: string
  channel: string
  fid?: number
}

export type TokenCreationState = "idle" | "loading" | "success" | "error"

export interface NotificationToken {
  fid: number
  token: string
  url: string
  created_at: string
}

export interface TokenRequest {
  ticker: string
  name: string
  image?: string
  channel: string
  fid: number
  status: "pending" | "success" | "failed"
  created_at: string
  message?: string
}

export interface TokenStatus {
  status: "pending" | "success" | "failed"
  message?: string
}

export interface FrameNotificationDetails {
  url: string
  token: string
}

export interface WebhookEvent {
  event: "frame_added" | "frame_removed" | "notifications_enabled" | "notifications_disabled"
  fid: number
  notificationDetails?: FrameNotificationDetails
} 