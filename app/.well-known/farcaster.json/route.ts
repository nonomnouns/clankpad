import { NextResponse } from "next/server"

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL

  const config = {
    accountAssociation: {
      header: 'eyJmaWQiOjE5NjY0OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGUzMTNGMDlDM2RkMzAzRjAzMzQ4QzA3N0NERjA2NEE5ZGY2MjI2NjIifQ',
      payload: "eyJkb21haW4iOiJjbGFuay5uYXRpdmUuY2VudGVyIn0",
      signature:
        "MHg5Y2Q1MGJlYzcxZWQ5NzM3MThlMzM1NmYxM2U3OTU3MjM0MzY0OGRlZGM5NWU3NTE3YzcwYTcxMjkzYjI5MDdmN2EwNzViMmJjOTA0YTUxMWZhZGQzMTkwMTY2OWRlZmIwMmE0NDMxYjhjN2VjNGI1Mjg3ODdmYWI1NTQ5YWMzNTFi",
    },
    frame: {
      version: "1",
      name: "Clankpad",
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#fafaf9",
      homeUrl: appUrl,
      webhookUrl: `${appUrl}/api/webhook`,
    },
  }

  return NextResponse.json(config)
}

