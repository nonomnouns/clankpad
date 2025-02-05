import { NextRequest } from "next/server"

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID!

if (!IMGUR_CLIENT_ID) {
  throw new Error("Missing IMGUR_CLIENT_ID environment variable")
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get("image") as File

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 })
    }

    const imgurFormData = new FormData()
    imgurFormData.append("image", image)

    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: imgurFormData,
    })

    if (!response.ok) {
      throw new Error(`Imgur API error: ${response.statusText}`)
    }

    const data = await response.json()
    return Response.json({ success: true, url: data.data.link })
  } catch (error) {
    console.error("Failed to upload image:", error)
    return Response.json({ error: "Failed to upload image" }, { status: 500 })
  }
}