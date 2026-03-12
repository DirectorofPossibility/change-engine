import { ImageResponse } from 'next/og'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <OGLayout
      title="Policies & Legislation"
      subtitle="Track bills and policies at every level of government — explained in plain language."
      label="Action"
      accentColor="#6a4e10"
    />,
    { ...size }
  )
}
