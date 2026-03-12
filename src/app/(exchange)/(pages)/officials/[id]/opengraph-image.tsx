import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('elected_officials')
    .select('official_name, title, level, party')
    .eq('official_id', params.id)
    .single()

  const title = data?.official_name || 'Elected Official'
  const subtitle = [data?.title, data?.party].filter(Boolean).join(' · ') || undefined
  const label = data?.level || 'Official'

  return new ImageResponse(
    <OGLayout title={title} subtitle={subtitle} label={label} accentColor="#6a4e10" />,
    { ...size }
  )
}
