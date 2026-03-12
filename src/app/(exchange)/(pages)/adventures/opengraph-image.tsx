import { ImageResponse } from 'next/og'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <OGLayout
      title="Community Adventures"
      subtitle="Interactive stories where your choices shape the outcome. Navigate a town hall, discover neighborhood assets, or prepare for hurricane season."
      label="Learning"
      accentColor="#1a3460"
    />,
    { ...size }
  )
}
