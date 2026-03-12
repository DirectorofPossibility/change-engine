import { ImageResponse } from 'next/og'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <OGLayout
      title="Community Services"
      subtitle="Find help with housing, food, healthcare, legal aid, and more in Greater Houston."
      label="Resources"
      accentColor="#7a2018"
    />,
    { ...size }
  )
}
