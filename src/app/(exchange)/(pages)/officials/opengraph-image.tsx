import { ImageResponse } from 'next/og'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <OGLayout
      title="Elected Officials"
      subtitle="Your representatives at city, county, state, and federal levels — with contact info and policy connections."
      label="Action"
      accentColor="#e53e3e"
    />,
    { ...size }
  )
}
