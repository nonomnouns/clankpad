import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import sdk from "@farcaster/frame-sdk"
import Image from "next/image"
import type { TokenData, TokenCreationState } from "@/lib/types"

interface TokenCreationTabProps {
  user: {
    fid: number
  } | null
  onSubmit: (data: TokenData) => void
  tokenCreationState: TokenCreationState
}

export default function TokenCreationTab({ user, onSubmit, tokenCreationState }: TokenCreationTabProps) {
  const [ticker, setTicker] = useState("")
  const [name, setName] = useState("")
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [channel, setChannel] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const response = await fetch("/api/image-handler", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Failed to upload image")
      const data = await response.json()
      setImageUrl(data.url)
      toast({
        title: "Image uploaded successfully",
        description: "Your token image has been uploaded.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.fid) {
      toast({
        title: "Error",
        description: "User FID not found. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    const tokenData: TokenData = {
      ticker,
      name,
      image: imageUrl,
      channel,
      fid: user.fid,
    }

    // Save token data first
    onSubmit(tokenData)

    // Compose the cast text
    const castText = `Hey @clankpad, please create a new Clanker token:
Ticker: ${ticker}
Name: ${name}
Channel: ${channel}
#ClankpadTokenCreation`

    // Create the compose URL with channel and embeds
    const composeUrl = new URL("https://warpcast.com/~/compose")
    composeUrl.searchParams.set("text", castText)
    if (channel) {
      composeUrl.searchParams.set("channelKey", channel)
    }
    if (imageUrl) {
      composeUrl.searchParams.append("embeds[]", imageUrl)
    }

    // Open the compose URL in Warpcast
    await sdk.actions.openUrl(composeUrl.toString())
  }

  return (
    <div className="flex-1 overflow-auto p-4 pb-20">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ticker">Ticker Symbol</Label>
          <Input
            id="ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            required
            maxLength={10}
            placeholder="CLNK"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Token Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Clanker Token"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-upload">Token Image</Label>
          {imageUrl ? (
            <div className="relative w-32 h-32">
              <Image
                src={imageUrl}
                alt="Token"
                width={128}
                height={128}
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                title="Remove image"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload size={24} className="text-gray-400" />
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  aria-label="Upload token image"
                />
              </label>
            </div>
          )}
          {isUploading && <p className="text-sm text-gray-500">Uploading image...</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="channel">Channel</Label>
          <Input
            id="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            required
            placeholder="Enter channel (e.g., general, memes)"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
          disabled={tokenCreationState === "loading" || isUploading}
        >
          {tokenCreationState === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Token...
            </>
          ) : (
            "Create Token"
          )}
        </Button>
      </form>
    </div>
  )
}

