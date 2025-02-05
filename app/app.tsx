"use client"

import dynamic from "next/dynamic"

const ClankpadFrame = dynamic(() => import("@/components/ClankpadFrame"), {
  ssr: false,
})

export default function App() {
  return <ClankpadFrame />
}

