import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('title_6th_grade, summary_6th_grade, content_type, source_org_name')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  const title = data?.title_6th_grade || 'Change Engine'
  const subtitle = data?.summary_6th_grade || undefined
  const label = [data?.content_type, data?.source_org_name].filter(Boolean).join(' · ') || 'Article'

  return new ImageResponse(
    <OGLayout title={title} subtitle={subtitle} label={label} />,
    { ...size }
  )
}
