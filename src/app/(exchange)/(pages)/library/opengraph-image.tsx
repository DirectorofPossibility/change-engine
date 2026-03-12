import { ImageResponse } from 'next/og'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <OGLayout
      title="Library"
      subtitle="Research reports, policy briefs, and deep dives curated from trusted sources across Houston and beyond."
      label="Learning"
      accentColor="#6a4e10"
    />,
    { ...size }
  )
}
