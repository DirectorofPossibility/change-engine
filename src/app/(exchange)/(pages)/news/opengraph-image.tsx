import { ImageResponse } from 'next/og'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <OGLayout
      title="News"
      subtitle="Local journalism and community reporting — what is happening right now in Houston."
      label="Learning"
      accentColor="#1a5030"
    />,
    { ...size }
  )
}
