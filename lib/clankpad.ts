import { supabase } from "./supabaseClient"
import type { TokenData, TokenRequest, TokenStatus } from "./types"

export async function createToken(data: TokenData): Promise<TokenRequest> {
  // Store token request in Supabase
  const { data: tokenRequest, error } = await supabase
    .from("token_requests")
    .insert({
      ...data,
      status: "pending",
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  return tokenRequest
}

export async function checkTokenStatus(ticker: string, fid: number): Promise<TokenStatus> {
  // Get token request from Supabase
  const { data: tokenRequest, error } = await supabase
    .from("token_requests")
    .select()
    .match({ ticker, fid })
    .single()

  if (error) {
    throw error
  }

  if (!tokenRequest) {
    return { status: "pending" }
  }

  return {
    status: tokenRequest.status,
    message: tokenRequest.message
  }
}

export async function updateTokenStatus(
  ticker: string,
  fid: number,
  status: "success" | "failed",
  message?: string
): Promise<void> {
  const { error } = await supabase
    .from("token_requests")
    .update({ status, message, updated_at: new Date().toISOString() })
    .match({ ticker, fid })

  if (error) throw error
}

export async function deleteTokenRequest(ticker: string, fid: number): Promise<void> {
  const { error } = await supabase
    .from("token_requests")
    .delete()
    .match({ ticker, fid })

  if (error) throw error
}

