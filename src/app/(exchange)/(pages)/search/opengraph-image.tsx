import { ImageResponse } from 'next/og'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <OGLayout
      title="Search"
      subtitle="Find services, officials, policies, organizations, and community resources across Greater Houston."
      label="Discover"
      accentColor="#C75B2A"
    />,
    { ...size }
  )
}
