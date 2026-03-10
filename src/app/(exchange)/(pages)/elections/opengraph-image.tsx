import { ImageResponse } from 'next/og'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <OGLayout
      title="Elections"
      subtitle="Upcoming elections, candidates, polling places, and voter registration for Houston and Harris County."
      label="Action"
      accentColor="#d69e2e"
    />,
    { ...size }
  )
}
