import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { OGLayout, OG_SIZE } from '@/lib/og-utils'

export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('policies')
    .select('policy_name, title_6th_grade, summary_5th_grade, level, bill_number')
    .eq('policy_id', params.id)
    .single()

  const title = data?.title_6th_grade || data?.policy_name || 'Policy'
  const subtitle = data?.summary_5th_grade || undefined
  const label = [data?.level, data?.bill_number].filter(Boolean).join(' · ') || 'Policy'

  return new ImageResponse(
    <OGLayout title={title} subtitle={subtitle} label={label} accentColor="#1a6b56" />,
    { ...size }
  )
}
