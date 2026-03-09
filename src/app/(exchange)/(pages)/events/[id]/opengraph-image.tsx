import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('event_name, description_5th_grade, start_datetime')
    .eq('event_id', params.id)
    .single()

  const title = data?.event_name || 'Community Event'
  const date = data?.start_datetime ? new Date(data.start_datetime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null
  const subtitle = [date, data?.description_5th_grade].filter(Boolean).join(' — ') || undefined

  return new ImageResponse(
    <OGLayout title={title} subtitle={subtitle} label="Event" accentColor="#d69e2e" />,
    { ...size }
  )
}
