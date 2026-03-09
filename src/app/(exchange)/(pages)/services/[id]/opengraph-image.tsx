import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('services_211')
    .select('service_name, description_5th_grade')
    .eq('service_id', params.id)
    .single()

  const title = data?.service_name || 'Community Service'
  const subtitle = data?.description_5th_grade || undefined

  return new ImageResponse(
    <OGLayout title={title} subtitle={subtitle} label="Service" accentColor="#38a169" />,
    { ...size }
  )
}
