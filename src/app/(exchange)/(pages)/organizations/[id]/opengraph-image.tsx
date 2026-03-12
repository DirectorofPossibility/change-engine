import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('org_name, description_5th_grade, org_type')
    .eq('org_id', params.id)
    .single()

  const title = data?.org_name || 'Organization'
  const subtitle = data?.description_5th_grade || undefined
  const label = data?.org_type || 'Organization'

  return new ImageResponse(
    <OGLayout title={title} subtitle={subtitle} label={label} accentColor="#1a3460" />,
    { ...size }
  )
}
