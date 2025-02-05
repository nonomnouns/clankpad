import type { Metadata } from "next"
import App from "./app"

const appUrl = process.env.NEXT_PUBLIC_URL

const frame = {
  version: "next",
  imageUrl: `${appUrl}/opengraph-image`,
  button: {
    title: "Launch Clankpad",
    action: {
      type: "launch_frame",
      name: "Clankpad Frame",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
}

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Clankpad Frame",
    description: "Launch your Clanker token with Clankpad",
    openGraph: {
      title: "Clankpad Frame",
      description: "Launch your Clanker token with Clankpad",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}

