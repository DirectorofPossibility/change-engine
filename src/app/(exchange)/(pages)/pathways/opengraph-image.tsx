import { ImageResponse } from 'next/og'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <OGLayout
      title="Topics"
      subtitle="Seven thematic journeys connecting you to content, services, and people across Houston."
      label="Explore"
      accentColor="#1b5e8a"
    />,
    { ...size }
  )
}
