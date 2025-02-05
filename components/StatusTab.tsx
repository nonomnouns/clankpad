import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { TokenData } from "@/lib/types"

interface StatusTabProps {
  user: {
    fid: number
  } | null
  createdTokenData: TokenData | null
}

interface TokenStatus {
  ticker: string
  name: string
  status: "pending" | "success" | "failed"
  message?: string
}

export default function StatusTab({ user, createdTokenData }: StatusTabProps) {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkTokenStatus = async () => {
      if (!user?.fid || !createdTokenData?.ticker) return

      try {
        const response = await fetch(
          `/api/check-token-status?ticker=${createdTokenData.ticker}&fid=${user.fid}`
        )
        const data = await response.json()
        
        setTokenStatus({
          ticker: createdTokenData.ticker,
          name: createdTokenData.name,
          status: data.status,
          message: data.message
        })
      } catch (error) {
        console.error("Error checking token status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Poll for status updates every 5 seconds if pending
    const interval = setInterval(() => {
      if (tokenStatus?.status === "pending") {
        checkTokenStatus()
      }
    }, 5000)

    // Initial check
    checkTokenStatus()

    return () => clearInterval(interval)
  }, [user, createdTokenData, tokenStatus?.status])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!tokenStatus) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Token Status</h2>
        <p className="text-gray-600">No token creation request found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <h2 className="text-xl font-semibold mb-4">Token Status</h2>
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold">
            {tokenStatus.name} ({tokenStatus.ticker})
          </h3>
          <p
            className={`text-sm mt-2 ${
              tokenStatus.status === "success"
                ? "text-green-600"
                : tokenStatus.status === "failed"
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            Status: {tokenStatus.status.charAt(0).toUpperCase() + tokenStatus.status.slice(1)}
          </p>
          {tokenStatus.message && (
            <p className="text-sm mt-2 text-gray-600">{tokenStatus.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

