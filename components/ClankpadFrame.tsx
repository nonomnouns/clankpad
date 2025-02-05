"use client"

import { useEffect, useState } from "react"
import { FaHome } from "react-icons/fa"
import { RiTokenSwapLine } from "react-icons/ri"
import { MdOutlineAssignment } from "react-icons/md"
import sdk from "@farcaster/frame-sdk"
import Home from "./Home"
import TokenCreationTab from "./TokenCreationTab"
import StatusTab from "./StatusTab"
import type { TokenData, TokenCreationState } from "@/lib/types"

interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

export default function ClankpadFrame() {
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [activeTab, setActiveTab] = useState("home")
  const [tokenCreationState, setTokenCreationState] = useState<TokenCreationState>("idle")
  const [createdTokenData, setCreatedTokenData] = useState<TokenData | null>(null)

  useEffect(() => {
    const initSDK = async () => {
      try {
        await sdk.actions.ready()
        const context = await sdk.context
        setUser(context.user as FarcasterUser)
        setIsSDKReady(true)

        // Listen for frame events
        sdk.on('frameAdded', ({ notificationDetails }) => {
          if (notificationDetails) {
            // Save notification details to backend
            fetch('/api/webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'frame_added',
                fid: context.user.fid,
                notificationDetails
              })
            })
          }
        })

        return () => {
          sdk.removeAllListeners()
        }
      } catch (error) {
        console.error("Error initializing SDK:", error)
      }
    }
    initSDK()
  }, [])

  const handleTokenCreation = async (formData: TokenData) => {
    setTokenCreationState("loading")
    setCreatedTokenData(formData)

    try {
      // Save token request to our database
      const response = await fetch('/api/token-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save token request')
      }

      // Switch to status tab to show progress
      setActiveTab("status")
    } catch (error) {
      console.error("Error handling token creation:", error)
      setTokenCreationState("error")
    }
  }

  if (!isSDKReady) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "home" && <Home user={user} setActiveTab={setActiveTab} />}
        {activeTab === "create" && (
          <TokenCreationTab 
            user={user} 
            onSubmit={handleTokenCreation} 
            tokenCreationState={tokenCreationState} 
          />
        )}
        {activeTab === "status" && (
          <StatusTab 
            user={user} 
            createdTokenData={createdTokenData}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex-none bg-white border-t border-gray-200">
        <div className="flex justify-around max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 flex flex-col items-center py-3 px-5 ${
              activeTab === "home" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <FaHome className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 flex flex-col items-center py-3 px-5 ${
              activeTab === "create" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <RiTokenSwapLine className="w-5 h-5" />
            <span className="text-xs mt-1">Create</span>
          </button>
          <button
            onClick={() => setActiveTab("status")}
            className={`flex-1 flex flex-col items-center py-3 px-5 ${
              activeTab === "status" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <MdOutlineAssignment className="w-5 h-5" />
            <span className="text-xs mt-1">Status</span>
          </button>
        </div>
      </div>
    </div>
  )
}
