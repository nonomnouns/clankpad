import { ImageResponse } from "next/og"

export const alt = "Clankpad Frame"
export const size = {
  width: 600,
  height: 400,
}

export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    <div tw="h-full w-full flex flex-col justify-center items-center relative bg-white">
      <h1 tw="text-6xl font-bold">Clankpad Frame</h1>
      <p tw="text-2xl mt-4">Launch your Clanker token with ease</p>
    </div>,
    {
      ...size,
    },
  )
}

