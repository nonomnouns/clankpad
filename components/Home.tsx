import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import sdk from "@farcaster/frame-sdk"

interface HomeProps {
  user: {
    fid: number
    username?: string
    displayName?: string
    pfpUrl?: string
  } | null
  setActiveTab: (tab: string) => void
}

interface Announcement {
  id: number
  title: string
  text: string
  castUrl?: string
}

const AnnouncementItem = ({ title, text, castUrl }: Announcement) => (
  <div className="py-2">
    <div className="flex justify-between items-start">
      <h3 className="font-bold text-lg">{title}</h3>
      {castUrl && (
        <button
          onClick={async () => {
            try {
              await sdk.actions.openUrl(castUrl)
            } catch (error) {
              console.error("Failed to open cast URL:", error)
            }
          }}
          className="flex items-center text-3xs font-mono gap-1 uppercase text-stone-500 hover:text-stone-700"
        >
          <div className="pt-0.5">View Cast</div>
          <ExternalLink className="h-3 w-3" />
        </button>
      )}
    </div>
    <p className="text-stone-600 mt-2 line-clamp-2">{text}</p>
    <div className="mt-3 border-b border-stone-200" />
  </div>
)

export default function Home({ user, setActiveTab }: HomeProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements")
        const data = await response.json()
        setAnnouncements(data)
      } catch (error) {
        console.error("Failed to fetch announcements:", error)
      }
    }
    fetchAnnouncements()
  }, [])

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.pfpUrl} />
              <AvatarFallback>{user?.displayName?.[0] || user?.username?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">Welcome, @{user?.username || "Clanker"}</h2>
              <p className="text-sm text-gray-600">FID: {user?.fid}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2">Create Your Token</h3>
          <p className="text-sm text-gray-600 mb-4">Start by creating your own custom token on Clankpad.</p>
          <Button className="w-full" onClick={() => setActiveTab("create")}>
            Create Token
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2">Token Status</h3>
          <p className="text-sm text-gray-600 mb-4">Check the status of your created tokens.</p>
          <Button variant="outline" className="w-full" onClick={() => setActiveTab("status")}>
            View Status
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h3 className="flex items-center justify-between font-mono uppercase text-xs sm:text-xs pb-2 gap-2">
            Announcements
            <div className="h-0.5 w-32 bg-stone-300" />
          </h3>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {announcements.map((announcement) => (
                <AnnouncementItem key={announcement.id} {...announcement} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

