import { type NextRequest } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { z } from "zod"

const tokenRequestSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  image: z.string().optional(),
  channel: z.string(),
  fid: z.number(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = tokenRequestSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        {
          success: false,
          errors: result.error.errors,
        },
        { status: 400 },
      )
    }

    // Store token request in Supabase
    const { error } = await supabase.from("token_requests").insert({
      ...result.data,
      status: "pending",
      created_at: new Date().toISOString(),
    })

    if (error) {
      throw error
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to save token request:", error)
    return Response.json({ error: "Failed to save token request" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { ticker, fid } = body

    if (!ticker || !fid) {
      return Response.json({ error: "Missing ticker or fid" }, { status: 400 })
    }

    // Delete token request from Supabase
    const { error } = await supabase
      .from("token_requests")
      .delete()
      .match({ ticker, fid })

    if (error) {
      throw error
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to delete token request:", error)
    return Response.json({ error: "Failed to delete token request" }, { status: 500 })
  }
} 